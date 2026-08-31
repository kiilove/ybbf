import { processWatermarkBranding, DEFAULT_OPTIONS } from '../utils/watermarkEngine';
import type { BrandingOptions } from '../utils/watermarkEngine';
import { uploadToR2, deleteFromR2 } from './uploadToR2Service';
import { contestService } from './contestService';
import type { Registration } from './contestService';

export interface BatchProgressCallback {
  (progress: {
    total: number;
    current: number;
    percent: number;
    currentPlayerName: string;
    stageSlot: 1 | 2;
    status: 'processing' | 'uploading' | 'saving' | 'done' | 'error';
    processedSlots: number;
    error?: string;
  }): void;
}

/**
 * 유효한 HTTP/HTTPS 이미지 URL인지 정밀 검증
 */
export function isValidPhotoUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 12) return false;
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

/**
 * 단일 선수의 무대 1번 & 2번 사진 안전 가공 처리
 * - 재가공 시 기존 R2에 올라가 있던 이전 가공본은 R2에서 즉시 완전 삭제하여 스토리지 용량을 절약합니다.
 */
export async function processSinglePlayerStagePhotos(
  reg: Registration,
  options?: Partial<BrandingOptions>
): Promise<{ updatedRegistration: Registration; processedCount: number; errors: string[] }> {
  const mergedOptions: BrandingOptions = {
    ...DEFAULT_OPTIONS,
    preset: 'official_stamp',
    subText: '용인시보디빌딩협회',
    text: 'ybbf.org',
    ...options
  };

  const rawSlot1 = reg.stagePhoto1 || reg.selectedPhotoUrls?.[0];
  const rawSlot2 = reg.stagePhoto2 || reg.selectedPhotoUrls?.[1];

  const slot1 = (rawSlot1 && isValidPhotoUrl(rawSlot1)) ? rawSlot1.trim() : null;
  const slot2 = (rawSlot2 && isValidPhotoUrl(rawSlot2)) ? rawSlot2.trim() : null;

  let newPub1 = reg.publicStagePhoto1 || '';
  let newPub2 = reg.publicStagePhoto2 || '';
  const currentPublicList: string[] = [...(reg.publicPhotoUrls || [])];

  const playerIdentifier = reg.playerUid || reg.playerTel || reg.id;
  let processedCount = 0;
  const errors: string[] = [];

  // [1] 무대 1번 사진 가공
  if (slot1) {
    try {
      console.log(`🪄 [일괄 브랜딩] ${reg.playerName} 1번 사진 가공 시작:`, slot1);
      
      // 🗑️ 기존 R2에 올라가 있던 이전 1번 가공본이 있다면 R2에서 삭제
      if (reg.publicStagePhoto1 && reg.publicStagePhoto1 !== slot1) {
        await deleteFromR2(reg.publicStagePhoto1);
      }

      const res1 = await processWatermarkBranding(slot1, mergedOptions);
      const url1 = await uploadToR2(res1.file, `contest_player_${playerIdentifier}_public_s1`, true);
      if (url1) {
        newPub1 = url1;
        if (!currentPublicList.includes(url1)) currentPublicList.push(url1);
        processedCount++;
      } else {
        errors.push(`1번 사진 R2 업로드 실패`);
      }
    } catch (e: any) {
      console.error(`선수 ${reg.playerName} 1번 사진 가공 에러:`, e);
      errors.push(`1번 사진 처리 에러: ${e.message || '알 수 없음'}`);
    }
  }

  // [2] 무대 2번 사진 가공 (1번과 중복되지 않고 유효한 경우)
  if (slot2 && slot2 !== slot1) {
    try {
      console.log(`🪄 [일괄 브랜딩] ${reg.playerName} 2번 사진 가공 시작:`, slot2);

      // 🗑️ 기존 R2에 올라가 있던 이전 2번 가공본이 있다면 R2에서 삭제
      if (reg.publicStagePhoto2 && reg.publicStagePhoto2 !== slot2) {
        await deleteFromR2(reg.publicStagePhoto2);
      }

      const res2 = await processWatermarkBranding(slot2, mergedOptions);
      const url2 = await uploadToR2(res2.file, `contest_player_${playerIdentifier}_public_s2`, true);
      if (url2) {
        newPub2 = url2;
        if (!currentPublicList.includes(url2)) currentPublicList.push(url2);
        processedCount++;
      } else {
        errors.push(`2번 사진 R2 업로드 실패`);
      }
    } catch (e: any) {
      console.error(`선수 ${reg.playerName} 2번 사진 가공 에러:`, e);
      errors.push(`2번 사진 처리 에러: ${e.message || '알 수 없음'}`);
    }
  }

  const targetDocId = (reg.id || reg.playerUid || (reg as any).docId || (reg as any).invoiceId || '').trim();

  const updatedReg: Registration = {
    ...reg,
    id: targetDocId || reg.id,
    playerUid: reg.playerUid || targetDocId,
    publicStagePhoto1: newPub1,
    publicStagePhoto2: newPub2,
    publicPhotoUrls: currentPublicList,
  };

  // 가공된 사진이 최소 1개 이상 있을 때만 DB 업데이트
  if (processedCount > 0 && targetDocId) {
    await contestService.saveRegistration(updatedReg);
  }

  return { updatedRegistration: updatedReg, processedCount, errors };
}

/**
 * 9회 대회(또는 지정 대회) 선수들의 무대 사진 일괄 자동 브랜딩
 * - 사진이 없는 선수는 안전하게 카운트하여 제외 보고합니다.
 */
export async function batchProcessAllStagePhotos(
  registrations: Registration[],
  targetContestId?: string,
  options?: Partial<BrandingOptions>,
  onProgress?: BatchProgressCallback
): Promise<{
  totalContestPlayers: number;
  validPhotoPlayersCount: number;
  skippedNoPhotoCount: number;
  successPlayerCount: number;
  failPlayerCount: number;
  totalPhotosProcessed: number;
  updatedRegistrations: Registration[];
}> {
  const mergedOptions: BrandingOptions = {
    ...DEFAULT_OPTIONS,
    preset: 'official_stamp',
    subText: '용인시보디빌딩협회',
    text: 'ybbf.org',
    ...options
  };

  // 1. 특정 대회가 지정된 경우 해당 대회 선수만 필터링
  let contestPlayers = registrations;
  if (targetContestId && targetContestId !== 'all' && targetContestId.trim() !== '') {
    contestPlayers = registrations.filter(r => r.contestId === targetContestId);
  }

  const totalContestPlayers = contestPlayers.length;

  // 2. 무대 1번 또는 2번에 유효한 사진이 있는 선수만 선별 (사진 없는 선수 자동 분리)
  const validPhotoPlayers: Registration[] = [];
  let skippedNoPhotoCount = 0;

  for (const player of contestPlayers) {
    const hasSlot1 = isValidPhotoUrl(player.stagePhoto1 || player.selectedPhotoUrls?.[0]);
    const hasSlot2 = isValidPhotoUrl(player.stagePhoto2 || player.selectedPhotoUrls?.[1]);

    if (hasSlot1 || hasSlot2) {
      validPhotoPlayers.push(player);
    } else {
      skippedNoPhotoCount++;
    }
  }

  const totalValid = validPhotoPlayers.length;
  let successPlayerCount = 0;
  let failPlayerCount = 0;
  let totalPhotosProcessed = 0;
  const updatedRegistrations: Registration[] = [];

  // 🚀 [초고속 병렬 처리 풀 - Concurrency Pool (동시 4명씩 병렬 가공)]
  const CONCURRENCY = 4;
  let completedCount = 0;

  for (let i = 0; i < totalValid; i += CONCURRENCY) {
    const chunk = validPhotoPlayers.slice(i, i + CONCURRENCY);

    // 동시 4명 병렬 실행
    const chunkResults = await Promise.all(
      chunk.map(async (player) => {
        try {
          const result = await processSinglePlayerStagePhotos(player, mergedOptions);
          return { player, result, success: result.processedCount > 0, error: null };
        } catch (err: any) {
          console.error(`선수 ${player.playerName} 일괄 처리 중 에러:`, err);
          return { player, result: null, success: false, error: err.message };
        }
      })
    );

    // 청크 결과 안전 집계 & 실시간 프로그레스 통지
    for (const res of chunkResults) {
      completedCount++;
      const percent = Math.round((completedCount / totalValid) * 100);

      if (res.success && res.result) {
        updatedRegistrations.push(res.result.updatedRegistration);
        successPlayerCount++;
        totalPhotosProcessed += res.result.processedCount;
      } else {
        failPlayerCount++;
        updatedRegistrations.push(res.player);
      }

      if (onProgress) {
        onProgress({
          total: totalValid,
          current: completedCount,
          percent,
          currentPlayerName: `${res.player.playerName} (병렬 처리 중)`,
          stageSlot: 1,
          status: 'processing',
          processedSlots: totalPhotosProcessed
        });
      }
    }
  }

  if (onProgress) {
    onProgress({
      total: totalValid,
      current: totalValid,
      percent: 100,
      currentPlayerName: '모든 처리 완료',
      stageSlot: 1,
      status: 'done',
      processedSlots: totalPhotosProcessed
    });
  }

  return {
    totalContestPlayers,
    validPhotoPlayersCount: totalValid,
    skippedNoPhotoCount,
    successPlayerCount,
    failPlayerCount,
    totalPhotosProcessed,
    updatedRegistrations
  };
}

/**
 * 9회 대회(또는 지정 대회) 선수들의 가공된 공개용 사진만 안전하게 초기화
 * - R2 버킷의 이전 가공 사진 파일들을 실제로 삭제하여 스토리지 찌꺼기를 없앱니다.
 * - 원본 사진(stagePhoto1, stagePhoto2, photos)은 100% 무손실 보존됩니다.
 */
export async function resetAllPublicStagePhotos(
  registrations: Registration[],
  targetContestId?: string
): Promise<number> {
  let contestPlayers = registrations;
  if (targetContestId && targetContestId !== 'all' && targetContestId.trim() !== '') {
    contestPlayers = registrations.filter(r => r.contestId === targetContestId);
  }

  let resetCount = 0;
  for (const player of contestPlayers) {
    const docId = (player.id || player.playerUid || (player as any).docId || '').trim();
    if (!docId) continue;

    // 🗑️ R2 버킷의 공개용 가공 사진 파일들 실제 삭제
    if (player.publicStagePhoto1) {
      await deleteFromR2(player.publicStagePhoto1);
    }
    if (player.publicStagePhoto2) {
      await deleteFromR2(player.publicStagePhoto2);
    }
    if (Array.isArray(player.publicPhotoUrls)) {
      for (const u of player.publicPhotoUrls) {
        await deleteFromR2(u);
      }
    }

    const clearedReg: Registration = {
      ...player,
      id: docId,
      playerUid: player.playerUid || docId,
      publicStagePhoto1: '',
      publicStagePhoto2: '',
      publicPhotoUrls: []
    };

    await contestService.saveRegistration(clearedReg);
    resetCount++;
  }

  return resetCount;
}
