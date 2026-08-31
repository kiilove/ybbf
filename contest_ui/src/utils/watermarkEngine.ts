/**
 * YBBF Watermark Masking & Branding Engine (Canvas-based)
 * AI 생성 이미지 또는 선수 사진 우측 하단의 워터마크(Gemini 등)를 자연스럽게 마스킹하고,
 * 그 위에 공식 'ybbf.org' 텍스트/뱃지를 고해상도로 합성합니다.
 */

export type BrandingPreset = 'neon_badge' | 'glass_pill' | 'subtle_text' | 'official_stamp';
export type BrandingPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-bottom';

export interface BrandingOptions {
  text?: string;
  subText?: string;
  preset?: BrandingPreset;
  position?: BrandingPosition;
  fontSize?: number;            // 기본 폰트 크기 (픽셀)
  opacity?: number;             // 0.0 ~ 1.0
  paddingX?: number;
  paddingY?: number;
  offsetX?: number;             // 가장자리로부터의 마진 X
  offsetY?: number;             // 가장자리로부터의 마진 Y
  maskIntensity?: number;       // 워터마크 가림 강도 (0.0 ~ 1.0)
  maskRadius?: number;          // 워터마크 마스킹 반경 배율
  customTextColor?: string;
  customBadgeColor?: string;
}

export const DEFAULT_OPTIONS: Required<BrandingOptions> = {
  text: 'ybbf.org',
  subText: '용인시보디빌딩협회',
  preset: 'neon_badge',
  position: 'bottom-right',
  fontSize: 26,
  opacity: 0.96,
  paddingX: 22,
  paddingY: 12,
  offsetX: 26,
  offsetY: 26,
  maskIntensity: 0.95,
  maskRadius: 1.0,
  customTextColor: '',
  customBadgeColor: '',
};

/**
 * 이미지 URL을 CORS 우회/안전하게 Image 객체로 로드
 */
export async function loadImageSafe(src: string): Promise<HTMLImageElement> {
  // 1. fetch Blob 변환 시도 (Canvas Tainted 문제 원천 차단)
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      return await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Blob 변환 이미지 로드 실패'));
        img.src = objectUrl;
      });
    }
  } catch (e) {
    // Fetch Blob 실패 시 Image.crossOrigin fallback
  }

  // 2. 표준 Image Loader Fallback
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

/**
 * Canvas에서 워터마크 마스킹 및 브랜딩 오버레이 렌더링
 */
export async function processWatermarkBranding(
  imageSource: string | HTMLImageElement,
  options: BrandingOptions = {}
): Promise<{
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  file: File;
}> {
  const opt: Required<BrandingOptions> = { ...DEFAULT_OPTIONS, ...options };
  const img = typeof imageSource === 'string' ? await loadImageSafe(imageSource) : imageSource;

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('2D Canvas Context를 생성할 수 없습니다.');

  // 1. 원본 이미지 원형 그대로 고화질 렌더링
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // 해상도 비율 계산 (기본 1080p 기준 스케일)
  const scale = Math.max(canvas.width, canvas.height) / 1080;
  const fontSize = Math.round(opt.fontSize * scale);
  const padX = Math.round(opt.paddingX * scale);
  const padY = Math.round(opt.paddingY * scale);
  const offX = Math.round(opt.offsetX * scale);
  const offY = Math.round(opt.offsetY * scale);

  // 2. 텍스트 측정
  ctx.font = `bold ${fontSize}px "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const textMetrics = ctx.measureText(opt.text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  const badgeWidth = Math.max(Math.round(150 * scale), textWidth + padX * 2);
  const badgeHeight = Math.max(Math.round(48 * scale), textHeight + padY * 2);

  // 3. 위치 계산
  let x = 0;
  let y = 0;

  switch (opt.position) {
    case 'bottom-right':
      x = canvas.width - badgeWidth - offX;
      y = canvas.height - badgeHeight - offY;
      break;
    case 'bottom-left':
      x = offX;
      y = canvas.height - badgeHeight - offY;
      break;
    case 'top-right':
      x = canvas.width - badgeWidth - offX;
      y = offY;
      break;
    case 'top-left':
      x = offX;
      y = offY;
      break;
    case 'center-bottom':
      x = (canvas.width - badgeWidth) / 2;
      y = canvas.height - badgeHeight - offY;
      break;
  }

  // 4. [1단계: ybbf.org 프리미엄 브랜딩 오버레이 렌더링]
  ctx.save();
  ctx.globalAlpha = opt.opacity;

  const cornerRadius = Math.round(9 * scale);

  switch (opt.preset) {
    case 'neon_badge': {
      // 🌟 Preset A: YBBF 시그니처 네온 사이버 뱃지 (깔끔한 솔리드 다크 배경)
      ctx.fillStyle = opt.customBadgeColor || '#090e0a';
      ctx.strokeStyle = '#d2ff00';
      ctx.lineWidth = Math.max(1.8, 2.2 * scale);

      ctx.beginPath();
      roundRect(ctx, x, y, badgeWidth, badgeHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      // 네온 글로우 텍스트
      ctx.shadowColor = 'rgba(210, 255, 0, 0.6)';
      ctx.shadowBlur = 8 * scale;
      ctx.fillStyle = opt.customTextColor || '#d2ff00';
      ctx.font = `900 ${fontSize}px "Montserrat", "Pretendard", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.text, x + badgeWidth / 2, y + badgeHeight / 2);
      break;
    }

    case 'glass_pill': {
      // 🌟 Preset B: 글래스모피즘 미니멀 캡슐
      ctx.fillStyle = opt.customBadgeColor || 'rgba(10, 15, 10, 0.94)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5 * scale;

      ctx.beginPath();
      roundRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = opt.customTextColor || '#ffffff';
      ctx.font = `800 ${fontSize}px "Pretendard", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.text, x + badgeWidth / 2, y + badgeHeight / 2);
      break;
    }

    case 'official_stamp': {
      // 🌟 Preset C: 공식 협회 2단 스탬프 (워터마크 완전 차단 넉넉한 박스)
      const subFontSize = Math.max(12, Math.round(fontSize * 0.46));
      
      // 서브 텍스트 & 메인 텍스트 각각 측정
      ctx.font = `800 ${subFontSize}px "Montserrat", "Pretendard", sans-serif`;
      const subMetrics = ctx.measureText(opt.subText || '용인시보디빌딩협회');
      
      ctx.font = `900 ${fontSize}px "Montserrat", "Pretendard", sans-serif`;
      const mainMetrics = ctx.measureText(opt.text || 'ybbf.org');

      const maxContentW = Math.max(subMetrics.width, mainMetrics.width);
      const stampWidth = Math.max(Math.round(180 * scale), maxContentW + padX * 2.2);
      const innerGap = Math.round(7 * scale);
      const stampHeight = Math.max(Math.round(72 * scale), subFontSize + fontSize + innerGap + padY * 2);

      // 위치 재계산 (우측 하단 기준 정렬)
      let stampX = x;
      let stampY = y;
      if (opt.position === 'bottom-right') {
        stampX = canvas.width - stampWidth - offX;
        stampY = canvas.height - stampHeight - offY;
      } else if (opt.position === 'bottom-left') {
        stampX = offX;
        stampY = canvas.height - stampHeight - offY;
      } else if (opt.position === 'top-right') {
        stampX = canvas.width - stampWidth - offX;
        stampY = offY;
      }

      const centerX = stampX + stampWidth / 2;

      // 1. 뱃지 배경 (다크 솔리드)
      ctx.fillStyle = opt.customBadgeColor || '#070b08';
      ctx.strokeStyle = '#d2ff00';
      ctx.lineWidth = Math.max(1.8, 2.2 * scale);

      ctx.beginPath();
      roundRect(ctx, stampX, stampY, stampWidth, stampHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      // 2. 상단 서브 텍스트 (용인시보디빌딩협회)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `800 ${subFontSize}px "Montserrat", "Pretendard", sans-serif`;
      const subY = stampY + padY + subFontSize / 2;
      ctx.fillText(opt.subText || '용인시보디빌딩협회', centerX, subY);

      // 3. 중간 구분선
      const lineY = subY + subFontSize / 2 + innerGap / 2;
      ctx.strokeStyle = 'rgba(210, 255, 0, 0.35)';
      ctx.lineWidth = Math.max(1, 1 * scale);
      ctx.beginPath();
      ctx.moveTo(stampX + padX * 0.7, lineY);
      ctx.lineTo(stampX + stampWidth - padX * 0.7, lineY);
      ctx.stroke();

      // 4. 하단 메인 텍스트 (ybbf.org)
      ctx.fillStyle = opt.customTextColor || '#d2ff00';
      ctx.font = `900 ${fontSize}px "Montserrat", "Pretendard", sans-serif`;
      ctx.shadowColor = 'rgba(210, 255, 0, 0.4)';
      ctx.shadowBlur = 6 * scale;
      const mainY = stampY + stampHeight - padY - fontSize / 2;
      ctx.fillText(opt.text, centerX, mainY);
      break;
    }

    case 'subtle_text':
    default: {
      // 🌟 Preset D: 심플 클린 텍스트 워터마크
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 6 * scale;
      ctx.fillStyle = opt.customTextColor || '#f8fafc';
      ctx.font = `800 ${fontSize}px "Pretendard", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.text, x + padX, y + badgeHeight / 2);
      break;
    }
  }

  ctx.restore();

  // 6. 결과 파일 Blob 및 File 생성
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.95));
  const fileName = `branded_${Date.now()}_ybbf.jpg`;
  const file = new File([blob], fileName, { type: 'image/jpeg' });

  return {
    canvas,
    dataUrl,
    blob,
    file,
  };
}

/**
 * Canvas 둥근 사각형 헬퍼
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
