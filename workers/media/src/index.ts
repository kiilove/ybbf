import { Hono, Context, Next } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  RESEND_API_KEY: string;
  CRYPTO_SECRET: string;
  DB: D1Database;
  R2: R2Bucket;
  MEDIA_PUBLIC_URL?: string;
};

type Variables = {
  adminUid: string;
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
        origin.includes('ybbf') ||
        origin.includes('pages.dev')
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 관리자 검증 공통 미들웨어
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  
  c.set('adminUid', token);
  await next();
}

// 유튜브 비디오 ID 추출 헬퍼
function getYoutubeVideoId(url: string): string {
  if (!url) return '';
  let videoId = '';
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0] || '';
    }
  } catch {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    videoId = match ? match[1] : '';
  }
  return videoId;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📹 미디어 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 미디어 목록 조회 (비로그인 허용)
app.get('/api/media', async (c) => {
  try {
    const category = c.req.query('category');
    const featured = c.req.query('featured');
    
    let query = 'SELECT * FROM media';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (category && category !== 'all') {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (featured === 'true' || featured === '1') {
      conditions.push('featured = 1');
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY sortOrder ASC, date DESC';
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    const mediaList = result.results || [];
    
    // JSON 문자열 파싱 (relatedLegendIds 등)
    const formatted = mediaList.map(m => ({
      ...m,
      featured: !!m.featured,
      relatedLegendIds: m.relatedLegendIds ? JSON.parse(m.relatedLegendIds as string) : []
    }));
    
    return c.json(formatted);
  } catch (err: any) {
    return c.json({ error: '미디어 목록 조회 실패: ' + err.message }, 500);
  }
});

// 2. 미디어 상세 조회 (비로그인 허용)
app.get('/api/media/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const media = await c.env.DB.prepare('SELECT * FROM media WHERE id = ?')
      .bind(id)
      .first() as any | null;
      
    if (!media) {
      return c.json({ error: '미디어를 찾을 수 없습니다.' }, 404);
    }
    
    return c.json({
      ...media,
      featured: !!media.featured,
      relatedLegendIds: media.relatedLegendIds ? JSON.parse(media.relatedLegendIds) : []
    });
  } catch (err: any) {
    return c.json({ error: '미디어 상세 조회 실패: ' + err.message }, 500);
  }
});

// 3. 미디어 등록 API (관리자 전용)
app.post('/api/admin/media', adminMiddleware, async (c) => {
  try {
    const payload = await c.req.json();
    const {
      id, title, category, videoUrl, youtubeUrl, aspect,
      date, description, featured, relatedLegendIds, sortOrder
    } = payload;
    let { thumbnail } = payload;
    
    // 유튜브 URL이 존재하고 썸네일이 누락된 경우 유튜브 썸네일 자동 생성
    if ((!thumbnail || thumbnail.trim() === '') && youtubeUrl) {
      const videoId = getYoutubeVideoId(youtubeUrl);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    
    if (!id || !title || !category || !thumbnail || !date || !description) {
      return c.json({ error: '필수 항목이 누락되었습니다.' }, 400);
    }
    
    const isFeatured = featured ? 1 : 0;
    const legendsJson = relatedLegendIds ? JSON.stringify(relatedLegendIds) : '[]';
    const order = sortOrder || 0;
    const finalAspect = aspect || 'landscape';
    
    await c.env.DB.prepare(`
      INSERT INTO media (
        id, title, category, thumbnail, videoUrl, youtubeUrl, aspect,
        date, description, featured, relatedLegendIds, sortOrder
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, title, category, thumbnail, videoUrl || null, youtubeUrl || null, finalAspect,
      date, description, isFeatured, legendsJson, order
    ).run();
    
    return c.json({ success: true, message: '미디어가 정상적으로 추가되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '미디어 등록 실패: ' + err.message }, 500);
  }
});

// 4. 미디어 수정 API (관리자 전용)
app.put('/api/admin/media/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    const payload = await c.req.json();
    const {
      title, category, videoUrl, youtubeUrl, aspect,
      date, description, featured, relatedLegendIds, sortOrder
    } = payload;
    let { thumbnail } = payload;
    
    // 유튜브 URL이 존재하고 썸네일이 누락된 경우 유튜브 썸네일 자동 생성
    if ((!thumbnail || thumbnail.trim() === '') && youtubeUrl) {
      const videoId = getYoutubeVideoId(youtubeUrl);
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    
    if (!title || !category || !thumbnail || !date || !description) {
      return c.json({ error: '필수 항목이 누락되었습니다.' }, 400);
    }
    
    const isFeatured = featured ? 1 : 0;
    const legendsJson = relatedLegendIds ? JSON.stringify(relatedLegendIds) : '[]';
    const order = sortOrder || 0;
    const finalAspect = aspect || 'landscape';
    
    await c.env.DB.prepare(`
      UPDATE media SET 
        title = ?, category = ?, thumbnail = ?, videoUrl = ?, youtubeUrl = ?, aspect = ?,
        date = ?, description = ?, featured = ?, relatedLegendIds = ?, sortOrder = ?
      WHERE id = ?
    `).bind(
      title, category, thumbnail, videoUrl || null, youtubeUrl || null, finalAspect,
      date, description, isFeatured, legendsJson, order, id
    ).run();
    
    return c.json({ success: true, message: '미디어 정보가 성공적으로 수정되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '미디어 수정 실패: ' + err.message }, 500);
  }
});

// 5. 미디어 삭제 API (관리자 전용)
app.delete('/api/admin/media/:id', adminMiddleware, async (c) => {
  try {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
    return c.json({ success: true, message: '미디어가 성공적으로 삭제되었습니다.' });
  } catch (err: any) {
    return c.json({ error: '미디어 삭제 실패: ' + err.message }, 500);
  }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📦 R2 미디어 파일 업로드 & 서빙 APIs
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. 선수 프로필 사진 및 범용 미디어 파일 Cloudflare R2 업로드 API
app.post('/api/upload', async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body['file'];
    const playerUid = body['playerUid'] as string | undefined;
    const folder = body['folder'] as string | undefined;

    if (!file || !(file instanceof File)) {
      return c.json({ error: '업로드할 파일이 누락되었습니다.' }, 400);
    }

    let key = '';
    if (playerUid) {
      // 1. 기존 호환성 유지: 선수 프로필 사진 등록 시 playerUid가 있을 경우
      key = `player_photos/${playerUid}_${file.name}`;
    } else if (folder) {
      // 2. 범용 폴더 지정 시 (예: notices)
      key = `${folder}/${Date.now()}_${file.name}`;
    } else {
      // 3. 둘 다 없을 때 기본 general 경로 사용
      key = `general/${Date.now()}_${file.name}`;
    }
    
    // Cloudflare R2 버킷에 파일 스트림 쓰기
    await c.env.R2.put(key, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // 환경변수 MEDIA_PUBLIC_URL이 존재하면 우선 적용, 없으면 요청 origin 호스트를 파싱하여 동적으로 생성
    const publicUrl = c.env.MEDIA_PUBLIC_URL || new URL(c.req.url).origin;
    const url = `${publicUrl}/api/photos/${key}`;
    return c.json({ url });
  } catch (err: any) {
    console.error('R2 업로드 실패:', err);
    return c.json({ error: 'R2 파일 업로드에 실패했습니다: ' + err.message }, 500);
  }
});

// 2. 로컬 개발 환경 이미지 서빙 프록시 API (R2)
app.get('/api/photos/*', async (c) => {
  try {
    const path = c.req.path.replace('/api/photos/', '');
    const object = await c.env.R2.get(path);
    if (!object) {
      return c.text('이미지 파일을 찾을 수 없습니다.', 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    // 브라우저 및 Cloudflare CDN 에지가 리소스를 1년간 캐싱하여 부하를 낮추고 성능을 극대화
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    // CORS 대응 허용
    const origin = c.req.header('Origin') || 'http://localhost:4100';
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');

    return new Response(object.body, { headers });
  } catch (err: any) {
    return c.text('이미지 서빙 오류: ' + err.message, 500);
  }
});

export default app;
