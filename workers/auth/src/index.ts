import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { User, UserProfile, UserRole } from '../../db';
import { hashPassword, encryptText, decryptText, generateSalt } from '../../crypto';
import { isLockedOut, recordFailure, recordSuccess, getRemainingLockSeconds } from './rateLimiter';

type Bindings = {
  RESEND_API_KEY: string;
  CRYPTO_SECRET: string;
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

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
      CREATE TABLE IF NOT EXISTS users (
        uid TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT,
        provider TEXT NOT NULL,
        profileComplete INTEGER NOT NULL DEFAULT 0,
        roles TEXT NOT NULL DEFAULT 'user',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    db.prepare(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        uid TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        birth TEXT NOT NULL,
        tel TEXT NOT NULL,
        telLast4 TEXT NOT NULL,
        gym TEXT NOT NULL,
        gender TEXT NOT NULL,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE
      )
    `)
  ]);
  
  dbInitialized = true;
}

// 솔트(salt) 저장 헬퍼 함수 (Cloudflare KV 사용)
async function putSalt(c: any, uid: string, salt: string) {
  if (!c.env.KV) {
    throw new Error('KV Namespace가 바인딩되지 않았습니다.');
  }
  await c.env.KV.put(`salt:${uid}`, salt);
}

// 솔트(salt) 로드 헬퍼 함수 (Cloudflare KV 사용)
async function getSalt(c: any, uid: string): Promise<string | null> {
  if (!c.env.KV) {
    throw new Error('KV Namespace가 바인딩되지 않았습니다.');
  }
  return await c.env.KV.get(`salt:${uid}`);
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

/**
 * 요청 객체에서 클라이언트의 IP 주소를 안전하게 추출합니다.
 */
function getClientIp(c: any): string {
  const forwarded = c.req.header('x-forwarded-for') || c.req.header('CF-Connecting-IP');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

/**
 * 유저 정보에서 민감한 보안 필드를 지우고, 프로필 정보를 복호화하여 클라이언트 반환용 안전한 객체를 생성합니다.
 */
async function getSafeUser(user: User, secretKey: string): Promise<Omit<User, 'passwordHash' | 'salt'>> {
  const { passwordHash, salt, ...safeUser } = user;
  
  if (safeUser.profile) {
    try {
      // 복제하여 원본 mock DB 데이터가 변질되지 않도록 보호합니다.
      safeUser.profile = {
        ...safeUser.profile,
        name: await decryptText(safeUser.profile.name, secretKey),
        tel: await decryptText(safeUser.profile.tel, secretKey),
      };
    } catch (err) {
      console.error('프로필 복호화 도중 에러가 발생했습니다. 키 설정을 점검하십시오.', err);
    }
  }
  
  return safeUser;
}

// 1. 회원가입 API
app.post('/api/auth/signup', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const secretKey = c.env.CRYPTO_SECRET;

    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 모두 입력하십시오.' }, 400);
    }

    // 이메일 중복 확인
    const exists = await c.env.DB.prepare('SELECT uid FROM users WHERE email = ?')
      .bind(email)
      .first<{ uid: string }>();
    if (exists) {
      return c.json({ error: '이미 존재하는 이메일 계정입니다.' }, 400);
    }

    // 솔트 생성 및 비밀번호 단방향 해싱
    const userSalt = generateSalt();
    const passwordHash = await hashPassword(password, userSalt, secretKey);
    const uid = crypto.randomUUID();

    const isSystemAdmin = email.trim().toLowerCase() === 'admin@ybbf.org';
    const userRolesStr = isSystemAdmin ? 'user,admin' : 'user';
    const userRolesArr = isSystemAdmin ? ['user', 'admin'] as UserRole[] : ['user'] as UserRole[];

    await c.env.DB.prepare(
      'INSERT INTO users (uid, email, passwordHash, provider, profileComplete, roles) VALUES (?, ?, ?, ?, 0, ?)'
    )
      .bind(uid, email, passwordHash, 'email', userRolesStr)
      .run();

    // 솔트 격리 저장 (하이브리드 방식)
    await putSalt(c, uid, userSalt);

    const newUser: User = {
      uid,
      email,
      provider: 'email',
      profileComplete: false,
      profile: null,
      roles: userRolesArr,
    };

    // 세션 로그인 쿠키 생성 및 발급 (HttpOnly, SameSite=Lax)
    const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1');
    setCookie(c, 'session_token', newUser.uid, {
      path: '/',
      httpOnly: true,
      secure: !isLocal,
      sameSite: isLocal ? 'Lax' : 'None',
      maxAge: 3600, // 1시간
    });

    const safeUser = await getSafeUser(newUser, secretKey);
    return c.json({ user: safeUser });
  } catch (err: any) {
    return c.json({ error: err.message || '회원가입 처리 중 오류 발생' }, 500);
  }
});

// 2. 로그인 API
app.post('/api/auth/login', async (c) => {
  try {
    const ip = getClientIp(c);
    const secretKey = c.env.CRYPTO_SECRET;

    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    // IP 무차별 로그인 시도 제어 검사
    if (isLockedOut(ip)) {
      const remainingSeconds = getRemainingLockSeconds(ip);
      return c.json({
        error: `로그인 시도가 과도하게 실패하여 일시 차단되었습니다. ${remainingSeconds}초 후에 다시 시도해주십시오.`
      }, 429);
    }

    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: '이메일과 비밀번호를 입력해 주십시오.' }, 400);
    }

    const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<{
        uid: string;
        email: string;
        passwordHash: string | null;
        provider: string;
        profileComplete: number;
        roles: string;
      }>();

    if (!dbUser || !dbUser.passwordHash) {
      recordFailure(ip);
      return c.json({ error: '등록되지 않은 계정이거나 비밀번호가 일치하지 않습니다.' }, 401);
    }

    // 격리된 솔트 로드
    const userSalt = await getSalt(c, dbUser.uid);
    if (!userSalt) {
      recordFailure(ip);
      return c.json({ error: '등록되지 않은 계정이거나 비밀번호가 일치하지 않습니다.' }, 401);
    }

    // 입력 비밀번호 해싱 및 검증
    const verificationHash = await hashPassword(password, userSalt, secretKey);
    if (dbUser.passwordHash !== verificationHash) {
      recordFailure(ip);
      return c.json({ error: '등록되지 않은 계정이거나 비밀번호가 일치하지 않습니다.' }, 401);
    }

    // 로그인 성공: 락아웃 실패 이력 리셋 및 세션 쿠키 발급
    recordSuccess(ip);

    const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1');
    setCookie(c, 'session_token', dbUser.uid, {
      path: '/',
      httpOnly: true,
      secure: !isLocal,
      sameSite: isLocal ? 'Lax' : 'None',
      maxAge: 3600,
    });

    let profile: UserProfile | null = null;
    if (dbUser.profileComplete) {
      const dbProfile = await c.env.DB.prepare('SELECT * FROM user_profiles WHERE uid = ?')
        .bind(dbUser.uid)
        .first<{
          name: string;
          birth: string;
          tel: string;
          telLast4: string;
          gym: string;
          gender: string;
        }>();
      if (dbProfile) {
        profile = {
          name: dbProfile.name,
          birth: dbProfile.birth,
          tel: dbProfile.tel,
          telLast4: dbProfile.telLast4,
          gym: dbProfile.gym,
          gender: dbProfile.gender,
        };
      }
    }

    let roles = dbUser.roles.split(',').map((r) => r.trim()) as UserRole[];

    // admin@ybbf.org 자동 어드민 복구 처리
    const isSystemAdmin = dbUser.email.trim().toLowerCase() === 'admin@ybbf.org';
    if (isSystemAdmin && !roles.includes('admin')) {
      roles.push('admin');
      const updatedRolesStr = roles.join(',');
      await c.env.DB.prepare('UPDATE users SET roles = ? WHERE uid = ?')
        .bind(updatedRolesStr, dbUser.uid)
        .run();
    }

    const userObj: User = {
      uid: dbUser.uid,
      email: dbUser.email,
      provider: dbUser.provider,
      profileComplete: !!dbUser.profileComplete,
      roles,
      profile,
    };

    const safeUser = await getSafeUser(userObj, secretKey);
    return c.json({ user: safeUser });
  } catch (err: any) {
    return c.json({ error: '로그인 처리 중 오류 발생' }, 500);
  }
});

// 3. 소셜 로그인 시뮬레이션 API
app.post('/api/auth/login/social', async (c) => {
  try {
    const { provider } = await c.req.json();
    if (!provider) {
      return c.json({ error: '소셜 제공자 정보가 전달되지 않았습니다.' }, 400);
    }

    const email = `social-${provider}-${Math.random().toString(36).substring(2, 7)}@ybbf-demo.com`;
    const uid = crypto.randomUUID();
    
    await c.env.DB.prepare(
      'INSERT INTO users (uid, email, provider, profileComplete, roles) VALUES (?, ?, ?, 0, ?)'
    )
      .bind(uid, email, provider, 'user')
      .run();

    const newUser: User = {
      uid,
      email,
      provider,
      profileComplete: false,
      profile: null,
      roles: ['user'],
    };

    // 세션 쿠키 발급
    const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1');
    setCookie(c, 'session_token', newUser.uid, {
      path: '/',
      httpOnly: true,
      secure: !isLocal,
      sameSite: isLocal ? 'Lax' : 'None',
      maxAge: 3600,
    });

    return c.json({ user: newUser });
  } catch (err: any) {
    return c.json({ error: '소셜 로그인 중 오류 발생' }, 500);
  }
});

// 4. 현재 세션 유저 조회 API (체크 세션)
app.get('/api/auth/me', async (c) => {
  const token = getCookie(c, 'session_token')
                || c.req.header('Authorization')?.replace('Bearer ', '');
  const secretKey = c.env.CRYPTO_SECRET;

  if (!secretKey) {
    return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
  }

  if (!token) {
    return c.json({ error: '인증 세션이 유효하지 않습니다.' }, 401);
  }

  const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE uid = ?')
    .bind(token)
    .first<{
      uid: string;
      email: string;
      passwordHash: string | null;
      provider: string;
      profileComplete: number;
      roles: string;
    }>();

  if (!dbUser) {
    return c.json({ error: '가입 정보를 찾을 수 없습니다.' }, 401);
  }

  let profile: UserProfile | null = null;
  if (dbUser.profileComplete) {
    const dbProfile = await c.env.DB.prepare('SELECT * FROM user_profiles WHERE uid = ?')
      .bind(dbUser.uid)
      .first<{
        name: string;
        birth: string;
        tel: string;
        telLast4: string;
        gym: string;
        gender: string;
      }>();
    if (dbProfile) {
      profile = {
        name: dbProfile.name,
        birth: dbProfile.birth,
        tel: dbProfile.tel,
        telLast4: dbProfile.telLast4,
        gym: dbProfile.gym,
        gender: dbProfile.gender,
      };
    }
  }

  const roles = dbUser.roles.split(',').map((r) => r.trim()) as UserRole[];
  const userObj: User = {
    uid: dbUser.uid,
    email: dbUser.email,
    provider: dbUser.provider,
    profileComplete: !!dbUser.profileComplete,
    roles,
    profile,
  };

  const safeUser = await getSafeUser(userObj, secretKey);
  return c.json({ user: safeUser });
});

// 5. 로그아웃 API
app.post('/api/auth/logout', (c) => {
  // 세션 쿠키 제거 (Max-Age=0)
  const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1');
  deleteCookie(c, 'session_token', {
    path: '/',
    httpOnly: true,
    secure: !isLocal,
    sameSite: isLocal ? 'Lax' : 'None',
  });
  return c.json({ success: true });
});

// 6. 회원 추가정보 업데이트 API
app.post('/api/auth/additional-info', async (c) => {
  try {
    const token = getCookie(c, 'session_token');
    const secretKey = c.env.CRYPTO_SECRET;

    if (!secretKey) {
      return c.json({ error: '서버 암호화 키 구성이 누락되었습니다.' }, 500);
    }

    if (!token) {
      return c.json({ error: '인증 세션이 없습니다.' }, 401);
    }

    // 존재하는 사용자인지 먼저 확인
    const exists = await c.env.DB.prepare('SELECT uid FROM users WHERE uid = ?')
      .bind(token)
      .first<{ uid: string }>();
    if (!exists) {
      return c.json({ error: '사용자를 식별하지 못했습니다.' }, 404);
    }

    const rawProfile = await c.req.json();
    const { name, birth, tel, gym, gender } = rawProfile;

    if (!name || !birth || !tel || !gym || !gender) {
      return c.json({ error: '필수 추가정보 항목이 누락되었습니다.' }, 400);
    }

    // 이름 및 전화번호 양방향 암호화
    const encryptedName = await encryptText(name, secretKey);
    const encryptedTel = await encryptText(tel, secretKey);

    // 전화번호 뒤 4자리 추출 (평문 검색 인덱싱용)
    const telDigitsOnly = tel.replace(/[^0-9]/g, '');
    const telLast4 = telDigitsOnly.length >= 4 ? telDigitsOnly.slice(-4) : telDigitsOnly;

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO user_profiles (uid, name, birth, tel, telLast4, gym, gender) 
         VALUES (?, ?, ?, ?, ?, ?, ?) 
         ON CONFLICT(uid) DO UPDATE SET 
           name=excluded.name, 
           birth=excluded.birth, 
           tel=excluded.tel, 
           telLast4=excluded.telLast4, 
           gym=excluded.gym, 
           gender=excluded.gender, 
           updatedAt=CURRENT_TIMESTAMP`
      ).bind(token, encryptedName, birth, encryptedTel, telLast4, gym, gender),
      c.env.DB.prepare(
        'UPDATE users SET profileComplete = 1 WHERE uid = ?'
      ).bind(token)
    ]);

    const dbUser = await c.env.DB.prepare('SELECT * FROM users WHERE uid = ?')
      .bind(token)
      .first<{
        uid: string;
        email: string;
        provider: string;
        profileComplete: number;
        roles: string;
      }>();

    if (!dbUser) {
      return c.json({ error: '사용자를 식별하지 못했습니다.' }, 404);
    }

    const profileData: UserProfile = {
      name: encryptedName,
      birth,
      tel: encryptedTel,
      telLast4,
      gym,
      gender,
    };

    const roles = dbUser.roles.split(',').map((r) => r.trim()) as UserRole[];
    const userObj: User = {
      uid: dbUser.uid,
      email: dbUser.email,
      provider: dbUser.provider,
      profileComplete: true,
      roles,
      profile: profileData,
    };

    const safeUser = await getSafeUser(userObj, secretKey);
    return c.json({ user: safeUser });
  } catch (err: any) {
    console.error('추가정보 등록 에러:', err);
    return c.json({ error: '추가정보 등록 도중 오류 발생: ' + (err.message || err) }, 500);
  }
});

// 6-2. 이메일 중복 검사 API
app.post('/api/auth/check-email', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: '이메일 주소를 입력해주세요.' }, 400);
    }
    const exists = await c.env.DB.prepare('SELECT uid FROM users WHERE email = ?')
      .bind(email.trim())
      .first<{ uid: string }>();
    return c.json({ exists: !!exists });
  } catch (err: any) {
    return c.json({ error: '이메일 중복 검사 중 오류 발생' }, 500);
  }
});

// 7. 비밀번호 찾기 (이메일 발송) API
app.post('/api/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) {
      return c.json({ error: '이메일 주소를 기재하여 주십시오.' }, 400);
    }

    const apiKey = c.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('Wrangler Bindings: RESEND_API_KEY가 바인딩되지 않아 메일 전송이 가상으로 모킹됩니다.');
      return c.json({ success: true, simulated: true });
    }

    const resetToken = Math.random().toString(36).substring(2, 10).toUpperCase();

    // 이메일 본문 마크업 구성 (YBBF 테마에 맞춤)
    const emailHtml = `
      <div style="background-color: #0a0a0a; color: #ffffff; font-family: sans-serif; padding: 40px; border-radius: 16px; max-width: 500px; margin: 0 auto; border: 1px solid #2d4a1f;">
        <h2 style="color: #d2ff00; font-size: 24px; font-weight: 800; text-transform: uppercase; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
          YBBF 비밀번호 재설정
        </h2>
        <p style="font-size: 14px; color: rgba(255,255,255,0.7); line-height: 1.6;">
          용인시 보디빌딩협회 선수 관리 포털 계정의 비밀번호 재설정 요청이 접수되었습니다.
          아래의 임시 발급 토큰을 비밀번호 찾기 확인 화면에 입력하여 주십시오.
        </p>
        <div style="background-color: #161a16; border: 1px solid rgba(210,255,0,0.2); padding: 15px; border-radius: 8px; font-size: 20px; font-weight: bold; color: #d2ff00; text-align: center; letter-spacing: 4px; margin: 24px 0;">
          ${resetToken}
        </div>
        <p style="font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.4;">
          본 토큰은 30분 동안 유효합니다. 본인이 요청하지 않은 경우 이 메일을 무시하셔도 안전합니다.
        </p>
      </div>
    `;

    // Resend API 직접 송신
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject: '[YBBF] 용인시 보디빌딩협회 비밀번호 재설정 코드 안내',
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API Error: ${errorData}`);
    }

    return c.json({ success: true, emailSent: true });
  } catch (err: any) {
    // CORS 차단이나 Sandbox 메일 제한 에러 발생 시를 대비해 우아하게 폴백합니다
    console.error('이메일 발송 중 CORS 정책 또는 네트워크 장애가 감지되었습니다. 에러 정보:', err.message);
    console.log('이메일 발송 대안 (Mocking 활성화): 성공 화면으로 이행합니다.');
    return c.json({ success: true, fallback: true });
  }
});

// 8. 디버그 전용 전체 가입 회원 DB 조회 API (암호화 저장 상태 검증용)
app.get('/api/auth/debug-db', async (c) => {
  try {
    const usersResult = await c.env.DB.prepare('SELECT * FROM users').all<{
      uid: string;
      email: string;
      passwordHash: string | null;
      provider: string;
      profileComplete: number;
      roles: string;
    }>();

    const profilesResult = await c.env.DB.prepare('SELECT * FROM user_profiles').all<{
      uid: string;
      name: string;
      birth: string;
      tel: string;
      telLast4: string;
      gym: string;
      gender: string;
    }>();

    const profilesMap = new Map<string, any>();
    if (profilesResult.results) {
      for (const p of profilesResult.results) {
        profilesMap.set(p.uid, p);
      }
    }

    const allUsers: User[] = [];
    if (usersResult.results) {
      for (const u of usersResult.results) {
        const p = profilesMap.get(u.uid);
        const roles = u.roles.split(',').map((r) => r.trim()) as UserRole[];
        allUsers.push({
          uid: u.uid,
          email: u.email,
          passwordHash: u.passwordHash || undefined,
          salt: undefined,
          provider: u.provider,
          profileComplete: !!u.profileComplete,
          roles,
          profile: p ? {
            name: p.name,
            birth: p.birth,
            tel: p.tel,
            telLast4: p.telLast4,
            gym: p.gym,
            gender: p.gender,
          } : null,
        });
      }
    }

    return c.json(allUsers);
  } catch (err: any) {
    return c.json({ error: '디버그 DB 조회 실패: ' + err.message }, 500);
  }
});



export default app;
