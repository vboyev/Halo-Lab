/* Aurora backdrop at the top of /projects.
 *
 * Vanilla-WebGL port of the React Bits <Aurora /> component: a simplex-noise
 * ridge coloured by a three-stop ramp, blended over the page. The original
 * draws it through `ogl` and React, which here amounts to one full-screen
 * triangle and one program, so the page keeps its no-bundler, no-dependency
 * setup, as the Growth site's js/dark-veil.js does.
 *
 * Each [data-aurora] host gets its own canvas. It draws only while on screen
 * and the tab is visible, and under reduced motion it draws one frame and
 * stops. When WebGL is unavailable the host stays empty and the section keeps
 * its flat background.
 */

(() => {
  const hosts = Array.from(document.querySelectorAll('[data-aurora]'));
  if (!hosts.length) return;

  const SETTINGS = {
    // The middle stop was #75c7ff: the shader darkens towards black, not into
    // the page, and that light blue darkened into a steel grey at the edges.
    // #4f8dff stays blue as it fades (Andrew, 2026-10-09).
    colorStops: ['#0900b5', '#4f8dff', '#7c3aed'],
    blend: 0.82,
    amplitude: 1.0,
    speed: 0.5
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const VERTEX = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`;

  // The upstream fragment shader, written for GLSL ES 1.00 so that it runs on
  // a WebGL 1 context too; the light-mode branch is dropped, the page is dark.
  const FRAGMENT = `
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#endif
uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}

float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod(i,289.0);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

vec3 ramp(float t){
  if(t<0.5)return mix(uColorStops[0],uColorStops[1],t*2.0);
  return mix(uColorStops[1],uColorStops[2],(t-0.5)*2.0);
}

void main(){
  vec2 uv=gl_FragCoord.xy/uResolution;
  vec3 rampColor=ramp(uv.x);
  float height=snoise(vec2(uv.x*2.0+uTime*0.1,uTime*0.25))*0.5*uAmplitude;
  height=exp(height);
  height=(uv.y*2.0-height+0.2);
  float intensity=0.6*height;
  float midPoint=0.20;
  float auroraAlpha=smoothstep(midPoint-uBlend*0.5,midPoint+uBlend*0.5,intensity);
  vec3 auroraColor=intensity*rampColor;
  gl_FragColor=vec4(auroraColor*auroraAlpha,auroraAlpha);
}
`;

  const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  /* One aurora bound to one host. Returns null when the context or the program
     cannot be built, which leaves the section's flat background in place. */
  const createAurora = (host, options) => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');

    const attrs = { alpha: true, premultipliedAlpha: true, antialias: true, depth: false, stencil: false };
    const gl = canvas.getContext('webgl2', attrs) || canvas.getContext('webgl', attrs);
    if (!gl) return null;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }

    const uniform = (name) => gl.getUniformLocation(program, name);
    const uniforms = {
      resolution: uniform('uResolution'),
      time: uniform('uTime'),
      amplitude: uniform('uAmplitude'),
      blend: uniform('uBlend'),
      colorStops: uniform('uColorStops')
    };

    // One oversized triangle rather than a quad: it covers the canvas in a
    // single primitive with no seam down the diagonal.
    const positionLocation = gl.getAttribLocation(program, 'position');
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    // The picture is a soft gradient, so a capped buffer looks the same as a
    // full-resolution one and costs a fraction of the fill rate.
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const MAX_PIXELS = 1200000;

    const measure = () => {
      const rect = host.getBoundingClientRect();
      let width = Math.max(1, Math.floor(rect.width * pixelRatio));
      let height = Math.max(1, Math.floor(rect.height * pixelRatio));
      const pixels = width * height;
      if (pixels > MAX_PIXELS) {
        const trim = Math.sqrt(MAX_PIXELS / pixels);
        width = Math.max(1, Math.floor(width * trim));
        height = Math.max(1, Math.floor(height * trim));
      }
      canvas.width = width;
      canvas.height = height;
    };

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform1f(uniforms.amplitude, options.amplitude);
    gl.uniform1f(uniforms.blend, options.blend);
    gl.uniform3fv(uniforms.colorStops, new Float32Array(options.colorStops.flatMap(hexToRgb)));

    const draw = (time) => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      // Matches the upstream clock: t * 0.01 * speed * 0.1 with t in ms.
      gl.uniform1f(uniforms.time, time * 0.001 * options.speed);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    measure();
    host.appendChild(canvas);
    return { canvas, measure, draw };
  };

  hosts.forEach((host) => {
    const aurora = createAurora(host, SETTINGS);
    if (!aurora) return;

    let frame = 0;
    let visible = false;
    const still = () => reduceMotion.matches;

    const loop = (time) => {
      frame = 0;
      aurora.draw(time);
      // The host is transparent until the first frame is on the canvas, then
      // fades in (CSS .ai-hero__aurora).
      host.classList.add('is-ready');
      if (visible && !document.hidden && !still()) frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }).observe(host);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (visible) start();
    });
    reduceMotion.addEventListener('change', () => { if (visible) start(); });

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        aurora.measure();
        if (visible) start();
      }, 150);
    });
  });
})();
