import React, { useState, useMemo, useCallback } from 'react';
import { ArenaCanvas } from './components/ArenaCanvas';
import { PowerBarTrainer } from './components/PowerBarTrainer';
import { FormulaCards } from './components/FormulaCards';
import { CheatSheetModal } from './components/CheatSheetModal';
import { InstructionsModal } from './components/InstructionsModal';
import { Point, FormulaType, Language } from './types';
import { calculateAllFormulas } from './formulas';
import {
  Wind,
  Target,
  Compass,
  BookOpen,
  HelpCircle,
  Globe,
  Flame,
  ArrowRight,
  ArrowLeft,
  Crosshair,
  Sliders,
  Sparkles,
} from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<Language>('pt');

  // Player and Target coordinates in Canvas space (Canvas is 940 x 480)
  const [playerPos, setPlayerPos] = useState<Point>({ x: 160, y: 380 });
  const [targetPos, setTargetPos] = useState<Point>({ x: 720, y: 380 });

  // Wind: -5.0 to +5.0 (positive = blowing to right, negative = blowing to left)
  const [wind, setWind] = useState<number>(0.8);

  // Selected formula
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>('65');

  // Manual angle override (defaults to recommended from selected formula)
  const [customAngle, setCustomAngle] = useState<number | null>(null);

  // 3-lines visual mode (DDTool Shift key spread)
  const [showThreeLines, setShowThreeLines] = useState<boolean>(false);

  // Firing trigger
  const [isFiring, setIsFiring] = useState<boolean>(false);

  // Modals
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);

  // Calculate distance in screen units (50px = 1 unit, 500px = 10 units = 1 screen)
  const facingRight = targetPos.x >= playerPos.x;
  const distancePx = Math.abs(targetPos.x - playerPos.x);
  const distanceUnits = Math.max(0.5, Math.min(20, Number((distancePx / 50).toFixed(1))));

  // Height difference: positive = target higher than player, negative = target lower
  const heightDeltaPx = playerPos.y - targetPos.y;
  const heightDeltaUnits = Number((heightDeltaPx / 50).toFixed(1));

  // Effective wind in the shooting direction
  const effectiveWind = facingRight ? wind : -wind;

  // Compute ballistics for all formulas
  const formulaResults = useMemo(() => {
    return calculateAllFormulas({
      distanceUnits,
      wind: effectiveWind,
      heightDeltaUnits,
      facingRight,
      lang,
    });
  }, [distanceUnits, effectiveWind, heightDeltaUnits, facingRight, lang]);

  // Current active calculation result
  const activeResult = useMemo(() => {
    return formulaResults.find((f) => f.formulaId === selectedFormula) || formulaResults[0];
  }, [formulaResults, selectedFormula]);

  // Active angle and power
  const currentAngle = customAngle !== null ? customAngle : activeResult.recommendedAngle;
  const targetPower = activeResult.recommendedPower;

  // Handle formula selection
  const handleSelectFormula = (formulaId: FormulaType) => {
    setSelectedFormula(formulaId);
    setCustomAngle(null); // reset custom angle to use recommended
  };

  // Trigger fire
  const triggerFire = useCallback(() => {
    setIsFiring(true);
    setTimeout(() => setIsFiring(false), 200);
  }, []);

  // Fire with specific power from trainer
  const handleFireWithPower = useCallback((p: number) => {
    triggerFire();
  }, [triggerFire]);

  // Quick wind setters
  const adjustWind = (delta: number) => {
    setWind((w) => Number(Math.max(-5.0, Math.min(5.0, w + delta)).toFixed(1)));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Applet Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-indigo-900/30">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Target className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-game font-bold text-lg text-slate-100 tracking-wide">
                  DDTool <span className="text-rose-400">Aimbot</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/30">
                  v4.1.3b Web
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Calculadora de Trajetória & Ângulos para DDTank'
                  : 'Trajectory & Ballistics Calculator for DDTank'}
              </p>
            </div>
          </div>

          {/* Wind Quick Bar in Header */}
          <div className="flex items-center gap-3 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {lang === 'pt' ? 'Vento' : 'Wind'}
                </span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-sm">
                  {wind > 0 ? (
                    <ArrowRight className="w-3.5 h-3.5 text-teal-400" />
                  ) : wind < 0 ? (
                    <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                  ) : null}
                  <span className={wind >= 0 ? 'text-teal-400' : 'text-rose-400'}>
                    {wind > 0 ? `+${wind.toFixed(1)}` : wind.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => adjustWind(-0.5)}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                title="-0.5 Vento"
              >
                -
              </button>
              <input
                type="range"
                min="-5.0"
                max="5.0"
                step="0.1"
                value={wind}
                onChange={(e) => setWind(parseFloat(e.target.value))}
                className="w-24 accent-teal-400 cursor-pointer"
              />
              <button
                onClick={() => adjustWind(+0.5)}
                className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                title="+0.5 Vento"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons: Cheat Sheet, Instructions, Language */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCheatSheetOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700/60"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{lang === 'pt' ? 'Tabela' : 'Tables'}</span>
            </button>

            <button
              onClick={() => setIsInstructionsOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700/60"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{lang === 'pt' ? 'Manual' : 'Guide'}</span>
            </button>

            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700/60"
              title="Trocar Idioma / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Quick Battlefield Overview & Ballistics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Distance */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              {lang === 'pt' ? 'Distância (Telas)' : 'Distance'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-game font-bold text-2xl text-slate-100">
                {distanceUnits} <span className="text-xs text-slate-400 font-sans">un</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({(distanceUnits / 10).toFixed(2)} {lang === 'pt' ? 'telas' : 'screens'})
              </span>
            </div>
          </div>

          {/* Elevation Delta */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              {lang === 'pt' ? 'Desnível (ΔH)' : 'Elevation (ΔH)'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-game font-bold text-2xl ${
                  heightDeltaUnits > 0
                    ? 'text-sky-400'
                    : heightDeltaUnits < 0
                    ? 'text-amber-400'
                    : 'text-slate-100'
                }`}
              >
                {heightDeltaUnits > 0 ? `+${heightDeltaUnits}` : heightDeltaUnits}{' '}
                <span className="text-xs text-slate-400 font-sans">un</span>
              </span>
              <span className="text-xs text-slate-500 font-sans">
                {heightDeltaUnits > 0
                  ? lang === 'pt' ? 'Alvo Acima' : 'Target Above'
                  : heightDeltaUnits < 0
                  ? lang === 'pt' ? 'Alvo Abaixo' : 'Target Below'
                  : lang === 'pt' ? 'Nivelado' : 'Level'}
              </span>
            </div>
          </div>

          {/* Selected Formula Angle */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              {lang === 'pt' ? 'Ângulo Recomendado' : 'Recommended Angle'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-game font-bold text-2xl text-emerald-400">
                {currentAngle}°
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({selectedFormula}°)
              </span>
            </div>
          </div>

          {/* Selected Formula Power */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
              {lang === 'pt' ? 'Força Recomendada' : 'Recommended Power'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-game font-bold text-2xl text-amber-400">
                {targetPower.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
          </div>
        </div>

        {/* Interactive Physics Arena Canvas */}
        <ArenaCanvas
          playerPos={playerPos}
          targetPos={targetPos}
          onPlayerPosChange={setPlayerPos}
          onTargetPosChange={setTargetPos}
          angle={currentAngle}
          power={targetPower}
          wind={effectiveWind}
          facingRight={facingRight}
          showThreeLines={showThreeLines}
          onToggleThreeLines={() => setShowThreeLines(!showThreeLines)}
          onFire={triggerFire}
          isFiring={isFiring}
          lang={lang}
        />

        {/* Spacebar Charging Power Bar Trainer */}
        <PowerBarTrainer
          targetPower={targetPower}
          onFireWithPower={handleFireWithPower}
          lang={lang}
        />

        {/* Formula Cards Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-game font-bold text-lg text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                {lang === 'pt' ? 'Fórmulas de Tiro Disponíveis' : 'Available Shooting Formulas'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Clique em qualquer fórmula para aplicar instantaneamente o ângulo e a força'
                  : 'Click any formula card to apply its recommended angle and power to the arena'}
              </p>
            </div>
          </div>

          <FormulaCards
            results={formulaResults}
            selectedFormula={selectedFormula}
            onSelectFormula={handleSelectFormula}
            lang={lang}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-4 py-6 mt-12 text-center text-xs text-slate-500">
        <p>
          DDTank DDTool Web Edition • {lang === 'pt' ? 'Simulador balístico fiel às mecânicas de artilharia 2D' : 'Faithful 2D artillery ballistics simulator'}.
        </p>
      </footer>

      {/* Modals */}
      <CheatSheetModal
        isOpen={isCheatSheetOpen}
        onClose={() => setIsCheatSheetOpen(false)}
        lang={lang}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        lang={lang}
      />
    </div>
  );
}

export default App;
