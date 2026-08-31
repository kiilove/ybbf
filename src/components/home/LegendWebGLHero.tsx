import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';

/* ────────────────────────────────────────────────
   LegendWebGLHero — 레전드 상세 전용 (골드 시네마틱 무대 후광 + 선명한 인물 렌더링)
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
    float t = uTime * 0.4;
    vec2 uv = vUv;
    vec2 centeredUv = (uv - 0.5) * vec2(uAspect, 1.0);
    float dist = length(centeredUv);

    /* ── 1. 골드 & 앰버 앰비언트 무대 배경 ── */
    vec3 darkBase = vec3(0.015, 0.015, 0.02);
    
    // 골드 펄스 후광
    float pulse = sin(t * 1.2 - dist * 3.0) * 0.5 + 0.5;
    float aura = exp(-dist * 1.8) * (0.6 + pulse * 0.4);
    
    // 역광 림라이트
    float rimAngle = dot(normalize(centeredUv + vec2(0.0, 0.2)), vec2(0.0, 1.0));
    float rimLight = smoothstep(0.1, 0.9, rimAngle) * exp(-dist * 1.4);

    vec3 goldColor = vec3(0.35, 0.28, 0.08);   // 딥 골드
    vec3 accentColor = vec3(0.95, 0.82, 0.25); // 브라이트 골드
    vec3 cyanColor = vec3(0.06, 0.15, 0.22);

    vec3 bg = darkBase;
    bg += goldColor * aura * 0.8;
    bg += accentColor * rimLight * 0.35;
    bg += cyanColor * (1.0 - smoothstep(0.0, 1.2, dist)) * 0.3;
    bg *= (1.0 - smoothstep(0.45, 1.3, dist));

    /* ── 2. 선수 이미지 ── */
    vec2 imgUv = coverUv(uv, uAspect, uBaseAspect);
    vec3 imgColor = vec3(0.0);

    if (imgUv.x >= 0.0 && imgUv.x <= 1.0 && imgUv.y >= 0.0 && imgUv.y <= 1.0) {
      vec4 tex = texture2D(uBase, imgUv);
      imgColor = tex.rgb;

      float fadeBottom = smoothstep(0.0, 0.08, imgUv.y);
      float fadeTop = smoothstep(1.0, 0.92, imgUv.y);
      float fadeLeft = smoothstep(0.05, 0.25, imgUv.x);
      float fadeRight = smoothstep(0.95, 0.75, imgUv.x);
      float edgeMask = fadeBottom * fadeTop * fadeLeft * fadeRight;

      imgColor *= edgeMask;
    }

    /* ── 3. Screen 합성 (스킨톤 보존) ── */
    float centerMask = smoothstep(0.12, 0.55, dist);
    vec3 activeWave = bg * mix(0.15, 1.0, centerMask);

    vec3 finalColor = 1.0 - (1.0 - activeWave) * (1.0 - imgColor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

interface LegendWebGLHeroProps {
  imageUrl?: string;
}

export default function LegendWebGLHero({ imageUrl }: LegendWebGLHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<any>(null);
  const programRef = useRef<Program | null>(null);

  const targetImage = imageUrl || DEFAULT_BASE_IMAGE;

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
      console.warn('[LegendWebGLHero] WebGL initialization fallback to native image:', err);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none bg-[#030306]"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
}
