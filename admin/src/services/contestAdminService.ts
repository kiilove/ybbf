import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from './firebase';

const getApiBaseUrl = () => {
  return `${import.meta.env.VITE_BACKEND_API_URL || 'https://ybbf-api-worker.jbkim.workers.dev'}/api`;
};

function getAuthHeaders(headers: Record<string, string> = {}) {
  const token = localStorage.getItem('session_token');
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return headers;
}

export interface AdminContestItem {
  id: string; // contests doc id (e.g. vEsEClzzEHCnZ1d8azo1)
  contestId: string;
  contestNoticeId: string;
  contestTitle: string;
  contestDate: string;
  contestLocation: string;
  contestPromoter?: string;
  contestStatus?: string;
  org?: string;
  collectionName?: string;
  isYongin?: boolean;
  contestPlayersFinalId?: string;
}

export interface OfficialResultPlayer {
  playerRank: number;
  playerNumber: string | number;
  playerName: string;
  playerGym?: string;
  playerUid?: string;
  totalScore?: number;
  score?: any[];
  award?: string;
  isGrandPrix?: boolean;
}

export interface OfficialCategoryResult {
  docId: string;
  contestId: string;
  categoryId?: string;
  categoryTitle: string;
  gradeId?: string;
  gradeTitle: string;
  scoreType?: string;
  isOverall: boolean;
  results: OfficialResultPlayer[];
  updatedAt?: string;
}

export const contestAdminService = {
  // 1. `contests` 컬렉션에서 org === 'ybbf' 또는 용인 대회 목록 로드
  async fetchContestList(): Promise<AdminContestItem[]> {
    try {
      const contestsSnap = await getDocs(collection(db, 'contests'));
      const contestDocs: { id: string; data: any }[] = [];

      contestsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const isYonginOrg = data.org && String(data.org).toLowerCase().trim() === 'ybbf';
        const isYonginName = data.collectionName && String(data.collectionName).includes('용인');
        if (isYonginOrg || isYonginName) {
          contestDocs.push({ id: docSnap.id, data });
        }
      });

      const noticeSnap = await getDocs(collection(db, 'contest_notice'));
      const noticeMap = new Map<string, any>();
      noticeSnap.forEach((nDoc) => {
        noticeMap.set(nDoc.id, { id: nDoc.id, ...nDoc.data() });
      });

      const list: AdminContestItem[] = [];

      for (const item of contestDocs) {
        const cData = item.data;
        const noticeId = cData.contestNoticeId;
        const noticeData = noticeId ? noticeMap.get(noticeId) : null;

        const title = noticeData?.contestTitle || cData.contestTitle || cData.collectionName || '용인특례시 보디빌딩 대회';
        const date = noticeData?.contestDate || cData.contestDate || '';
        const location = noticeData?.contestLocation || cData.contestLocation || '용인시청 에이스홀';
        const status = noticeData?.contestStatus || cData.contestStatus || '접수중';

        list.push({
          id: item.id,
          contestId: item.id,
          contestNoticeId: noticeId || item.id,
          contestTitle: title,
          contestDate: date,
          contestLocation: location,
          contestPromoter: noticeData?.contestPromoter || '용인시보디빌딩협회',
          contestStatus: status,
          org: 'ybbf',
          collectionName: cData.collectionName || '',
          isYongin: true,
          contestPlayersFinalId: cData.contestPlayersFinalId,
        });
      }

      list.sort((a, b) => (b.contestDate || '').localeCompare(a.contestDate || ''));
      return list;
    } catch (err) {
      console.error('대회 목록(ybbf) 로드 오류:', err);
      return [];
    }
  },

  // 2. 특정 대회의 상태 변경
  async updateContestStatus(contestNoticeId: string, status: string): Promise<void> {
    try {
      const docRef = doc(db, 'contest_notice', contestNoticeId);
      await updateDoc(docRef, { contestStatus: status });
    } catch (err) {
      console.warn('대회 상태 업데이트 경고:', err);
    }
  },

  // 3. `contest_results_list`에서 유효 순위(100등 이상/미채점 제외)만 필터링하여 로드
  async fetchOfficialResultsByContest(contestIdOrNoticeId: string): Promise<OfficialCategoryResult[]> {
    try {
      let realContestId = contestIdOrNoticeId;
      let contestDocRef = doc(db, 'contests', realContestId);
      let contestSnap = await getDoc(contestDocRef);

      if (!contestSnap.exists()) {
        const cQuery = query(collection(db, 'contests'), where('contestNoticeId', '==', contestIdOrNoticeId));
        const cQuerySnap = await getDocs(cQuery);
        if (!cQuerySnap.empty) {
          realContestId = cQuerySnap.docs[0].id;
          contestSnap = cQuerySnap.docs[0];
        }
      }

      const q = query(collection(db, 'contest_results_list'), where('contestId', '==', realContestId));
      let snap = await getDocs(q);

      if (snap.empty && contestSnap.exists() && contestSnap.data()?.contestNoticeId) {
        const qNotice = query(collection(db, 'contest_results_list'), where('contestId', '==', contestSnap.data().contestNoticeId));
        snap = await getDocs(qNotice);
      }

      // 전광판 및 최종 계측 명단(contest_players_final) 전수 로드
      const pfPlayers: any[] = [];
      try {
        const pfQuery = query(collection(db, 'contest_players_final'), where('contestId', '==', realContestId));
        const pfSnap = await getDocs(pfQuery);
        pfSnap.forEach((docSnap) => {
          const d = docSnap.data();
          if (Array.isArray(d.players)) pfPlayers.push(...d.players);
        });

        // contestNoticeId로 추가 검색
        if (pfPlayers.length === 0 && contestSnap.exists() && contestSnap.data()?.contestNoticeId) {
          const pfQueryNotice = query(collection(db, 'contest_players_final'), where('contestNoticeId', '==', contestSnap.data().contestNoticeId));
          const pfSnapNotice = await getDocs(pfQueryNotice);
          pfSnapNotice.forEach((docSnap) => {
            const d = docSnap.data();
            if (Array.isArray(d.players)) pfPlayers.push(...d.players);
          });
        }

        // 특정 ID 직접 조회 fallback
        if (pfPlayers.length === 0) {
          const directDoc = await getDoc(doc(db, 'contest_players_final', 'IFGioouoPXZEPW6DAtjD')).catch(() => null);
          if (directDoc && directDoc.exists() && Array.isArray(directDoc.data().players)) {
            pfPlayers.push(...directDoc.data().players);
          }
        }
      } catch (err) {
        console.warn('contest_players_final 조회 오류:', err);
      }

      const invSnap = await getDocs(query(collection(db, 'invoices_pool'), where('contestId', '==', realContestId))).catch(() => null);
      const invMap = new Map<string, any>();
      if (invSnap) {
        invSnap.forEach((invDoc) => {
          const invData = invDoc.data();
          if (invData.playerName) invMap.set(invData.playerName.trim(), invData);
        });
      }

      const list: OfficialCategoryResult[] = [];

      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const catTitle = d.categoryTitle || '종목 미지정';
        const grTitle = d.gradeTitle || '체급 미지정';
        const isOverall = catTitle.includes('그랑프리') || catTitle.includes('오버롤') || catTitle.includes('OVERALL');

        const rawResults: any[] = Array.isArray(d.result) ? d.result : [];
        
        // 100등 이상 및 미채점(-, 0 등) 완전 제외 필터링
        const validRaw = rawResults.filter((r) => {
          const rank = Number(r.playerRank);
          return rank && rank > 0 && rank < 100;
        });

        if (validRaw.length === 0) return;

        const results: OfficialResultPlayer[] = validRaw.map((r) => {
          const rank = Number(r.playerRank);
          const isGp = isOverall && rank === 1;
          const award = isGp ? '그랑프리' : `${rank}위`;
          const pName = (r.playerName || '').trim();

          const pf = pfPlayers.find((p: any) => p.playerName?.trim() === pName);
          const inv = invMap.get(pName);

          const stage1 = pf?.stagePhoto1 || inv?.stagePhoto1 || undefined;
          const stage2 = pf?.stagePhoto2 || inv?.stagePhoto2 || undefined;
          const photo = stage1 || stage2 || inv?.playerPhotoUrl || (inv?.playerPhotoUrls && inv.playerPhotoUrls[0]) || pf?.playerPhotoUrl || undefined;

          // 실제 계측표(contest_players_final)에 기재된 진짜 신장/체중만 추출 (공백이면 undefined)
          const rawHeight = pf?.playerHeight ?? inv?.playerHeight;
          const rawWeight = pf?.playerWeight ?? inv?.playerWeight;

          const pHeight = (rawHeight !== undefined && rawHeight !== '' && rawHeight !== null) ? String(rawHeight).trim() : undefined;
          const pWeight = (rawWeight !== undefined && rawWeight !== '' && rawWeight !== null) ? String(rawWeight).trim() : undefined;

          return {
            playerRank: rank,
            playerNumber: r.playerNumber !== undefined ? String(r.playerNumber).trim() : (pf?.playerNumber ? String(pf.playerNumber) : ''),
            playerName: pName || '선수명 미기재',
            playerGym: r.playerGym || pf?.playerGym || inv?.playerGym || '',
            playerUid: r.playerUid || pf?.playerUid || inv?.playerUid || '',
            totalScore: r.totalScore,
            score: r.score,
            award,
            isGrandPrix: isGp,
            stagePhoto1: stage1,
            stagePhoto2: stage2,
            photoUrl: photo,
            playerHeight: pHeight,
            playerWeight: pWeight,
          };
        });

        // 1위부터 순위 오름차순 정렬
        results.sort((a, b) => a.playerRank - b.playerRank);

        list.push({
          docId: docSnap.id,
          contestId: realContestId,
          categoryId: d.categoryId,
          categoryTitle: catTitle,
          gradeId: d.gradeId,
          gradeTitle: grTitle,
          scoreType: d.scoreType,
          isOverall,
          results,
        });
      });

      // 종목명 및 체급명 순 정렬
      list.sort((a, b) => {
        if (a.isOverall !== b.isOverall) return a.isOverall ? 1 : -1;
        if (a.categoryTitle !== b.categoryTitle) return a.categoryTitle.localeCompare(b.categoryTitle);
        return a.gradeTitle.localeCompare(b.gradeTitle);
      });

      return list;
    } catch (err) {
      console.error('공식 결과 목록 로드 오류:', err);
      return [];
    }
  },

  // 4. Cloudflare D1에 공식 심사 결과 및 선수 성적 일괄 저장
  async saveOfficialResultsToD1(contestId: string, categories: OfficialCategoryResult[]): Promise<any> {
    const url = `${getApiBaseUrl()}/admin/contests/${encodeURIComponent(contestId)}/results`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      credentials: 'include',
      body: JSON.stringify({ categories }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'D1 저장 실패' }));
      throw new Error(err.error || `D1 저장 실패 (HTTP ${res.status})`);
    }

    return await res.json();
  },

  // 5. Cloudflare D1에서 저장된 공식 심사 결과 조회
  async fetchOfficialResultsFromD1(contestId: string): Promise<OfficialCategoryResult[]> {
    try {
      const url = `${getApiBaseUrl()}/contests/${encodeURIComponent(contestId)}/results`;
      const res = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return data.categories || [];
    } catch (err) {
      console.warn('D1 결과 조회 실패, fallback 필요:', err);
      return [];
    }
  },

  // 6. `contest_results_list`의 실제 공식 심사 순위를 `invoices_pool`에 1:1 동기화 (Firebase 백업용)
  async syncOfficialResultsToInvoices(contestId: string): Promise<number> {
    const officialResults = await this.fetchOfficialResultsByContest(contestId);

    const resultMap = new Map<string, { rank: number; award: string; isGrandPrix: boolean; totalScore?: number }>();
    const playerOverallAwardMap = new Map<string, { award: string; rank: number; isGrandPrix: boolean }>();

    officialResults.forEach((catRes) => {
      catRes.results.forEach((r) => {
        const pNum = r.playerNumber;
        const pUid = r.playerUid;
        const pName = r.playerName;

        const info = {
          rank: r.playerRank,
          award: r.isGrandPrix ? '그랑프리 우승 (Grand Prix)' : `${r.playerRank}위`,
          isGrandPrix: r.isGrandPrix || false,
          totalScore: r.totalScore,
        };

        if (pNum && catRes.categoryTitle) resultMap.set(`${pNum}___${catRes.categoryTitle}`, info);
        if (pUid && catRes.categoryTitle) resultMap.set(`${pUid}___${catRes.categoryTitle}`, info);
        if (pName && catRes.categoryTitle) resultMap.set(`${pName}___${catRes.categoryTitle}`, info);

        if (pNum && catRes.gradeTitle) resultMap.set(`${pNum}___${catRes.gradeTitle}`, info);
        if (pUid && catRes.gradeTitle) resultMap.set(`${pUid}___${catRes.gradeTitle}`, info);

        const key = String(pUid || pNum || pName);
        const prev = playerOverallAwardMap.get(key);
        if (info.isGrandPrix) {
          playerOverallAwardMap.set(key, { award: '그랑프리 우승 (OVERALL CHAMPION)', rank: 1, isGrandPrix: true });
        } else if (!prev || info.rank < prev.rank) {
          playerOverallAwardMap.set(key, { award: info.award, rank: info.rank, isGrandPrix: false });
        }
      });
    });

    let realContestId = contestId;
    const q = query(collection(db, 'invoices_pool'), where('contestId', '==', realContestId));
    const snap = await getDocs(q);

    let updatedCount = 0;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const pNum = data.playerNumber ? String(data.playerNumber).trim() : '';
      const pUid = data.playerUid ? String(data.playerUid).trim() : '';
      const pName = data.playerName ? String(data.playerName).trim() : '';

      let newJoins = (data.joins || []).map((j: any) => {
        const cat = j.contestCategoryTitle || '';
        const gr = j.contestGradeTitle || '';

        const matched = 
          (pNum && cat && resultMap.get(`${pNum}___${cat}`)) ||
          (pUid && cat && resultMap.get(`${pUid}___${cat}`)) ||
          (pName && cat && resultMap.get(`${pName}___${cat}`)) ||
          (pNum && gr && resultMap.get(`${pNum}___${gr}`)) ||
          (pUid && gr && resultMap.get(`${pUid}___${gr}`)) ||
          null;

        if (matched) {
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

      const overall = playerOverallAwardMap.get(pUid) || playerOverallAwardMap.get(pNum) || playerOverallAwardMap.get(pName);

      const payload: any = { joins: newJoins };
      if (overall) {
        payload.award = overall.award;
        payload.rank = overall.rank;
        payload.isGrandPrix = overall.isGrandPrix;
      }

      await updateDoc(docSnap.ref, payload);
      updatedCount++;
    }

    return updatedCount;
  }
};
