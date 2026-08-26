interface AttemptRecord {
  attempts: number;
  lockUntil: number;
}

// IP별 시도 이력을 보관할 인메모리 맵
const ipAttemptsMap = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15분 (밀리초)

/**
 * 해당 IP가 현재 로그인 차단(락아웃) 상태인지 확인합니다.
 */
export function isLockedOut(ip: string): boolean {
  const record = ipAttemptsMap.get(ip);
  if (!record) return false;

  const now = Date.now();
  if (now < record.lockUntil) {
    return true;
  }

  // 차단 시간이 경과한 경우 기록을 정리합니다.
  if (record.lockUntil > 0 && now >= record.lockUntil) {
    ipAttemptsMap.delete(ip);
  }

  return false;
}

/**
 * 로그인 실패 이력을 기록합니다. 5회 누적 시 15분간 차단됩니다.
 */
export function recordFailure(ip: string): void {
  const record = ipAttemptsMap.get(ip) || { attempts: 0, lockUntil: 0 };
  
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = Date.now() + LOCKOUT_DURATION;
  }

  ipAttemptsMap.set(ip, record);
}

/**
 * 로그인 성공 시 해당 IP의 로그인 시도 카운트를 모두 초기화합니다.
 */
export function recordSuccess(ip: string): void {
  ipAttemptsMap.delete(ip);
}

/**
 * 남은 차단 시간을 초 단위로 반환합니다.
 */
export function getRemainingLockSeconds(ip: string): number {
  const record = ipAttemptsMap.get(ip);
  if (!record || record.lockUntil === 0) return 0;

  const diff = record.lockUntil - Date.now();
  return diff > 0 ? Math.ceil(diff / 1000) : 0;
}
