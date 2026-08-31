import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

/* ────────────────────────────────────────────────
   WebGLHero — 챔피언 선수 이미지 + 다크 시네마틱 무대 후광 통합 렌더링
   
   • 선수의 브론즈 스킨톤과 근육 데피니션을 100% 자연스럽게 보존
   • 선수 뒤쪽과 외곽 스모크에만 YBBF 네온 라임 / 에메랄드 웨이브 후광 집중
   • 선수 전환 및 포즈(StagePhoto 1/2) 변경 시 즉시 100% 텍스처 교체 동기화
   ──────────────────────────────────────────────── */

const DEFAULT_BASE_IMAGE = 'https://ybbf-media-worker.jbkim.workers.dev/api/photos/contest_player_fbbfb18c-875d-4eaf-8145-5d74903ee440/1787973711190_Athlete_striking_side_chest_pose_202608291221.jpeg';

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform sampler2D uBase;
  uniform float uTime;
  uniform vec2 uRes;
  uniform float uAspect;
  uniform float uBaseAspect;

  varying vec2 vUv;

  /* ── Noise ── */
  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  /* Cover UV: 비율 유지 중앙 배치 */
  vec2 coverUv(vec2 uv, float screenAsp, float imgAsp) {
    vec2 st = uv - 0.5;
    if (screenAsp > imgAsp) {
      st.y *= imgAsp / screenAsp;
    } else {
      st.x *= screenAsp / imgAsp;
    }
    return st + 0.5;
  }

  void main() {
    float t = uTime * 0.5;
    vec2 uv = vUv;
    vec2 centeredUv = (uv - 0.5) * vec2(uAspect, 1.0);
    float dist = length(centeredUv);

    /* ── 1. 🌊 실시간 시그니처 에너지 웨이브 & 앰비언트 ── */
    float wave1 = sin(centeredUv.x * 4.0 + t * 1.5 + sin(centeredUv.y * 3.0 + t * 0.7)) * 0.5 + 0.5;
    float wave2 = sin(centeredUv.y * 4.5 - t * 1.2 + cos(centeredUv.x * 3.5 + t * 0.5)) * 0.5 + 0.5;
    float wave3 = sin(dist * 6.0 - t * 1.8) * 0.5 + 0.5;
    float waves = (wave1 * 0.45 + wave2 * 0.35 + wave3 * 0.20);

    // 후광 펄스 (Pulse Aura)
    float pulse = sin(t * 1.2 - dist * 3.0) * 0.5 + 0.5;
    float aura = exp(-dist * 1.8) * (0.5 + pulse * 0.5);

    // 역광 림라이트 (Rim Light)
    float rimAngle = dot(normalize(centeredUv + vec2(0.0, 0.2)), vec2(0.0, 1.0));
    float rimLight = smoothstep(0.1, 0.9, rimAngle) * exp(-dist * 1.4);

    // 컬러 팔레트
    vec3 darkBase = vec3(0.015, 0.015, 0.02);
    vec3 waveColor = vec3(0.08, 0.28, 0.16);   // 은은한 에메랄드 웨이브
    vec3 neonAccent = vec3(0.60, 0.95, 0.12);  // 시그니처 네온 라임
    vec3 auraColor = vec3(0.05, 0.15, 0.25);   // 딥 사이언 앰비언트

    vec3 bg = darkBase;
    bg += waveColor * waves * 0.50;
    bg += auraColor * aura * 0.60;
    bg += neonAccent * rimLight * 0.35;
    bg *= (1.0 - smoothstep(0.45, 1.3, dist));

    /* ── 2. 📸 선수 사진 렌더링 & 가장자리 페이드 ── */
    vec2 imgUv = coverUv(uv, uAspect, uBaseAspect);

    vec3 imgColor = vec3(0.0);
    float edgeMask = 0.0;

    if (imgUv.x >= 0.0 && imgUv.x <= 1.0 && imgUv.y >= 0.0 && imgUv.y <= 1.0) {
      vec4 tex = texture2D(uBase, imgUv);
      imgColor = tex.rgb;

      // 스튜디오 벽면/삼각대 등 외곽 사각형 영역 딥 블랙 페이드아웃
      float fadeBottom = smoothstep(0.0, 0.06, imgUv.y);
      float fadeTop = smoothstep(1.0, 0.94, imgUv.y);
      float fadeLeft = smoothstep(0.05, 0.28, imgUv.x);
      float fadeRight = smoothstep(0.95, 0.72, imgUv.x);
      edgeMask = fadeBottom * fadeTop * fadeLeft * fadeRight;

      imgColor *= edgeMask;
    }

    /* ── 3. ✨ 스마트 블렌딩 (인물 스킨톤 보호 + 배경 웨이브 합성) ── */
    float centerMask = smoothstep(0.12, 0.55, dist);
    vec3 activeWave = bg * mix(0.15, 1.0, centerMask);

    vec3 finalColor = 1.0 - (1.0 - activeWave) * (1.0 - imgColor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface WebGLHeroProps {
  imageUrl?: string;
}

export default function WebGLHero({ imageUrl }: WebGLHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<any>(null);
  const programRef = useRef<Program | null>(null);

  const targetImage = imageUrl || DEFAULT_BASE_IMAGE;

  // 텍스처 업데이트 Effect (선수/포즈 전환 시 즉시 새 텍스처 바인딩)
  useEffect(() => {
    if (!glRef.current || !programRef.current) return;
    const gl = glRef.current;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (programRef.current) {
        const newTexture = new Texture(gl, {
          image: img,
          generateMipmaps: false,
          minFilter: gl.LINEAR,
          magFilter: gl.LINEAR,
          wrapS: gl.CLAMP_TO_EDGE,
          wrapT: gl.CLAMP_TO_EDGE,
        });
        (newTexture as any).needsUpdate = true;
        programRef.current.uniforms.uBase.value = newTexture;
        const baseAspect = img.naturalWidth / img.naturalHeight;
        programRef.current.uniforms.uBaseAspect.value = baseAspect;
      }
    };
    img.onerror = () => {
      if (img.src !== DEFAULT_BASE_IMAGE) {
        img.src = DEFAULT_BASE_IMAGE;
      }
    };
    img.src = targetImage;
  }, [targetImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let renderer: Renderer | null = null;
    let animationId: number;

    try {
      renderer = new Renderer({
        canvas,
        width: container.clientWidth,
        height: container.clientHeight,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
        alpha: false,
      });
      const gl = renderer.gl;
      glRef.current = gl;
      gl.clearColor(0.015, 0.015, 0.02, 1);

      const texture = new Texture(gl, {
        generateMipmaps: false,
        minFilter: gl.LINEAR,
        magFilter: gl.LINEAR,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
      });
      
      let baseAspect = 1;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        texture.image = img;
        (texture as any).needsUpdate = true;
        baseAspect = img.naturalWidth / img.naturalHeight;
        if (programRef.current) {
          programRef.current.uniforms.uBaseAspect.value = baseAspect;
        }
      };
      img.onerror = () => {
        if (img.src !== DEFAULT_BASE_IMAGE) {
          img.src = DEFAULT_BASE_IMAGE;
        }
      };
      img.src = targetImage;

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex,
        fragment,
        uniforms: {
          uBase:       { value: texture },
          uTime:       { value: 0 },
          uRes:        { value: [container.clientWidth, container.clientHeight] },
          uAspect:     { value: container.clientWidth / container.clientHeight },
          uBaseAspect: { value: 1.0 },
        },
      });
      programRef.current = program;

      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        if (!container || !renderer) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h);
        if (programRef.current) {
          programRef.current.uniforms.uRes.value = [w, h];
          programRef.current.uniforms.uAspect.value = w / h;
        }
      };
      window.addEventListener('resize', resize);
      resize();

      let startTime = performance.now();
      const update = (now: number) => {
        animationId = requestAnimationFrame(update);
        if (programRef.current && renderer) {
          programRef.current.uniforms.uTime.value = (now - startTime) * 0.001;
          renderer.render({ scene: mesh });
        }
      };
      animationId = requestAnimationFrame(update);

      return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationId);
      };
    } catch (err) {
      console.warn('[WebGLHero] WebGL initialization fallback to native image:', err);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none bg-[#030306] overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* 🖼️ 모바일 및 WebGL 미지원 기기를 위한 100% 안전 네이티브 이미지 백업 레이어 */}
      <img
        src={targetImage}
        alt="Champion Hero"
        className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none opacity-90 transition-opacity duration-300"
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = DEFAULT_BASE_IMAGE;
        }}
      />

      {/* 🌊 WebGL 오라 셰이더 캔버스 */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block relative z-10"
      />
    </div>
  );
}
