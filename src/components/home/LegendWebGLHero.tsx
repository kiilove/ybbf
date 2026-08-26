import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

/* ────────────────────────────────────────────────
   LegendWebGLHero — 레전드 상세 전용 (누끼 없는 이미지 대응 루마키, 골드 테마)
   ──────────────────────────────────────────────── */

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
  uniform float uThemeTransition; // 0.0: White, 1.0: Dark

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

  /* Cover UV: 이미지를 화면에 맞추되 비율 유지 (cover 방식) */
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
    vec2 uv = vUv;
    float t = uTime;
    vec2 aspUv = vec2(uv.x * uAspect, uv.y);

    /* ── 1. 배경 효과 ── */
    
    // Light Theme
    vec3 lightBgColor = vec3(0.96, 0.96, 0.96);
    
    // Dark Theme (레전드 전용 황금/네온옐로우 톤이 아닌 순수 다크)
    vec3 darkBgColor = vec3(0.02, 0.02, 0.02);
    
    // 스크롤에 따른 테마 혼합
    vec3 baseBgColor = mix(lightBgColor, darkBgColor, uThemeTransition);

    // 배경 합성 (파동 없음)
    vec3 bg = baseBgColor;
    
    // 중심부 dimming
    vec2 centerDim = vec2(0.5, 0.4);
    float dimDist = length((uv - centerDim) * vec2(1.2, 1.0));
    float dimMask = smoothstep(0.15, 0.55, dimDist);
    
    vec3 dimColor = mix(vec3(0.98), vec3(0.0), uThemeTransition);
    bg = mix(dimColor, bg, dimMask);
    
    // 비네팅
    vec2 vigUv = (uv - 0.5) * 2.0;
    float vig = 1.0 - dot(vigUv, vigUv) * mix(0.1, 0.35, uThemeTransition);
    bg *= clamp(vig, 0.0, 1.0);

    /* ── 2. 선수 이미지 (비율 유지, 하단 정렬, 약간 크게) ── */
    
    vec2 imgUv = uv - 0.5;
    float scale = 0.8; // 이미지를 약간 확대
    
    if (uAspect > uBaseAspect) {
      imgUv.x *= uAspect / uBaseAspect;
    } else {
      imgUv.y *= uBaseAspect / uAspect;
    }
    
    imgUv /= scale;
    // 하단 정렬을 위해 y축 위치 약간 조정
    imgUv.y += 0.25;
    imgUv += 0.5;
    
    bool inBounds = imgUv.x > 0.0 && imgUv.x < 1.0 && imgUv.y > 0.0 && imgUv.y < 1.0;
    
    vec3 imgColor = vec3(0.0);
    float imgAlpha = 0.0;
    
    if (inBounds) {
      vec4 tex = texture2D(uBase, imgUv);
      imgColor = tex.rgb;
      
      // 사진에 마스크(Luma Key) 씌우기: 검정 배경을 투명하게 처리
      // 어두운 스튜디오 배경도 날리기 위해 임계값을 상향 (0.05 -> 0.15, 0.15 -> 0.3)
      float luma = dot(imgColor, vec3(0.299, 0.587, 0.114));
      imgAlpha = smoothstep(0.15, 0.3, luma);
      
      // 원본에 알파채널이 있다면 존중
      imgAlpha = min(imgAlpha, tex.a);
      
      // 가장자리 페이드 - 사각형 테두리가 보이지 않도록 상하좌우 모두 페이드 처리
      float fadeBottom = smoothstep(0.0, 0.15, imgUv.y);
      float fadeTop = smoothstep(1.0, 0.85, imgUv.y);
      float fadeLeft = smoothstep(0.0, 0.15, imgUv.x);
      float fadeRight = smoothstep(1.0, 0.85, imgUv.x);
      imgAlpha *= fadeBottom * fadeTop * fadeLeft * fadeRight;
      
      // 흑백 & 고대비 + 은은한 웜톤 틴트
      float gray = dot(imgColor, vec3(0.299, 0.587, 0.114));
      imgColor = vec3(gray);
      imgColor = (imgColor - 0.5) * 1.3 + 0.55;
      imgColor *= vec3(1.05, 1.02, 0.95); // 살짝 웜톤 
    }

    /* ── 3. 최종 합성 ── */
    // 배경 위에 선수 이미지를 알파 블렌딩
    vec3 finalColor = mix(bg, imgColor, imgAlpha);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface LegendWebGLHeroProps {
  imageUrl: string;
}

export default function LegendWebGLHero({ imageUrl }: LegendWebGLHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new Renderer({
      canvas,
      width: container.clientWidth,
      height: container.clientHeight,
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: false,
    });
    const gl = renderer.gl;
    gl.clearColor(0.96, 0.96, 0.96, 1);

    // 텍스처 로딩
    const texture = new Texture(gl, {
      generateMipmaps: true,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
    });
    
    let baseAspect = 1;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      texture.image = img;
      baseAspect = img.naturalWidth / img.naturalHeight;
      program.uniforms.uBaseAspect.value = baseAspect;
    };
    img.src = imageUrl;

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
        uThemeTransition: { value: 0.0 }, // 초깃값 밝은 테마
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uAspect.value = w / h;
      program.uniforms.uRes.value = [w, h];
    };
    window.addEventListener('resize', resize);

    let disposed = false;
    const t0 = performance.now();

    const update = () => {
      if (disposed) return;
      requestAnimationFrame(update);
      program.uniforms.uTime.value = (performance.now() - t0) * 0.001;
      
      // 강제로 다크 테마 유지 (레전드 상세 페이지)
      program.uniforms.uThemeTransition.value = 1.0;

      try {
        renderer.render({ scene: mesh });
      } catch (err) {
        console.error('[WebGLHero] render error:', err);
        disposed = true;
      }
    };
    requestAnimationFrame(update);

    return () => {
      disposed = true;
      window.removeEventListener('resize', resize);
      try { program.remove(); } catch (_) { /* noop */ }
      canvas.width = 0;
      canvas.height = 0;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
