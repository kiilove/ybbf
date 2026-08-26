import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

/* ────────────────────────────────────────────────
   WebGLHero — 선수 이미지 + 배경 효과 통합 렌더링
   
   선수 이미지를 셰이더 안에서 렌더링하여:
   1. 루마키(Luma Key)로 검정 배경을 완벽히 제거
   2. 배경 효과(후광, 펄스, 성운)와 자연스럽게 합성
   3. 선수 사진은 절대 왜곡/변형하지 않음
   ──────────────────────────────────────────────── */

const BASE_IMAGE = '/hero_section.png';

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
    
    // 후광 효과 계산
    vec2 heroCenter = vec2(0.5 * uAspect, 0.55);
    float heroDist = length(aspUv - heroCenter);
    float coreGlow = exp(-heroDist * 1.8) * 0.1;
    float aura = exp(-heroDist * 0.7) * 0.05;

    // ── 얇고 일정한 선형 파동 (Thin Linear Contours) ──
    vec2 waveUv = aspUv;
    float noise = fbm(waveUv * 1.5 + vec2(t * 0.03, t * 0.01)) * 0.5
                + fbm(waveUv * 3.0 - vec2(t * 0.01, t * 0.02)) * 0.25;
    
    float contourFreq = 40.0; 
    float n = aspUv.y * contourFreq + noise * 15.0;
    
    float fr = fract(n);
    float lineDist = min(fr, 1.0 - fr);
    float contourLine = smoothstep(0.03, 0.0, lineDist);
    
    float sweep = sin(aspUv.x * 2.0 - t * 1.5) * 0.5 + 0.5;
    float sweepGlow = smoothstep(0.7, 1.0, sweep);
    
    // ── 테마별 컬러 세팅 (Light vs Dark) ──
    
    // Light Theme
    vec3 lightBgColor = vec3(0.96, 0.96, 0.96);
    vec3 lightLineCol = mix(vec3(0.85, 0.85, 0.85), vec3(0.7, 0.9, 0.0), sweepGlow * 0.8);
    vec3 lightGlow = vec3(0.9, 1.0, 0.5) * coreGlow + vec3(0.9) * aura;
    
    // Dark Theme
    vec3 darkBgColor = vec3(0.04, 0.04, 0.04);
    vec3 darkLineCol = mix(vec3(0.12, 0.12, 0.12), vec3(0.8, 1.0, 0.0), sweepGlow * 0.9);
    vec3 darkGlow = vec3(0.8, 1.0, 0.0) * coreGlow + vec3(0.6, 0.8, 0.0) * aura;
    
    // 스크롤에 따른 테마 혼합
    vec3 baseBgColor = mix(lightBgColor, darkBgColor, uThemeTransition);
    vec3 finalLineCol = mix(lightLineCol, darkLineCol, uThemeTransition);
    vec3 glowColor = mix(lightGlow, darkGlow, uThemeTransition);

    // 배경 합성
    vec3 bg = baseBgColor + glowColor;
    bg = mix(bg, finalLineCol, contourLine);
    
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

    /* ── 2. 선수 이미지 (절대 왜곡 없음) ── */
    
    // contain 방식: 이미지 전체가 보이되 비율 유지
    vec2 imgUv = uv - 0.5;
    float scaleRatio;
    if (uAspect > uBaseAspect) {
      // 화면이 더 넓음 → 높이 기준
      scaleRatio = 1.0;
      imgUv.x *= uAspect / uBaseAspect;
    } else {
      // 화면이 더 높음 → 너비 기준
      scaleRatio = 1.0;
      imgUv.y *= uBaseAspect / uAspect;
    }
    // 이미지를 위쪽으로 올림 (하단에 텍스트 공간 확보)
    imgUv.y += 0.12;
    imgUv += 0.5;
    
    // 이미지 범위 체크
    bool inBounds = imgUv.x > 0.0 && imgUv.x < 1.0 && imgUv.y > 0.0 && imgUv.y < 1.0;
    
    vec3 imgColor = vec3(0.0);
    float imgAlpha = 0.0;
    
    if (inBounds) {
      vec4 tex = texture2D(uBase, imgUv);
      imgColor = tex.rgb;
      
      // 사용자님이 제공해주신 투명 배경 PNG의 고유 알파 채널을 그대로 사용!
      // 지저분한 루마키(Luma Key)가 전혀 필요 없습니다.
      imgAlpha = tex.a;
      
      // 가장자리 페이드 - 흰 배경에서는 페이드 없이 하단만 부드럽게 페이드
      float bottomFade = smoothstep(0.0, 0.2, imgUv.y);
      imgAlpha *= bottomFade;
      
      // Lando Norris 스타일: 흑백 & 고대비 (흰 배경에 맞게 너무 어둡지 않게)
      float gray = dot(imgColor, vec3(0.299, 0.587, 0.114));
      imgColor = vec3(gray);
      imgColor = (imgColor - 0.5) * 1.2 + 0.55;
    }

    /* ── 3. 최종 합성 ── */
    // 배경 위에 선수 이미지를 알파 블렌딩
    vec3 finalColor = mix(bg, imgColor, imgAlpha);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export default function WebGLHero() {
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
    img.src = BASE_IMAGE;

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
      
      // 스크롤에 따른 테마 보간 (스크롤을 내릴수록 1.0에 가까워짐 -> 다크 테마)
      const maxScroll = window.innerHeight * 1.0; 
      const targetTransition = Math.min(Math.max(window.scrollY / maxScroll, 0.0), 1.0);
      program.uniforms.uThemeTransition.value += (targetTransition - program.uniforms.uThemeTransition.value) * 0.1;

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
