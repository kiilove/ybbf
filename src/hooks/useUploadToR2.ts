import { useState } from 'react';
import { uploadToR2 } from '../services/uploadToR2Service';

export function useUploadToR2() {
  const [isUploadingToR2, setIsUploadingToR2] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  /**
   * 선수 사진 파일을 R2 스토리지에 업로드합니다.
   * @param file 업로드할 이미지 파일 객체
   * @param playerUidOrFolder 업로드할 선수의 고유 식별값 (UID) 또는 저장할 폴더명
   * @param isFolder 폴더 업로드 모드인지 여부 (true인 경우 folder 인자로 전송)
   * @returns R2 버킷 업로드 결과 이미지 URL
   */
  const uploadPlayerPhotoToR2 = async (file: File, playerUidOrFolder: string, isFolder: boolean = false): Promise<string> => {
    setIsUploadingToR2(true);
    setUploadError(null);
    try {
      const uploadedUrl = await uploadToR2(file, playerUidOrFolder, isFolder);
      setUploadedPhotoUrl(uploadedUrl);
      return uploadedUrl;
    } catch (err: any) {
      const errMsg = err.message || 'R2 업로드에 실패했습니다.';
      setUploadError(errMsg);
      throw err;
    } finally {
      setIsUploadingToR2(false);
    }
  };

  /**
   * 업로드 상태값들을 초기화합니다.
   */
  const resetUploadState = () => {
    setIsUploadingToR2(false);
    setUploadError(null);
    setUploadedPhotoUrl(null);
  };

  return {
    uploadPlayerPhotoToR2,
    isUploadingToR2,
    uploadError,
    uploadedPhotoUrl,
    resetUploadState,
  };
}
