/**
 * Cloudflare R2 선수 사진 및 대회 미디어 업로드 서비스 (contest_ui)
 * @param file 업로드할 이미지 파일 객체
 * @param playerUidOrFolder 업로드할 선수의 식별자 또는 폴더명
 * @param isFolder 폴더 업로드 모드 여부
 * @returns R2 버킷 업로드 결과 이미지 URL
 */
export async function uploadToR2(file: File, playerUidOrFolder: string, isFolder: boolean = false): Promise<string> {
  const mediaUrl = import.meta.env.VITE_MEDIA_API_URL || 'https://ybbf-media-worker.jbkim.workers.dev';

  try {
    const formData = new FormData();
    formData.append('file', file);

    const url = isFolder 
      ? `${mediaUrl}/api/upload?folder=${encodeURIComponent(playerUidOrFolder)}`
      : `${mediaUrl}/api/upload`;

    if (isFolder) {
      formData.append('folder', playerUidOrFolder);
    } else {
      formData.append('playerUid', playerUidOrFolder);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.url) {
        throw new Error('서버에서 반환된 이미지 주소가 비어있습니다.');
      }
      return data.url;
    }

    let errorDetail = '';
    try {
      const errData = await response.json();
      errorDetail = errData.error || errData.message || '';
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`R2 업로드 실패 (${response.status}): ${errorDetail || '서버 오류'}`);
  } catch (err: any) {
    console.error('R2 업로드 통신 실패:', err);
    throw new Error(`R2 업로드에 실패했습니다: ${err.message || '네트워크 오류'}`);
  }
}
