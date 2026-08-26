/**
 * Cloudflare R2 선수 프로필 업로드 서비스
 * @param file 업로드할 이미지 파일 객체
 * @param playerUidOrFolder 업로드할 선수의 고유 식별값 (UID) 또는 저장할 폴더명
 * @param isFolder 폴더 업로드 모드인지 여부 (true인 경우 folder 인자로 전송)
 * @returns R2 버킷 업로드 결과 이미지 URL
 */
export async function uploadToR2(file: File, playerUidOrFolder: string, isFolder: boolean = false): Promise<string> {
  const mediaUrl = import.meta.env.VITE_MEDIA_API_URL || '';
  if (!mediaUrl) {
    throw new Error('미디어 API 서버 환경 변수(VITE_MEDIA_API_URL) 주소가 누락되었습니다.');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const url = isFolder 
      ? `${mediaUrl}/api/upload?folder=${playerUidOrFolder}`
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
