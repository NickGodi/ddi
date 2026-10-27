import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, CalculationResult } from '../types';
import {
  Monitor,
  VideoOff,
  Crosshair,
  ShieldAlert,
  Target,
  Maximize2,
  ZoomIn,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface ScreenCaptureOverlayProps {
  playerPos: Point;
  targetPos: Point;
  onPlayerPosChange: (pos: Point) => void;
  onTargetPosChange: (pos: Point) => void;
  angle: number;
  power: number;
  wind: number;
  facingRight: boolean;
  onFire: () => void;
  lang: 'pt' | 'en';
}

export const ScreenCaptureOverlay: React.FC<ScreenCaptureOverlayProps> = ({
  playerPos,
  targetPos,
  onPlayerPosChange,
  onTargetPosChange,
  angle,
  power,
  wind,
  facingRight,
  onFire,
  lang,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'player' | 'target'>('target');
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [pixelMagnifier, setPixelMagnifier] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Start Screen Capture with Multi-Monitor support
  const startCapture = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error(
          lang === 'pt'
            ? 'Seu navegador não suporta captura de tela direta.'
            : 'Your browser does not support getDisplayMedia screen capture.'
        );
      }

      // Request display capture - browser prompts user to select Screen 1, Screen 2, Window, etc.
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 60, max: 60 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCapturing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Handle stream end (user clicks browser "Stop Sharing")
      mediaStream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name !== 'NotAllowedError') {
        setErrorMsg(e.message || 'Falha ao iniciar captura da tela');
      }
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCapturing(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Keep canvas resolution synced to video or default aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      } else {
        canvas.width = 1280;
        canvas.height = 720;
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', handleResize);
    }
    return () => {
      if (video) {
        video.removeEventListener('loadedmetadata', handleResize);
      }
    };
  }, [isCapturing]);

  // Main Canvas Rendering Loop (Draws directly over live video feed)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // If not capturing, draw subtle guide background
      if (!isCapturing) {
        ctx.fillStyle = 'rgba(11, 15, 25, 0.92)';
        ctx.fillRect(0, 0, width, height);

        // Tech grid pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 60) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 60) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // 1. DISTANCE RULER & TICKS BETWEEN PLAYER & TARGET
      if (showRuler) {
        const dx = targetPos.x - playerPos.x;
        const dy = playerPos.y - targetPos.y;
        const distPx = Math.abs(dx);
        const unitPx = 50; // DDTank distance scale
        const units = distPx / unitPx;

        ctx.save();
        // Horizontal projection line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(playerPos.x, playerPos.y);
        ctx.lineTo(targetPos.x, playerPos.y);
        ctx.stroke();

        // Vertical elevation line
        if (Math.abs(dy) > 5) {
          ctx.strokeStyle = dy > 0 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(245, 158, 11, 0.5)';
          ctx.beginPath();
          ctx.moveTo(targetPos.x, playerPos.y);
          ctx.lineTo(targetPos.x, targetPos.y);
          ctx.stroke();
        }

        // Ticks along the distance line
        const dir = dx >= 0 ? 1 : -1;
        for (let u = 1; u <= Math.floor(units); u++) {
          const tx = playerPos.x + u * unitPx * dir;
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.strokeStyle = u % 10 === 0 ? '#facc15' : 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = u % 10 === 0 ? 2.5 : 1;
          ctx.moveTo(tx, playerPos.y - (u % 10 === 0 ? 10 : 5));
          ctx.lineTo(tx, playerPos.y + (u % 10 === 0 ? 10 : 5));
          ctx.stroke();

          if (u % 5 === 0) {
            ctx.fillStyle = u % 10 === 0 ? '#facc15' : '#94a3b8';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(
              u % 10 === 0 ? `${u / 10} TELA` : `${u}`,
              tx,
              playerPos.y + 20
            );
          }
        }
        ctx.restore();
      }

      // 2. LIVE TRAJECTORY ARC OVERLAY
      {
        const rad = (angle * Math.PI) / 180;
        const speed = (power / 100) * 26.5;
        const dir = facingRight ? 1 : -1;

        let vx = speed * Math.cos(rad) * dir;
        let vy = -speed * Math.sin(rad);
        let curX = playerPos.x;
        let curY = playerPos.y - 12;
        const gravity = 0.38;
        const windAcc = wind * 0.045;

        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(curX, curY);

        for (let t = 1; t <= 220; t++) {
          vx += windAcc;
          vy += gravity;
          curX += vx;
          curY += vy;
          ctx.lineTo(curX, curY);

          // Stop if hitting target height or screen edge
          if (curX < 0 || curX > width || curY > height + 50) {
            break;
          }
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. JOGADOR AZUL (PLAYER BLUE) - Solicitado pelo usuário
      {
        ctx.save();
        ctx.translate(playerPos.x, playerPos.y);

        // Pulsing Blue aura
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fill();

        // Crosshair reticle
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, 0);
        ctx.moveTo(0, -16);
        ctx.lineTo(0, 16);
        ctx.stroke();

        // Cannon Angle Indicator Arrow
        const rad = (angle * Math.PI) / 180;
        const dir = facingRight ? 1 : -1;
        const arrowLen = 32;
        const ax = Math.cos(rad) * arrowLen * dir;
        const ay = -Math.sin(rad) * arrowLen;

        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ax, ay);
        ctx.stroke();

        // Blue Player Tag Badge
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-50, -48, 100, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 11px Chakra Petch';
        ctx.textAlign = 'center';
        ctx.fillText(`JOGADOR AZUL (${angle}°)`, 0, -34);
        ctx.restore();
      }

      // 4. INIMIGO VERMELHO (ENEMY RED) - Solicitado pelo usuário
      {
        ctx.save();
        ctx.translate(targetPos.x, targetPos.y);

        // Pulsing Red aura
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fill();

        // Target reticle
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(18, 0);
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.stroke();

        // Red Target Tag Badge
        ctx.fillStyle = '#7f1d1d';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-50, -48, 100, 20, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Chakra Petch';
        ctx.textAlign = 'center';
        ctx.fillText('INIMIGO VERMELHO', 0, -34);
        ctx.restore();
      }

      // 5. TOP HUD STATS OVERLAY
      {
        const dx = Math.abs(targetPos.x - playerPos.x);
        const dy = playerPos.y - targetPos.y;
        const units = (dx / 50).toFixed(1);
        const screens = (dx / 500).toFixed(2);

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(16, 16, 320, 60, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 13px JetBrains Mono';
        ctx.textAlign = 'left';
        ctx.fillText(`Distância: ${units} un (${screens} Telas)`, 30, 38);

        ctx.fillStyle = dy >= 0 ? '#38bdf8' : '#fb923c';
        ctx.font = 'bold 12px JetBrains Mono';
        ctx.fillText(`Desnível Altura: ${(dy / 50).toFixed(1)} un (${Math.round(dy)}px)`, 30, 58);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    playerPos,
    targetPos,
    angle,
    power,
    wind,
    facingRight,
    isCapturing,
    showRuler,
  ]);

  // Handle Canvas click to place Player Blue or Enemy Red
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    if (e.shiftKey || selectionMode === 'player') {
      onPlayerPosChange({ x, y });
    } else {
      onTargetPosChange({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setPixelMagnifier({ x, y, visible: true });
  };

  const handleMouseLeave = () => {
    setPixelMagnifier((m) => ({ ...m, visible: false }));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl"
    >
      {/* Hidden Live Video Element for MediaStream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-contain ${
          isCapturing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Top Floating Action Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left tools: Mode & Start/Stop Screen Capture */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          {!isCapturing ? (
            <button
              onClick={startCapture}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-lg shadow-indigo-900/40"
            >
              <Monitor className="w-4 h-4" />
              <span>{lang === 'pt' ? 'Detectar Outra Tela / Monitor' : 'Capture Other Screen'}</span>
            </button>
          ) : (
            <button
              onClick={stopCapture}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>{lang === 'pt' ? 'Parar Captura' : 'Stop'}</span>
            </button>
          )}

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Place Player Blue */}
          <button
            onClick={() => setSelectionMode('player')}
            title="Marcar Jogador Azul (Shift + Clique)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectionMode === 'player'
                ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>{lang === 'pt' ? 'Jogador Azul' : 'Player Blue'}</span>
          </button>

          {/* Place Target Red */}
          <button
            onClick={() => setSelectionMode('target')}
            title="Marcar Inimigo Vermelho (Clique)"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              selectionMode === 'target'
                ? 'bg-rose-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span>{lang === 'pt' ? 'Inimigo Vermelho' : 'Enemy Red'}</span>
          </button>
        </div>

        {/* Right status */}
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={() => setShowRuler(!showRuler)}
            className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
              showRuler ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Régua de Telas' : 'Screen Ruler'}
          </button>

          <span className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className={`w-2 h-2 rounded-full ${isCapturing ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
            {isCapturing ? (lang === 'pt' ? 'AO VIVO' : 'LIVE') : (lang === 'pt' ? 'AGUARDANDO TELA' : 'OFFLINE')}
          </span>
        </div>
      </div>

      {/* Main Interactive HUD Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-auto cursor-crosshair block relative z-10 select-none"
      />

      {/* Error / Instruction Message if Not Capturing */}
      {!isCapturing && (
        <div className="absolute inset-0 z-15 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
            <Monitor className="w-8 h-8" />
          </div>
          <h3 className="font-game font-bold text-xl text-slate-100 mb-2">
            {lang === 'pt' ? 'Captura de Tela & Multi-Monitor Ativa' : 'Live Screen & Multi-Monitor Capture'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
            {lang === 'pt'
              ? 'Clique em "Detectar Outra Tela / Monitor" acima e selecione sua Segunda Tela (Screen 2) ou a Janela do DDTank para projetar a mira e os cálculos em tempo real.'
              : 'Click "Capture Other Screen" above and choose your second monitor or DDTank game window to project live aim calculation overlay.'}
          </p>
          <div className="pointer-events-auto">
            <button
              onClick={startCapture}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-game font-bold text-sm rounded-xl shadow-xl shadow-blue-900/30 transition-all flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span>{lang === 'pt' ? 'SELECIONAR SEGUNDA TELA AGORA' : 'SELECT SECOND MONITOR NOW'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Hint Banner */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 relative z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <span>{lang === 'pt' ? 'Azul: Jogador' : 'Blue: Player'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>{lang === 'pt' ? 'Vermelho: Inimigo' : 'Red: Enemy'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[10px]">Del</kbd>
            <span>{lang === 'pt' ? 'Auto-Calcular Força & Espaço' : 'Auto Calculate & Fire'}</span>
          </span>
        </div>

        {pixelMagnifier.visible && (
          <div className="text-[11px] font-mono text-slate-400">
            X: {pixelMagnifier.x}px | Y: {pixelMagnifier.y}px
          </div>
        )}
      </div>
    </div>
  );
};
