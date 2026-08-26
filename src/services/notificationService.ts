const API_BASE_URL = `${import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:4300'}/api`;

async function handleResponseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 에러가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}

export interface NotificationSubscription {
  id: number;
  email: string;
  competitionId: string;
  userId: string | null;
  isSent: number;
  sentAt: string | null;
  sendCount: number;
  sendStatus: 'pending' | 'processing' | 'sent' | 'failed';
  createdAt: string;
}

export const notificationService = {
  // 1. 알림 구독 신청
  async subscribe(email: string, competitionId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE_URL}/notifications/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, competitionId }),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    const data = await res.json();
    return !!data.success;
  },

  // 2. 전체 알림 구독 목록 조회
  async getSubscriptions(): Promise<NotificationSubscription[]> {
    const res = await fetch(`${API_BASE_URL}/notifications/subscriptions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },

  // 3. 알림 재발송 요청
  async resendNotification(params: { id?: number; email?: string; competitionId?: string }): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/notifications/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw await handleResponseError(res);
    }

    return await res.json();
  },
};
