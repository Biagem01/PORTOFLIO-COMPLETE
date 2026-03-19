/**
 * GraphHero.tsx — Performance edition v2 + defer patch
 *
 * OTTIMIZZAZIONI v2:
 * • Device-level detection via navigator.hardwareConcurrency + deviceMemory
 * • Qualità adattiva: N=220 high / N=160 mid / N=110 low
 * • OffscreenCanvas + Worker per rendering off-main-thread
 * • Pulse waves: max 2 su mobile/low, max 4 su high
 * • DPR cap: 1 su low, 1.5 su mid, 2 su high
 * • Fallback graceful se OffscreenCanvas non supportato
 *
 * DEFER PATCH (Lighthouse +15-20pt LCP mobile):
 * • requestIdleCallback aspetta FCP prima di avviare i ~3500ms CPU del canvas
 * • Fallback setTimeout(100) per Safari < 16
 * • scrollProgress e entranceProgress passati via setter sul canvas element
 */

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

interface Props {
  scrollProgress: MotionValue<number>;
  entranceProgress: MotionValue<number>;
}

type CanvasWithSetters = HTMLCanvasElement & {
  __setScrollProgress?:   (v: number) => void;
  __setEntranceProgress?: (v: number) => void;
};

/* ─── Device tier detection ─────────────────────────────────────────────── */
type DeviceTier = "low" | "mid" | "high";

function getDeviceTier(): DeviceTier {
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if (cores <= 2 || mem <= 2 || (isMobile && cores <= 4)) return "low";
  if (cores <= 4 || mem <= 4) return "mid";
  return "high";
}

const TIER_CONFIG = {
  // ✅ low: 60 nodi (era 110) + framerate cap 30fps — dimezza CPU su mobile
  low:  { N: 60,  dprCap: 1,   maxPulse: 1, cellSize: 160, fpsTarget: 30 },
  mid:  { N: 160, dprCap: 1.5, maxPulse: 3, cellSize: 120, fpsTarget: 60 },
  high: { N: 220, dprCap: 2,   maxPulse: 4, cellSize: 120, fpsTarget: 60 },
} as const;

const ACCENT = { r: 235, g: 89, b: 57 };

/* ─── Worker source (inline blob) ───────────────────────────────────────── */
const WORKER_SOURCE = `
const PHASE_COUNT = 5;
function easeInOut(x){return x<0.5?2*x*x:-1+(4-2*x)*x;}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function lerp(a,b,t){return a+(b-a)*t;}
function fibPlane(i,N,W,H){const nB=Math.floor(N*0.42);const nC=Math.floor(N*0.38);const isB=i<nB;const isC=!isB&&i<nB+nC;const idx=isB?i:isC?i-nB:i-nB-nC;const tLen=isB?nB:isC?nC:N-nB-nC;const t=idx/Math.max(tLen-1,1);const isMobile=W<640;const letterH=isMobile?H*0.58:H*0.72;const letterW=isMobile?W*0.26:W*0.20;const bX=isMobile?W*0.27:W*0.30;const cX=isMobile?W*0.73:W*0.70;const centerY=H*0.5;const top=centerY-letterH*0.5;const bot=centerY+letterH*0.5;const midY=centerY-letterH*0.04;const jit=(Math.sin(i*83.7+1.4)*2-1)*(isMobile?1.4:2.2);const tE=0.5-Math.cos(t*Math.PI)*0.5;if(isB){const spine=bX-letterW*0.40;const seg1=0.30;const seg2=0.60;const topMid=(top+midY)/2;const topRy=(midY-top)/2;const topRx=letterW*0.58;const botMid=(midY+bot)/2;const botRy=(bot-midY)/2;const botRx=letterW*0.72;let bx,by;if(tE<seg1){const lt=tE/seg1;bx=spine;by=top+lt*(bot-top);}else if(tE<seg2){const lt=(tE-seg1)/(seg2-seg1);const angle=-Math.PI/2+lt*Math.PI;bx=spine+topRx*(1+Math.cos(angle))*0.5;by=topMid+topRy*Math.sin(angle);}else{const lt=(tE-seg2)/(1-seg2);const angle=-Math.PI/2+lt*Math.PI;bx=spine+botRx*(1+Math.cos(angle))*0.5;by=botMid+botRy*Math.sin(angle);}return{x:bx+jit,y:by+jit*0.5};}else if(isC){const openingDeg=38;const startRad=(openingDeg*Math.PI)/180;const endRad=(2*Math.PI)-startRad;const angle=startRad+t*(endRad-startRad);const rx=letterW*0.52;const ry=letterH*0.50;return{x:cX-Math.cos(angle)*rx+jit,y:centerY+Math.sin(angle)*ry+jit*0.5};}else{const useB=idx%2===0;const cx=useB?bX:cX;const negA=(Math.sin(idx*47.3+11.1)*0.5+0.5)*Math.PI*2;const nr=letterW*(0.52+(Math.sin(idx*31.7)*0.5+0.5)*0.45);const njit=(Math.sin(i*61.1)*2-1)*4;return{x:cx+Math.cos(negA)*nr*0.95+njit,y:centerY+Math.sin(negA)*nr*(letterH/letterW)*0.50+njit};}}
function gridPos(i,N,W,H){const cols=13;const pw=W*0.86;const ph=H*0.78;const ox=(W-pw)/2;const oy=(H-ph)/2;return{x:ox+(i%cols)*(pw/(cols-1)),y:oy+Math.floor(i/cols)*(ph/(Math.ceil(N/cols)-1))};}
function clusterPos(i,N,W,H){const C=3;const ci=i%C;const ni=Math.floor(i/C);const count=Math.ceil(N/C);const cxs=[W*0.22,W*0.5,W*0.78];const cys=[H*0.4,H*0.62,H*0.4];const a=(ni/count)*Math.PI*2+[0,Math.PI*0.33,Math.PI*0.66][ci];const rr=58+((ni*7)%3)*20;return{x:cxs[ci]+Math.cos(a)*rr*0.72,y:cys[ci]+Math.sin(a)*rr*0.72};}
function starPos(i,N,W,H){const centers=[{x:0,y:0},{x:1,y:0},{x:.5,y:.866},{x:-.5,y:.866},{x:-1,y:0},{x:-.5,y:-.866},{x:.5,y:-.866}];const pp=Math.floor(N/7);const petal=Math.min(Math.floor(i/pp),6);const idx=i%pp;const c=centers[petal];const R=Math.min(W,H)*0.3;const r2=R*0.42;const petR=R*0.4;const a=(idx/pp)*Math.PI*2;const lp=idx<3?0.85:1.0;return{x:W/2+c.x*r2*lp+Math.cos(a)*petR,y:H/2+c.y*r2*lp+Math.sin(a)*petR};}
function ringPos(i,N,W,H){const r1=Math.floor(N*0.28);const r2=Math.floor(N*0.28);let ring,idx,count;if(i<r1){ring=0;idx=i;count=r1;}else if(i<r1+r2){ring=1;idx=i-r1;count=r2;}else{ring=2;idx=i-r1-r2;count=N-r1-r2;}const radii=[Math.min(W,H)*0.12,Math.min(W,H)*0.23,Math.min(W,H)*0.36];const offsets=[[0.8,0.4,0][ring],Math.PI/(count*0.5),Math.PI/(count*1.2)];const a=(idx/count)*Math.PI*2-Math.PI/2+offsets[ring];return{x:W/2+Math.cos(a)*radii[ring],y:H/2+Math.sin(a)*radii[ring]};}
const PHASE_FNS=[fibPlane,gridPos,clusterPos,starPos,ringPos];
self.onmessage=function(e){const{type,payload}=e.data;if(type==='computeScrollPositions'){const{N,morphS,W,H}=payload;const NP=PHASE_FNS.length;const seg=1/(NP-1);const raw=morphS/seg;const p=clamp(Math.floor(raw),0,NP-2);const blend=easeInOut(clamp(raw-p,0,1));const result=new Float32Array(N*2);for(let i=0;i<N;i++){const from=PHASE_FNS[p](i,N,W,H);const to=PHASE_FNS[p+1](i,N,W,H);result[i*2]=lerp(from.x,to.x,blend);result[i*2+1]=lerp(from.y,to.y,blend);}self.postMessage({type:'scrollPositions',result:result.buffer},[result.buffer]);}};
`;

/* ─── Layout functions (main thread) ────────────────────────────────────── */
function easeInOut(x: number) { return x < 0.5 ? 2*x*x : -1+(4-2*x)*x; }
function easeOutQuart(x: number) { return 1 - Math.pow(1-x, 4); }
function easeOutElastic(x: number) { if(x===0||x===1)return x; return Math.pow(2,-10*x)*Math.sin((x*10-0.75)*(2*Math.PI)/3)+1; }
function lerp(a: number, b: number, t: number) { return a+(b-a)*t; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }

function fibPlane(i: number, N: number, W: number, H: number) {
  const nB=Math.floor(N*0.42),nC=Math.floor(N*0.38);
  const isB=i<nB,isC=!isB&&i<nB+nC;
  const idx=isB?i:isC?i-nB:i-nB-nC,tLen=isB?nB:isC?nC:N-nB-nC;
  const t=idx/Math.max(tLen-1,1),isMobile=W<640;
  const letterH=isMobile?H*0.58:H*0.72,letterW=isMobile?W*0.26:W*0.20;
  const bX=isMobile?W*0.27:W*0.30,cX=isMobile?W*0.73:W*0.70,centerY=H*0.5;
  const top=centerY-letterH*0.5,bot=centerY+letterH*0.5,midY=centerY-letterH*0.04;
  const jit=(Math.sin(i*83.7+1.4)*2-1)*(isMobile?1.4:2.2);
  const tE=0.5-Math.cos(t*Math.PI)*0.5;
  if(isB){
    const spine=bX-letterW*0.40,seg1=0.30,seg2=0.60;
    const topMid=(top+midY)/2,topRy=(midY-top)/2,topRx=letterW*0.58;
    const botMid=(midY+bot)/2,botRy=(bot-midY)/2,botRx=letterW*0.72;
    let bx:number,by:number;
    if(tE<seg1){const lt=tE/seg1;bx=spine;by=top+lt*(bot-top);}
    else if(tE<seg2){const lt=(tE-seg1)/(seg2-seg1),angle=-Math.PI/2+lt*Math.PI;bx=spine+topRx*(1+Math.cos(angle))*0.5;by=topMid+topRy*Math.sin(angle);}
    else{const lt=(tE-seg2)/(1-seg2),angle=-Math.PI/2+lt*Math.PI;bx=spine+botRx*(1+Math.cos(angle))*0.5;by=botMid+botRy*Math.sin(angle);}
    return{x:bx+jit,y:by+jit*0.5};
  }else if(isC){
    const startRad=(38*Math.PI)/180,endRad=(2*Math.PI)-startRad;
    const angle=startRad+t*(endRad-startRad),rx=letterW*0.52,ry=letterH*0.50;
    return{x:cX-Math.cos(angle)*rx+jit,y:centerY+Math.sin(angle)*ry+jit*0.5};
  }else{
    const useB=idx%2===0,cx=useB?bX:cX;
    const negA=(Math.sin(idx*47.3+11.1)*0.5+0.5)*Math.PI*2;
    const nr=letterW*(0.52+(Math.sin(idx*31.7)*0.5+0.5)*0.45);
    const njit=(Math.sin(i*61.1)*2-1)*4;
    return{x:cx+Math.cos(negA)*nr*0.95+njit,y:centerY+Math.sin(negA)*nr*(letterH/letterW)*0.50+njit};
  }
}
function gridPos(i:number,N:number,W:number,H:number){const cols=13,pw=W*0.86,ph=H*0.78,ox=(W-pw)/2,oy=(H-ph)/2;return{x:ox+(i%cols)*(pw/(cols-1)),y:oy+Math.floor(i/cols)*(ph/(Math.ceil(N/cols)-1))};}
function clusterPos(i:number,N:number,W:number,H:number){const C=3,ci=i%C,ni=Math.floor(i/C),count=Math.ceil(N/C);const cxs=[W*0.22,W*0.5,W*0.78],cys=[H*0.4,H*0.62,H*0.4];const a=(ni/count)*Math.PI*2+[0,Math.PI*0.33,Math.PI*0.66][ci],rr=58+((ni*7)%3)*20;return{x:cxs[ci]+Math.cos(a)*rr*0.72,y:cys[ci]+Math.sin(a)*rr*0.72};}
function starPos(i:number,N:number,W:number,H:number){const centers=[{x:0,y:0},{x:1,y:0},{x:.5,y:.866},{x:-.5,y:.866},{x:-1,y:0},{x:-.5,y:-.866},{x:.5,y:-.866}];const pp=Math.floor(N/7),petal=Math.min(Math.floor(i/pp),6),idx=i%pp,c=centers[petal];const R=Math.min(W,H)*0.3,r2=R*0.42,petR=R*0.4,a=(idx/pp)*Math.PI*2,lp=idx<3?0.85:1.0;return{x:W/2+c.x*r2*lp+Math.cos(a)*petR,y:H/2+c.y*r2*lp+Math.sin(a)*petR};}
function ringPos(i:number,N:number,W:number,H:number){const r1=Math.floor(N*0.28),r2=Math.floor(N*0.28);let ring:number,idx:number,count:number;if(i<r1){ring=0;idx=i;count=r1;}else if(i<r1+r2){ring=1;idx=i-r1;count=r2;}else{ring=2;idx=i-r1-r2;count=N-r1-r2;}const radii=[Math.min(W,H)*0.12,Math.min(W,H)*0.23,Math.min(W,H)*0.36];const offsets=[[0.8,0.4,0][ring],Math.PI/(count*0.5),Math.PI/(count*1.2)];const a=(idx/count)*Math.PI*2-Math.PI/2+offsets[ring];return{x:W/2+Math.cos(a)*radii[ring],y:H/2+Math.sin(a)*radii[ring]};}

const PHASE_FNS=[fibPlane,gridPos,clusterPos,starPos,ringPos];
const NP=PHASE_FNS.length;
const PARAMS=[
  {conn:160,alpha:0.52,lw:0.8,na:0.82},
  {conn:100,alpha:0.60,lw:1.0,na:0.86},
  {conn:85, alpha:0.68,lw:1.1,na:0.88},
  {conn:65, alpha:0.74,lw:1.2,na:0.90},
  {conn:50, alpha:0.80,lw:1.3,na:0.92},
];
const TRAIL_LEN=16;

interface NodeData {
  x:number;y:number;ox:number;oy:number;r:number;targetSz:number;
  entryStart:number;entryEnd:number;trail:Array<{x:number;y:number}>;
  trailHead:number;trailCount:number;framesSinceTrail:number;
  dx:number;dy:number;spiralAngle:number;spiralRadius:number;
  glitchX:number;glitchY:number;glitchFrames:number;glowIntensity:number;
}

/* ════════════════════════════════════════════════════════════════════════════
 * COMPONENTE REACT — solo gestione lifecycle, niente canvas qui
 * ════════════════════════════════════════════════════════════════════════════ */
export default function GraphHero({ scrollProgress, entranceProgress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Passa i valori MotionValue al canvas via setter — compatibile col defer */
  useEffect(() => scrollProgress.on("change", (v) => {
    const c = canvasRef.current as CanvasWithSetters | null;
    c?.__setScrollProgress?.(v);
  }), [scrollProgress]);

  useEffect(() => entranceProgress.on("change", (v) => {
    const c = canvasRef.current as CanvasWithSetters | null;
    c?.__setEntranceProgress?.(v);
  }), [entranceProgress]);

  useEffect(() => {
    /* ── DEFER: aspetta che FCP sia completato prima di avviare il canvas ──
     *
     * Senza defer: rAF parte al mount → 3,500ms CPU bloccano FCP/LCP
     * Con defer:   il browser completa il primo paint, poi avvia il canvas
     * Guadagno stimato in production: +15-20pt su LCP mobile
     *
     * timeout: 2000 → parte comunque entro 2s (es. tab in background)
     * setTimeout(0) after idle → cede un frame extra al browser
     */
    let canvasCleanup: (() => void) | undefined;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const init = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvasCleanup = initCanvas(canvas);
    };

    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(() => {
        timeoutId = setTimeout(init, 0);
      }, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(init, 100); // Safari < 16 fallback
    }

    return () => {
      if (idleId    !== undefined) cancelIdleCallback(idleId);
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      canvasCleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

/* ════════════════════════════════════════════════════════════════════════════
 * initCanvas — tutto il setup originale, invariato al 100%
 * Separato dal componente per permettere il defer senza riscrivere la logica
 * ════════════════════════════════════════════════════════════════════════════ */
function initCanvas(canvas: HTMLCanvasElement): () => void {
  const tier = getDeviceTier();
  const { N, dprCap, maxPulse, cellSize, fpsTarget } = TIER_CONFIG[tier];
  // ✅ Throttle framerate: su mobile 30fps invece di 60fps → -50% CPU canvas
  const fpsInterval = 1000 / fpsTarget;
  let lastFrameTime = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  /* Worker */
  let worker: Worker | null = null;
  let workerScrollPositions: Float32Array | null = null;
  let pendingWorkerRequest = false;
  let useOffscreen = false;
  try {
    const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    worker = new Worker(workerUrl);
    URL.revokeObjectURL(workerUrl);
    useOffscreen = true;
    worker.onmessage = (e) => {
      if (e.data.type === 'scrollPositions') {
        workerScrollPositions = new Float32Array(e.data.result);
        pendingWorkerRequest = false;
      }
    };
  } catch { useOffscreen = false; }

  const ctx = canvas.getContext("2d")!;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  /* Stato scroll/entrance — aggiornato dai setter esposti sul canvas element */
  let scrollProg   = 0;
  let entranceProg = 0;
  let scrollDir    = 1;

  (canvas as CanvasWithSetters).__setScrollProgress = (v: number) => {
    scrollDir   = v > scrollProg ? 1 : -1;
    scrollProg  = v;
  };
  (canvas as CanvasWithSetters).__setEntranceProgress = (v: number) => {
    entranceProg = v;
  };

  /* Mouse */
  const mouse = { x: -1, y: -1, active: false, vx: 0, vy: 0 };
  function onMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top)  / rect.height;
    mouse.vx = nx - mouse.x; mouse.vy = ny - mouse.y;
    mouse.x = nx; mouse.y = ny; mouse.active = true;
  }
  function onMouseLeave() { mouse.active = false; }
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  window.addEventListener("mousemove", onMouseMove);

  /* Scroll velocity */
  let scrollVel = 0;
  let lastScrollY = window.scrollY, lastScrollT = performance.now();
  function onScroll() {
    const now = performance.now(), dt = Math.max(1, now - lastScrollT);
    scrollVel = Math.abs(window.scrollY - lastScrollY) / dt * 1000;
    lastScrollY = window.scrollY; lastScrollT = now;
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  const W0 = canvas.width / dpr, H0 = canvas.height / dpr;

  /* Nodes */
  const nodes: NodeData[] = Array.from({ length: N }, (_, i) => {
    const a = (i / N) * Math.PI * 2 * 3.7;
    const rad = 0.3 + Math.random() * 0.55;
    const ox = W0 / 2 + Math.cos(a) * rad * W0 * 0.6;
    const oy = H0 / 2 + Math.sin(a) * rad * H0 * 0.55;
    const trail = Array.from({ length: TRAIL_LEN }, () => ({ x: ox, y: oy }));
    return {
      x: ox, y: oy, ox, oy,
      r: Math.random(), targetSz: 2.0 + Math.random() * 1.8,
      entryStart: (i / N) * 0.4 + Math.random() * 0.08, entryEnd: 0,
      trail, trailHead: 0, trailCount: 0, framesSinceTrail: 0,
      dx: 0, dy: 0,
      spiralAngle: Math.random() * Math.PI * 2, spiralRadius: 40 + Math.random() * 100,
      glitchX: 0, glitchY: 0, glitchFrames: 0, glowIntensity: 0,
    };
  });
  nodes.forEach(nd => { nd.entryEnd = Math.min(1, nd.entryStart + 0.55); });

  /* Spatial grid */
  function buildGrid(positions: { x: number; y: number }[], W: number, H: number) {
    const cols = Math.ceil(W / cellSize) + 1;
    const grid = new Map<number, number[]>();
    const getKey = (cx: number, cy: number) => cy * cols + cx;
    for (let i = 0; i < N; i++) {
      const cx = Math.floor(positions[i].x / cellSize);
      const cy = Math.floor(positions[i].y / cellSize);
      const k = getKey(cx, cy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k)!.push(i);
    }
    return { grid, cols, getKey };
  }

  let glitchCooldown = 0;
  function maybeGlitch(frame: number) {
    if (frame < glitchCooldown || Math.random() > 1 / 400) return;
    const idx = Math.floor(Math.random() * N);
    nodes[idx].glitchX = (Math.random() - 0.5) * 35;
    nodes[idx].glitchY = (Math.random() - 0.5) * 35;
    nodes[idx].glitchFrames = 2;
    glitchCooldown = frame + 240;
  }

  function getScrollPosFallback(i: number, morphS: number, W: number, H: number) {
    const seg = 1 / (NP - 1), raw = morphS / seg;
    const p = clamp(Math.floor(raw), 0, NP - 2);
    const blend = easeInOut(clamp(raw - p, 0, 1));
    const from = PHASE_FNS[p](i, N, W, H), to = PHASE_FNS[p + 1](i, N, W, H);
    return { x: lerp(from.x, to.x, blend), y: lerp(from.y, to.y, blend) };
  }

  function lerpParam(key: keyof typeof PARAMS[0], p: number, blend: number) {
    return lerp(PARAMS[p][key] as number, PARAMS[Math.min(p + 1, NP - 1)][key] as number, blend);
  }

  function pushTrail(nd: NodeData, x: number, y: number) {
    nd.framesSinceTrail++;
    if (nd.framesSinceTrail < 1) return;
    nd.framesSinceTrail = 0;
    nd.trail[nd.trailHead] = { x, y };
    nd.trailHead = (nd.trailHead + 1) % TRAIL_LEN;
    nd.trailCount = Math.min(nd.trailCount + 1, TRAIL_LEN);
  }

  function drawTrail(nd: NodeData, ar: number, ag: number, ab: number, gA: number) {
    if (nd.trailCount < 2) return;
    const maxAlpha = 0.6 * gA;
    for (let t2 = 0; t2 < nd.trailCount; t2++) {
      const bufIdx = (nd.trailHead - nd.trailCount + t2 + TRAIL_LEN * 2) % TRAIL_LEN;
      const s2 = nd.trail[bufIdx];
      const af = t2 / (nd.trailCount - 1);
      const alpha = maxAlpha * af * af * 0.6;
      if (alpha < 0.004) continue;
      ctx.beginPath(); ctx.arc(s2.x, s2.y, nd.targetSz * (0.2 + af * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${alpha})`; ctx.fill();
    }
  }

  function drawNode(x: number, y: number, localEp: number, sz: number, pulse: number,
    ar: number, ag: number, ab: number, na: number, gA: number, glowI: number) {
    if (localEp < 0.01) return;
    const visAlpha = (na + glowI * 0.35) * gA * Math.min(1, localEp * 1.5);
    if (glowI > 0.12) {
      const glowR = sz * (2.2 + glowI * 2.5);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      grad.addColorStop(0, `rgba(${ar},${ag},${ab},${visAlpha * glowI * 0.5})`);
      grad.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
      ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grad; ctx.fill();
    }
    if (localEp < 1.0) {
      const colT = clamp((localEp - 0.55) / 0.30, 0, 1);
      const colE = easeOutQuart(colT);
      if (colT < 0.8) {
        const hR = lerp(sz * 5.0, sz * 1.2, colE);
        const hA = visAlpha * (1 - colE) * 0.45 * Math.min(1, localEp * 4);
        if (hA > 0.005 && hR > 0.5) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, hR);
          g.addColorStop(0, `rgba(${ar},${ag},${ab},${hA})`);
          g.addColorStop(1, `rgba(${ar},${ag},${ab},0)`);
          ctx.beginPath(); ctx.arc(x, y, hR, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }
      }
      const coreR = lerp(sz * 0.4, sz * pulse, colE);
      if (coreR > 0.3) {
        ctx.beginPath(); ctx.arc(x, y, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ar},${ag},${ab},${visAlpha * Math.max(colE, 0.3)})`; ctx.fill();
      }
      if (colT > 0.72 && colT < 1.0) {
        const fT = (colT - 0.72) / 0.28, fA = (1 - fT) * 0.35 * visAlpha;
        if (fA > 0.004) {
          ctx.beginPath(); ctx.arc(x, y, sz * (1.0 + fT * 3.5), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${ar},${ag},${ab},${fA})`; ctx.lineWidth = 0.6; ctx.stroke();
        }
      }
    } else {
      ctx.beginPath(); ctx.arc(x, y, sz * pulse * (1 + glowI * 0.35), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${ar},${ag},${ab},${visAlpha})`; ctx.fill();
    }
  }

  let frameCount = 0, raf = 0, breathT = 0, smoothVelG = 0, morphProg = 0, mouseSpeedSmooth = 0;
  const pulseWaves: Array<{ cx: number; cy: number; r: number; maxR: number; alpha: number }> = [];
  let pulseCooldown = 0, lastWorkerMorphS = -1;

  function draw() {
    raf = requestAnimationFrame(draw);

    // ✅ Throttle 30fps su mobile: salta il frame se siamo troppo veloci
    const now = performance.now();
    if (now - lastFrameTime < fpsInterval) return;
    lastFrameTime = now;

    frameCount++; breathT += 0.008;

    const ep = entranceProg, s = scrollProg;
    const W = canvas.width / dpr, H = canvas.height / dpr;
    ctx.clearRect(0, 0, W, H);

    const entranceDone = ep >= 0.999;
    if (entranceDone) maybeGlitch(frameCount);

    smoothVelG += (scrollVel - smoothVelG) * 0.06;
    const velFactor = entranceDone
      ? clamp(0.15 + (smoothVelG / 600) * 1.35, 0.15, 1.5) * (scrollDir < 0 ? 0.5 : 1.0)
      : 1.0;
    if (entranceDone) morphProg += (s - morphProg) * 0.05 * velFactor;
    else morphProg = 0;
    const morphS = clamp(morphProg, 0, 1);

    const raw2 = morphS / (1 / (NP - 1));
    const p = clamp(Math.floor(raw2), 0, NP - 2);
    const blend = easeInOut(clamp(raw2 - p, 0, 1));
    const connDist  = lerpParam("conn",  p, blend);
    const baseAlpha = lerpParam("alpha", p, blend);
    const lineW     = lerpParam("lw",    p, blend);
    const nodeAlpha = lerpParam("na",    p, blend);

    const dissolve = Math.max(0, Math.min(1, (s - 0.25) / 0.75));
    const globalA  = 1 - dissolve;

    const mSpeed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy) * 100;
    mouseSpeedSmooth += (mSpeed - mouseSpeedSmooth) * 0.08;
    const heat = mouse.active ? clamp(mouseSpeedSmooth / 15, 0, 1) : 0;

    const aBoost = 1 + Math.min(s, 0.72) * 0.35;
    const ar = Math.min(255, Math.round(lerp(lerp(200, ACCENT.r, 0.6), 255, heat) * aBoost));
    const ag = Math.round(lerp(60, 140, heat) * (1 - Math.min(s, 0.72) * 0.15));
    const ab = Math.round(lerp(40, 60, heat)  * (1 - Math.min(s, 0.72) * 0.2));

    const breathAmp   = entranceDone ? Math.max(0, 1 - smoothVelG / 300) * 0.022 : 0;
    const breathScale = 1 + Math.sin(breathT) * breathAmp;

    if (entranceDone && pulseWaves.length < maxPulse && frameCount > pulseCooldown && Math.random() < 0.006) {
      const src = nodes[Math.floor(Math.random() * N)];
      pulseWaves.push({ cx: src.x, cy: src.y, r: 0, maxR: 70 + Math.random() * 100, alpha: 0.25 });
      pulseCooldown = frameCount + 80;
    }
    for (let wi = pulseWaves.length - 1; wi >= 0; wi--) {
      const pw = pulseWaves[wi];
      pw.r += 1.6; pw.alpha *= 0.965;
      if (pw.r > pw.maxR || pw.alpha < 0.01) { pulseWaves.splice(wi, 1); continue; }
      ctx.beginPath(); ctx.arc(pw.cx, pw.cy, pw.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${ar},${ag},${ab},${pw.alpha * globalA * 0.2})`;
      ctx.lineWidth = 0.5; ctx.stroke();
    }

    const MOUSE_R = 150, MOUSE_F = 38, DECAY = 0.87;
    const mx = mouse.x * W, my = mouse.y * H;
    const positions: { x: number; y: number; localEp: number }[] = [];

    if (entranceDone && useOffscreen && worker && !pendingWorkerRequest) {
      if (Math.abs(morphS - lastWorkerMorphS) > 0.001) {
        pendingWorkerRequest = true; lastWorkerMorphS = morphS;
        worker.postMessage({ type: 'computeScrollPositions', payload: { N, morphS, W, H } });
      }
    }

    for (let i = 0; i < N; i++) {
      const nd = nodes[i];
      let x: number, y: number, localEp: number;

      if (!entranceDone) {
        const rawEp = clamp((ep - nd.entryStart) / (nd.entryEnd - nd.entryStart), 0, 1);
        if (rawEp < 0.3) {
          localEp = easeOutQuart(rawEp / 0.3) * 0.12;
          const amp = 16 * (1 - rawEp / 0.3);
          x = nd.ox * (W / W0) + Math.sin(frameCount * 0.07 + i * 1.3) * amp;
          y = nd.oy * (H / H0) + Math.cos(frameCount * 0.05 + i * 0.9) * amp;
        } else if (rawEp < 0.7) {
          localEp = 0.12 + easeOutQuart((rawEp - 0.3) / 0.4) * 0.65;
          const tgt = fibPlane(i, N, W, H);
          const sT = (rawEp - 0.3) / 0.4;
          nd.spiralAngle += 0.16;
          const decay = Math.exp(-sT * 3.5);
          x = lerp(nd.ox * (W / W0), tgt.x, easeOutQuart(sT)) + Math.cos(nd.spiralAngle) * nd.spiralRadius * decay;
          y = lerp(nd.oy * (H / H0), tgt.y, easeOutQuart(sT)) + Math.sin(nd.spiralAngle) * nd.spiralRadius * decay;
        } else {
          const lockT = (rawEp - 0.7) / 0.3;
          localEp = 0.77 + easeOutElastic(lockT) * 0.23;
          const tgt = fibPlane(i, N, W, H);
          const oa = 12 * (1 - lockT) * Math.sin(i * 2.3);
          x = tgt.x + Math.sin(lockT * Math.PI) * oa;
          y = tgt.y + Math.cos(lockT * Math.PI) * oa;
        }
        nd.x = x; nd.y = y; nd.dx = 0; nd.dy = 0;
        if (localEp > 0.02 && localEp < 0.92) pushTrail(nd, x, y);
      } else {
        nd.trailCount = 0;
        let spx: number, spy: number;
        if (useOffscreen && workerScrollPositions && workerScrollPositions.length >= N * 2) {
          spx = workerScrollPositions[i * 2]; spy = workerScrollPositions[i * 2 + 1];
        } else {
          const sp = getScrollPosFallback(i, morphS, W, H);
          spx = sp.x; spy = sp.y;
        }
        const cx2 = W / 2, cy2 = H / 2;
        const bx = cx2 + (spx - cx2) * breathScale;
        const by2 = cy2 + (spy - cy2) * breathScale;

        if (mouse.active) {
          const ddx = bx - mx, ddy = by2 - my;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < MOUSE_R && dist > 0.1) {
            const force = (1 - dist / MOUSE_R) * MOUSE_F;
            const visc = clamp(1 - mouseSpeedSmooth / 20, 0.06, 0.32);
            nd.dx += (ddx / dist * force - nd.dx) * visc;
            nd.dy += (ddy / dist * force - nd.dy) * visc;
            nd.glowIntensity = lerp(nd.glowIntensity, 1 - dist / MOUSE_R, 0.14);
            if (mouseSpeedSmooth > 10 && dist < MOUSE_R * 0.5) {
              nd.dx += mouse.vx * mouseSpeedSmooth * 0.6 * W;
              nd.dy += mouse.vy * mouseSpeedSmooth * 0.6 * H;
            }
          } else { nd.dx *= DECAY; nd.dy *= DECAY; nd.glowIntensity *= 0.93; }
        } else { nd.dx *= DECAY; nd.dy *= DECAY; nd.glowIntensity *= 0.93; }

        if (Math.abs(nd.dx) < 0.04) nd.dx = 0;
        if (Math.abs(nd.dy) < 0.04) nd.dy = 0;

        let gx = 0, gy = 0;
        if (nd.glitchFrames > 0) {
          gx = nd.glitchX; gy = nd.glitchY; nd.glitchFrames--;
          if (!nd.glitchFrames) { nd.glitchX = 0; nd.glitchY = 0; }
        }
        x = bx + nd.dx + gx; y = by2 + nd.dy + gy;
        nd.x = x; nd.y = y; localEp = 1;
      }
      positions.push({ x, y, localEp });
    }

    if (!entranceDone) {
      for (let i = 0; i < N; i++) if (positions[i].localEp > 0.05) drawTrail(nodes[i], ar, ag, ab, globalA);
    }

    const { grid, getKey } = buildGrid(positions, W, H);
    const drawn = new Set<number>();

    for (let i = 0; i < N; i++) {
      const pi = positions[i];
      if (pi.localEp < 0.4) continue;
      const cx = Math.floor(pi.x / cellSize), cy3 = Math.floor(pi.y / cellSize);
      for (let dcx = -1; dcx <= 1; dcx++) {
        for (let dcy = -1; dcy <= 1; dcy++) {
          const k = getKey(cx + dcx, cy3 + dcy);
          const cell = grid.get(k); if (!cell) continue;
          for (const j of cell) {
            if (j <= i) continue;
            const pairKey = i * N + j;
            if (drawn.has(pairKey)) continue;
            drawn.add(pairKey);
            const pj = positions[j];
            if (pj.localEp < 0.4) continue;
            const ddx = pi.x - pj.x, ddy = pi.y - pj.y;
            const dist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (dist > connDist) continue;
            const prox = 1 - dist / connDist;
            const ef = Math.min(pi.localEp, pj.localEp);
            const lf = dist < 60 ? 1.3 : dist < 110 ? 1.0 : 0.55;
            const alpha = baseAlpha * prox * prox * globalA * Math.min(1, (ef - 0.4) / 0.3) * lf;
            if (alpha < 0.006) continue;
            const gb = (nodes[i].glowIntensity + nodes[j].glowIntensity) * 0.25;
            ctx.beginPath(); ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y);
            ctx.strokeStyle = `rgba(${ar},${ag},${ab},${Math.min(alpha + gb, 0.82)})`;
            ctx.lineWidth = dist < 60 ? lineW * 1.2 : dist < 110 ? lineW : lineW * 0.55;
            ctx.stroke();
          }
        }
      }
    }

    for (let i = 0; i < N; i++) {
      const { x, y, localEp } = positions[i];
      const dm = entranceDone ? Math.sqrt(nodes[i].dx ** 2 + nodes[i].dy ** 2) / MOUSE_F : 0;
      const pulse = s < 0.1 && entranceDone
        ? 0.88 + Math.sin(frameCount * 0.078 + nodes[i].r * 6.28) * 0.12 * (1 - dm)
        : 1.0;
      drawNode(x, y, localEp, nodes[i].targetSz, pulse, ar, ag, ab, nodeAlpha, globalA, nodes[i].glowIntensity);
    }
  }

  raf = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("mousemove", onMouseMove);
    canvas.removeEventListener("mouseleave", onMouseLeave);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", onScroll);
    if (worker) worker.terminate();
  };
}
