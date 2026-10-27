import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Crosshair, Award, Zap } from 'lucide-react';

interface PowerBarTrainerProps {
  targetPower: number;
  onFireWithPower: (power: number) => void;
  lang: 'pt' | 'en';
}

export const PowerBarTrainer: React.FC<PowerBarTrainerProps> = ({
  targetPower,
  onFireWithPower,
  lang,
}) => {
  const [currentPower, setCurrentPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [lastReleasedPower, setLastReleasedPower] = useState<number | null>(null);
  const [accuracyRating, setAccuracyRating] = useState<{ label: string; color: string; score: number } | null>(null);

  const chargeStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // DDTank power bar speed: roughly 1.8 seconds to fill from 0 to 100
  const FILL_DURATION_MS = 1800;

  const startCharging = useCallback(() => {
    if (isCharging) return;
    setIsCharging(true);
    setCurrentPower(0);
    chargeStartTimeRef.current = performance.now();
  }, [isCharging]);

  const releaseCharging = useCallback(() => {
    if (!isCharging) return;
    setIsCharging(false);

    // Calculate score
    const delta = Math.abs(currentPower - targetPower);
    const score = Math.max(0, Math.round(100 - (delta / targetPower) * 100));

    let label = '';
    let color = '';

    if (delta <= 0.8) {
      label = lang === 'pt' ? 'PERFEITO! 🎯 100%' : 'PERFECT! 🎯 100%';
      color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
    } else if (delta <= 2.0) {
      label = lang === 'pt' ? 'EXCELENTE! ✨' : 'EXCELLENT! ✨';
      color = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/40';
    } else if (delta <= 4.5) {
      label = lang === 'pt' ? 'MUITO BOM 👍' : 'VERY GOOD 👍';
      color = 'text-amber-400 bg-amber-500/10 border-amber-500/40';
    } else {
      label = lang === 'pt' ? 'ERROU O PONTO ⚠️' : 'MISSED MARK ⚠️';
      color = 'text-rose-400 bg-rose-500/10 border-rose-500/40';
    }

    setLastReleasedPower(Number(currentPower.toFixed(1)));
    setAccuracyRating({ label, color, score });

    // Fire bullet on arena
    onFireWithPower(currentPower);
  }, [isCharging, currentPower, targetPower, lang, onFireWithPower]);

  // Handle Spacebar hold and release
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        startCharging();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        releaseCharging();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startCharging, releaseCharging]);

  // Charging animation loop
  useEffect(() => {
    if (!isCharging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateCharge = () => {
      if (!chargeStartTimeRef.current) return;
      const elapsed = performance.now() - chargeStartTimeRef.current;
      const progress = (elapsed / FILL_DURATION_MS) * 100;

      if (progress >= 100) {
        setCurrentPower(100);
        releaseCharging();
        return;
      }

      setCurrentPower(progress);
      animationFrameRef.current = requestAnimationFrame(updateCharge);
    };

    animationFrameRef.current = requestAnimationFrame(updateCharge);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCharging, releaseCharging]);

  const handleQuickFire = () => {
    setLastReleasedPower(targetPower);
    setAccuracyRating({
      label: lang === 'pt' ? 'AUTO-DISPARO PERFEITO (DDTool Del)' : 'AUTO-FIRE PERFECT (DDTool Del)',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40',
      score: 100,
    });
    onFireWithPower(targetPower);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-game font-bold text-base text-slate-100 uppercase tracking-wide">
              {lang === 'pt' ? 'Barra de Força DDTank (Espaço)' : 'DDTank Power Bar (Space)'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'pt'
                ? 'Segure a Barra de Espaço ou botão para carregar e solte no marcador alvo'
                : 'Hold Spacebar or button to charge and release at target mark'}
            </p>
          </div>
        </div>

        {/* Target Power Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {lang === 'pt' ? 'Força Alvo' : 'Target Power'}
            </span>
            <span className="font-mono font-bold text-xl text-amber-400">{targetPower.toFixed(1)}</span>
          </div>

          <button
            onClick={handleQuickFire}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-all transform active:scale-95"
            title="Dispara automaticamente com a força calculada (tecla Del do DDTool)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{lang === 'pt' ? 'Auto-Tiro (Del)' : 'Auto-Fire (Del)'}</span>
          </button>
        </div>
      </div>

      {/* Main DDTank Styled Power Gauge */}
      <div className="relative mb-3">
        {/* Outer Frame with metallic border */}
        <div className="h-10 w-full bg-slate-950 rounded-xl border-2 border-slate-700/80 p-1 relative overflow-hidden shadow-inner">
          {/* Background tick marks */}
          <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="h-full flex flex-col justify-between items-center opacity-30">
                <div className="w-px h-2 bg-white" />
                <div className="w-px h-1 bg-white" />
                <div className="w-px h-2 bg-white" />
              </div>
            ))}
          </div>

          {/* Target power marker needle */}
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-none transition-all flex flex-col items-center"
            style={{ left: `${Math.min(99, Math.max(1, targetPower))}%` }}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-amber-400 -mt-1" />
            <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-amber-400 -mb-1" />
          </div>

          {/* Active Filling Power Bar Gradient */}
          <div
            className="h-full rounded-lg transition-all duration-75 relative"
            style={{
              width: `${currentPower}%`,
              background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #f59e0b 80%, #ef4444 100%)',
              boxShadow: isCharging ? '0 0 16px rgba(56, 189, 248, 0.6)' : 'none',
            }}
          >
            {isCharging && (
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-r animate-pulse" />
            )}
          </div>
        </div>

        {/* Numbers 0 - 100 below bar */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-1">
          <span>0</span>
          <span>20</span>
          <span>40</span>
          <span>60</span>
          <span>80</span>
          <span>100</span>
        </div>
      </div>

      {/* Interactive Trigger Button & Accuracy Feedback */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <button
            onMouseDown={startCharging}
            onMouseUp={releaseCharging}
            onTouchStart={startCharging}
            onTouchEnd={releaseCharging}
            className={`px-6 py-2.5 rounded-xl font-game font-bold text-sm select-none transition-all flex items-center gap-2 shadow-lg active:scale-95 ${
              isCharging
                ? 'bg-amber-500 text-slate-950 scale-102 ring-4 ring-amber-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>
              {isCharging
                ? lang === 'pt' ? 'SOLTE PARA ATIRAR!' : 'RELEASE TO SHOOT!'
                : lang === 'pt' ? 'SEGURE O ESPAÇO' : 'HOLD SPACEBAR'}
            </span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {lang === 'pt' ? 'Força Atual:' : 'Current:'} <strong className="text-slate-100">{currentPower.toFixed(1)}</strong>
          </span>
        </div>

        {/* Feedback on Last Release */}
        {accuracyRating && lastReleasedPower !== null && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${accuracyRating.color}`}>
            <Award className="w-4 h-4" />
            <span>{accuracyRating.label}</span>
            <span className="font-mono text-slate-300">
              ({lastReleasedPower} vs {targetPower.toFixed(1)})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
