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
