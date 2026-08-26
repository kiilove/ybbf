const API_BASE_URL = `${import.meta.env.VITE_MEDIA_API_URL || 'http://localhost:4400'}/api`;

export interface MediaItem {
  id: string;
  title: string;
  category: 'highlight' | 'interview' | 'training' | 'notice';
  thumbnail: string;
  videoUrl?: string;
  youtubeUrl?: string;
  date: string;
  description: string;
  featured: boolean;
  relatedLegendIds?: string[];
}

async function handleResponseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || 'API 요청 중 에러가 발생했습니다.');
  } catch {
    return new Error(`서버 요청 실패 (상태 코드: ${response.status})`);
  }
}

export const mediaService = {
  // 1. 미디어 목록 조회
  async getMediaList(category?: string, featured?: boolean): Promise<MediaItem[]> {
    const url = new URL(`${API_BASE_URL}/media`);
    if (category) url.searchParams.append('category', category);
    if (featured) url.searchParams.append('featured', 'true');
    
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  },
  
  // 2. 미디어 상세 조회
  async getMediaDetail(id: string): Promise<MediaItem> {
    const res = await fetch(`${API_BASE_URL}/media/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw await handleResponseError(res);
    return await res.json();
  }
};
