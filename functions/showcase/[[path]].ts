interface Env {
  ASSETS: { fetch: typeof fetch };
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { params, request } = context;
  const idOrName = (params.id || (Array.isArray(params.path) ? params.path[0] : params.path) || '') as string;

  // 1. 기본 정적 HTML 가져오기
  const response = await context.env.ASSETS.fetch(request);
  if (!idOrName || response.status !== 200) {
    return response;
  }

  try {
    // 2. Worker API를 통해 D1에서 해당 선수의 실제 데이터 조회
    const apiUrl = `https://ybbf-api-worker.jbkim.workers.dev/api/invoices/showcase/${encodeURIComponent(idOrName)}`;
    const apiRes = await fetch(apiUrl);
    
    if (!apiRes.ok) {
      return response;
    }

    const data: any = await apiRes.json();
    if (!data.success || !data.invoice) {
      return response;
    }

    const inv = data.invoice;
    const playerName = (inv.playerName || '선수').trim();
    const gym = inv.playerGym ? `${inv.playerGym} 소속` : '';
    
    // 주요 출전 종목 또는 수상 내역 구성
    let categorySummary = '';
    if (inv.joins && Array.isArray(inv.joins) && inv.joins.length > 0) {
      categorySummary = inv.joins.map((j: any) => `${j.categoryTitle || ''} ${j.divisionTitle || ''}`).filter(Boolean).join(' · ');
    }

    // 워터마크 브랜딩 사진 최우선 사용
    const stagePhoto = 
      inv.publicStagePhoto1 || 
      inv.stagePhoto1 || 
      (inv.playerPhotoUrls && inv.playerPhotoUrls[0]) || 
      inv.playerPhotoUrl || 
      'https://ybbf.org/hero_section.png';

    const title = `[YBBF] ${playerName} 선수 공식 무대 쇼케이스`;
    const description = `${playerName} 선수${gym ? `(${gym})` : ''}의 2026 제9회 용인특례시 협회장배 공식 무대 화보와 출전 기록을 확인하고 응원해 보세요! 🏆✨`;
    const pageUrl = `https://ybbf.org/showcase/${encodeURIComponent(idOrName)}`;

    // 3. HTMLRewriter를 사용하여 메타 태그를 해당 선수 정보로 치환
    return new HTMLRewriter()
      .on('title', {
        element(e) {
          e.setInnerContent(`${title} | YBBF 용인시보디빌딩협회`);
        }
      })
      .on('meta[name="description"]', {
        element(e) {
          e.setAttribute('content', description);
        }
      })
      .on('meta[property="og:title"]', {
        element(e) {
          e.setAttribute('content', title);
        }
      })
      .on('meta[property="og:description"]', {
        element(e) {
          e.setAttribute('content', description);
        }
      })
      .on('meta[property="og:image"]', {
        element(e) {
          e.setAttribute('content', stagePhoto);
        }
      })
      .on('meta[property="og:url"]', {
        element(e) {
          e.setAttribute('content', pageUrl);
        }
      })
      .on('meta[name="twitter:title"], meta[property="twitter:title"]', {
        element(e) {
          e.setAttribute('content', title);
        }
      })
      .on('meta[name="twitter:description"], meta[property="twitter:description"]', {
        element(e) {
          e.setAttribute('content', description);
        }
      })
      .on('meta[name="twitter:image"], meta[property="twitter:image"]', {
        element(e) {
          e.setAttribute('content', stagePhoto);
        }
      })
      .transform(response);

  } catch (err) {
    console.error('[Showcase OG Rewriter] 오류 발생:', err);
    return response;
  }
};
