import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { UserRole } from '../../db';
import { hashPassword, encryptText, decryptText, generateSalt } from '../../crypto';
import { sendEmailHelper, CloudflareEmailBinding } from './services/emailService';

type Bindings = {
  RESEND_API_KEY: string;
  CRYPTO_SECRET: string;
  CONTEST_CRYPTO_SECRET: string;
  DB: D1Database;
  KV?: KVNamespace;
  EMAIL?: CloudflareEmailBinding;
};

type Variables = {
  adminUid: string;
  staffUid?: string;
  staffContestId?: string | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS 미들웨어 설정: 프론트엔드 포트인 4100을 허용하고 쿠키 공유를 활성화합니다.
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return 'http://localhost:4100';
      if (
        origin.startsWith('http://localhost') ||
        origin.endsWith('ybbf.org') ||
        origin.includes('ybbf')
      ) {
        return origin;
      }
      return 'http://localhost:4100';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposeHeaders: ['Set-Cookie'],
  })
);

let dbInitialized = false;

async function ensureTables(db: D1Database) {
  if (dbInitialized) return;

  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS notification_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        competitionId TEXT NOT NULL,
        userId TEXT,
        isSent INTEGER NOT NULL DEFAULT 0,
        sentAt TEXT DEFAULT NULL,
        sendCount INTEGER NOT NULL DEFAULT 0,
        sendStatus TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(email, competitionId)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS invoices_pool (
        id TEXT PRIMARY KEY,
        playerUid TEXT NOT NULL,
        playerName TEXT NOT NULL,
        playerGender TEXT NOT NULL,
        playerBirth TEXT NOT NULL,
        playerTel TEXT NOT NULL,
        playerEmail TEXT,
        playerGym TEXT NOT NULL,
        playerText TEXT,
        playerPhotoUrl TEXT,
        playerPhotoUrls TEXT,
        playerService INTEGER NOT NULL DEFAULT 0,
        joins TEXT NOT NULL,
        contestPriceSum INTEGER NOT NULL,
        contestPriceTotal INTEGER NOT NULL,
        playerAge INTEGER,
        isPriceCheck INTEGER NOT NULL DEFAULT 0,
        isCanceled INTEGER NOT NULL DEFAULT 0,
        invoiceEdited INTEGER NOT NULL DEFAULT 0,
        createBy TEXT,
        invoiceCreateAt TEXT,
        invoiceEditAt TEXT,
        contestId TEXT,
        selectedPhotoUrls TEXT,
        submittedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS pre_measurements (
        id TEXT PRIMARY KEY,
        contestId TEXT NOT NULL,
        playerUid TEXT NOT NULL,
        playerName TEXT NOT NULL,
        playerTel TEXT NOT NULL,
        mediaUrl TEXT NOT NULL,
        mediaType TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(contestId, playerUid)
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS contest_staffs (
        uid TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        contestId TEXT,
        phone_encrypted TEXT,
        phone_last4 TEXT,
        email TEXT,
        position TEXT,
        isReferee INTEGER DEFAULT 0,
        refereeGrade TEXT,
        status TEXT DEFAULT 'active',
        profilePhotoUrl TEXT,
        businessIntro TEXT,
        snsLinks TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS virtual_kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS contest_results (
        id TEXT PRIMARY KEY,
        contestId TEXT NOT NULL,
        categoryId TEXT,
        categoryTitle TEXT NOT NULL,
        gradeId TEXT,
        gradeTitle TEXT NOT NULL,
        isOverall INTEGER NOT NULL DEFAULT 0,
        scoreType TEXT DEFAULT 'ranking',
        resultsJson TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  ]);

  try {
    await db.prepare('ALTER TABLE user_profiles ADD COLUMN nickname TEXT').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE user_profiles ADD COLUMN profilePhotoUrl TEXT').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN selectedPhotoUrls TEXT').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN contestId TEXT').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN playerPhotoUrls TEXT').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN award TEXT').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN rank INTEGER').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN isGrandPrix INTEGER DEFAULT 0').run();
  } catch (e) {}
  try {
    await db.prepare('ALTER TABLE invoices_pool ADD COLUMN playerNumber TEXT').run();
  } catch (e) {}

  dbInitialized = true;
}

// DB 스키마 검증 및 자동 테이블 생성 미들웨어
app.use('*', async (c, next) => {
  if (c.env.DB) {
    try {
      await ensureTables(c.env.DB);
    } catch (err) {
      console.error('SQLite 마이그레이션 실패:', err);
    }
  }
  await next();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 관리자 검증 공통 미들웨어
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { Context, Next } from 'hono';

async function adminMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const token = c.req.header('Cookie')?.match(/session_token=([^;]+)/)?.[1]
                || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: '인증 세션이 유효하지 않습니다.' }, 401);
  }
  
  // D1에서 해당 사용자의 역할군 조회
  const dbUser = await c.env.DB.prepare('SELECT roles FROM users WHERE uid = ?')
    .bind(token)
    .first() as { roles: string } | null;
    
  if (!dbUser) {
    return c.json({ error: '가입 정보를 찾을 수 없습니다.' }, 401);
  }
  
  const roles = dbUser.roles.split(',').map((r: string) => r.trim());
  if (!roles.includes('admin')) {
    return c.json({ error: '권한이 없습니다. (관리자 전용)' }, 403);
  }
  
  // 유효한 관리자면 Context에 uid를 기록하고 다음 파이프라인으로 이동
  c.set('adminUid', token);
  await next();
}

// 하이브리드 솔트(salt) 저장 헬퍼 함수
async function putSalt(c: any, uid: string, salt: string) {
  if (c.env.KV) {
    await c.env.KV.put(`salt:${uid}`, salt);
  } else {
    await c.env.DB.prepare('INSERT OR REPLACE INTO virtual_kv (key, value) VALUES (?, ?)')
      .bind(`salt:${uid}`, salt)
      .run();
  }
}

async function getSalt(c: any, uid: string): Promise<string | null> {
  if (c.env.KV) {
    return await c.env.KV.get(`salt:${uid}`);
  } else {
    const row = await c.env.DB.prepare('SELECT value FROM virtual_kv WHERE key = ?')
      .bind(`salt:${uid}`)
      .first() as { value: string } | null;
    return row ? row.value : null;
  }
}

// IP 기반 래이트 리밋 헬퍼 (분당 최대 maxRequests회 허용)
async function checkRateLimit(c: any, keyPrefix: string, maxRequests = 3, windowSeconds = 60): Promise<{ allowed: boolean; remaining: number }> {
  const clientIp = c.req.header('cf-connecting-ip') 
                || c.req.header('x-forwarded-for')?.split(',')[0]?.trim() 
                || '127.0.0.1';
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / windowSeconds);
  const rateKey = `ratelimit:${keyPrefix}:${clientIp}:${currentWindow}`;

  let count = 0;
  if (c.env.KV) {
    const current = await c.env.KV.get(rateKey);
    count = current ? parseInt(current, 10) : 0;
    if (count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    await c.env.KV.put(rateKey, (count + 1).toString(), { expirationTtl: windowSeconds + 10 });
  } else {
    const row = await c.env.DB.prepare('SELECT value FROM virtual_kv WHERE key = ?')
      .bind(rateKey)
      .first() as { value: string } | null;
    
    count = row ? parseInt(row.value, 10) : 0;
    if (count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    await c.env.DB.prepare('INSERT OR REPLACE INTO virtual_kv (key, value) VALUES (?, ?)')
      .bind(rateKey, (count + 1).toString())
      .run();
  }

  return { allowed: true, remaining: maxRequests - (count + 1) };
}

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  let maskedLocal = local;
  if (local.length <= 2) {
    maskedLocal = local[0] + '*';
  } else if (local.length <= 4) {
    maskedLocal = local.slice(0, 2) + '**';
  } else {
    maskedLocal = local.slice(0, 2) + '***' + local.slice(-1);
  }
  return `${maskedLocal}@${domain}`;
}

// 시스템 설정 기본값 객체 정의
const DEFAULT_SETTINGS = {
  heroName: "KIM CHAMPION",
  heroClass: "CLASSIC PHYSIQUE",
  heroHeight: "182",
  heroWeight: "95",
  heroGym: "용인시 보디빌딩협회",
  heroTitles: "2026 Overall Winner · 2025 Grand Prix 1st · Mr. Yongin 3× Champion",
  heroImageUrl: "/hero_section.png",
  heroInstagram: "#",
  heroYoutube: "#",
  heroFacebook: "#",
  competitionPhase: "LIVE",
  competitionTitle: "2026 YBBF CHAMPIONSHIP",
  competitionDate: "2026. 10. 15",
  competitionVenue: "용인시 실내체육관 특설무대",
  competitionBankName: "우리은행",
  competitionAccountNumber: "1002-250-33892",
  competitionAccountOwner: "정태천(용인시보디빌딩협회)",
  competitionPriceBasic: 80000,
  competitionPriceExtra: 30000,
  heroPlayers: [
    {
      id: "default-player-1",
      heroName: "KIM CHAMPION",
      heroClass: "CLASSIC PHYSIQUE",
      heroHeight: "182",
      heroWeight: "95",
      heroGym: "용인시 보디빌딩협회",
      heroTitles: "2026 Overall Winner · 2025 Grand Prix 1st · Mr. Yongin 3× Champion",
      heroImageUrl: "/hero_section.png",
      heroInstagram: "#",
      heroYoutube: "#",
      heroFacebook: "#"
    }
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚙️ 시스템 설정 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 설정 조회 API (비로그인 허용)
app.get('/api/settings', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT value FROM system_settings WHERE key = ?')
      .bind('system_settings')
      .first() as { value: string } | null;

    if (!result) {
      return c.json(DEFAULT_SETTINGS);
    }

    const settingsObj = JSON.parse(result.value);
    
    // Clean up old properties if they remain in JSON
    delete settingsObj.heroConditioning;
    delete settingsObj.heroDDay;

    if (!settingsObj.heroPlayers) {
      settingsObj.heroPlayers = DEFAULT_SETTINGS.heroPlayers;
    }

    return c.json(settingsObj);
  } catch (err: any) {
    return c.json({ error: '설정 조회 실패: ' + err.message }, 500);
  }
});

// 2. 설정 업데이트 API (관리자 전용)
app.post('/api/settings', adminMiddleware, async (c) => {
  try {
    const payload = await c.req.json();

    // Clean up old fields
    delete payload.heroConditioning;
    delete payload.heroDDay;

    await c.env.DB.prepare(
      'INSERT OR REPLACE INTO system_settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)'
    )
      .bind('system_settings', JSON.stringify(payload))
      .run();
      
    return c.json({ success: true, message: '설정이 성공적으로 저장되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '설정 업데이트 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 회원 관리 APIs (관리자 전용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 전체 회원 목록 조회 API (복호화 처리)
app.get('/api/admin/users', adminMiddleware, async (c) => {
  try {
    const secretKey = c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }
    
    // 유저 정보 및 프로필 정보를 한 번에 조인 쿼리 (닉네임은 user_nickname_history 이력 테이블과 최신 JOIN)
    const query = `
      SELECT u.uid, u.email, u.provider, u.profileComplete, u.roles, u.createdAt,
             p.name AS profileName, p.birth AS profileBirth, p.tel AS profileTel, 
             p.telLast4 AS profileTelLast4, p.gym AS profileGym, p.gender AS profileGender, p.profilePhotoUrl AS profilePhotoUrl,
             nh.nickname AS profileNickname
      FROM users u
      LEFT JOIN user_profiles p ON u.uid = p.uid
      LEFT JOIN (
        SELECT uid, nickname
        FROM user_nickname_history
        WHERE id IN (
          SELECT MAX(id) FROM user_nickname_history GROUP BY uid
        )
      ) nh ON u.uid = nh.uid
      ORDER BY u.createdAt DESC
    `;
    
    const result = await c.env.DB.prepare(query).all();
    const usersList = result.results || [];
    
    const safeUsers = [];
    for (const u of usersList) {
      const parsedRoles = (u.roles as string).split(',').map((r: string) => r.trim()) as UserRole[];
      
      let profile = null;
      if (u.profileComplete && u.profileName && u.profileTel) {
        try {
          profile = {
            name: await decryptText(u.profileName as string, secretKey),
            nickname: (u.profileNickname as string) || '',
            birth: u.profileBirth as string,
            tel: await decryptText(u.profileTel as string, secretKey),
            telLast4: u.profileTelLast4 as string,
            gym: u.profileGym as string,
            gender: u.profileGender as string,
            profilePhotoUrl: (u.profilePhotoUrl as string) || '',
          };
        } catch (decErr) {
          console.error(`유저 uid ${u.uid}의 프로필 복호화 에러:`, decErr);
        }
      }
      
      safeUsers.push({
        uid: u.uid,
        email: u.email,
        provider: u.provider,
        profileComplete: !!u.profileComplete,
        roles: parsedRoles,
        createdAt: u.createdAt,
        profile
      });
    }
    
    return c.json(safeUsers);
  } catch (err: any) {
    return c.json({ error: '회원 목록 조회 실패: ' + err.message }, 500);
  }
});

// 2. 회원 역할군(권한) 변경 API
app.post('/api/admin/users/:uid/roles', adminMiddleware, async (c) => {
  try {
    const uid = c.req.param('uid');
    const { roles } = await c.req.json();
    
    if (!roles || !Array.isArray(roles)) {
      return c.json({ error: '올바른 역할군 목록이 아닙니다.' }, 400);
    }
    
    const rolesStr = roles.join(',');
    await c.env.DB.prepare('UPDATE users SET roles = ? WHERE uid = ?')
      .bind(rolesStr, uid)
      .run();
      
    return c.json({ success: true, message: '역할군 변경이 완료되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '역할군 변경 실패: ' + err.message }, 500);
  }
});

// 3. 회원 강제 탈퇴 (삭제) API
app.delete('/api/admin/users/:uid', adminMiddleware, async (c) => {
  try {
    const uid = c.req.param('uid');
    const currentAdminUid = c.get('adminUid');
    
    // 자기 자신 강제 삭제 차단
    if (uid === currentAdminUid) {
      return c.json({ error: '자기 자신은 강제 탈퇴시킬 수 없습니다.' }, 400);
    }
    
    // 캐스케이드 삭제 미작동 상황을 방지하기 위해 둘 다 명시적으로 삭제 진행
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM user_profiles WHERE uid = ?').bind(uid),
      c.env.DB.prepare('DELETE FROM users WHERE uid = ?').bind(uid)
    ]);
    
    return c.json({ success: true, message: '회원 정보가 완전히 삭제되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '회원 강제 삭제 실패: ' + err.message }, 500);
  }
});

// 4. 신규 사용자/관리자 수동 등록 API (패스워드 PBKDF2 해싱 + 솔트 격리 + 프로필 AES-256-GCM 암호화)
app.post('/api/admin/users', adminMiddleware, async (c) => {
  try {
    const secretKey = c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }
    
    const { email, password, roles, profile } = await c.req.json();
    if (!email || !password || !roles || !Array.isArray(roles)) {
      return c.json({ error: '필수 등록 항목이 누락되었습니다.' }, 400);
    }
    
    // 이메일 중복 체크
    const exists = await c.env.DB.prepare('SELECT uid FROM users WHERE email = ?')
      .bind(email)
      .first() as { uid: string } | null;
    if (exists) {
      return c.json({ error: '이미 가입된 이메일 주소입니다.' }, 400);
    }
    
    const uid = crypto.randomUUID();
    const userSalt = generateSalt();
    const passwordHash = await hashPassword(password, userSalt, secretKey);
    const rolesStr = roles.join(',');
    const profileComplete = profile ? 1 : 0;
    
    // D1 users 적재
    await c.env.DB.prepare(
      'INSERT INTO users (uid, email, passwordHash, provider, profileComplete, roles) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(uid, email, passwordHash, 'email', profileComplete, rolesStr)
      .run();
      
    // 격리 솔트 저장
    await putSalt(c, uid, userSalt);
    
    // 프로필 암호화 및 적재
    if (profile) {
      const { name, birth, tel, gym, gender } = profile;
      if (!name || !birth || !tel || !gym || !gender) {
        return c.json({ error: '프로필 필수 추가정보 항목이 누락되었습니다.' }, 400);
      }
      
      const encryptedName = await encryptText(name, secretKey);
      const encryptedTel = await encryptText(tel, secretKey);
      const telDigitsOnly = tel.replace(/[^0-9]/g, '');
      const telLast4 = telDigitsOnly.length >= 4 ? telDigitsOnly.slice(-4) : telDigitsOnly;
      
      await c.env.DB.prepare(
        `INSERT INTO user_profiles (uid, name, birth, tel, telLast4, gym, gender) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(uid, encryptedName, birth, encryptedTel, telLast4, gym, gender)
        .run();
    }
    
    return c.json({ success: true, message: '사용자 등록이 완료되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '사용자 수동 등록 실패: ' + err.message }, 500);
  }
});

// 🔍 이메일(아이디) 찾기 API (성명 + 연락처 매칭, IP 래이트 리밋 분당 3회)
app.post('/api/auth/find-email', async (c) => {
  try {
    // 1. IP 기반 래이트 리밋 체크 (분당 3회 제한)
    const rateCheck = await checkRateLimit(c, 'find-email', 3, 60);
    if (!rateCheck.allowed) {
      return c.json({ 
        error: '단시간에 너무 많은 이메일 찾기 요청이 발생했습니다. 1분 후 다시 시도해 주세요.' 
      }, 429);
    }

    const { name, tel } = await c.req.json() as { name?: string; tel?: string };
    if (!name || !tel) {
      return c.json({ error: '성명과 전화번호를 모두 입력해 주세요.' }, 400);
    }

    const cleanName = name.trim();
    const cleanTelDigits = tel.replace(/[^0-9]/g, '');
    if (cleanName.length < 2 || cleanTelDigits.length < 9) {
      return c.json({ error: '올바른 성명과 전화번호를 입력해 주세요.' }, 400);
    }

    const telLast4 = cleanTelDigits.slice(-4);
    const secretKey = c.env.CRYPTO_SECRET || c.env.CONTEST_CRYPTO_SECRET;

    // 2. telLast4 일치하는 프로필 후보 조회
    const candidates = await c.env.DB.prepare(
      'SELECT uid, name, tel FROM user_profiles WHERE telLast4 = ?'
    )
      .bind(telLast4)
      .all<{ uid: string; name: string; tel: string }>();

    let matchedUid: string | null = null;
    if (candidates && candidates.results) {
      for (const row of candidates.results) {
        let decName = row.name;
        let decTel = row.tel;
        if (secretKey) {
          try { decName = await decryptText(row.name, secretKey); } catch (e) {}
          try { decTel = await decryptText(row.tel, secretKey); } catch (e) {}
        }

        const decTelDigits = decTel.replace(/[^0-9]/g, '');
        if (decName.trim() === cleanName && decTelDigits === cleanTelDigits) {
          matchedUid = row.uid;
          break;
        }
      }
    }

    if (!matchedUid) {
      return c.json({ 
        error: '입력하신 정보와 일치하는 회원 계정을 찾을 수 없습니다.' 
      }, 404);
    }

    // 3. users 테이블에서 이메일 및 가입일 조회
    const userRow = await c.env.DB.prepare('SELECT email, createdAt FROM users WHERE uid = ?')
      .bind(matchedUid)
      .first<{ email: string; createdAt: string }>();

    if (!userRow) {
      return c.json({ error: '회원 계정 정보를 조회할 수 없습니다.' }, 404);
    }

    const masked = maskEmail(userRow.email);

    return c.json({
      success: true,
      email: masked,
      createdAt: userRow.createdAt ? userRow.createdAt.split('T')[0] : ''
    });
  } catch (err: any) {
    console.error('이메일 찾기 오류:', err);
    return c.json({ error: '이메일 찾기 처리 중 오류가 발생했습니다: ' + err.message }, 500);
  }
});

// 🔑 비밀번호 찾기 (재설정 이메일 발송) API
app.post('/api/auth/forgot-password', async (c) => {
  try {
    // IP 기반 래이트 리밋 체크 (분당 3회 제한)
    const rateCheck = await checkRateLimit(c, 'forgot-password', 3, 60);
    if (!rateCheck.allowed) {
      return c.json({ 
        error: '단시간에 너무 많은 비밀번호 찾기 요청이 발생했습니다. 1분 후 다시 시도해 주세요.' 
      }, 429);
    }

    const body = await c.req.json() as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: '올바른 이메일 주소를 입력해 주세요.' }, 400);
    }

    // 1. 유저 데이터 존재 여부 확인
    const user = await c.env.DB.prepare('SELECT uid, email FROM users WHERE LOWER(email) = ?')
      .bind(email)
      .first<{ uid: string; email: string }>();

    if (user) {
      // 유저 이름 조회 (프로필이 있는 경우)
      let userName = '선수';
      const userProfile = await c.env.DB.prepare('SELECT name FROM user_profiles WHERE uid = ?')
        .bind(user.uid)
        .first<{ name: string }>();

      if (userProfile && userProfile.name) {
        const secretKey = c.env.CRYPTO_SECRET || c.env.CONTEST_CRYPTO_SECRET;
        try {
          userName = await decryptText(userProfile.name, secretKey);
        } catch (e) {
          userName = userProfile.name;
        }
      }

      // 2. 보안 토큰 생성 (유효기간: 1시간)
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      // 3. DB에 토큰 저장
      await c.env.DB.prepare(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)'
      )
        .bind(email, resetToken, expiresAt)
        .run();

      // 4. Cloudflare Native Email Sending Helper로 메일 발송
      const appUrl = 'https://ybbf.org';
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

      await sendEmailHelper(c.env.EMAIL, appUrl, {
        to: email,
        subject: '[YBBF] 비밀번호 재설정 인증 안내',
        title: '비밀번호 재설정 요청',
        contentHtml: `
          <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin-bottom: 16px;">
            안녕하세요, <strong>${userName}</strong>님.
          </p>
          <p style="color: rgba(255,255,255,0.7); font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
            용인특례시보디빌딩협회(YBBF) 계정의 비밀번호 재설정 요청이 접수되었습니다.<br/>
            아래 [비밀번호 재설정하기] 버튼을 누르시면 새 비밀번호를 설정하실 수 있습니다. (유효시간: 1시간)
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="btn" style="background-color: #d2ff00; color: #000; font-weight: 900; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block;">
              👉 비밀번호 재설정하기
            </a>
          </div>
          <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin-top: 20px;">
            버튼이 작동하지 않는 경우 아래 URL을 복사하여 브라우저에 직접 붙여넣으세요:<br/>
            <span style="color: #d2ff00; word-break: break-all;">${resetUrl}</span>
          </p>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 16px;">
            * 본인이 요청하지 않은 경우 이 메일을 무시하셔도 됩니다.
          </p>
        `,
        plainText: `${userName}님, YBBF 비밀번호 재설정 링크: ${resetUrl}\n본인이 요청하지 않은 경우 무시하셔도 됩니다.`
      });
    }

    // 5. User Enumeration 방지: 유저 존재 여부와 상관없이 동일 성공 메세지 반환
    return c.json({ 
      success: true, 
      message: '입력하신 이메일로 비밀번호 재설정 안내 메일을 발송했습니다. 메일함을 확인해 주세요.' 
    });
  } catch (err: any) {
    console.error('비밀번호 재설정 이메일 요청 에러:', err);
    return c.json({ error: '비밀번호 재설정 요청 처리 중 오류가 발생했습니다: ' + err.message }, 500);
  }
});

// 🔓 비밀번호 재설정 실행 API
app.post('/api/auth/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json() as { token?: string; newPassword?: string };
    
    if (!token || !newPassword || newPassword.length < 6) {
      return c.json({ error: '유효한 토큰과 6자 이상의 새 비밀번호를 입력해 주세요.' }, 400);
    }

    const secretKey = c.env.CRYPTO_SECRET || c.env.CONTEST_CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키가 누락되었습니다.' }, 500);
    }

    // 1. 토큰 유효성 및 만료 여부 확인
    const nowStr = new Date().toISOString();
    const resetRecord = await c.env.DB.prepare(
      'SELECT id, email FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ?'
    )
      .bind(token, nowStr)
      .first<{ id: number; email: string }>();

    if (!resetRecord) {
      return c.json({ error: '유효하지 않거나 이미 만료/사용된 재설정 토큰입니다.' }, 400);
    }

    // 2. 해당 유저 조회
    const user = await c.env.DB.prepare('SELECT uid FROM users WHERE LOWER(email) = ?')
      .bind(resetRecord.email.toLowerCase())
      .first<{ uid: string }>();

    if (!user) {
      return c.json({ error: '해당 이메일의 유저 계정을 찾을 수 없습니다.' }, 404);
    }

    // 3. 솔트 가져오기 또는 새로 생성
    let userSalt = await getSalt(c, user.uid);
    if (!userSalt) {
      userSalt = generateSalt();
      await putSalt(c, user.uid, userSalt);
    }

    // 4. 새 비밀번호 해싱 및 DB 업데이트
    const newPasswordHash = await hashPassword(newPassword, userSalt, secretKey);
    await c.env.DB.prepare('UPDATE users SET passwordHash = ? WHERE uid = ?')
      .bind(newPasswordHash, user.uid)
      .run();

    // 5. 토큰 사용 처리
    await c.env.DB.prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
      .bind(resetRecord.id)
      .run();

    return c.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다. 새로 로그인해 주세요.' });
  } catch (err: any) {
    console.error('비밀번호 변경 처리 에러:', err);
    return c.json({ error: '비밀번호 변경 처리 중 오류가 발생했습니다: ' + err.message }, 500);
  }
});

// 🔑 로그인된 유저 비밀번호 변경 API
app.post('/api/auth/change-password', async (c) => {
  try {
    const { uid, currentPassword, newPassword } = await c.req.json() as {
      uid?: string;
      currentPassword?: string;
      newPassword?: string;
    };

    if (!uid || !currentPassword || !newPassword) {
      return c.json({ error: '필수 입력 항목(현재 비밀번호, 새 비밀번호)을 모두 입력해 주세요.' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: '새 비밀번호는 최소 6자 이상이어야 합니다.' }, 400);
    }

    // 1. 유저 정보 조회
    const user = await c.env.DB.prepare('SELECT uid, passwordHash FROM users WHERE uid = ?')
      .bind(uid)
      .first<{ uid: string; passwordHash: string }>();

    if (!user) {
      return c.json({ error: '사용자 계정을 찾을 수 없습니다.' }, 404);
    }

    const secretKey = c.env.CRYPTO_SECRET || c.env.CONTEST_CRYPTO_SECRET;

    // 2. 현재 비밀번호 검증
    const userSalt = await getSalt(c, uid);
    if (!userSalt) {
      return c.json({ error: '비밀번호 암호화 정보를 찾을 수 없습니다.' }, 400);
    }

    const currentHash = await hashPassword(currentPassword, userSalt, secretKey);
    if (currentHash !== user.passwordHash) {
      return c.json({ error: '현재 비밀번호가 일치하지 않습니다.' }, 400);
    }

    // 3. 새 비밀번호 해싱 및 DB 업데이트
    const newPasswordHash = await hashPassword(newPassword, userSalt, secretKey);
    await c.env.DB.prepare('UPDATE users SET passwordHash = ? WHERE uid = ?')
      .bind(newPasswordHash, uid)
      .run();

    return c.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (err: any) {
    console.error('비밀번호 변경 오류:', err);
    return c.json({ error: '비밀번호 변경 중 오류가 발생했습니다: ' + err.message }, 500);
  }
});

// 👤 유저 개인 프로필 (프로필 사진, 실명, 생년월일, 연락처, 소속 등) 및 닉네임 이력 관리 API
app.post('/api/user/profile', async (c) => {
  try {
    const { uid, name, nickname, birth, tel, gym, gender, profilePhotoUrl } = await c.req.json() as {
      uid?: string;
      name?: string;
      nickname?: string;
      birth?: string;
      tel?: string;
      gym?: string;
      gender?: string;
      profilePhotoUrl?: string;
    };

    if (!uid) {
      return c.json({ error: '사용자 식별자가 누락되었습니다.' }, 400);
    }

    const secretKey = c.env.CRYPTO_SECRET || c.env.CONTEST_CRYPTO_SECRET;
    
    // 유저 존재 여부 확인
    const user = await c.env.DB.prepare('SELECT uid FROM users WHERE uid = ?')
      .bind(uid)
      .first();
    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 1. 닉네임 변경 이력 적재 처리 (user_nickname_history 별도 이력 테이블)
    if (nickname && nickname.trim()) {
      const cleanNick = nickname.trim();
      const latestNick = await c.env.DB.prepare(
        'SELECT nickname FROM user_nickname_history WHERE uid = ? ORDER BY id DESC LIMIT 1'
      )
        .bind(uid)
        .first() as { nickname: string } | null;

      if (!latestNick || latestNick.nickname !== cleanNick) {
        await c.env.DB.prepare(
          'INSERT INTO user_nickname_history (uid, nickname, changeReason, changedBy) VALUES (?, ?, ?, ?)'
        )
          .bind(uid, cleanNick, 'user_update', uid)
          .run();
      }
    }

    const encryptedName = name ? await encryptText(name, secretKey) : null;
    const encryptedTel = tel ? await encryptText(tel, secretKey) : null;
    const telDigitsOnly = tel ? tel.replace(/[^0-9]/g, '') : '';
    const telLast4 = telDigitsOnly.length >= 4 ? telDigitsOnly.slice(-4) : telDigitsOnly;

    // 2. user_profiles Upsert (실명, 연락처, 체육관, 사진만 관리)
    const existingProfile = await c.env.DB.prepare('SELECT uid FROM user_profiles WHERE uid = ?')
      .bind(uid)
      .first();

    if (existingProfile) {
      await c.env.DB.prepare(
        `UPDATE user_profiles 
         SET name = COALESCE(?, name),
             birth = COALESCE(?, birth),
             tel = COALESCE(?, tel),
             telLast4 = COALESCE(?, telLast4),
             gym = COALESCE(?, gym),
             gender = COALESCE(?, gender),
             profilePhotoUrl = COALESCE(?, profilePhotoUrl),
             updatedAt = CURRENT_TIMESTAMP
         WHERE uid = ?`
      )
        .bind(
          encryptedName,
          birth || null,
          encryptedTel,
          telLast4 || null,
          gym || null,
          gender || null,
          profilePhotoUrl || null,
          uid
        )
        .run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO user_profiles (uid, name, birth, tel, telLast4, gym, gender, profilePhotoUrl)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          uid,
          encryptedName || '',
          birth || '',
          encryptedTel || '',
          telLast4 || '',
          gym || '',
          gender || '',
          profilePhotoUrl || null
        )
        .run();
    }

    // users 테이블 profileComplete = 1 업데이트
    await c.env.DB.prepare('UPDATE users SET profileComplete = 1 WHERE uid = ?')
      .bind(uid)
      .run();

    return c.json({
      success: true,
      message: '프로필 정보 및 닉네임 이력이 성공적으로 저장되었습니다.'
    });
  } catch (err: any) {
    console.error('프로필 저장 에러:', err);
    return c.json({ error: '프로필 저장 중 오류가 발생했습니다: ' + err.message }, 500);
  }
});

// 📜 유저 닉네임 변경 이력 (언제, 누가, 어떻게) 조회 API
app.get('/api/user/nickname-history', async (c) => {
  try {
    const uid = c.req.query('uid');
    if (!uid) {
      return c.json({ error: '사용자 식별자가 누락되었습니다.' }, 400);
    }
    const history = await c.env.DB.prepare(
      'SELECT id, uid, nickname, changeReason, changedBy, createdAt FROM user_nickname_history WHERE uid = ? ORDER BY id DESC'
    )
      .bind(uid)
      .all();
    return c.json(history.results || []);
  } catch (err: any) {
    return c.json({ error: '닉네임 이력 조회 오류: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📨 기존 이관 엔드포인트들 (접수, R2 업로드/서빙, 모집 알림)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 5. 대회 모집 알림 신청 API
app.post('/api/notifications/subscribe', async (c) => {
  try {
    const { email, competitionId } = await c.req.json();
    if (!email || !competitionId) {
      return c.json({ error: '이메일과 대회 식별 정보가 누락되었습니다.' }, 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: '올바른 이메일 형식이 아닙니다.' }, 400);
    }

    const token = c.req.header('Cookie')?.match(/session_token=([^;]+)/)?.[1];
    let userId: string | null = null;
    if (token) {
      const dbUser = await c.env.DB.prepare('SELECT uid FROM users WHERE uid = ?')
        .bind(token)
        .first<{ uid: string }>();
      if (dbUser) {
        userId = dbUser.uid;
      }
    }

    await c.env.DB.prepare(`
      INSERT INTO notification_subscriptions (email, competitionId, userId)
      VALUES (?, ?, ?)
      ON CONFLICT(email, competitionId) DO UPDATE SET 
        userId = COALESCE(excluded.userId, notification_subscriptions.userId),
        createdAt = CURRENT_TIMESTAMP
    `)
      .bind(email.trim(), competitionId, userId)
      .run();

    return c.json({ success: true, message: '알림 신청이 완료되었습니다.' });
  } catch (err: any) {
    console.error('알림 신청 실패:', err);
    return c.json({ error: '알림 신청 등록에 실패했습니다: ' + err.message }, 500);
  }
});

// 6. 알림 수동 재발송 API
app.post('/api/notifications/resend', async (c) => {
  try {
    const { id, email, competitionId } = await c.req.json();
    let subscription;

    if (id) {
      subscription = await c.env.DB.prepare('SELECT * FROM notification_subscriptions WHERE id = ?')
        .bind(id)
        .first<{
          id: number;
          email: string;
          competitionId: string;
          userId: string | null;
          isSent: number;
          sentAt: string | null;
          sendCount: number;
          sendStatus: string;
        }>();
    } else if (email && competitionId) {
      subscription = await c.env.DB.prepare('SELECT * FROM notification_subscriptions WHERE email = ? AND competitionId = ?')
        .bind(email.trim(), competitionId)
        .first<{
          id: number;
          email: string;
          competitionId: string;
          userId: string | null;
          isSent: number;
          sentAt: string | null;
          sendCount: number;
          sendStatus: string;
        }>();
    }

    if (!subscription) {
      return c.json({ error: '알림 신청 내역을 찾을 수 없습니다.' }, 404);
    }

    await c.env.DB.prepare('UPDATE notification_subscriptions SET sendStatus = ? WHERE id = ?')
      .bind('processing', subscription.id)
      .run();

    const apiKey = c.env.RESEND_API_KEY;
    let isSuccess = false;
    let simulated = false;

    if (!apiKey) {
      console.warn('Wrangler Bindings: RESEND_API_KEY가 바인딩되지 않아 메일 전송이 가상으로 모킹됩니다.');
      simulated = true;
      isSuccess = true;
    } else {
      const emailHtml = `
        <div style="background-color: #0a0a0a; color: #ffffff; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #2d4a1f;">
          <h2 style="color: #d2ff00; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
            YBBF 대회 모집 알림
          </h2>
          <p style="font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.6;">
            신청하신 대회(ID: ${subscription.competitionId})의 모집 정보 및 재전송 안내 메일입니다.
          </p>
          <div style="background-color: #161a16; border: 1px solid rgba(210,255,0,0.2); padding: 15px; border-radius: 8px; font-size: 16px; font-weight: bold; color: #d2ff00; text-align: center; margin: 24px 0;">
            알림 발송 일시: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
          </div>
          <p style="font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.4;">
            본 메일은 YBBF 포털에서 자동으로 발송되었습니다.
          </p>
        </div>
      `;

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: subscription.email,
            subject: `[YBBF] 신청하신 대회 알림이 재발송되었습니다.`,
            html: emailHtml,
          }),
        });

        if (response.ok) {
          isSuccess = true;
        } else {
          const errorData = await response.text();
          console.error(`Resend API Error: ${errorData}`);
        }
      } catch (err: any) {
        console.error('이메일 재발송 실패:', err);
      }
    }

    const nextCount = subscription.sendCount + 1;
    const nowIso = new Date().toISOString();

    if (isSuccess) {
      await c.env.DB.prepare(`
        UPDATE notification_subscriptions 
        SET isSent = 1, sentAt = ?, sendCount = ?, sendStatus = 'sent'
        WHERE id = ?
      `)
        .bind(nowIso, nextCount, subscription.id)
        .run();

      return c.json({ 
        success: true, 
        simulated, 
        isSent: true, 
        sentAt: nowIso, 
        sendCount: nextCount, 
        sendStatus: 'sent' 
      });
    } else {
      await c.env.DB.prepare(`
        UPDATE notification_subscriptions 
        SET sendStatus = 'failed', sendCount = ?
        WHERE id = ?
      `)
        .bind(nextCount, subscription.id)
        .run();

      return c.json({ 
        success: false, 
        error: '메일 발송에 실패했습니다.', 
        sendStatus: 'failed',
        sendCount: nextCount
      }, 500);
    }
  } catch (err: any) {
    return c.json({ error: '알림 재발송 처리 중 오류 발생: ' + err.message }, 500);
  }
});

// 7. 알림 구독 목록 전체 조회 API
app.get('/api/notifications/subscriptions', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM notification_subscriptions ORDER BY id DESC').all();
    return c.json(result.results || []);
  } catch (err: any) {
    return c.json({ error: '알림 목록 조회 실패: ' + err.message }, 500);
  }
});

// invoices_pool 컬럼 자동 보정 헬퍼
async function ensureInvoicesPoolColumns(db: D1Database) {
  try {
    await db.prepare("ALTER TABLE invoices_pool ADD COLUMN stagePhoto1 TEXT").run();
  } catch (e) {}
  try {
    await db.prepare("ALTER TABLE invoices_pool ADD COLUMN stagePhoto2 TEXT").run();
  } catch (e) {}
  try {
    await db.prepare("ALTER TABLE invoices_pool ADD COLUMN publicStagePhoto1 TEXT").run();
  } catch (e) {}
  try {
    await db.prepare("ALTER TABLE invoices_pool ADD COLUMN publicStagePhoto2 TEXT").run();
  } catch (e) {}
  try {
    await db.prepare("ALTER TABLE invoices_pool ADD COLUMN publicPhotoUrls TEXT").run();
  } catch (e) {}
}

// 8. 대회 참가 접수 데이터 D1 적재 API
app.post('/api/register', async (c) => {
  try {
    const payload = await c.req.json();
    const {
      id, playerUid, playerName, playerGender, playerBirth, playerTel,
      playerEmail, playerGym, playerText, playerPhotoUrl, playerPhotoUrls, selectedPhotoUrls,
      stagePhoto1, stagePhoto2, playerService,
      joins, contestPriceSum, contestPriceTotal, playerAge, isPriceCheck,
      isCanceled, invoiceEdited, createBy, invoiceCreateAt, invoiceEditAt, contestId, submittedAt
    } = payload;

    if (!id || !playerUid || !playerName || !playerBirth || !playerTel || !playerGym) {
      return c.json({ error: '대회 신청을 위한 필수 항목이 누락되었습니다.' }, 400);
    }

    // 사진 목록 안전 가공 (배열, JSON 문자열, 단일 URL 모두 수용)
    let photoUrlsStr = '[]';
    const rawPhotos = payload.photos || playerPhotoUrls;
    if (rawPhotos) {
      photoUrlsStr = typeof rawPhotos === 'string' ? rawPhotos : JSON.stringify(rawPhotos);
    } else if (payload.playerPhotoUrlsJson) {
      photoUrlsStr = typeof payload.playerPhotoUrlsJson === 'string' ? payload.playerPhotoUrlsJson : JSON.stringify(payload.playerPhotoUrlsJson);
    } else if (playerPhotoUrl) {
      photoUrlsStr = JSON.stringify([playerPhotoUrl]);
    }

    let selectedUrlsArr: string[] = [];
    if (Array.isArray(selectedPhotoUrls)) {
      selectedUrlsArr = selectedPhotoUrls;
    } else if (typeof selectedPhotoUrls === 'string') {
      try { selectedUrlsArr = JSON.parse(selectedPhotoUrls); } catch (e) {}
    } else if (payload.selectedPhotoUrlsJson) {
      try { selectedUrlsArr = JSON.parse(payload.selectedPhotoUrlsJson); } catch (e) {}
    }

    const finalStagePhoto1 = stagePhoto1 || selectedUrlsArr[0] || null;
    const finalStagePhoto2 = stagePhoto2 || selectedUrlsArr[1] || null;
    const selectedUrlsStr = JSON.stringify([finalStagePhoto1 || '', finalStagePhoto2 || '']);

    await ensureInvoicesPoolColumns(c.env.DB);

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO invoices_pool (
        id, playerUid, playerName, playerGender, playerBirth, playerTel,
        playerEmail, playerGym, playerText, playerPhotoUrl, playerPhotoUrls, selectedPhotoUrls,
        stagePhoto1, stagePhoto2, playerService,
        joins, contestPriceSum, contestPriceTotal, playerAge, isPriceCheck,
        isCanceled, invoiceEdited, createBy, invoiceCreateAt, invoiceEditAt, contestId, submittedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, playerUid, playerName, playerGender, playerBirth, playerTel,
      playerEmail || null, playerGym, playerText || null, playerPhotoUrl || null,
      photoUrlsStr,
      selectedUrlsStr,
      finalStagePhoto1,
      finalStagePhoto2,
      playerService ? 1 : 0,
      typeof joins === 'string' ? joins : JSON.stringify(joins || []),
      contestPriceSum, contestPriceTotal, playerAge || null, isPriceCheck ? 1 : 0,
      isCanceled ? 1 : 0, invoiceEdited ? 1 : 0, createBy || 'online', invoiceCreateAt || null, invoiceEditAt || null, contestId || null, submittedAt || new Date().toISOString()
    ).run();

    return c.json({ success: true, message: 'D1 접수 아카이브 성공' });
  } catch (err: any) {
    console.error('D1 접수 오류:', err);
    return c.json({ error: '대회 접수 아카이브 실패: ' + err.message }, 500);
  }
});



// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖥️ 랜딩 및 서브페이지 CRUD APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 페이지 섹션 조회 (비로그인 허용)
app.get('/api/landing/sections', async (c) => {
  try {
    const page = c.req.query('page');
    let query = 'SELECT * FROM site_sections';
    const params = [];
    if (page) {
      query += ' WHERE page = ?';
      params.push(page);
    }
    const result = await c.env.DB.prepare(query).bind(...params).all();
    const list = (result.results || []).map(item => ({
      ...item,
      extraData: item.extraData ? JSON.parse(item.extraData as string) : null
    }));
    return c.json(list);
  } catch (err: any) {
    return c.json({ error: '섹션 조회 실패: ' + err.message }, 500);
  }
});

// 2. 페이지 섹션 업데이트 (관리자 전용)
app.post('/api/landing/sections/:sectionId', adminMiddleware, async (c) => {
  try {
    const sectionId = c.req.param('sectionId');
    const { page, title, subtitle, description, imageUrl, buttonText, buttonLink, extraData } = await c.req.json();
    if (!page) {
      return c.json({ error: '페이지 식별자는 필수 항목입니다.' }, 400);
    }
    const extraStr = extraData ? JSON.stringify(extraData) : null;

    await c.env.DB.prepare(`
      INSERT INTO site_sections (sectionId, page, title, subtitle, description, imageUrl, buttonText, buttonLink, extraData, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(sectionId) DO UPDATE SET
        page = excluded.page,
        title = excluded.title,
        subtitle = excluded.subtitle,
        description = excluded.description,
        imageUrl = excluded.imageUrl,
        buttonText = excluded.buttonText,
        buttonLink = excluded.buttonLink,
        extraData = excluded.extraData,
        updatedAt = CURRENT_TIMESTAMP
    `).bind(sectionId, page, title || null, subtitle || null, description || null, imageUrl || null, buttonText || null, buttonLink || null, extraStr).run();

    return c.json({ success: true, message: '섹션이 성공적으로 저장되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '섹션 저장 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎖️ 협회 소개 연맹 카드 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app.get('/api/about/affiliations', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM about_affiliations ORDER BY sortOrder ASC, id ASC').all();
    return c.json(result.results || []);
  } catch (err: any) {
    return c.json({ error: '연맹 목록 조회 실패: ' + err.message }, 500);
  }
});

app.post('/api/about/affiliations', adminMiddleware, async (c) => {
  try {
    const { title, description, iconName, sortOrder } = await c.req.json();
    if (!title || !description || !iconName) {
      return c.json({ error: '필수 항목이 누락되었습니다.' }, 400);
    }
    const order = sortOrder || 0;
    await c.env.DB.prepare(
      'INSERT INTO about_affiliations (title, description, iconName, sortOrder) VALUES (?, ?, ?, ?)'
    ).bind(title, description, iconName, order).run();
    return c.json({ success: true, message: '연맹 카드가 정상 등록되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '연맹 카드 생성 실패: ' + err.message }, 500);
  }
});

app.put('/api/about/affiliations/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { title, description, iconName, sortOrder } = await c.req.json();
    if (!title || !description || !iconName) {
      return c.json({ error: '필수 항목이 누락되었습니다.' }, 400);
    }
    const order = sortOrder || 0;
    await c.env.DB.prepare(`
      UPDATE about_affiliations SET title = ?, description = ?, iconName = ?, sortOrder = ?
      WHERE id = ?
    `).bind(title, description, iconName, order, id).run();
    return c.json({ success: true, message: '연맹 카드가 정상 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '연맹 카드 수정 실패: ' + err.message }, 500);
  }
});

app.delete('/api/about/affiliations/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM about_affiliations WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: '연맹 카드가 정상 삭제되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '연맹 카드 삭제 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🤝 스폰서 및 소셜 배너 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 스폰서
app.get('/api/landing/sponsors', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM landing_sponsors ORDER BY sortOrder ASC, id ASC').all();
    return c.json(result.results || []);
  } catch (err: any) {
    return c.json({ error: '스폰서 목록 조회 실패: ' + err.message }, 500);
  }
});

app.post('/api/landing/sponsors', adminMiddleware, async (c) => {
  try {
    const { name, logoUrl, sortOrder } = await c.req.json();
    if (!name) return c.json({ error: '스폰서 이름이 누락되었습니다.' }, 400);
    const order = sortOrder || 0;
    await c.env.DB.prepare('INSERT INTO landing_sponsors (name, logoUrl, sortOrder) VALUES (?, ?, ?)').bind(name, logoUrl || null, order).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/landing/sponsors/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { name, logoUrl, sortOrder } = await c.req.json();
    if (!name) return c.json({ error: '스폰서 이름이 누락되었습니다.' }, 400);
    const order = sortOrder || 0;
    await c.env.DB.prepare('UPDATE landing_sponsors SET name = ?, logoUrl = ?, sortOrder = ? WHERE id = ?').bind(name, logoUrl || null, order, id).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/landing/sponsors/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM landing_sponsors WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 소셜 피드
app.get('/api/landing/socials', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT * FROM landing_socials ORDER BY sortOrder ASC, id ASC').all();
    return c.json(result.results || []);
  } catch (err: any) {
    return c.json({ error: '소셜 목록 조회 실패: ' + err.message }, 500);
  }
});

app.post('/api/landing/socials', adminMiddleware, async (c) => {
  try {
    const { imageUrl, type, aspect, linkUrl, sortOrder } = await c.req.json();
    if (!imageUrl || !type || !aspect) return c.json({ error: '필수 항목 누락' }, 400);
    const order = sortOrder || 0;
    await c.env.DB.prepare('INSERT INTO landing_socials (imageUrl, type, aspect, linkUrl, sortOrder) VALUES (?, ?, ?, ?, ?)').bind(imageUrl, type, aspect, linkUrl || null, order).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/landing/socials/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { imageUrl, type, aspect, linkUrl, sortOrder } = await c.req.json();
    if (!imageUrl || !type || !aspect) return c.json({ error: '필수 항목 누락' }, 400);
    const order = sortOrder || 0;
    await c.env.DB.prepare('UPDATE landing_socials SET imageUrl = ?, type = ?, aspect = ?, linkUrl = ?, sortOrder = ? WHERE id = ?').bind(imageUrl, type, aspect, linkUrl || null, order, id).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/landing/socials/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM landing_socials WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏆 명예의 전당 레전드 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 전체 레전드 조회 (조인 포함, 비로그인 가능)
app.get('/api/legends', async (c) => {
  try {
    const legendsResult = await c.env.DB.prepare('SELECT * FROM legends ORDER BY sortOrder ASC, createdAt DESC').all();
    const legendsList = legendsResult.results || [];
    
    // 타이틀과 갤러리 일괄 조회 후 가공
    const titlesResult = await c.env.DB.prepare('SELECT * FROM legend_titles ORDER BY year DESC').all();
    const galleryResult = await c.env.DB.prepare('SELECT * FROM legend_gallery').all();
    
    const titlesList = titlesResult.results || [];
    const galleryList = galleryResult.results || [];
    
    const formatted = legendsList.map(legend => {
      const legendId = legend.id as string;
      const titles = titlesList.filter(t => t.legendId === legendId);
      const gallery = galleryList.filter(g => g.legendId === legendId).map(g => g.imageUrl);
      
      return {
        ...legend,
        mediaIds: legend.mediaIds ? JSON.parse(legend.mediaIds as string) : [],
        titles,
        gallery
      };
    });
    
    return c.json(formatted);
  } catch (err: any) {
    return c.json({ error: '레전드 조회 실패: ' + err.message }, 500);
  }
});

// 2. 특정 레전드 상세 조회 (비로그인 가능)
app.get('/api/legends/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const legend = await c.env.DB.prepare('SELECT * FROM legends WHERE id = ?').bind(id).first() as any | null;
    if (!legend) {
      return c.json({ error: '레전드를 찾을 수 없습니다.' }, 404);
    }
    
    const titles = (await c.env.DB.prepare('SELECT * FROM legend_titles WHERE legendId = ? ORDER BY year DESC').bind(id).all()).results || [];
    const gallery = ((await c.env.DB.prepare('SELECT imageUrl FROM legend_gallery WHERE legendId = ?').bind(id).all()).results || []).map((g: any) => g.imageUrl);
    
    return c.json({
      ...legend,
      mediaIds: legend.mediaIds ? JSON.parse(legend.mediaIds as string) : [],
      titles,
      gallery
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 3. 레전드 신규 생성 (관리자 전용)
app.post('/api/admin/legends', adminMiddleware, async (c) => {
  try {
    const payload = await c.req.json();
    const {
      id, name, nameEn, nickname, profileImage, class: className,
      height, weight, club, bio, quote, mediaIds, sortOrder
    } = payload;
    
    if (!id || !name || !nameEn || !profileImage || !className || !height || !weight) {
      return c.json({ error: '필수 등록 정보가 누락되었습니다.' }, 400);
    }
    
    const mediaJson = mediaIds ? JSON.stringify(mediaIds) : '[]';
    const order = sortOrder || 0;
    
    await c.env.DB.prepare(`
      INSERT INTO legends (id, name, nameEn, nickname, profileImage, class, height, weight, club, bio, quote, mediaIds, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, nameEn, nickname || null, profileImage, className, height, weight, club || null, bio || null, quote || null, mediaJson, order).run();
    
    return c.json({ success: true, message: '레전드가 생성되었습니다.' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. 레전드 정보 수정 (관리자 전용)
app.put('/api/admin/legends/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const payload = await c.req.json();
    const {
      name, nameEn, nickname, profileImage, class: className,
      height, weight, club, bio, quote, mediaIds, sortOrder
    } = payload;
    
    if (!name || !nameEn || !profileImage || !className || !height || !weight) {
      return c.json({ error: '필수 등록 정보가 누락되었습니다.' }, 400);
    }
    
    const mediaJson = mediaIds ? JSON.stringify(mediaIds) : '[]';
    const order = sortOrder || 0;
    
    await c.env.DB.prepare(`
      UPDATE legends SET name = ?, nameEn = ?, nickname = ?, profileImage = ?, class = ?, height = ?, weight = ?, club = ?, bio = ?, quote = ?, mediaIds = ?, sortOrder = ?
      WHERE id = ?
    `).bind(name, nameEn, nickname || null, profileImage, className, height, weight, club || null, bio || null, quote || null, mediaJson, order, id).run();
    
    return c.json({ success: true, message: '레전드 정보가 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 5. 레전드 강제 삭제 (관리자 전용)
app.delete('/api/admin/legends/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM legend_titles WHERE legendId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM legend_gallery WHERE legendId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM legends WHERE id = ?').bind(id)
    ]);
    return c.json({ success: true, message: '레전드 명예의전당 카드가 삭제되었습니다.' });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 레전드 하위 타이틀 추가
app.post('/api/admin/legends/:id/titles', adminMiddleware, async (c) => {
  try {
    const legendId = c.req.param('id');
    const { year, competition, result, class: className } = await c.req.json();
    if (!year || !competition || !result || !className) return c.json({ error: '필수값 누락' }, 400);
    await c.env.DB.prepare(
      'INSERT INTO legend_titles (legendId, year, competition, result, class) VALUES (?, ?, ?, ?, ?)'
    ).bind(legendId, year, competition, result, className).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 레전드 하위 타이틀 삭제
app.delete('/api/admin/legends/:id/titles/:titleId', adminMiddleware, async (c) => {
  try {
    const titleId = c.req.param('titleId');
    await c.env.DB.prepare('DELETE FROM legend_titles WHERE id = ?').bind(titleId).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 6. 레전드 하위 갤러리 이미지 추가
app.post('/api/admin/legends/:id/gallery', adminMiddleware, async (c) => {
  try {
    const legendId = c.req.param('id');
    const { imageUrl } = await c.req.json();
    if (!imageUrl) return c.json({ error: '이미지 경로가 누락되었습니다.' }, 400);
    await c.env.DB.prepare('INSERT INTO legend_gallery (legendId, imageUrl) VALUES (?, ?)').bind(legendId, imageUrl).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 레전드 하위 갤러리 이미지 삭제
app.delete('/api/admin/legends/:id/gallery/:galleryId', adminMiddleware, async (c) => {
  try {
    const galleryId = c.req.param('galleryId');
    await c.env.DB.prepare('DELETE FROM legend_gallery WHERE id = ?').bind(galleryId).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧒 유스 양성 시스템 APIs (클럽 & 선수)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 유스 클럽 조회 (비로그인 허용)
app.get('/api/youth/clubs', async (c) => {
  try {
    const query = `
      SELECT c.*, COUNT(a.id) AS actualAthleteCount
      FROM youth_clubs c
      LEFT JOIN youth_athletes a ON c.id = a.clubId
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const result = await c.env.DB.prepare(query).all();
    const formatted = (result.results || []).map(club => ({
      ...club,
      athleteCount: Number(club.actualAthleteCount || club.athleteCount || 0)
    }));
    return c.json(formatted);
  } catch (err: any) {
    return c.json({ error: '유스 클럽 조회 실패: ' + err.message }, 500);
  }
});

// 2. 유스 선수 조회 (수상경력 포함, 비로그인 허용)
app.get('/api/youth/athletes', async (c) => {
  try {
    const query = `
      SELECT a.*, c.name AS clubName
      FROM youth_athletes a
      LEFT JOIN youth_clubs c ON a.clubId = c.id
      ORDER BY a.createdAt DESC
    `;
    const athletesResult = await c.env.DB.prepare(query).all();
    const athletesList = athletesResult.results || [];
    
    const achievementsResult = await c.env.DB.prepare('SELECT * FROM youth_athlete_achievements').all();
    const achievementsList = achievementsResult.results || [];
    
    const formatted = athletesList.map(athlete => {
      const athleteId = athlete.id as string;
      const achievements = achievementsList.filter(ach => ach.athleteId === athleteId).map(ach => ach.achievement);
      
      return {
        ...athlete,
        achievements
      };
    });
    
    return c.json(formatted);
  } catch (err: any) {
    return c.json({ error: '유스 선수 조회 실패: ' + err.message }, 500);
  }
});

// 3. 유스 클럽 관리 (CUD, 관리자 전용)
app.post('/api/admin/youth/clubs', adminMiddleware, async (c) => {
  try {
    const { id, name, location, coach, region } = await c.req.json();
    if (!id || !name || !location || !coach) return c.json({ error: '필수 항목 누락' }, 400);
    const reg = region || '용인시';
    await c.env.DB.prepare(
      'INSERT INTO youth_clubs (id, name, location, coach, athleteCount, region) VALUES (?, ?, ?, ?, 0, ?)'
    ).bind(id, name, location, coach, reg).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/admin/youth/clubs/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { name, location, coach, region } = await c.req.json();
    if (!name || !location || !coach) return c.json({ error: '필수 항목 누락' }, 400);
    const reg = region || '용인시';
    await c.env.DB.prepare(
      'UPDATE youth_clubs SET name = ?, location = ?, coach = ?, region = ? WHERE id = ?'
    ).bind(name, location, coach, reg, id).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/admin/youth/clubs/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM youth_athlete_achievements WHERE athleteId IN (SELECT id FROM youth_athletes WHERE clubId = ?)').bind(id),
      c.env.DB.prepare('DELETE FROM youth_athletes WHERE clubId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM youth_clubs WHERE id = ?').bind(id)
    ]);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 4. 유스 선수 관리 (CUD, 관리자 전용)
app.post('/api/admin/youth/athletes', adminMiddleware, async (c) => {
  try {
    const { id, name, grade, school, clubId, class: className, badge, image, quote, bio } = await c.req.json();
    if (!id || !name || !grade || !school || !clubId || !className) return c.json({ error: '필수 항목 누락' }, 400);
    const bdg = badge || 'YBBF_YOUTH';
    
    await c.env.DB.prepare(`
      INSERT INTO youth_athletes (id, name, grade, school, clubId, class, badge, image, quote, bio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, name, grade, school, clubId, className, bdg, image || null, quote || null, bio || null).run();
    
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.put('/api/admin/youth/athletes/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { name, grade, school, clubId, class: className, badge, image, quote, bio } = await c.req.json();
    if (!name || !grade || !school || !clubId || !className) return c.json({ error: '필수 항목 누락' }, 400);
    const bdg = badge || 'YBBF_YOUTH';
    
    await c.env.DB.prepare(`
      UPDATE youth_athletes SET name = ?, grade = ?, school = ?, clubId = ?, class = ?, badge = ?, image = ?, quote = ?, bio = ?
      WHERE id = ?
    `).bind(name, grade, school, clubId, className, bdg, image || null, quote || null, bio || null, id).run();
    
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.delete('/api/admin/youth/athletes/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM youth_athlete_achievements WHERE athleteId = ?').bind(id),
      c.env.DB.prepare('DELETE FROM youth_athletes WHERE id = ?').bind(id)
    ]);
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 선수 수상 경력 추가
app.post('/api/admin/youth/athletes/:id/achievements', adminMiddleware, async (c) => {
  try {
    const athleteId = c.req.param('id');
    const { achievement } = await c.req.json();
    if (!achievement) return c.json({ error: '수상 기록 내용이 누락되었습니다.' }, 400);
    await c.env.DB.prepare('INSERT INTO youth_athlete_achievements (athleteId, achievement) VALUES (?, ?)').bind(athleteId, achievement).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// 선수 수상 경력 삭제
app.delete('/api/admin/youth/athletes/:id/achievements', adminMiddleware, async (c) => {
  try {
    const athleteId = c.req.param('id');
    const { achievement } = await c.req.json();
    if (!achievement) return c.json({ error: '삭제할 기록이 누락되었습니다.' }, 400);
    await c.env.DB.prepare('DELETE FROM youth_athlete_achievements WHERE athleteId = ? AND achievement = ?').bind(athleteId, achievement).run();
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📢 공지사항 게시판 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 공지사항 목록 조회 (비로그인 허용, mandatory 필터링 지원)
app.get('/api/notices', async (c) => {
  try {
    const mandatory = c.req.query('mandatory');
    let query = 'SELECT * FROM notices';
    
    if (mandatory === 'true' || mandatory === '1') {
      query += ' WHERE isMandatory = 1';
    }
    
    query += ' ORDER BY sortOrder ASC, createdAt DESC';
    
    const result = await c.env.DB.prepare(query).all();
    const list = result.results || [];
    
    // JSON 필드 안전 파싱 함수
    const safeJsonParse = (str: any, fallback: any = []) => {
      if (!str) return fallback;
      try {
        return typeof str === 'string' ? JSON.parse(str) : str;
      } catch (e) {
        console.error('JSON 파싱 오류:', e);
        return fallback;
      }
    };

    // JSON 필드 파싱 (images, attachments)
    const formatted = list.map(item => ({
      ...item,
      isMandatory: !!item.isMandatory,
      images: safeJsonParse(item.images),
      attachments: safeJsonParse(item.attachments)
    }));
    
    return c.json(formatted);
  } catch (err: any) {
    return c.json({ error: '공지사항 목록 조회 실패: ' + err.message }, 500);
  }
});

// 2. 공지사항 상세 조회 (비로그인 허용, 조회수 증가 처리)
app.get('/api/notices/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    // 조회수 1 증가 처리
    await c.env.DB.prepare('UPDATE notices SET views = views + 1 WHERE id = ?').bind(id).run();
    
    const item = await c.env.DB.prepare('SELECT * FROM notices WHERE id = ?')
      .bind(id)
      .first() as any | null;
      
    if (!item) {
      return c.json({ error: '공지사항을 찾을 수 없습니다.' }, 404);
    }

    const safeJsonParse = (str: any, fallback: any = []) => {
      if (!str) return fallback;
      try {
        return typeof str === 'string' ? JSON.parse(str) : str;
      } catch (e) {
        console.error('JSON 파싱 오류:', e);
        return fallback;
      }
    };
    
    return c.json({
      ...item,
      isMandatory: !!item.isMandatory,
      images: safeJsonParse(item.images),
      attachments: safeJsonParse(item.attachments)
    });
  } catch (err: any) {
    return c.json({ error: '공지사항 상세 조회 실패: ' + err.message }, 500);
  }
});

// 3. 공지사항 등록 API (관리자 전용)
app.post('/api/admin/notices', adminMiddleware, async (c) => {
  try {
    const payload = await c.req.json();
    const {
      id, title, content, videoUrl, youtubeUrl, audioUrl,
      images, attachments, isMandatory, sortOrder
    } = payload;
    
    if (!id || !title) {
      return c.json({ error: '필수 항목(id, 제목)이 누락되었습니다.' }, 400);
    }
    
    const mandatoryVal = isMandatory ? 1 : 0;
    const order = sortOrder || 0;
    const imagesJson = images ? (typeof images === 'string' ? images : JSON.stringify(images)) : '[]';
    const attachmentsJson = attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : '[]';
    
    await c.env.DB.prepare(`
      INSERT INTO notices (
        id, title, content, videoUrl, youtubeUrl, audioUrl, 
        images, attachments, isMandatory, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, title, content || null, videoUrl || null, youtubeUrl || null, audioUrl || null,
      imagesJson, attachmentsJson, mandatoryVal, order
    ).run();
    
    return c.json({ success: true, message: '공지사항이 등록되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '공지사항 등록 실패: ' + err.message }, 500);
  }
});

// 4. 공지사항 수정 API (관리자 전용)
app.put('/api/admin/notices/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const payload = await c.req.json();
    const {
      title, content, videoUrl, youtubeUrl, audioUrl,
      images, attachments, isMandatory, sortOrder
    } = payload;
    
    if (!title) {
      return c.json({ error: '제목은 필수 항목입니다.' }, 400);
    }
    
    const mandatoryVal = isMandatory ? 1 : 0;
    const order = sortOrder || 0;
    const imagesJson = images ? (typeof images === 'string' ? images : JSON.stringify(images)) : '[]';
    const attachmentsJson = attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : '[]';
    
    await c.env.DB.prepare(`
      UPDATE notices SET 
        title = ?, content = ?, videoUrl = ?, youtubeUrl = ?, audioUrl = ?, 
        images = ?, attachments = ?, isMandatory = ?, sortOrder = ?
      WHERE id = ?
    `).bind(
      title, content || null, videoUrl || null, youtubeUrl || null, audioUrl || null,
      imagesJson, attachmentsJson, mandatoryVal, order, id
    ).run();
    
    return c.json({ success: true, message: '공지사항이 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '공지사항 수정 실패: ' + err.message }, 500);
  }
});

// 5. 공지사항 삭제 API (관리자 전용)
app.delete('/api/admin/notices/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM notices WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: '공지사항이 삭제되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '공지사항 삭제 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚖️ 사전계측자료 업로드 및 검토 APIs (선수용 및 관리자용)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 선수용 접수 상태 및 제출 여부 조회 API
app.get('/api/pre-measurement/status', async (c) => {
  try {
    const contestId = c.req.query('contestId');
    const playerUid = c.req.query('playerUid');

    if (!contestId || !playerUid) {
      return c.json({ error: '대회 식별자(contestId)와 선수 식별자(playerUid)가 필요합니다.' }, 400);
    }

    // 1. D1 invoices_pool 테이블에서 접수 완료 여부 판독 (취소되지 않은 상태)
    const invoice = await c.env.DB.prepare(`
      SELECT id, playerName, playerTel 
      FROM invoices_pool 
      WHERE contestId = ? AND playerUid = ? AND isCanceled = 0
      LIMIT 1
    `).bind(contestId, playerUid).first() as { id: string; playerName: string; playerTel: string } | null;

    if (!invoice) {
      return c.json({
        registered: false,
        submitted: false,
        data: null
      });
    }

    // 2. 이미 계측자료가 등록되어 있는지 판독
    const measurement = await c.env.DB.prepare(`
      SELECT * FROM pre_measurements 
      WHERE contestId = ? AND playerUid = ?
      LIMIT 1
    `).bind(contestId, playerUid).first() as any | null;

    return c.json({
      registered: true,
      submitted: !!measurement,
      data: measurement || null
    });
  } catch (err: any) {
    console.error('사전계측 상태 조회 실패:', err);
    return c.json({ error: '상태 조회 실패: ' + err.message }, 500);
  }
});

// 2. 선수용 사전계측자료 제출 API
app.post('/api/pre-measurement', async (c) => {
  try {
    const { contestId, playerUid, playerName, playerTel, mediaUrl, mediaType } = await c.req.json();

    if (!contestId || !playerUid || !playerName || !playerTel || !mediaUrl || !mediaType) {
      return c.json({ error: '사전계측자료 제출을 위한 필수 정보가 누락되었습니다.' }, 400);
    }

    // 1. 접수 완료된 선수인지 검증
    const invoice = await c.env.DB.prepare(`
      SELECT id FROM invoices_pool 
      WHERE contestId = ? AND playerUid = ? AND isCanceled = 0
      LIMIT 1
    `).bind(contestId, playerUid).first();

    if (!invoice) {
      return c.json({ error: '해당 대회에 접수 완료된 내역을 찾을 수 없습니다.' }, 403);
    }

    // 2. 사전계측 정보 삽입 또는 업데이트
    const id = `${contestId}_${playerUid}`;
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO pre_measurements (
        id, contestId, playerUid, playerName, playerTel, mediaUrl, mediaType, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(id, contestId, playerUid, playerName, playerTel, mediaUrl, mediaType).run();

    return c.json({ success: true, message: '사전계측자료가 제출되었습니다.' });
  } catch (err: any) {
    console.error('사전계측 제출 실패:', err);
    return c.json({ error: '제출 실패: ' + err.message }, 500);
  }
});

// 3. 관리자용 특정 대회의 사전계측자료 전체 조회 API (관리자 전용)
app.get('/api/admin/pre-measurement/list', adminMiddleware, async (c) => {
  try {
    const contestId = c.req.query('contestId');
    if (!contestId) {
      return c.json({ error: '대회 식별자(contestId)가 누락되었습니다.' }, 400);
    }

    const result = await c.env.DB.prepare(`
      SELECT * FROM pre_measurements 
      WHERE contestId = ? 
      ORDER BY createdAt DESC
    `).bind(contestId).all();

    return c.json(result.results || []);
  } catch (err: any) {
    console.error('사전계측 목록 조회 실패:', err);
    return c.json({ error: '목록 조회 실패: ' + err.message }, 500);
  }
});

// 4. 관리자용 사전계측자료 레코드 삭제 API (관리자 전용)
app.delete('/api/admin/pre-measurement/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM pre_measurements WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: '사전계측 자료가 성공적으로 삭제되었습니다.' });
  } catch (err: any) {
    console.error('사전계측 삭제 실패:', err);
    return c.json({ error: '자료 삭제 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚖️ 협회 관계자(Contest Staff) 인증 미들웨어 및 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 관계자 세션 검증 미들웨어
async function contestMiddleware(c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) {
  const token = c.req.header('Cookie')?.match(/contest_session_token=([^;]+)/)?.[1]
                || c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: '인증 세션이 유효하지 않습니다. (관계자 전용)' }, 401);
  }

  const staff = await c.env.DB.prepare('SELECT uid, contestId, role FROM contest_staffs WHERE uid = ?')
    .bind(token)
    .first() as { uid: string; contestId: string | null; role: string } | null;

  if (!staff) {
    return c.json({ error: '관계자 정보를 찾을 수 없습니다.' }, 401);
  }

  c.set('staffUid', staff.uid);
  c.set('staffContestId', staff.contestId);
  await next();
}

// 1-1. 관계자 아이디 중복 확인 API
app.get('/api/contest/auth/check-username', async (c) => {
  try {
    const username = c.req.query('username')?.trim();
    if (!username) {
      return c.json({ error: '확인할 아이디를 입력해 주세요.', available: false }, 400);
    }

    const exists = await c.env.DB.prepare('SELECT uid FROM contest_staffs WHERE username = ?')
      .bind(username)
      .first();

    if (exists) {
      return c.json({ available: false, message: '이미 사용 중인 아이디입니다.' });
    }

    return c.json({ available: true, message: '사용 가능한 아이디입니다.' });
  } catch (err: any) {
    console.error('아이디 중복 확인 에러:', err);
    return c.json({ error: '아이디 중복 확인 중 오류가 발생했습니다: ' + err.message, available: false }, 500);
  }
});

// 2. 관계자 회원가입 API
app.post('/api/contest/auth/signup', async (c) => {
  try {
    const { username, password, name, contestId, phone, email, position, isReferee, refereeGrade, profilePhotoUrl, businessIntro, snsLinks } = await c.req.json();
    if (!username || !password || !name || !phone) {
      return c.json({ error: '아이디, 비밀번호, 이름, 연락처는 필수 가입 항목입니다.' }, 400);
    }

    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    // 아이디 중복 체크
    const exists = await c.env.DB.prepare('SELECT uid FROM contest_staffs WHERE username = ?')
      .bind(username.trim())
      .first();
    if (exists) {
      return c.json({ error: '이미 존재하는 관계자 아이디입니다.' }, 400);
    }

    const uid = crypto.randomUUID();
    
    // 🔒 솔트 격리 저장 (KV 활용)
    const salt = generateSalt();
    await putSalt(c, `contest:${uid}`, salt);
    
    const passwordHash = await hashPassword(password, salt, secretKey);

    // 🔒 이름 및 전화번호 복호화 가능한 암호화 처리 (AES-256-GCM)
    const encryptedName = await encryptText(name.trim(), secretKey);
    const encryptedTel = await encryptText(phone.trim(), secretKey);
    const phoneLast4 = phone.replace(/[^0-9]/g, '').slice(-4);
    const snsLinksStr = snsLinks ? JSON.stringify(snsLinks) : null;

    await c.env.DB.prepare(`
      INSERT INTO contest_staffs (
        uid, username, passwordHash, name, role, contestId, 
        phone_encrypted, phone_last4, email, position, isReferee, refereeGrade,
        profilePhotoUrl, businessIntro, snsLinks
      ) VALUES (?, ?, ?, ?, 'staff', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uid, username.trim(), passwordHash, encryptedName, contestId || null,
      encryptedTel, phoneLast4, email || null, position || null, isReferee ? 1 : 0, refereeGrade || null,
      profilePhotoUrl || null, businessIntro || null, snsLinksStr
    ).run();

    return c.json({ success: true, message: '관계자 계정이 생성되었습니다. 관리자 승인 후 사용 가능합니다.' });
  } catch (err: any) {
    console.error('관계자 가입 에러:', err);
    return c.json({ error: '관계자 가입 실패: ' + err.message }, 500);
  }
});

// 3. 관계자 로그인 API
app.post('/api/contest/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: '아이디와 비밀번호를 입력해 주세요.' }, 400);
    }

    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    const staff = await c.env.DB.prepare('SELECT * FROM contest_staffs WHERE username = ?')
      .bind(username.trim())
      .first() as any | null;

    if (!staff) {
      return c.json({ error: '가입되지 않은 관계자 아이디이거나 비밀번호가 다릅니다.' }, 400);
    }

    if (staff.status === 'inactive') {
      return c.json({ error: '해당 계정은 비활성화 상태입니다. 관리자에게 문의하세요.' }, 403);
    }

    // 🔒 격리 저장된 솔트 로드
    const saltKey = `contest:${staff.uid}`;
    let salt: string | null = null;
    if (c.env.KV) {
      salt = await c.env.KV.get(`salt:${saltKey}`);
    } else {
      const kvRow = await c.env.DB.prepare('SELECT value FROM virtual_kv WHERE key = ?')
        .bind(`salt:${saltKey}`)
        .first() as { value: string } | null;
      salt = kvRow ? kvRow.value : null;
    }

    if (!salt) {
      return c.json({ error: '계정 보안 솔트 정보를 조회할 수 없습니다.' }, 400);
    }

    const inputHash = await hashPassword(password, salt, secretKey);
    if (inputHash !== staff.passwordHash) {
      return c.json({ error: '가입되지 않은 관계자 아이디이거나 비밀번호가 다릅니다.' }, 400);
    }

    // 세션 쿠키 헤더 구성 (Cross-Site 대응)
    c.header(
      'Set-Cookie',
      `contest_session_token=${staff.uid}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000` // 30일
    );

    // 🔒 개인정보 실시간 복호화 리턴
    const decryptedName = await decryptText(staff.name, secretKey);
    const decryptedPhone = staff.phone_encrypted ? await decryptText(staff.phone_encrypted, secretKey) : '';
    
    let parsedSnsLinks = {};
    try {
      if (staff.snsLinks) {
        parsedSnsLinks = JSON.parse(staff.snsLinks);
      }
    } catch (parseErr) {
      console.error('Failed to parse snsLinks:', parseErr);
    }

    return c.json({
      success: true,
      token: staff.uid,
      staff: {
        uid: staff.uid,
        username: staff.username,
        name: decryptedName,
        role: staff.role,
        status: staff.status || 'active',
        contestId: staff.contestId,
        phone: decryptedPhone,
        email: staff.email,
        position: staff.position,
        isReferee: !!staff.isReferee,
        refereeGrade: staff.refereeGrade,
        profilePhotoUrl: staff.profilePhotoUrl || null,
        businessIntro: staff.businessIntro || null,
        snsLinks: parsedSnsLinks
      }
    });
  } catch (err: any) {
    console.error('관계자 로그인 에러:', err);
    return c.json({ error: '로그인 오류: ' + err.message }, 500);
  }
});

// 4. 관계자 로그아웃 API
app.post('/api/contest/auth/logout', async (c) => {
  c.header(
    'Set-Cookie',
    `contest_session_token=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0`
  );
  return c.json({ success: true, message: '로그아웃되었습니다.' });
});

// 5. 관계자 내 세션 확인 API
app.get('/api/contest/auth/me', contestMiddleware, async (c) => {
  try {
    const staffUid = c.get('staffUid');
    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    
    const staff = await c.env.DB.prepare('SELECT * FROM contest_staffs WHERE uid = ?')
      .bind(staffUid)
      .first() as any | null;

    if (!staff) {
      return c.json({ error: '세션 세부 정보를 조회할 수 없습니다.' }, 404);
    }

    // 🔒 개인정보 실시간 복호화 리턴
    const decryptedName = await decryptText(staff.name, secretKey);
    const decryptedPhone = staff.phone_encrypted ? await decryptText(staff.phone_encrypted, secretKey) : '';

    let parsedSnsLinks = {};
    try {
      if (staff.snsLinks) {
        parsedSnsLinks = JSON.parse(staff.snsLinks);
      }
    } catch (parseErr) {
      console.error('Failed to parse snsLinks:', parseErr);
    }

    return c.json({
      uid: staff.uid,
      username: staff.username,
      name: decryptedName,
      role: staff.role,
      status: staff.status || 'active',
      contestId: staff.contestId,
      phone: decryptedPhone,
      email: staff.email,
      position: staff.position,
      isReferee: !!staff.isReferee,
      refereeGrade: staff.refereeGrade,
      profilePhotoUrl: staff.profilePhotoUrl || null,
      businessIntro: staff.businessIntro || null,
      snsLinks: parsedSnsLinks
    });
  } catch (err: any) {
    return c.json({ error: '세션 갱신 실패: ' + err.message }, 500);
  }
});

// 5.1. 관계자 추가 프로필 정보 입력 API
app.post('/api/contest/auth/additional-info', async (c) => {
  try {
    const { username, profilePhotoUrl, businessIntro, snsLinks } = await c.req.json();
    if (!username) {
      return c.json({ error: 'username은 필수 요청 항목입니다.' }, 400);
    }

    const snsLinksStr = snsLinks ? JSON.stringify(snsLinks) : null;

    // username이 일치하는 스태프 찾기
    const staff = await c.env.DB.prepare('SELECT uid FROM contest_staffs WHERE username = ?')
      .bind(username.trim())
      .first();

    if (!staff) {
      return c.json({ error: '존재하지 않는 관계자 아이디입니다.' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE contest_staffs
      SET profilePhotoUrl = ?, businessIntro = ?, snsLinks = ?
      WHERE username = ?
    `).bind(
      profilePhotoUrl || null,
      businessIntro || null,
      snsLinksStr,
      username.trim()
    ).run();

    return c.json({ success: true, message: '임원 추가 정보가 저장되었습니다.' });
  } catch (err: any) {
    console.error('관계자 추가 정보 저장 에러:', err);
    return c.json({ error: '추가 정보 저장 실패: ' + err.message }, 500);
  }
});

// 5.2. 관계자 비밀번호 검증 API
app.post('/api/contest/auth/verify-password', contestMiddleware, async (c) => {
  try {
    const staffUid = c.get('staffUid');
    const { password } = await c.req.json();

    if (!password) {
      return c.json({ error: '비밀번호를 입력해 주세요.' }, 400);
    }

    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    // DB에서 스태프 정보 조회
    const staff = await c.env.DB.prepare('SELECT passwordHash FROM contest_staffs WHERE uid = ?')
      .bind(staffUid)
      .first() as { passwordHash: string } | null;

    if (!staff) {
      return c.json({ error: '관계자 정보를 조회할 수 없습니다.' }, 404);
    }

    // 🔒 격리 저장된 솔트 로드
    const saltKey = `contest:${staffUid}`;
    let salt: string | null = null;
    if (c.env.KV) {
      salt = await c.env.KV.get(`salt:${saltKey}`);
    } else {
      const kvRow = await c.env.DB.prepare('SELECT value FROM virtual_kv WHERE key = ?')
        .bind(`salt:${saltKey}`)
        .first() as { value: string } | null;
      salt = kvRow ? kvRow.value : null;
    }

    if (!salt) {
      return c.json({ error: '계정 보안 솔트 정보를 조회할 수 없습니다.' }, 400);
    }

    const inputHash = await hashPassword(password, salt, secretKey);
    if (inputHash !== staff.passwordHash) {
      return c.json({ error: '비밀번호가 일치하지 않습니다.' }, 400);
    }

    return c.json({ success: true, message: '비밀번호가 확인되었습니다.' });
  } catch (err: any) {
    console.error('비밀번호 검증 에러:', err);
    return c.json({ error: '비밀번호 검증 실패: ' + err.message }, 500);
  }
});

// 6. 최고 관리자 전용 관계자 계정 제어 APIs
// 6.1. 관계자 등록 API
app.post('/api/admin/contest-staffs', adminMiddleware, async (c) => {
  try {
    const { username, password, name, role, status, contestId, phone, email, position, isReferee, refereeGrade, profilePhotoUrl, businessIntro, snsLinks } = await c.req.json();
    if (!username || !password || !name || !phone) {
      return c.json({ error: '아이디, 패스워드, 이름, 연락처는 필수 등록 항목입니다.' }, 400);
    }

    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    // 아이디 중복 체크
    const exists = await c.env.DB.prepare('SELECT uid FROM contest_staffs WHERE username = ?')
      .bind(username.trim())
      .first();
    if (exists) {
      return c.json({ error: '이미 존재하는 관계자 아이디입니다.' }, 400);
    }

    const uid = crypto.randomUUID();
    
    // 🔒 솔트 격리 저장
    const salt = generateSalt();
    await putSalt(c, `contest:${uid}`, salt);
    
    const passwordHash = await hashPassword(password, salt, secretKey);

    // 🔒 이름 및 전화번호 암호화
    const encryptedName = await encryptText(name.trim(), secretKey);
    const encryptedTel = await encryptText(phone.trim(), secretKey);
    const phoneLast4 = phone.replace(/[^0-9]/g, '').slice(-4);
    const snsLinksStr = snsLinks ? JSON.stringify(snsLinks) : null;

    await c.env.DB.prepare(`
      INSERT INTO contest_staffs (
        uid, username, passwordHash, name, role, status, contestId, 
        phone_encrypted, phone_last4, email, position, isReferee, refereeGrade,
        profilePhotoUrl, businessIntro, snsLinks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      uid, username.trim(), passwordHash, encryptedName, role || 'staff', status || 'active', contestId || null,
      encryptedTel, phoneLast4, email || null, position || null, isReferee ? 1 : 0, refereeGrade || null,
      profilePhotoUrl || null, businessIntro || null, snsLinksStr
    ).run();

    return c.json({
      success: true,
      message: '관계자 계정이 성공적으로 등록되었습니다.',
      uid: uid
    });
  } catch (err: any) {
    return c.json({ error: '스태프 생성 실패: ' + err.message }, 500);
  }
});

// 6.2. 관계자 목록 조회 API (실시간 복호화 및 검색/필터링)
app.get('/api/admin/contest-staffs', adminMiddleware, async (c) => {
  try {
    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    const keyword = c.req.query('keyword')?.trim().toLowerCase();
    const statusParam = c.req.query('status');
    const roleParam = c.req.query('role');

    let query = 'SELECT * FROM contest_staffs WHERE 1=1';
    const params: any[] = [];

    if (statusParam && statusParam !== 'all') {
      query += ' AND status = ?';
      params.push(statusParam);
    }

    if (roleParam && roleParam !== 'all') {
      query += ' AND role = ?';
      params.push(roleParam);
    }

    query += ' ORDER BY createdAt DESC';

    const stmt = c.env.DB.prepare(query);
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    const list = result.results || [];
    
    let decryptedList: any[] = [];
    for (const staff of list) {
      let decryptedName = staff.name as string;
      let decryptedPhone = '';
      try {
        decryptedName = await decryptText(staff.name as string, secretKey);
        decryptedPhone = staff.phone_encrypted ? await decryptText(staff.phone_encrypted as string, secretKey) : '';
      } catch (decErr) {
        console.error(`스태프 uid ${staff.uid} 복호화 실패:`, decErr);
      }
      
      let parsedSnsLinks = {};
      try {
        if (staff.snsLinks) {
          parsedSnsLinks = JSON.parse(staff.snsLinks as string);
        }
      } catch (parseErr) {
        console.error(`스태프 uid ${staff.uid} snsLinks 파싱 실패:`, parseErr);
      }

      decryptedList.push({
        uid: staff.uid,
        username: staff.username,
        name: decryptedName,
        role: staff.role,
        status: (staff.status as string) || 'active',
        contestId: staff.contestId,
        phone: decryptedPhone,
        phone_last4: staff.phone_last4,
        email: staff.email,
        position: staff.position,
        isReferee: !!staff.isReferee,
        refereeGrade: staff.refereeGrade,
        profilePhotoUrl: staff.profilePhotoUrl || null,
        businessIntro: staff.businessIntro || null,
        snsLinks: parsedSnsLinks,
        createdAt: staff.createdAt
      });
    }

    // keyword 필터링 (아이디, 복호화된 이름, 복호화된 연락처, phone_last4, 이메일)
    if (keyword) {
      decryptedList = decryptedList.filter(item => 
        (item.username && item.username.toLowerCase().includes(keyword)) ||
        (item.name && item.name.toLowerCase().includes(keyword)) ||
        (item.phone && item.phone.toLowerCase().includes(keyword)) ||
        (item.phone_last4 && item.phone_last4.includes(keyword)) ||
        (item.email && item.email.toLowerCase().includes(keyword))
      );
    }
    
    return c.json({
      success: true,
      total: decryptedList.length,
      staffs: decryptedList
    });
  } catch (err: any) {
    return c.json({ error: '목록 조회 실패: ' + err.message }, 500);
  }
});

// 6.3. 관계자 정보 수정 API
app.put('/api/admin/contest-staffs/:uid', adminMiddleware, async (c) => {
  try {
    const uid = c.req.param('uid');
    const { name, role, status, contestId, password, phone, email, position, isReferee, refereeGrade, profilePhotoUrl, businessIntro, snsLinks } = await c.req.json();

    if (!name || !role || !phone) {
      return c.json({ error: '이름, 역할, 연락처는 필수 항목입니다.' }, 400);
    }

    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;

    // 🔒 이름 및 전화번호 암호화
    const encryptedName = await encryptText(name.trim(), secretKey);
    const encryptedTel = await encryptText(phone.trim(), secretKey);
    const phoneLast4 = phone.replace(/[^0-9]/g, '').slice(-4);
    const snsLinksStr = snsLinks ? JSON.stringify(snsLinks) : null;

    if (password && password.trim() !== '') {
      // 비밀번호 변경 시 솔트 격리 갱신 및 해싱
      const salt = generateSalt();
      await putSalt(c, `contest:${uid}`, salt);
      const passwordHash = await hashPassword(password, salt, secretKey);
      
      await c.env.DB.prepare(`
        UPDATE contest_staffs 
        SET name = ?, role = ?, status = ?, contestId = ?, passwordHash = ?, 
            phone_encrypted = ?, phone_last4 = ?, email = ?, position = ?, isReferee = ?, refereeGrade = ?,
            profilePhotoUrl = ?, businessIntro = ?, snsLinks = ?
        WHERE uid = ?
      `).bind(
        encryptedName, role, status || 'active', contestId || null, passwordHash, 
        encryptedTel, phoneLast4, email || null, position || null, isReferee ? 1 : 0, refereeGrade || null, 
        profilePhotoUrl || null, businessIntro || null, snsLinksStr,
        uid
      ).run();
    } else {
      await c.env.DB.prepare(`
        UPDATE contest_staffs 
        SET name = ?, role = ?, status = ?, contestId = ?, 
            phone_encrypted = ?, phone_last4 = ?, email = ?, position = ?, isReferee = ?, refereeGrade = ?,
            profilePhotoUrl = ?, businessIntro = ?, snsLinks = ?
        WHERE uid = ?
      `).bind(
        encryptedName, role, status || 'active', contestId || null, 
        encryptedTel, phoneLast4, email || null, position || null, isReferee ? 1 : 0, refereeGrade || null, 
        profilePhotoUrl || null, businessIntro || null, snsLinksStr,
        uid
      ).run();
    }

    return c.json({ success: true, message: '관계자 정보가 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '수정 실패: ' + err.message }, 500);
  }
});

// 6.4. 계정 상태 변경 API (PATCH)
app.patch('/api/admin/contest-staffs/:uid/status', adminMiddleware, async (c) => {
  try {
    const uid = c.req.param('uid');
    const { status } = await c.req.json();

    if (!status || !['active', 'inactive', 'pending'].includes(status)) {
      return c.json({ error: '유효하지 않은 계정 상태입니다.' }, 400);
    }

    const result = await c.env.DB.prepare('UPDATE contest_staffs SET status = ? WHERE uid = ?')
      .bind(status, uid)
      .run();

    if (!result.success) {
      return c.json({ error: '상태 변경에 실패했습니다.' }, 500);
    }

    return c.json({
      success: true,
      message: `계정 상태가 '${status}'로 변경되었습니다.`
    });
  } catch (err: any) {
    return c.json({ error: '상태 변경 실패: ' + err.message }, 500);
  }
});

// 6.5. 비밀번호 초기화 API (POST)
app.post('/api/admin/contest-staffs/:uid/reset-password', adminMiddleware, async (c) => {
  try {
    const uid = c.req.param('uid');
    const { newPassword } = await c.req.json().catch(() => ({}));

    const staff = await c.env.DB.prepare('SELECT uid FROM contest_staffs WHERE uid = ?')
      .bind(uid)
      .first();
    if (!staff) {
      return c.json({ error: '존재하지 않는 스태프 계정입니다.' }, 404);
    }

    const secretKey = c.env.CONTEST_CRYPTO_SECRET || c.env.CRYPTO_SECRET;
    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    let tempPassword = newPassword && newPassword.trim() !== '' ? newPassword.trim() : '';
    if (!tempPassword) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < 8; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // 무작위 솔트 생성 및 저장
    const salt = generateSalt();
    await putSalt(c, `contest:${uid}`, salt);

    const passwordHash = await hashPassword(tempPassword, salt, secretKey);

    await c.env.DB.prepare('UPDATE contest_staffs SET passwordHash = ? WHERE uid = ?')
      .bind(passwordHash, uid)
      .run();

    return c.json({
      success: true,
      message: '비밀번호가 성공적으로 초기화되었습니다.',
      tempPassword: tempPassword
    });
  } catch (err: any) {
    return c.json({ error: '비밀번호 초기화 실패: ' + err.message }, 500);
  }
});

// 6.6. 관계자 삭제 API
app.delete('/api/admin/contest-staffs/:uid', adminMiddleware, async (c) => {
  try {
    const uid = c.req.param('uid');
    
    // D1 레코드 삭제
    await c.env.DB.prepare('DELETE FROM contest_staffs WHERE uid = ?').bind(uid).run();
    
    // 🔒 격리된 솔트 삭제 시도
    try {
      const saltKey = `contest:${uid}`;
      if (c.env.KV) {
        await c.env.KV.delete(`salt:${saltKey}`);
      } else {
        await c.env.DB.prepare('DELETE FROM virtual_kv WHERE key = ?').bind(`salt:${saltKey}`).run();
      }
    } catch (kvErr) {
      console.warn('솔트 삭제 실패:', kvErr);
    }
    
    return c.json({ success: true, message: '관계자 계정이 삭제되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '삭제 실패: ' + err.message }, 500);
  }
});

// 7. 관계자용 대회 접수 현황 APIs (격리 권한 적용)
// 7.1. 관계자용 접수 신청 목록 조회
app.get('/api/contest/registrations', contestMiddleware, async (c) => {
  try {
    const staffContestId = c.get('staffContestId');
    const paramContestId = c.req.query('contestId');
    const keyword = c.req.query('keyword');
    const isPriceCheck = c.req.query('isPriceCheck');
    const isCanceled = c.req.query('isCanceled');

    let finalContestId = paramContestId;
    if (staffContestId) {
      finalContestId = staffContestId;
    }

    let query = 'SELECT * FROM invoices_pool WHERE 1=1';
    const params: any[] = [];

    if (finalContestId) {
      query += ' AND contestId = ?';
      params.push(finalContestId);
    }

    if (keyword) {
      query += ' AND (playerName LIKE ? OR playerTel LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (isPriceCheck !== undefined && isPriceCheck !== '') {
      query += ' AND isPriceCheck = ?';
      params.push(isPriceCheck === 'true' || isPriceCheck === '1' ? 1 : 0);
    }

    if (isCanceled !== undefined && isCanceled !== '') {
      query += ' AND isCanceled = ?';
      params.push(isCanceled === 'true' || isCanceled === '1' ? 1 : 0);
    }

    query += ' ORDER BY submittedAt DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();
    const list = (result.results || []).map(item => {
      let playerPhotoUrls: string[] = [];
      try {
        if (item.playerPhotoUrls) {
          playerPhotoUrls = typeof item.playerPhotoUrls === 'string' ? JSON.parse(item.playerPhotoUrls) : item.playerPhotoUrls;
        }
      } catch (e) {}
      if ((!playerPhotoUrls || playerPhotoUrls.length === 0) && item.playerPhotoUrl) {
        playerPhotoUrls = [item.playerPhotoUrl as string];
      }

      let selectedPhotoUrls: string[] = [];
      try {
        if (item.selectedPhotoUrls) {
          selectedPhotoUrls = typeof item.selectedPhotoUrls === 'string' ? JSON.parse(item.selectedPhotoUrls) : item.selectedPhotoUrls;
        }
      } catch (e) {}

      const stagePhoto1 = (item.stagePhoto1 as string) || selectedPhotoUrls[0] || '';
      const stagePhoto2 = (item.stagePhoto2 as string) || selectedPhotoUrls[1] || '';

      let publicPhotoUrls: string[] = [];
      try {
        if (item.publicPhotoUrls) {
          publicPhotoUrls = typeof item.publicPhotoUrls === 'string' ? JSON.parse(item.publicPhotoUrls) : item.publicPhotoUrls;
        }
      } catch (e) {}

      return {
        ...item,
        joins: item.joins ? JSON.parse(item.joins as string) : [],
        playerPhotoUrls,
        photos: playerPhotoUrls,
        selectedPhotoUrls: [stagePhoto1, stagePhoto2],
        stagePhoto1,
        stagePhoto2,
        publicStagePhoto1: (item.publicStagePhoto1 as string) || '',
        publicStagePhoto2: (item.publicStagePhoto2 as string) || '',
        publicPhotoUrls,
        isPriceCheck: !!item.isPriceCheck,
        isCanceled: !!item.isCanceled,
        invoiceEdited: !!item.invoiceEdited,
        playerService: !!item.playerService
      };
    });

    return c.json(list);
  } catch (err: any) {
    console.error('관계자 접수 목록 조회 실패:', err);
    return c.json({ error: '목록 조회 실패: ' + err.message }, 500);
  }
});

// 7.2. 관계자용 특정 접수 건의 입금 확인 여부 토글
app.post('/api/contest/registrations/:id/check', contestMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { isPriceCheck } = await c.req.json();
    const staffContestId = c.get('staffContestId');

    if (staffContestId) {
      const invoice = await c.env.DB.prepare('SELECT contestId FROM invoices_pool WHERE id = ?').bind(id).first() as { contestId: string | null } | null;
      if (!invoice || invoice.contestId !== staffContestId) {
        return c.json({ error: '해당 데이터의 수정 권한이 없습니다.' }, 403);
      }
    }

    const checkVal = isPriceCheck ? 1 : 0;
    await c.env.DB.prepare('UPDATE invoices_pool SET isPriceCheck = ? WHERE id = ?')
      .bind(checkVal, id)
      .run();

    return c.json({ success: true, message: '입금 확인 상태가 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '상태 수정 실패: ' + err.message }, 500);
  }
});

// 7.3. 관계자용 특정 접수 건의 취소 여부 토글
app.post('/api/contest/registrations/:id/cancel', contestMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const { isCanceled } = await c.req.json();
    const staffContestId = c.get('staffContestId');

    if (staffContestId) {
      const invoice = await c.env.DB.prepare('SELECT contestId FROM invoices_pool WHERE id = ?').bind(id).first() as { contestId: string | null } | null;
      if (!invoice || invoice.contestId !== staffContestId) {
        return c.json({ error: '해당 데이터의 수정 권한이 없습니다.' }, 403);
      }
    }

    const cancelVal = isCanceled ? 1 : 0;
    await c.env.DB.prepare('UPDATE invoices_pool SET isCanceled = ? WHERE id = ?')
      .bind(cancelVal, id)
      .run();

    return c.json({ success: true, message: '접수 취소 상태가 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '상태 수정 실패: ' + err.message }, 500);
  }
});

// 8. 최고 관리자용 대회 참가 접수 내역(인보이스) 삭제 API (관리자 전용)
app.delete('/api/admin/invoices/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM invoices_pool WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: '참가 접수 내역이 성공적으로 삭제되었습니다.' });
  } catch (err: any) {
    console.error('참가 접수 내역 삭제 실패:', err);
    return c.json({ error: '참가 접수 내역 삭제 실패: ' + err.message }, 500);
  }
});

// 9. 관계자 아이디 중복 확인 API
app.get('/api/contest/auth/check-username', async (c) => {
  try {
    const username = c.req.query('username');
    if (!username || username.trim() === '') {
      return c.json({ error: '중복 확인할 아이디(username)를 입력해 주세요.' }, 400);
    }

    const exists = await c.env.DB.prepare('SELECT uid FROM contest_staffs WHERE username = ?')
      .bind(username.trim())
      .first();

    return c.json({
      success: true,
      available: !exists,
      message: exists ? '이미 사용 중인 아이디입니다.' : '사용 가능한 아이디입니다.'
    });
  } catch (err: any) {
    console.error('아이디 중복 확인 실패:', err);
    return c.json({ error: '아이디 중복 확인 실패: ' + err.message }, 500);
  }
});

// 7.4. Firestore ➔ D1 동기화 API (관계자 인증 필수)
app.post('/api/contest/sync-from-firestore', contestMiddleware, async (c) => {
  try {
    const { invoices } = await c.req.json() as { invoices: any[] };
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return c.json({ error: '동기화할 접수 내역 데이터가 없습니다.' }, 400);
    }

    await ensureInvoicesPoolColumns(c.env.DB);

    const statements: any[] = [];
    for (const item of invoices) {
      if (!item.id || !item.playerName || !item.playerBirth || !item.playerTel || !item.playerGym) {
        continue;
      }

      // 사진 목록 안전 가공 (배열, JSON 문자열, 단일 URL 모두 수용)
      let photoUrlsStr = '[]';
      const rawPhotos = item.photos || item.playerPhotoUrls;
      if (rawPhotos) {
        photoUrlsStr = typeof rawPhotos === 'string' ? rawPhotos : JSON.stringify(rawPhotos);
      } else if (item.playerPhotoUrlsJson) {
        photoUrlsStr = typeof item.playerPhotoUrlsJson === 'string' ? item.playerPhotoUrlsJson : JSON.stringify(item.playerPhotoUrlsJson);
      } else if (item.playerPhotoUrl) {
        photoUrlsStr = JSON.stringify([item.playerPhotoUrl]);
      }

      let selectedUrlsArr: string[] = [];
      if (Array.isArray(item.selectedPhotoUrls)) {
        selectedUrlsArr = item.selectedPhotoUrls;
      } else if (typeof item.selectedPhotoUrls === 'string') {
        try { selectedUrlsArr = JSON.parse(item.selectedPhotoUrls); } catch (e) {}
      } else if (item.selectedPhotoUrlsJson) {
        try { selectedUrlsArr = JSON.parse(item.selectedPhotoUrlsJson); } catch (e) {}
      }

      const finalStagePhoto1 = item.stagePhoto1 || selectedUrlsArr[0] || null;
      const finalStagePhoto2 = item.stagePhoto2 || selectedUrlsArr[1] || null;
      const selectedUrlsStr = JSON.stringify([finalStagePhoto1 || '', finalStagePhoto2 || '']);

      const stmt = c.env.DB.prepare(`
        INSERT OR REPLACE INTO invoices_pool (
          id, playerUid, playerName, playerGender, playerBirth, playerTel,
          playerEmail, playerGym, playerText, playerPhotoUrl, playerPhotoUrls,
          stagePhoto1, stagePhoto2, selectedPhotoUrls,
          playerService, joins, contestPriceSum, contestPriceTotal, playerAge,
          isPriceCheck, isCanceled, invoiceEdited, createBy, invoiceCreateAt,
          invoiceEditAt, contestId, submittedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        item.id,
        item.playerUid || 'guest',
        item.playerName,
        item.playerGender || 'm',
        item.playerBirth,
        item.playerTel,
        item.playerEmail || null,
        item.playerGym,
        item.playerText || null,
        item.playerPhotoUrl || null,
        photoUrlsStr,
        finalStagePhoto1,
        finalStagePhoto2,
        selectedUrlsStr,
        item.playerService ? 1 : 0,
        typeof item.joins === 'string' ? item.joins : JSON.stringify(item.joins || []),
        item.contestPriceSum || 0,
        item.contestPriceTotal || 0,
        item.playerAge || null,
        item.isPriceCheck ? 1 : 0,
        item.isCanceled ? 1 : 0,
        item.invoiceEdited ? 1 : 0,
        item.createBy || 'web',
        item.invoiceCreateAt || item.submittedAt || new Date().toISOString(),
        item.invoiceEditAt || null,
        item.contestId || null,
        item.submittedAt || item.invoiceCreateAt || new Date().toISOString()
      );
      statements.push(stmt);
    }

    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({
      success: true,
      count: statements.length,
      message: `${statements.length}건의 Firestore 접수 데이터가 D1 데이터베이스와 성공적으로 동기화되었습니다.`
    });
  } catch (err: any) {
    console.error('Firestore ➔ D1 동기화 에러:', err);
    return c.json({ error: '동기화 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏆 Cloudflare D1 대회 공식 심사 결과(순위표 & 그랑프리) 저장 & 조회 API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. D1 공식 성적 일괄 저장 및 선수 인보이스 동기화
app.post('/api/admin/contests/:contestId/results', async (c) => {
  try {
    const contestId = c.req.param('contestId');
    const body = await c.req.json();
    const categories = body.categories as any[];

    if (!Array.isArray(categories)) {
      return c.json({ error: '유효하지 않은 categories 배열 데이터입니다.' }, 400);
    }

    const statements: D1PreparedStatement[] = [];

    // 1) 기존 해당 대회의 D1 contest_results 삭제
    statements.push(
      c.env.DB.prepare('DELETE FROM contest_results WHERE contestId = ?').bind(contestId)
    );

    // 2) 신규 카테고리별 결과 D1 삽입
    const now = new Date().toISOString();
    const awardMap = new Map<string, { rank: number; award: string; isGrandPrix: boolean; totalScore?: number }>();
    const playerOverallMap = new Map<string, { award: string; rank: number; isGrandPrix: boolean; playerNumber?: string }>();

    for (const cat of categories) {
      const docId = cat.docId || `${contestId}_${cat.categoryTitle}_${cat.gradeTitle}`.replace(/[\s/]/g, '_');
      const isOverall = cat.isOverall ? 1 : 0;
      const resultsJson = typeof cat.results === 'string' ? cat.results : JSON.stringify(cat.results || []);

      statements.push(
        c.env.DB.prepare(`
          INSERT INTO contest_results (
            id, contestId, categoryId, categoryTitle, gradeId, gradeTitle, isOverall, scoreType, resultsJson, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          docId,
          contestId,
          cat.categoryId || null,
          cat.categoryTitle,
          cat.gradeId || null,
          cat.gradeTitle,
          isOverall,
          cat.scoreType || 'ranking',
          resultsJson,
          now,
          now
        )
      );

      // 인보이스 매핑용 데이터 파싱
      const playerList = Array.isArray(cat.results) ? cat.results : (typeof cat.results === 'string' ? JSON.parse(cat.results) : []);
      playerList.forEach((r: any) => {
        const pNum = r.playerNumber ? String(r.playerNumber).trim() : '';
        const pUid = r.playerUid ? String(r.playerUid).trim() : '';
        const pName = r.playerName ? String(r.playerName).trim() : '';

        const rankNum = Number(r.playerRank) || 1;
        const isGp = isOverall === 1 && rankNum === 1;
        const awardText = isGp ? '그랑프리 우승 (Grand Prix)' : `${rankNum}위`;

        const info = {
          rank: rankNum,
          award: awardText,
          isGrandPrix: isGp,
          totalScore: r.totalScore
        };

        if (pNum && cat.categoryTitle) awardMap.set(`${pNum}___${cat.categoryTitle}`, info);
        if (pUid && cat.categoryTitle) awardMap.set(`${pUid}___${cat.categoryTitle}`, info);
        if (pName && cat.categoryTitle) awardMap.set(`${pName}___${cat.categoryTitle}`, info);

        if (pNum && cat.gradeTitle) awardMap.set(`${pNum}___${cat.gradeTitle}`, info);
        if (pUid && cat.gradeTitle) awardMap.set(`${pUid}___${cat.gradeTitle}`, info);

        const key = pUid || pNum || pName;
        const prev = playerOverallMap.get(key);
        if (isGp) {
          playerOverallMap.set(key, { award: '그랑프리 우승 (OVERALL CHAMPION)', rank: 1, isGrandPrix: true, playerNumber: pNum });
        } else if (!prev || rankNum < prev.rank) {
          playerOverallMap.set(key, { award: awardText, rank: rankNum, isGrandPrix: false, playerNumber: pNum || prev?.playerNumber });
        }
      });
    }

    // 3) D1 invoices_pool 선수들 joins 및 award 일괄 업데이트
    const existingInvoices = await c.env.DB.prepare('SELECT * FROM invoices_pool WHERE contestId = ?').bind(contestId).all();
    
    if (existingInvoices.results && existingInvoices.results.length > 0) {
      for (const inv of existingInvoices.results as any[]) {
        const pNum = inv.playerNumber ? String(inv.playerNumber).trim() : '';
        const pUid = inv.playerUid ? String(inv.playerUid).trim() : '';
        const pName = inv.playerName ? String(inv.playerName).trim() : '';

        let joinsArr: any[] = [];
        try {
          joinsArr = typeof inv.joins === 'string' ? JSON.parse(inv.joins) : (inv.joins || []);
        } catch (e) {}

        let joinsUpdated = false;
        const updatedJoins = joinsArr.map((j: any) => {
          const cat = j.contestCategoryTitle || '';
          const gr = j.contestGradeTitle || '';

          const matched = 
            (pNum && cat && awardMap.get(`${pNum}___${cat}`)) ||
            (pUid && cat && awardMap.get(`${pUid}___${cat}`)) ||
            (pName && cat && awardMap.get(`${pName}___${cat}`)) ||
            (pNum && gr && awardMap.get(`${pNum}___${gr}`)) ||
            (pUid && gr && awardMap.get(`${pUid}___${gr}`)) ||
            null;

          if (matched) {
            joinsUpdated = true;
            return {
              ...j,
              rank: matched.rank,
              award: matched.award,
              isGrandPrix: matched.isGrandPrix,
              totalScore: matched.totalScore,
            };
          }
          return j;
        });

        const overall = playerOverallMap.get(pUid) || playerOverallMap.get(pNum) || playerOverallMap.get(pName);

        if (joinsUpdated || overall) {
          const joinsStr = JSON.stringify(updatedJoins);
          const highestAward = overall ? overall.award : (inv.award || null);
          const topRank = overall ? overall.rank : (inv.rank || null);
          const isGpInt = overall?.isGrandPrix ? 1 : (inv.isGrandPrix || 0);
          const finalPlayerNum = overall?.playerNumber || inv.playerNumber || null;

          statements.push(
            c.env.DB.prepare(`
              UPDATE invoices_pool 
              SET joins = ?, award = ?, rank = ?, isGrandPrix = ?, playerNumber = COALESCE(?, playerNumber)
              WHERE id = ?
            `).bind(joinsStr, highestAward, topRank, isGpInt, finalPlayerNum, inv.id)
          );
        }
      }
    }

    // 4) 그랑프리 챔피언들을 system_settings의 heroPlayers에 자동 동기화 (다관왕 스마트 통합)
    const grandPrixCategories = categories.filter((cat: any) => cat.isOverall);
    if (grandPrixCategories.length > 0) {
      const playerMap = new Map<string, any>();

      for (const gpCat of grandPrixCategories) {
        const playerList = Array.isArray(gpCat.results) ? gpCat.results : (typeof gpCat.results === 'string' ? JSON.parse(gpCat.results) : []);
        const winner = playerList.find((r: any) => Number(r.playerRank) === 1) || playerList[0];
        if (!winner) continue;

        const pNum = winner.playerNumber ? String(winner.playerNumber).trim() : '';
        const pUid = winner.playerUid ? String(winner.playerUid).trim() : '';
        const pName = winner.playerName ? String(winner.playerName).trim() : '';
        const pKey = pName || pUid || pNum;
        if (!pKey) continue;

        // D1 invoices_pool에서 해당 선수의 고화질 무대 사진 조회
        let photoUrl = winner.playerPhotoUrl || '';
        const invRow = existingInvoices.results?.find((inv: any) => 
          (pUid && inv.playerUid === pUid) || 
          (pNum && String(inv.playerNumber).trim() === pNum) || 
          (pName && inv.playerName === pName)
        ) as any;

        if (invRow) {
          photoUrl = invRow.stagePhoto1 || invRow.stagePhoto2 || invRow.playerPhotoUrl || photoUrl;
          if (!photoUrl && invRow.playerPhotoUrls) {
            try {
              const urls = typeof invRow.playerPhotoUrls === 'string' ? JSON.parse(invRow.playerPhotoUrls) : invRow.playerPhotoUrls;
              if (urls && urls.length > 0) photoUrl = urls[urls.length - 1];
            } catch (e) {}
          }
        }

        const stage1 = winner.stagePhoto1 || invRow?.stagePhoto1 || photoUrl;
        const stage2 = winner.stagePhoto2 || invRow?.stagePhoto2 || '';
        const catTitle = gpCat.categoryTitle.replace(/그랑프리/g, '').trim();

        if (playerMap.has(pKey)) {
          const existing = playerMap.get(pKey);
          existing.crownCount = (existing.crownCount || 1) + 1;
          existing.isMultiCrown = true;
          existing.crownBadge = `👑 ${existing.crownCount}관왕`;
          if (!existing.categories.includes(catTitle)) {
            existing.categories.push(catTitle);
          }
          existing.heroClass = `${existing.categories.join(' · ')} (${existing.crownCount}관왕)`;
          existing.heroTitles = `2026 제9회 용인특례시 보디빌딩대회 ${existing.categories.join(' & ')} ${existing.crownCount}관왕 오버롤 그랑프리`;
          if (!existing.stagePhoto2 && (stage1 || stage2)) {
            existing.stagePhoto2 = stage2 || stage1;
          }
        } else {
          const heroId = `hero-gp-${(pUid || pNum || pName).toLowerCase().replace(/[^a-z0-9_-]/g, '')}`;
          const realHeight = winner.playerHeight || invRow?.playerHeight || '';
          const realWeight = winner.playerWeight || invRow?.playerWeight || '';

          playerMap.set(pKey, {
            id: heroId,
            heroName: pName,
            heroClass: `${gpCat.categoryTitle} (오버롤)`,
            categories: [catTitle],
            crownCount: 1,
            isMultiCrown: false,
            crownBadge: 'GRAND PRIX',
            heroHeight: realHeight ? String(realHeight) : '',
            heroWeight: realWeight ? String(realWeight) : '',
            heroGym: winner.playerGym || invRow?.playerGym || '용인시보디빌딩협회',
            heroTitles: `2026 제9회 용인특례시 보디빌딩대회 ${gpCat.categoryTitle} 챔피언`,
            heroImageUrl: stage1 || photoUrl || 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/player_photos/default-player-1_hero_section.png',
            stagePhoto1: stage1,
            stagePhoto2: stage2,
            heroInstagram: '#',
            heroYoutube: '#',
            heroFacebook: '#'
          });
        }
      }

      const heroPlayers = Array.from(playerMap.values());

      if (heroPlayers.length > 0) {
        const settingsRow = await c.env.DB.prepare("SELECT value FROM system_settings WHERE key = 'system_settings'").first() as { value: string } | null;
        let currentSettings: any = {};
        if (settingsRow?.value) {
          try { currentSettings = JSON.parse(settingsRow.value); } catch (e) {}
        }
        currentSettings.heroPlayers = heroPlayers;

        statements.push(
          c.env.DB.prepare("INSERT OR REPLACE INTO system_settings (key, value, updatedAt) VALUES ('system_settings', ?, CURRENT_TIMESTAMP)")
            .bind(JSON.stringify(currentSettings))
        );
      }
    }

    // D1 Batch 실행
    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({
      success: true,
      categoryCount: categories.length,
      statementsExecuted: statements.length,
      message: `총 ${categories.length}개 종목/체급의 공식 성적이 Cloudflare D1 데이터베이스에 안전하게 영구 저장되었습니다.`
    });
  } catch (err: any) {
    console.error('D1 공식 성적 저장 실패:', err);
    return c.json({ error: 'D1 저장 실패: ' + err.message }, 500);
  }
});

// 2. D1 공식 성적 조회 (공개 & 어드민 공용)
app.get('/api/contests/:contestId/results', async (c) => {
  try {
    const contestId = c.req.param('contestId');
    const records = await c.env.DB.prepare(`
      SELECT * FROM contest_results 
      WHERE contestId = ? 
      ORDER BY isOverall ASC, categoryTitle ASC, gradeTitle ASC
    `).bind(contestId).all();

    const categories = (records.results || []).map((row: any) => {
      let results: any[] = [];
      try {
        results = typeof row.resultsJson === 'string' ? JSON.parse(row.resultsJson) : (row.resultsJson || []);
      } catch (e) {}

      return {
        docId: row.id,
        contestId: row.contestId,
        categoryId: row.categoryId,
        categoryTitle: row.categoryTitle,
        gradeId: row.gradeId,
        gradeTitle: row.gradeTitle,
        isOverall: row.isOverall === 1,
        scoreType: row.scoreType,
        results,
        updatedAt: row.updatedAt,
      };
    });

    return c.json({
      success: true,
      contestId,
      count: categories.length,
      categories,
    });
  } catch (err: any) {
    console.error('D1 공식 성적 조회 에러:', err);
    return c.json({ error: '조회 실패: ' + err.message }, 500);
  }
});

// 3. D1 실시간 대회 기록 기반 자동 분류 시스템 (Legends / Champions / Youth Club 기수 자동 배정)
app.get('/api/contests/:contestId/auto-roster', async (c) => {
  try {
    const contestId = c.req.param('contestId');
    
    // 1) D1 contest_results 조회
    const records = await c.env.DB.prepare(`
      SELECT * FROM contest_results 
      WHERE contestId = ? 
      ORDER BY isOverall ASC, categoryTitle ASC, gradeTitle ASC
    `).bind(contestId).all();

    const categories = (records.results || []).map((row: any) => {
      let results: any[] = [];
      try {
        results = typeof row.resultsJson === 'string' ? JSON.parse(row.resultsJson) : (row.resultsJson || []);
      } catch (e) {}
      return {
        ...row,
        isOverall: row.isOverall === 1,
        results
      };
    });

    // 2) D1 invoices_pool 조회 (선수 프로필 & 사진)
    const invoices = await c.env.DB.prepare(`
      SELECT * FROM invoices_pool 
      WHERE contestId = ?
    `).bind(contestId).all();

    const playerMap = new Map<string, any>();
    (invoices.results || []).forEach((inv: any) => {
      let joins = [];
      try { joins = typeof inv.joins === 'string' ? JSON.parse(inv.joins) : (inv.joins || []); } catch(e) {}
      
      let photos = [];
      try { photos = typeof inv.playerPhotoUrls === 'string' ? JSON.parse(inv.playerPhotoUrls) : (inv.playerPhotoUrls || []); } catch(e) {}

      playerMap.set(inv.playerName.trim(), {
        ...inv,
        joins,
        photos,
        stagePhoto1: inv.stagePhoto1 || (joins.find((j: any) => j.stagePhoto1)?.stagePhoto1),
        stagePhoto2: inv.stagePhoto2 || (joins.find((j: any) => j.stagePhoto2)?.stagePhoto2),
      });
    });

    // 3) 자동 분류 컨테이너
    const legendsMap = new Map<string, any>();
    const championsMap = new Map<string, any>();
    const youthMap = new Map<string, any>();

    // 회차 계산 (예: 'vEsEClzzEHCnZ1d8azo1' -> 9회)
    const editionNumber = 9;
    const editionTitle = `제${editionNumber}회 용인특례시 대회`;
    const youthGeneration = `YBBF 유스클럽 ${editionNumber}기`;

    // 4) 카테고리별 성적 기반 전수 분류
    for (const cat of categories) {
      const isStudentCategory = cat.categoryTitle.includes('학생부') || cat.categoryTitle.includes('고등부') || cat.categoryTitle.includes('유스');

      for (const r of (cat.results || [])) {
        if (!r.playerName) continue;
        const name = r.playerName.trim();
        const pInfo = playerMap.get(name);

        const photo = r.stagePhoto1 || r.stagePhoto2 || pInfo?.stagePhoto1 || pInfo?.stagePhoto2 || r.photoUrl || pInfo?.playerPhotoUrl || (pInfo?.photos && pInfo.photos[0]) || '';
        const stage1 = r.stagePhoto1 || pInfo?.stagePhoto1 || photo;
        const stage2 = r.stagePhoto2 || pInfo?.stagePhoto2 || photo;

        const isFirstPlace = r.playerRank === 1 || (r.award && r.award.includes('1위'));
        const isGrandPrix = (cat.isOverall || cat.categoryTitle.includes('그랑프리')) 
          ? (r.playerRank === 1 || (r.award && r.award.includes('그랑프리')))
          : (r.award && (r.award.includes('그랑프리') || r.award.includes('Overall')));

        const realHeight = r.playerHeight || pInfo?.playerHeight || null;
        const realWeight = r.playerWeight || pInfo?.playerWeight || null;

        // A. 🏆 [Legends] 그랑프리 자동 분류 (오버롤 챔피언)
        if (isGrandPrix) {
          if (!legendsMap.has(name)) {
            legendsMap.set(name, {
              id: `legend-${name}`,
              name,
              nameEn: name.toUpperCase(),
              number: r.playerNumber || pInfo?.playerNumber || null,
              gym: r.playerGym || pInfo?.playerGym || '용인시보디빌딩협회',
              height: realHeight,
              weight: realWeight,
              stagePhoto1: stage1,
              stagePhoto2: stage2,
              profileImage: stage1 || photo,
              class: cat.categoryTitle,
              isGrandPrix: true,
              edition: editionNumber,
              titles: []
            });
          } else {
            const legendObj = legendsMap.get(name);
            legendObj.crownCount = (legendObj.crownCount || 1) + 1;
            legendObj.isMultiCrown = true;
            legendObj.crownBadge = `👑 ${legendObj.crownCount}관왕`;
            if (!legendObj.classes) {
              legendObj.classes = [legendObj.class.replace(/그랑프리/g, '').trim()];
            }
            const newClass = cat.categoryTitle.replace(/그랑프리/g, '').trim();
            if (!legendObj.classes.includes(newClass)) {
              legendObj.classes.push(newClass);
            }
            legendObj.class = `${legendObj.classes.join(' · ')} (${legendObj.crownCount}관왕)`;
          }
          legendsMap.get(name).titles.push({
            year: 2026,
            competition: editionTitle,
            result: r.award || '오버롤 그랑프리',
            class: cat.categoryTitle
          });
        }

        // B. 🥇 [Champions] 체급 1위 우승자 자동 분류
        if (isFirstPlace || isGrandPrix) {
          if (!championsMap.has(name)) {
            championsMap.set(name, {
              id: `champ-${name}`,
              name,
              nameEn: name.toUpperCase(),
              number: r.playerNumber || pInfo?.playerNumber || null,
              gym: r.playerGym || pInfo?.playerGym || '용인시보디빌딩협회',
              height: realHeight,
              weight: realWeight,
              stagePhoto1: stage1,
              stagePhoto2: stage2,
              photoUrl: stage1 || photo,
              isGrandPrix,
              edition: editionNumber,
              categories: []
            });
          }
        }

        // 챔피언 선수의 모든 출전 부문 기록 집계 (1위 우승, 2위 준우승 등)
        if (championsMap.has(name)) {
          const champObj = championsMap.get(name);
          const awardText = r.award || (isGrandPrix ? '오버롤 그랑프리' : `${r.playerRank}위`);
          const existing = champObj.categories.find((c: any) => c.categoryTitle === cat.categoryTitle && c.gradeTitle === cat.gradeTitle);
          if (!existing) {
            champObj.categories.push({
              categoryTitle: cat.categoryTitle,
              gradeTitle: cat.gradeTitle,
              isOverall: isGrandPrix,
              rank: r.playerRank,
              award: awardText,
              totalScore: r.totalScore
            });
          }
        }

        // C. 🌱 [Youth Club] 학생부 출전 선수는 무조건 유스클럽 해당 기수에 자동 가입
        if (isStudentCategory) {
          if (!youthMap.has(name)) {
            youthMap.set(name, {
              id: `youth-${editionNumber}-${name}`,
              name,
              school: r.playerGym || pInfo?.playerGym || '용인시 학생부',
              club: youthGeneration,
              generation: editionNumber,
              badge: 'YBBF_YOUTH',
              class: cat.gradeTitle || cat.categoryTitle,
              stagePhoto1: stage1,
              stagePhoto2: stage2,
              image: stage1 || photo,
              rank: r.playerRank,
              isGrandPrix,
              achievements: []
            });
          }
          const youthEntry = youthMap.get(name);
          const awardTitle = isGrandPrix 
            ? `${editionTitle} 학생부 오버롤 그랑프리` 
            : `${editionTitle} ${cat.categoryTitle} ${cat.gradeTitle ? `(${cat.gradeTitle}) ` : ''}${r.playerRank ? `${r.playerRank}위` : '참가'}`;
          
          if (youthEntry && !youthEntry.achievements.includes(awardTitle)) {
            youthEntry.achievements.push(awardTitle);
          }
        }
      }
    }

    const getLegendPriority = (l: any) => {
      const cls = (l.class || '').toLowerCase();
      if (cls.includes('일반부') || (cls.includes('보디빌딩') && !cls.includes('클래식') && !cls.includes('마스터즈') && !cls.includes('학생부'))) return 1;
      if (cls.includes('비키니') || cls.includes('모노키니') || cls.includes('여자')) return 2;
      if (cls.includes('클래식')) return 3;
      if (cls.includes('피지크')) return 4;
      if (cls.includes('스포츠 모델') || cls.includes('스포츠모델') || cls.includes('모델')) return 5;
      if (cls.includes('마스터즈') || cls.includes('장년부')) return 6;
      if (cls.includes('학생부') || cls.includes('유스') || cls.includes('고등부')) return 7;
      return 99;
    };

    const legends = Array.from(legendsMap.values()).sort((a, b) => getLegendPriority(a) - getLegendPriority(b));
    const champions = Array.from(championsMap.values()).sort((a, b) => (b.isGrandPrix ? 1 : 0) - (a.isGrandPrix ? 1 : 0));
    const youthMembers = Array.from(youthMap.values()).sort((a, b) => (a.rank || 99) - (b.rank || 99));

    return c.json({
      success: true,
      contestId,
      edition: {
        number: editionNumber,
        title: editionTitle,
        year: 2026,
        youthGeneration
      },
      counts: {
        legends: legends.length,
        champions: champions.length,
        youthMembers: youthMembers.length,
        categories: categories.length
      },
      legends,
      champions,
      youthMembers
    });
  } catch (err: any) {
    console.error('D1 자동 로스터 분류 에러:', err);
    return c.json({ error: '자동 분류 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💎 [Showcase API] 단일 선수 쇼케이스 인보이스 D1 공식 데이터 조회
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/api/invoices/showcase/:idOrName', async (c) => {
  try {
    const rawParam = decodeURIComponent(c.req.param('idOrName')).trim();
    const cleanName = rawParam.replace(/^(champ-|legend-|youth-\d+-|youth-)/, '');

    const row = await c.env.DB.prepare(`
      SELECT * FROM invoices_pool 
      WHERE id = ? OR playerUid = ? OR playerName = ? OR playerName = ?
      LIMIT 1
    `).bind(rawParam, rawParam, rawParam, cleanName).first() as any;

    if (!row) {
      return c.json({ error: '선수를 찾을 수 없습니다.' }, 404);
    }

    // JSON 필드 파싱
    let joins: any[] = [];
    if (row.joins) {
      try { joins = typeof row.joins === 'string' ? JSON.parse(row.joins) : row.joins; } catch (e) {}
    }

    let playerPhotoUrls: string[] = [];
    if (row.playerPhotoUrls) {
      try { playerPhotoUrls = typeof row.playerPhotoUrls === 'string' ? JSON.parse(row.playerPhotoUrls) : row.playerPhotoUrls; } catch (e) {}
    }

    return c.json({
      success: true,
      invoice: {
        ...row,
        joins,
        playerPhotoUrls,
        stagePhoto1: row.stagePhoto1 || row.playerPhotoUrl || '',
        stagePhoto2: row.stagePhoto2 || '',
        isPriceCheck: row.isPriceCheck === 1,
        isCanceled: row.isCanceled === 1,
        contestTitle: '제9회 용인특례시 협회장배 보디빌딩대회',
        contestDate: '2026-08-29',
        contestLocation: '용인시청 에이스홀'
      }
    });
  } catch (err: any) {
    console.error('Showcase 조회 에러:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏢 [D1 Sponsors API] 스폰서 목록 조회 & 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/api/sponsors', async (c) => {
  try {
    const contestId = c.req.query('contestId') || 'vEsEClzzEHCnZ1d8azo1';
    const status = c.req.query('status');

    let query = 'SELECT * FROM contest_sponsors WHERE contest_id = ?';
    const params: any[] = [contestId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY sort_order ASC, weight DESC, created_at DESC';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const sponsors = (results || []).map((row: any) => {
      let socials = {};
      if (row.socials_json) {
        try { socials = JSON.parse(row.socials_json); } catch (e) {}
      }
      return {
        id: row.id,
        contestId: row.contest_id,
        name: row.name,
        tag: row.tag,
        slogan: row.slogan,
        desc: row.desc,
        imageUrl: row.image_url,
        videoUrl: row.video_url,
        linkUrl: row.link_url,
        mediaType: row.media_type,
        status: row.status,
        address: row.address,
        contactPerson: row.contact_person,
        phone: row.phone,
        email: row.email,
        businessNumber: row.business_number,
        socials,
        weight: row.weight,
        durationSeconds: row.duration_seconds,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return c.json({ success: true, count: sponsors.length, sponsors });
  } catch (err: any) {
    return c.json({ error: '스폰서 조회 실패: ' + err.message }, 500);
  }
});

app.post('/api/sponsors/sync-from-firestore', async (c) => {
  try {
    const body = await c.req.json();
    const contestId = body.contestId || 'vEsEClzzEHCnZ1d8azo1';
    const sponsors = body.sponsors || [];

    if (!Array.isArray(sponsors)) {
      return c.json({ error: 'sponsors 배열이 필요합니다.' }, 400);
    }

    const stmts = sponsors.map((s: any, idx: number) => {
      const id = s.id || `sp_${Date.now()}_${idx}`;
      const socialsJson = JSON.stringify(s.socials || (s.linkUrl ? { homepage: s.linkUrl } : {}));
      return c.env.DB.prepare(`
        INSERT INTO contest_sponsors (
          id, contest_id, name, tag, slogan, desc, image_url, video_url, link_url,
          media_type, status, address, contact_person, phone, email, business_number,
          socials_json, weight, duration_seconds, sort_order, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+9 hours'))
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          tag = excluded.tag,
          slogan = excluded.slogan,
          desc = excluded.desc,
          image_url = excluded.image_url,
          video_url = excluded.video_url,
          link_url = excluded.link_url,
          media_type = excluded.media_type,
          status = excluded.status,
          address = excluded.address,
          contact_person = excluded.contact_person,
          phone = excluded.phone,
          email = excluded.email,
          business_number = excluded.business_number,
          socials_json = excluded.socials_json,
          weight = excluded.weight,
          duration_seconds = excluded.duration_seconds,
          sort_order = excluded.sort_order,
          updated_at = datetime('now', '+9 hours')
      `).bind(
        id,
        contestId,
        s.name || '',
        s.tag || 'OFFICIAL',
        s.slogan || '',
        s.desc || '',
        s.imageUrl || '',
        s.videoUrl || '',
        s.linkUrl || (s.socials?.homepage || ''),
        s.mediaType || (s.videoUrl ? 'VIDEO' : 'IMAGE'),
        s.status || 'active',
        s.address || '',
        s.contactPerson || '',
        s.phone || '',
        s.email || '',
        s.businessNumber || '',
        socialsJson,
        s.weight || 1,
        Number(s.durationSeconds || 5),
        idx
      );
    });

    if (stmts.length > 0) {
      await c.env.DB.batch(stmts);
    }

    return c.json({ success: true, message: `${stmts.length}개 스폰서 D1 동기화 완료` });
  } catch (err: any) {
    return c.json({ error: '스폰서 동기화 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 [D1 Pre-Registrations API] 2027 제10회 사전 접수 D1 관리
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.get('/api/pre-registrations', async (c) => {
  try {
    const edition = Number(c.req.query('edition') || 10);
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM pre_registrations 
      WHERE contest_edition = ?
      ORDER BY created_at DESC
    `).bind(edition).all();

    const registrations = (results || []).map((row: any) => {
      let desiredCategories = [];
      if (row.desired_categories_json) {
        try { desiredCategories = JSON.parse(row.desired_categories_json); } catch (e) {}
      }
      return {
        id: row.id,
        contestEdition: row.contest_edition,
        name: row.name,
        phone: row.phone,
        email: row.email,
        gender: row.gender,
        birthDate: row.birth_date,
        gym: row.gym,
        desiredCategories,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    return c.json({ success: true, count: registrations.length, registrations });
  } catch (err: any) {
    return c.json({ error: '사전 접수자 조회 실패: ' + err.message }, 500);
  }
});

app.post('/api/pre-registrations', async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || `pre_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const edition = Number(body.contestEdition || 10);
    const categoriesJson = JSON.stringify(body.desiredCategories || []);

    await c.env.DB.prepare(`
      INSERT INTO pre_registrations (
        id, contest_edition, name, phone, email, gender, birth_date, gym,
        desired_categories_json, message, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+9 hours'), datetime('now', '+9 hours'))
    `).bind(
      id,
      edition,
      body.name || '',
      body.phone || '',
      body.email || '',
      body.gender || '남성',
      body.birthDate || '',
      body.gym || '',
      categoriesJson,
      body.message || '',
      body.status || 'pending'
    ).run();

    return c.json({ success: true, id, message: '2027 제10회 사전 접수가 D1에 성공적으로 등록되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '사전 접수 등록 실패: ' + err.message }, 500);
  }
});

app.delete('/api/pre-registrations/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM pre_registrations WHERE id = ?`).bind(id).run();
    return c.json({ success: true, message: '삭제 완료' });
  } catch (err: any) {
    return c.json({ error: '삭제 실패: ' + err.message }, 500);
  }
});

export default app;
