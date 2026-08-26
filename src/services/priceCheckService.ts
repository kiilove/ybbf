import { db } from './firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  updateDoc
} from 'firebase/firestore';

export interface JoinItem {
  contestCategoryTitle: string;
  contestCategoryId: string;
  contestGradeTitle: string;
  contestGradeId: string;
}

export interface InvoiceData {
  id: string;
  contestId: string;
  playerUid: string;
  playerName: string;
  playerBirth: string;
  playerGym: string;
  playerTel: string;
  playerText?: string;
  invoiceCreateAt: string;
  createBy?: string;
  joins: JoinItem[];
  isPriceCheck: boolean;
  playerService?: boolean;
}

export interface SessionUser {
  userID?: string;
  userGroup?: string;
  userContext?: string;
  id?: string;
}

/**
 * ✅ 1. Firestore contests/{contestId}/priceCheckLogs 하위에 입금 확인/취소 로그 기록
 */
async function writePriceCheckLog(
  action: 'add' | 'del' | 'cancel' | 'restore',
  invoice: InvoiceData,
  sessionUser: SessionUser,
  contestId: string
) {
  try {
    const logRef = collection(db, 'contests', contestId, 'priceCheckLogs');
    const logData = {
      action,
      timestamp: new Date().toISOString(),
      playerName: invoice.playerName || '-',
      clientInfo: {
        userID: sessionUser.userID || null,
        userGroup: sessionUser.userGroup || null,
        userContext: sessionUser.userContext || null,
        userDocId: sessionUser.id || null,
        clickedAt: new Date().toISOString(),
        clientDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Worker',
        clientIp: '-' // 클라이언트단 기본 홀더
      }
    };
    await addDoc(logRef, logData);
    console.log(`Firestore 입금 확인 로그 기록 완료 (${action})`);
  } catch (err) {
    console.error('Firestore 입금 로그 작성 실패:', err);
  }
}

/**
 * ✅ 2. 특정 선수의 기존 채점 명단 초기화 (입금 확인 취소 시 contest_entrys_list에서 선수 제거)
 */
async function clearContestEntries(contestId: string, playerUid: string) {
  try {
    const entryRef = collection(db, 'contest_entrys_list');
    const q = query(
      entryRef,
      where('contestId', '==', contestId),
      where('playerUid', '==', playerUid)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          await deleteDoc(doc(db, 'contest_entrys_list', docSnap.id));
          console.log('채점 엔트리 삭제 완료:', docSnap.id);
        })
      );
    }
  } catch (err) {
    console.error('기존 채점 명단 청소 실패:', err);
    throw err;
  }
}

/**
 * ✅ 3. 메인 서비스 함수: 입금 확인 상태 업데이트 및 D1/Firestore 하이브리드 동기화
 * (전자채점 시스템 연동을 위해 contest_entrys_list 및 감사 로그 처리를 동시 지원합니다)
 */
export async function updateRegistrationPriceCheck(
  invoiceId: string,
  playerUid: string,
  checked: boolean,
  invoice: InvoiceData,
  sessionUser: SessionUser,
  contestId: string
): Promise<{ success: boolean; message: string; d1Saved: boolean }> {
  
  let d1Saved = false;
  
  // [A] Cloudflare D1 백엔드 API 상태 업데이트 호출 (동기화)
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '';
  if (backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/api/contest/registrations/${invoiceId}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPriceCheck: checked })
      });
      if (response.ok) {
        d1Saved = true;
        console.log('D1 입금 확인 상태 동기화 성공');
      } else {
        console.warn('D1 입금 확인 동기화 실패 (HTTP status):', response.status);
      }
    } catch (err) {
      console.error('D1 입금 확인 API 호출 중 에러:', err);
    }
  }

  // [B] Firestore 실시간 업데이트 진행
  try {
    if (checked) {
      // 1) 입금 확정 시 -> contest_entrys_list에 각 신청 종목/체급별로 선수 추가
      if (invoice.joins && invoice.joins.length > 0) {
        await Promise.all(
          invoice.joins.map(async (join) => {
            const entryInfo = {
              contestId: invoice.contestId,
              invoiceId: invoiceId,
              playerUid: invoice.playerUid,
              playerName: invoice.playerName,
              playerBirth: invoice.playerBirth,
              playerGym: invoice.playerGym,
              playerTel: invoice.playerTel,
              playerText: invoice.playerText || '',
              invoiceCreateAt: invoice.invoiceCreateAt,
              createBy: invoice.createBy || 'web',
              contestCategoryTitle: join.contestCategoryTitle,
              contestCategoryId: join.contestCategoryId,
              contestGradeTitle: join.contestGradeTitle,
              contestGradeId: join.contestGradeId,
              originalGradeTitle: join.contestGradeTitle,
              originalGradeId: join.contestGradeId,
              isGradeChanged: false,
              clientInfo: {
                userID: sessionUser.userID || null,
                userGroup: sessionUser.userGroup || null,
                userContext: sessionUser.userContext || null,
                userDocId: sessionUser.id || null,
                clickedAt: new Date().toISOString(),
                clientDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server/Worker',
              }
            };
            
            // contest_entrys_list에 새 문서 삽입
            await addDoc(collection(db, 'contest_entrys_list'), entryInfo);
          })
        );
        console.log('contest_entrys_list 채점 엔트리 생성 완료');
      }
      
      // 2) 로그 기록
      await writePriceCheckLog('add', invoice, sessionUser, contestId);
      
    } else {
      // 3) 입금 취소 시 -> contest_entrys_list에서 해당 선수 엔트리 전부 청소
      await clearContestEntries(contestId, playerUid);
      
      // 4) 로그 기록
      await writePriceCheckLog('del', invoice, sessionUser, contestId);
    }

    // 5) invoices_pool 문서 내 isPriceCheck 필드 최종 갱신
    const invoiceDocRef = doc(db, 'invoices_pool', invoiceId);
    await updateDoc(invoiceDocRef, {
      isPriceCheck: checked
    });
    console.log('invoices_pool 입금 여부(isPriceCheck) 필드 최종 갱신 완료');
    
    return {
      success: true,
      message: checked ? '입금 처리가 성공적으로 확정되었습니다.' : '입금 확인이 취소되었습니다.',
      d1Saved
    };

  } catch (err: any) {
    console.error('Firestore 입금 상태 반영 중 오류:', err);
    throw new Error(`Firestore 입금 동기화 실패: ${err.message}`);
  }
}

/**
 * ✅ 4. 접수 취소(삭제 처리) 및 복원 처리 및 D1/Firestore 하이브리드 동기화
 */
export async function updateRegistrationCancelStatus(
  invoiceId: string,
  playerUid: string,
  canceled: boolean, // true = 취소(삭제), false = 복원
  invoice: InvoiceData,
  sessionUser: SessionUser,
  contestId: string
): Promise<{ success: boolean; message: string; d1Saved: boolean }> {
  
  let d1Saved = false;
  
  // [A] Cloudflare D1 백엔드 API 상태 업데이트 호출 (동기화)
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '';
  if (backendUrl) {
    try {
      // 1) 취소 상태 업데이트
      const cancelResponse = await fetch(`${backendUrl}/api/contest/registrations/${invoiceId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isCanceled: canceled })
      });
      
      // 2) 취소/복원 시 입금 확인도 함께 false(미확정)로 강제 동기화
      const checkResponse = await fetch(`${backendUrl}/api/contest/registrations/${invoiceId}/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPriceCheck: false })
      });

      if (cancelResponse.ok && checkResponse.ok) {
        d1Saved = true;
        console.log(`D1 접수 취소 상태 동기화 성공 (isCanceled: ${canceled})`);
      } else {
        console.warn('D1 취소 상태 동기화 실패 (HTTP status):', cancelResponse.status, checkResponse.status);
      }
    } catch (err) {
      console.error('D1 접수 취소 API 호출 중 에러:', err);
    }
  }

  // [B] Firestore 실시간 업데이트 진행
  try {
    // 1) 취소/복원 모두 엔트리 리스트에서는 선수를 제거(물리 삭제) 처리함
    // (취소된 경우 당연히 대회 참가에서 제외되어야 하고, 복원되더라도 입금 확인은 미확정이므로 참가 명단에서 빠져야 함)
    await clearContestEntries(contestId, playerUid);
    
    // 2) 감사 로그 기록 ('cancel' 또는 'restore')
    const logAction = canceled ? 'cancel' : 'restore';
    await writePriceCheckLog(logAction, invoice, sessionUser, contestId);

    // 3) invoices_pool 문서 내 isCanceled 및 isPriceCheck 필드 최종 갱신
    const invoiceDocRef = doc(db, 'invoices_pool', invoiceId);
    await updateDoc(invoiceDocRef, {
      isCanceled: canceled,
      isPriceCheck: false
    });
    console.log(`invoices_pool 접수취소 상태(isCanceled: ${canceled}, isPriceCheck: false) 최종 갱신 완료`);
    
    return {
      success: true,
      message: canceled ? '참가 신청이 취소(삭제) 처리되었습니다.' : '참가 신청이 복원되었습니다.',
      d1Saved
    };

  } catch (err: any) {
    console.error('Firestore 취소 상태 반영 중 오류:', err);
    throw new Error(`Firestore 취소/복원 동기화 실패: ${err.message}`);
  }
}
