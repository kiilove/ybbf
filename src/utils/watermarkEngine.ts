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
  fontSize?: number;
  opacity?: number;
  paddingX?: number;
  paddingY?: number;
  offsetX?: number;
  offsetY?: number;
  maskIntensity?: number;
  maskRadius?: number;
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

export async function loadImageSafe(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallbackImg = new Image();
      fallbackImg.onload = () => resolve(fallbackImg);
      fallbackImg.onerror = () => reject(new Error('이미지 로드에 실패했습니다.'));
      fallbackImg.src = src;
    };
    img.src = src;
  });
}

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

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const scale = Math.max(canvas.width, canvas.height) / 1080;
  const fontSize = Math.round(opt.fontSize * scale);
  const padX = Math.round(opt.paddingX * scale);
  const padY = Math.round(opt.paddingY * scale);
  const offX = Math.round(opt.offsetX * scale);
  const offY = Math.round(opt.offsetY * scale);

  ctx.font = `bold ${fontSize}px "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const textMetrics = ctx.measureText(opt.text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  const badgeWidth = textWidth + padX * 2;
  const badgeHeight = textHeight + padY * 2;

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

  const maskW = badgeWidth * 1.5 * opt.maskRadius;
  const maskH = badgeHeight * 1.8 * opt.maskRadius;
  const maskCenterX = x + badgeWidth / 2;
  const maskCenterY = y + badgeHeight / 2;

  ctx.save();
  ctx.globalAlpha = opt.maskIntensity;

  const grad = ctx.createRadialGradient(
    maskCenterX, maskCenterY, 0,
    maskCenterX, maskCenterY, Math.max(maskW, maskH) / 1.2
  );
  grad.addColorStop(0, 'rgba(5, 5, 5, 0.98)');
  grad.addColorStop(0.4, 'rgba(8, 10, 8, 0.92)');
  grad.addColorStop(0.75, 'rgba(10, 12, 10, 0.65)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(maskCenterX, maskCenterY, maskW / 2, maskH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = opt.opacity;

  const cornerRadius = Math.round(8 * scale);

  switch (opt.preset) {
    case 'neon_badge': {
      ctx.fillStyle = opt.customBadgeColor || 'rgba(12, 16, 12, 0.88)';
      ctx.strokeStyle = '#d2ff00';
      ctx.lineWidth = Math.max(1.5, 2 * scale);

      ctx.beginPath();
      roundRect(ctx, x, y, badgeWidth, badgeHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      ctx.shadowColor = 'rgba(210, 255, 0, 0.6)';
      ctx.shadowBlur = 8 * scale;
      ctx.fillStyle = opt.customTextColor || '#d2ff00';
      ctx.font = `900 ${fontSize}px "Pretendard", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.text, x + padX, y + badgeHeight / 2);
      break;
    }

    case 'glass_pill': {
      ctx.fillStyle = opt.customBadgeColor || 'rgba(255, 255, 255, 0.12)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5 * scale;

      ctx.beginPath();
      roundRect(ctx, x, y, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = opt.customTextColor || '#ffffff';
      ctx.font = `800 ${fontSize}px "Pretendard", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(opt.text, x + padX, y + badgeHeight / 2);
      break;
    }

    case 'official_stamp': {
      // 🌟 Preset C: 공식 협회 2단 스탬프 (워터마크 완전 차단 넉넉한 박스)
      const subFontSize = Math.max(12, Math.round(fontSize * 0.46));
      
      ctx.font = `800 ${subFontSize}px "Montserrat", "Pretendard", sans-serif`;
      const subMetrics = ctx.measureText(opt.subText || '용인시보디빌딩협회');
      
      ctx.font = `900 ${fontSize}px "Montserrat", "Pretendard", sans-serif`;
      const mainMetrics = ctx.measureText(opt.text || 'ybbf.org');

      const maxContentW = Math.max(subMetrics.width, mainMetrics.width);
      const stampWidth = Math.max(Math.round(180 * scale), maxContentW + padX * 2.2);
      const innerGap = Math.round(7 * scale);
      const stampHeight = Math.max(Math.round(72 * scale), subFontSize + fontSize + innerGap + padY * 2);

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

      ctx.fillStyle = opt.customBadgeColor || '#070b08';
      ctx.strokeStyle = '#d2ff00';
      ctx.lineWidth = Math.max(1.8, 2.2 * scale);

      ctx.beginPath();
      roundRect(ctx, stampX, stampY, stampWidth, stampHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();

      // 상단 서브 텍스트 (용인시보디빌딩협회)
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = `800 ${subFontSize}px "Montserrat", "Pretendard", sans-serif`;
      const subY = stampY + padY + subFontSize / 2;
      ctx.fillText(opt.subText || '용인시보디빌딩협회', centerX, subY);

      // 중간 구분선
      const lineY = subY + subFontSize / 2 + innerGap / 2;
      ctx.strokeStyle = 'rgba(210, 255, 0, 0.35)';
      ctx.lineWidth = Math.max(1, 1 * scale);
      ctx.beginPath();
      ctx.moveTo(stampX + padX * 0.7, lineY);
      ctx.lineTo(stampX + stampWidth - padX * 0.7, lineY);
      ctx.stroke();

      // 하단 메인 텍스트 (ybbf.org)
      ctx.fillStyle = opt.customTextColor || '#d2ff00';
      ctx.font = `900 ${fontSize}px "Montserrat", "Pretendard", sans-serif`;
      ctx.shadowColor = 'rgba(210, 255, 0, 0.5)';
      ctx.shadowBlur = 8 * scale;
      const mainY = stampY + stampHeight - padY - fontSize / 2;
      ctx.fillText(opt.text, centerX, mainY);
      break;
    }

    case 'subtle_text':
    default: {
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
