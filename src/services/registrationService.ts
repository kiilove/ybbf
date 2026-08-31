import { doc, getDoc, collection, setDoc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { 
  ContestNotice, 
  Contest, 
  Category, 
  Grade, 
  RegistrationPayload, 
  MandatoryNotice 
} from '../types/registration';

// 💡 날짜 안전 파서 (ISO 8601 UTC 및 로컬 YYYY-MM-DD HH:mm:ss 타임존 보정 파싱)
export function parseSafeDate(isoStr?: string, localStr?: string): number {
  if (isoStr) {
    const d = new Date(isoStr).getTime();
    if (!isNaN(d)) return d;
  }
  if (localStr) {
    // KST(UTC+9) 타임존 오프셋을 결합하여 파싱함으로써 9시간 정렬 왜곡과 브라우저별 파싱 오류 예방
    const formatted = localStr.replace(' ', 'T') + '+09:00';
    const d = new Date(formatted).getTime();
    if (!isNaN(d)) return d;
    const fallback = new Date(localStr).getTime();
    if (!isNaN(fallback)) return fallback;
  }
  return 0;
}

// 1. 대회 공고(notice) 상세 조회
export async function getContestNotice(noticeId: string): Promise<ContestNotice> {
  const docRef = doc(db, 'contest_notice', noticeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ContestNotice;
  }
  throw new Error('대회 공고를 찾을 수 없습니다.');
}

// 2. 대회(contest) 메타데이터 조회
export async function getContest(contestId: string): Promise<Contest> {
  const docRef = doc(db, 'contests', contestId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Contest;
  }
  throw new Error('대회 상세 정보를 찾을 수 없습니다.');
}

// 3. 카테고리(부문) 리스트 조회
export async function getCategoryList(categoryListId: string): Promise<Category[]> {
  const docRef = doc(db, 'contest_categorys_list', categoryListId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return (docSnap.data()?.categorys || []) as Category[];
  }
  return [];
}

// 4. 체급 리스트 조회
export async function getGradeList(gradeListId: string): Promise<Grade[]> {
  const docRef = doc(db, 'contest_grades_list', gradeListId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return (docSnap.data()?.grades || []) as Grade[];
  }
  return [];
}

export interface HybridSubmitResult {
  success: boolean;
  invoiceId: string;
  d1Saved: boolean;
  d1Error: string | null;
}

// 5. 하이브리드 접수 저장 어댑터 (D1 + Firestore)
// 트랜잭션 순서 변경: 원천 데이터인 Firestore 선저장 후, D1 2차 동기화 적재
export async function submitHybridRegistration(invoiceData: RegistrationPayload): Promise<HybridSubmitResult> {
  const invoiceId = invoiceData.id;
  if (!invoiceId) {
    throw new Error('접수 식별자(ID)가 페이로드에 누락되었습니다.');
  }

  // [A] Firebase Firestore 저장 (원천 데이터베이스 영속성 쓰기)
  try {
    // Firestore의 'invoices_pool' 컬렉션 아래에 invoiceId를 Key로 하여 문서 저장
    const { playerPhotoUrls, ...firestorePayload } = invoiceData;
    const finalFirestorePayload: any = { ...firestorePayload };
    if (playerPhotoUrls && playerPhotoUrls.length > 0) {
      finalFirestorePayload.playerPhotoUrlsJson = JSON.stringify(playerPhotoUrls);
    }
    await setDoc(doc(db, 'invoices_pool', invoiceId), finalFirestorePayload);
  } catch (firestoreErr: any) {
    console.error('Firestore 저장 오류:', firestoreErr);
    throw new Error(`대회 접수 서버(Firestore) 저장 오류: ${firestoreErr.message}`);
  }

  // [B] Cloudflare D1 전송 (Worker API Endpoint 호출) - 비동기 동기화 2순위 적재
  let d1Success = false;
  let d1Error: string | null = null;
  const d1Url = import.meta.env.VITE_BACKEND_API_URL || '';

  if (d1Url) {
    try {
      const response = await fetch(`${d1Url}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      if (response.ok) {
        d1Success = true;
      } else {
        d1Error = `D1 API Error (HTTP ${response.status})`;
      }
    } catch (err: any) {
      d1Error = err.message || 'D1 API Connection Failed';
    }
  } else {
    // 개발 모드/설정 미완료 시 LocalStorage 백업 및 아카이빙
    try {
      const localBackup = JSON.parse(localStorage.getItem('ybbf_d1_registrations') || '[]');
      localBackup.push({
        ...invoiceData,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem('ybbf_d1_registrations', JSON.stringify(localBackup));
      d1Success = true;
    } catch (e: any) {
      // 💡 LocalStorage 용량 초과(QuotaExceededError) 대응 및 메시지 구체화
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        d1Error = '로컬 브라우저 백업 저장소 용량 초과';
      } else {
        d1Error = e.message || '로컬 백업 실패';
      }
    }
  }

  return {
    success: true,
    invoiceId,
    d1Saved: d1Success,
    d1Error,
  };
}

// 7. 특정 선수의 대회 접수 내역(인보이스) 목록 조회
export async function getUserInvoices(playerUid: string): Promise<RegistrationPayload[]> {
  try {
    const q = query(collection(db, 'invoices_pool'), where('playerUid', '==', playerUid));
    const querySnapshot = await getDocs(q);
    const list: RegistrationPayload[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as any;
      if (data.playerPhotoUrlsJson) {
        try {
          data.playerPhotoUrls = JSON.parse(data.playerPhotoUrlsJson);
        } catch (e) {
          console.error('Failed to parse playerPhotoUrlsJson:', e);
        }
      }
      if (data.selectedPhotoUrlsJson) {
        try {
          data.selectedPhotoUrls = JSON.parse(data.selectedPhotoUrlsJson);
        } catch (e) {
          console.error('Failed to parse selectedPhotoUrlsJson:', e);
        }
      }
      if (typeof data.selectedPhotoUrls === 'string') {
        try {
          data.selectedPhotoUrls = JSON.parse(data.selectedPhotoUrls);
        } catch (e) {}
      }
      if (!data.stagePhoto1 && Array.isArray(data.selectedPhotoUrls) && data.selectedPhotoUrls[0]) {
        data.stagePhoto1 = data.selectedPhotoUrls[0];
      }
      if (!data.stagePhoto2 && Array.isArray(data.selectedPhotoUrls) && data.selectedPhotoUrls[1]) {
        data.stagePhoto2 = data.selectedPhotoUrls[1];
      }
      list.push({ id: doc.id, ...data } as RegistrationPayload);
    });
    // 최신 신청서가 위로 오도록 정렬
    return list.sort((a, b) => {
      const dateA = parseSafeDate(a.submittedAt, a.invoiceCreateAt);
      const dateB = parseSafeDate(b.submittedAt, b.invoiceCreateAt);
      return dateB - dateA;
    });
  } catch (err) {
    console.error('Firestore 대회 접수 내역 조회 오류:', err);
    try {
      interface LocalRegistrationPayload extends RegistrationPayload {
        savedAt?: string;
      }
      const localBackup = JSON.parse(localStorage.getItem('ybbf_d1_registrations') || '[]') as LocalRegistrationPayload[];
      return localBackup
        .filter((item) => item.playerUid === playerUid)
        .sort((a, b) => {
          const dateA = parseSafeDate(a.submittedAt, a.invoiceCreateAt || a.savedAt);
          const dateB = parseSafeDate(b.submittedAt, b.invoiceCreateAt || b.savedAt);
          return dateB - dateA;
        });
    } catch {
      return [];
    }
  }
}

// 8. 필수 공지사항 리스트 조회
export async function getMandatoryNotices(): Promise<MandatoryNotice[]> {
  const d1Url = import.meta.env.VITE_BACKEND_API_URL || '';
  if (!d1Url) {
    return [];
  }
  try {
    const res = await fetch(`${d1Url}/api/notices?mandatory=true`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json() as MandatoryNotice[];
  } catch (err) {
    console.error('필수 공지사항 조회 실패:', err);
    return [];
  }
}

// 9. 하이브리드 참가신청 수정 반영 (Firestore 롤백 및 아카이브 동기화)
export async function updateHybridRegistration(
  invoiceId: string,
  invoiceData: RegistrationPayload
): Promise<HybridSubmitResult> {
  // [A] Firestore - contest_entrys_list의 기존 채점판 등록 명단 강제 삭제 (롤백/청소)
  try {
    const entryQuery = query(
      collection(db, 'contest_entrys_list'),
      where('playerUid', '==', invoiceData.playerUid),
      where('contestId', '==', invoiceData.contestId)
    );
    const querySnapshot = await getDocs(entryQuery);
    
    if (!querySnapshot.empty) {
      await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          await deleteDoc(doc(db, 'contest_entrys_list', docSnap.id));
          console.log('기존 채점 엔트리 삭제완료:', docSnap.id);
        })
      );
    }
  } catch (entryCleanErr: any) {
    console.error('기존 채점 명단 청소 실패:', entryCleanErr);
    // 채점판 정합성이 중요하므로 청소 실패 시 에러를 던져 트랜잭션 중단 유도
    throw new Error(`기존 채점 명단 초기화 실패: ${entryCleanErr.message}`);
  }

  // [B] Firestore - invoices_pool 문서 수정 갱신
  const kstDate = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
  const localEditTime = kstDate.toISOString().replace('T', ' ').substring(0, 16); // "YYYY-MM-DD HH:mm"

  const finalInvoiceData: RegistrationPayload = {
    ...invoiceData,
    invoiceEdited: true, // 수정 상태 참 마킹
    isPriceCheck: false, // 입금확인 상태 취소로 강제 롤백
    invoiceEditAt: localEditTime, // 수정된 시각 기입
  };

  try {
    const { playerPhotoUrls, ...firestorePayload } = finalInvoiceData;
    const finalFirestorePayload: any = { ...firestorePayload };
    if (playerPhotoUrls && playerPhotoUrls.length > 0) {
      finalFirestorePayload.playerPhotoUrlsJson = JSON.stringify(playerPhotoUrls);
    }
    await setDoc(doc(db, 'invoices_pool', invoiceId), finalFirestorePayload);
  } catch (firestoreErr: any) {
    console.error('Firestore 수정 갱신 실패:', firestoreErr);
    throw new Error(`대회 접수 정보 수정 실패(Firestore): ${firestoreErr.message}`);
  }

  // [C] Cloudflare D1 동기화 적재 전송 (Worker API 호출)
  let d1Success = false;
  let d1Error: string | null = null;
  const d1Url = import.meta.env.VITE_BACKEND_API_URL || '';

  if (d1Url) {
    try {
      const response = await fetch(`${d1Url}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalInvoiceData),
      });
      if (response.ok) {
        d1Success = true;
      } else {
        d1Error = `D1 API Error (HTTP ${response.status})`;
      }
    } catch (err: any) {
      d1Error = err.message || 'D1 API Connection Failed';
    }
  }

  return {
    success: true,
    invoiceId,
    d1Saved: d1Success,
    d1Error,
  };
}

// 6-1. 대회 메타데이터 실시간 보강 헬퍼 (대회일자, 대회장소, 대회명 동기화)
async function enrichInvoiceWithContestData(invoice: RegistrationPayload): Promise<RegistrationPayload> {
  const result = { ...invoice };

  // 만약 contestDate 또는 contestLocation이 이미 채워져 있다면 그대로 사용
  if (result.contestDate && result.contestLocation) {
    return result;
  }

  // contestId 또는 contestNoticeId로 Firestore contest_notice 조회
  const targetContestId = result.contestId;
  if (targetContestId) {
    try {
      // 1) contest_notice 컬렉션에서 contestId 또는 문서 ID로 조회
      const noticeDocRef = doc(db, 'contest_notice', targetContestId);
      const noticeSnap = await getDoc(noticeDocRef);
      if (noticeSnap.exists()) {
        const nd = noticeSnap.data();
        if (!result.contestTitle && nd.contestTitle) result.contestTitle = nd.contestTitle;
        if (!result.contestDate && nd.contestDate) result.contestDate = nd.contestDate;
        if (!result.contestLocation && nd.contestLocation) result.contestLocation = nd.contestLocation;
      } else {
        // 쿼리로 contestId 일치 조회
        const qNotice = query(collection(db, 'contest_notice'), where('contestId', '==', targetContestId));
        const snapNotice = await getDocs(qNotice);
        if (!snapNotice.empty) {
          const nd = snapNotice.docs[0].data();
          if (!result.contestTitle && nd.contestTitle) result.contestTitle = nd.contestTitle;
          if (!result.contestDate && nd.contestDate) result.contestDate = nd.contestDate;
          if (!result.contestLocation && nd.contestLocation) result.contestLocation = nd.contestLocation;
        }
      }
    } catch (e) {
      console.warn('대회 메타데이터 보강 조회 오류:', e);
    }
  }

  // 최후 Fallback: 제9회 용인특례시 공식 대회 기본값 적용
  if (!result.contestDate) {
    result.contestDate = '2026-08-29';
  }
  if (!result.contestLocation) {
    result.contestLocation = '용인시청 에이스홀';
  }

  return result;
}

// 7. 단일 선수 쇼케이스 인보이스 조회 (D1 우선 조회 & Firestore 브랜딩 사진/성적 실시간 병합 보강)
export async function getInvoiceByIdOrPlayerUid(idOrUid: string): Promise<RegistrationPayload | null> {
  if (!idOrUid) return null;

  let baseInvoice: RegistrationPayload | null = null;

  // 0) Cloudflare D1 공식 인보이스 및 공식 심사 결과 조회 (실시간 성적 & 사진)
  try {
    const res = await fetch(`https://ybbf-api-worker.jbkim.workers.dev/api/invoices/showcase/${encodeURIComponent(idOrUid)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.invoice) {
        baseInvoice = json.invoice as RegistrationPayload;
      }
    }
  } catch (err) {
    // continue to Firestore
  }

  // 1) Firestore에서 브랜딩 사진 (publicStagePhoto1, 2) 및 원천 데이터 실시간 병합 (마이페이지와 동일 소스)
  try {
    const targetId = baseInvoice?.id || idOrUid;
    const docRef = doc(db, 'invoices_pool', targetId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const fsData = docSnap.data();
      let photoUrls = fsData.playerPhotoUrls || [];
      if ((!photoUrls || photoUrls.length === 0) && fsData.playerPhotoUrlsJson) {
        try { photoUrls = JSON.parse(fsData.playerPhotoUrlsJson); } catch (e) {}
      }

      if (baseInvoice) {
        return {
          ...baseInvoice,
          publicStagePhoto1: fsData.publicStagePhoto1 || baseInvoice.publicStagePhoto1 || '',
          publicStagePhoto2: fsData.publicStagePhoto2 || baseInvoice.publicStagePhoto2 || '',
          stagePhoto1: fsData.stagePhoto1 || baseInvoice.stagePhoto1 || '',
          stagePhoto2: fsData.stagePhoto2 || baseInvoice.stagePhoto2 || '',
          playerPhotoUrls: (photoUrls.length > 0) ? photoUrls : baseInvoice.playerPhotoUrls
        };
      } else {
        const rawPayload = { id: docSnap.id, ...fsData, playerPhotoUrls: photoUrls } as RegistrationPayload;
        return await enrichInvoiceWithContestData(rawPayload);
      }
    }
  } catch (err) {
    // continue
  }

  // 2) playerUid 쿼리 조회 (invoices_pool)
  try {
    const targetUid = baseInvoice?.playerUid || idOrUid;
    const q1 = query(collection(db, 'invoices_pool'), where('playerUid', '==', targetUid));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docItem = snap1.docs[0];
      const fsData = docItem.data();
      let photoUrls = fsData.playerPhotoUrls || [];
      if ((!photoUrls || photoUrls.length === 0) && fsData.playerPhotoUrlsJson) {
        try { photoUrls = JSON.parse(fsData.playerPhotoUrlsJson); } catch (e) {}
      }

      if (baseInvoice) {
        return {
          ...baseInvoice,
          publicStagePhoto1: fsData.publicStagePhoto1 || baseInvoice.publicStagePhoto1 || '',
          publicStagePhoto2: fsData.publicStagePhoto2 || baseInvoice.publicStagePhoto2 || '',
          stagePhoto1: fsData.stagePhoto1 || baseInvoice.stagePhoto1 || '',
          stagePhoto2: fsData.stagePhoto2 || baseInvoice.stagePhoto2 || '',
          playerPhotoUrls: (photoUrls.length > 0) ? photoUrls : baseInvoice.playerPhotoUrls
        };
      } else {
        const rawPayload = { id: docItem.id, ...fsData, playerPhotoUrls: photoUrls } as RegistrationPayload;
        return await enrichInvoiceWithContestData(rawPayload);
      }
    }
  } catch (err) {
    // continue
  }

  // 3) invoices 컬렉션 직접 문서 ID로 조회 (구버전 fallback)
  try {
    const docRef = doc(db, 'invoices', idOrUid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      let photoUrls = data.playerPhotoUrls || [];
      if ((!photoUrls || photoUrls.length === 0) && data.playerPhotoUrlsJson) {
        try { photoUrls = JSON.parse(data.playerPhotoUrlsJson); } catch (e) {}
      }
      const rawPayload = { id: docSnap.id, ...data, playerPhotoUrls: photoUrls } as RegistrationPayload;
      return await enrichInvoiceWithContestData(rawPayload);
    }
  } catch (err) {
    // continue
  }

  // 4) playerName 쿼리 조회 (선수 이름으로도 쇼케이스 열기 지원)
  try {
    const cleanName = decodeURIComponent(idOrUid).trim().replace(/^(champ-|legend-|youth-\d+-|youth-)/, '');
    const q3 = query(collection(db, 'invoices_pool'), where('playerName', '==', cleanName));
    const snap3 = await getDocs(q3);
    if (!snap3.empty) {
      const docItem = snap3.docs[0];
      const data = docItem.data();
      let photoUrls = data.playerPhotoUrls || [];
      if ((!photoUrls || photoUrls.length === 0) && data.playerPhotoUrlsJson) {
        try { photoUrls = JSON.parse(data.playerPhotoUrlsJson); } catch (e) {}
      }
      const rawPayload = { id: docItem.id, ...data, playerPhotoUrls: photoUrls } as RegistrationPayload;
      return await enrichInvoiceWithContestData(rawPayload);
    }
  } catch (err) {
    // continue
  }

  return baseInvoice;
}

// 8. 쇼케이스 SNS 인터랙션 (Reactions & Comments)
export type ShowcaseReactionType = 'heart' | 'fire' | 'clap' | 'trophy';

export interface ShowcaseReactions {
  heart: number;
  fire: number;
  clap: number;
  trophy: number;
}

export interface ShowcaseComment {
  id: string;
  invoiceId: string;
  authorName: string;
  authorGym?: string;
  content: string;
  badge?: string;
  createdAt: string;
  likeCount?: number;
}

// 8-1. 쇼케이스 리액션 인터랙션 (하트, 불꽃, 박수, 트로피)
export async function reactShowcase(
  invoiceId: string, 
  reaction: ShowcaseReactionType
): Promise<ShowcaseReactions> {
  const localKey = `ybbf_reactions_${invoiceId}`;
  let currentReactions: ShowcaseReactions = { heart: 0, fire: 0, clap: 0, trophy: 0 };
  try {
    const saved = localStorage.getItem(localKey);
    if (saved) currentReactions = JSON.parse(saved);
  } catch {}

  currentReactions[reaction] = (currentReactions[reaction] || 0) + 1;
  localStorage.setItem(localKey, JSON.stringify(currentReactions));

  try {
    const docRef = doc(db, 'invoices_pool', invoiceId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const firestoreReactions = data.reactions || { heart: data.cheerCount || 0, fire: 0, clap: 0, trophy: 0 };
      firestoreReactions[reaction] = (firestoreReactions[reaction] || 0) + 1;
      await setDoc(docRef, { reactions: firestoreReactions, cheerCount: firestoreReactions.heart }, { merge: true });
      return firestoreReactions;
    }
  } catch (e) {
    console.warn('Firestore reaction update error:', e);
  }

  return currentReactions;
}

// 8-2. 쇼케이스 리액션 초기값 조회
export async function getShowcaseReactions(invoiceId: string): Promise<ShowcaseReactions> {
  try {
    const docRef = doc(db, 'invoices_pool', invoiceId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.reactions) return data.reactions;
      if (data.cheerCount) return { heart: data.cheerCount, fire: 0, clap: 0, trophy: 0 };
    }
  } catch {}

  const localKey = `ybbf_reactions_${invoiceId}`;
  try {
    const saved = localStorage.getItem(localKey);
    if (saved) return JSON.parse(saved);
  } catch {}

  return { heart: 0, fire: 0, clap: 0, trophy: 0 };
}

// 8-3. 쇼케이스 댓글 목록 조회
export async function getShowcaseComments(invoiceId: string): Promise<ShowcaseComment[]> {
  const localKey = `ybbf_comments_${invoiceId}`;
  let localComments: ShowcaseComment[] = [];
  try {
    const saved = localStorage.getItem(localKey);
    if (saved) localComments = JSON.parse(saved);
  } catch {}

  try {
    const commentsRef = collection(db, 'invoices_pool', invoiceId, 'comments');
    const snap = await getDocs(commentsRef);
    if (!snap.empty) {
      const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShowcaseComment));
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return fetched;
    }
  } catch (e) {
    console.warn('Firestore comments fetch error (using local):', e);
  }

  return localComments;
}

// 8-4. 쇼케이스 댓글 등록
export async function addShowcaseComment(
  invoiceId: string,
  comment: Omit<ShowcaseComment, 'id' | 'createdAt'>
): Promise<ShowcaseComment> {
  const newComment: ShowcaseComment = {
    id: `cmt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    invoiceId,
    ...comment,
    createdAt: new Date().toISOString(),
    likeCount: 0,
  };

  // 1. LocalStorage 저장
  const localKey = `ybbf_comments_${invoiceId}`;
  try {
    const existing: ShowcaseComment[] = JSON.parse(localStorage.getItem(localKey) || '[]');
    existing.unshift(newComment);
    localStorage.setItem(localKey, JSON.stringify(existing));
  } catch {}

  // 2. Firestore 저장
  try {
    const commentDocRef = doc(db, 'invoices_pool', invoiceId, 'comments', newComment.id);
    await setDoc(commentDocRef, newComment);
  } catch (e) {
    console.warn('Firestore add comment error:', e);
  }

  return newComment;
}

// 8-5. 레거시 호환 cheerShowcase
export async function cheerShowcase(invoiceId: string): Promise<number> {
  const res = await reactShowcase(invoiceId, 'heart');
  return res.heart;
}

