import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Crosshair, Award, Zap, Timer } from 'lucide-react';

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
  const [isAutoCharging, setIsAutoCharging] = useState(false);
  const [lastReleasedPower, setLastReleasedPower] = useState<number | null>(null);
  const [accuracyRating, setAccuracyRating] = useState<{ label: string; color: string; score: number } | null>(null);

  const chargeStartTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAutoModeRef = useRef(false);

  // DDTank power bar speed: roughly 1.8 seconds (1800ms) to fill from 0 to 100
  const FILL_DURATION_MS = 1800;
  const holdDurationTargetMs = Math.round((targetPower / 100) * FILL_DURATION_MS);

  const startCharging = useCallback(() => {
    if (isCharging || isAutoCharging) return;
    isAutoModeRef.current = false;
    setIsCharging(true);
    setCurrentPower(0);
    chargeStartTimeRef.current = performance.now();
  }, [isCharging, isAutoCharging]);

  const releaseCharging = useCallback(() => {
    if (!isCharging && !isAutoCharging) return;
    setIsCharging(false);
    setIsAutoCharging(false);

    // Calculate score
    const delta = Math.abs(currentPower - targetPower);
    const score = Math.max(0, Math.round(100 - (delta / targetPower) * 100));

    let label = '';
    let color = '';

    if (isAutoModeRef.current || delta <= 0.8) {
      label = lang === 'pt' ? 'AUTO-DISPARO PERFEITO! 🎯 100%' : 'AUTO-FIRE PERFECT! 🎯 100%';
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

    const released = isAutoModeRef.current ? targetPower : Number(currentPower.toFixed(1));
    setLastReleasedPower(released);
    setAccuracyRating({ label, color, score });

    onFireWithPower(released);
  }, [isCharging, isAutoCharging, currentPower, targetPower, lang, onFireWithPower]);

  // Automated spacebar hold & release on target power
  const triggerAutoFire = useCallback(() => {
    if (isCharging || isAutoCharging) return;
    isAutoModeRef.current = true;
    setIsAutoCharging(true);
    setCurrentPower(0);
    const startTime = performance.now();

    const step = () => {
      const elapsed = performance.now() - startTime;
      const progress = (elapsed / FILL_DURATION_MS) * 100;

      if (progress >= targetPower) {
        setCurrentPower(targetPower);
        setIsAutoCharging(false);
        releaseCharging();
        return;
      }

      setCurrentPower(progress);
      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [isCharging, isAutoCharging, targetPower, releaseCharging]);

  // Listen for Spacebar (manual hold) and Delete (auto hold-and-release)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startCharging();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        triggerAutoFire();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }
        e.preventDefault();
        if (!isAutoModeRef.current) {
          releaseCharging();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startCharging, releaseCharging, triggerAutoFire]);

  // Manual charging loop
  useEffect(() => {
    if (!isCharging || isAutoCharging) return;

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
  }, [isCharging, isAutoCharging, releaseCharging]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-game font-bold text-base text-slate-100 uppercase tracking-wide">
              {lang === 'pt' ? 'Barra de Força DDTank (Espaço & Del)' : 'DDTank Power Bar (Space & Del)'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'pt'
                ? 'Pressione Delete para auto-segurar e soltar no valor exato, ou segure a barra de espaço manualmente'
                : 'Press Delete to auto-charge and release at exact value, or hold Spacebar manually'}
            </p>
          </div>
        </div>

        {/* Target Power Badge & Timing duration */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {lang === 'pt' ? 'Força / Tempo' : 'Power / Time'}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-xl text-amber-400">{targetPower.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-mono">({holdDurationTargetMs}ms)</span>
            </div>
          </div>

          <button
            onClick={triggerAutoFire}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 flex items-center gap-1.5 transition-all transform active:scale-95"
            title="Auto-calcula e segura espaço até soltar no valor exato (Tecla Delete)"
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
              boxShadow: isCharging || isAutoCharging ? '0 0 16px rgba(56, 189, 248, 0.6)' : 'none',
            }}
          >
            {(isCharging || isAutoCharging) && (
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
              isCharging || isAutoCharging
                ? 'bg-amber-500 text-slate-950 scale-102 ring-4 ring-amber-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>
              {isAutoCharging
                ? lang === 'pt' ? 'SEGURANDO AUTOMATICAMENTE...' : 'AUTO-HOLDING SPACEBAR...'
                : isCharging
                ? lang === 'pt' ? 'SOLTE PARA ATIRAR!' : 'RELEASE TO SHOOT!'
                : lang === 'pt' ? 'SEGURE O ESPAÇO' : 'HOLD SPACEBAR'}
            </span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {lang === 'pt' ? 'Força Atual:' : 'Current:'}{' '}
            <strong className="text-slate-100">{currentPower.toFixed(1)}</strong>{' '}
            <span className="text-slate-500">({Math.round((currentPower / 100) * FILL_DURATION_MS)}ms)</span>
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
