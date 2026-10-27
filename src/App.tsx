import React, { useState, useMemo, useCallback } from 'react';
import { ScreenCaptureOverlay } from './components/ScreenCaptureOverlay';
import { ArenaCanvas } from './components/ArenaCanvas';
import { PowerBarTrainer } from './components/PowerBarTrainer';
import { FormulaCards } from './components/FormulaCards';
import { CheatSheetModal } from './components/CheatSheetModal';
import { InstructionsModal } from './components/InstructionsModal';
import { Point, FormulaType, Language } from './types';
import { calculateAllFormulas, solvePowerForCurrentAngle } from './formulas';
import {
  Monitor,
  Gamepad2,
  Wind,
  Target,
  Compass,
  BookOpen,
  HelpCircle,
  Globe,
  ArrowRight,
  ArrowLeft,
  Crosshair,
  Sliders,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  Download,
} from 'lucide-react';

export function App() {
  const [lang, setLang] = useState<Language>('pt');

  // Display Mode: 'screen_capture' (Live monitor/window) vs 'simulation_arena' (Practice)
  const [activeTab, setActiveTab] = useState<'screen_capture' | 'simulation_arena'>('screen_capture');

  // Coordinates: Blue Player & Red Enemy
  const [playerPos, setPlayerPos] = useState<Point>({ x: 200, y: 380 });
  const [targetPos, setTargetPos] = useState<Point>({ x: 740, y: 380 });

  // Wind: -5.0 to +5.0 (positive = right, negative = left)
  const [wind, setWind] = useState<number>(0.8);

  // In-Game Current Angle of Player (defaults to 65°)
  const [currentAngle, setCurrentAngle] = useState<number>(65);

  // Selected Formula
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>('65');
  const [useExactAngleSolver, setUseExactAngleSolver] = useState<boolean>(true);

  // 3-lines visual mode
  const [showThreeLines, setShowThreeLines] = useState<boolean>(false);

  // Firing trigger
  const [isFiring, setIsFiring] = useState<boolean>(false);

  // Modals
  const [isCheatSheetOpen, setIsCheatSheetOpen] = useState<boolean>(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);

  // Coordinate Calculations
  const facingRight = targetPos.x >= playerPos.x;
  const distancePx = Math.abs(targetPos.x - playerPos.x);
  const distanceUnits = Math.max(0.5, Math.min(20, Number((distancePx / 50).toFixed(1))));

  // Height difference: positive = target higher than player, negative = target lower
  const heightDeltaPx = playerPos.y - targetPos.y;
  const heightDeltaUnits = Number((heightDeltaPx / 50).toFixed(1));

  // Effective wind in the shooting direction
  const effectiveWind = facingRight ? wind : -wind;

  // Ballistics calculations for all 6 classic formulas
  const formulaResults = useMemo(() => {
    return calculateAllFormulas({
      distanceUnits,
      wind: effectiveWind,
      heightDeltaUnits,
      facingRight,
      lang,
    });
  }, [distanceUnits, effectiveWind, heightDeltaUnits, facingRight, lang]);

  // Current active calculation result based on formula
  const activeFormulaResult = useMemo(() => {
    return formulaResults.find((f) => f.formulaId === selectedFormula) || formulaResults[0];
  }, [formulaResults, selectedFormula]);

  // Arbitrary current-angle solver (calculates EXACT required power for whatever angle player currently has)
  const customAngleSolveResult = useMemo(() => {
    return solvePowerForCurrentAngle(
      playerPos,
      targetPos,
      currentAngle,
      effectiveWind,
      facingRight
    );
  }, [playerPos, targetPos, currentAngle, effectiveWind, facingRight]);

  // Active target power: if useExactAngleSolver is true, uses customAngleSolveResult, otherwise formula result
  const activeTargetPower = useExactAngleSolver
    ? customAngleSolveResult.power
    : activeFormulaResult.recommendedPower;

  const activeDisplayAngle = useExactAngleSolver
    ? currentAngle
    : activeFormulaResult.recommendedAngle;

  // Handle formula selection
  const handleSelectFormula = (formulaId: FormulaType) => {
    setSelectedFormula(formulaId);
    setUseExactAngleSolver(false);
    const item = formulaResults.find((f) => f.formulaId === formulaId);
    if (item) {
      setCurrentAngle(item.recommendedAngle);
    }
  };

  // Trigger fire
  const triggerFire = useCallback(() => {
    setIsFiring(true);
    setTimeout(() => setIsFiring(false), 200);
  }, []);

  const handleFireWithPower = useCallback((p: number) => {
    triggerFire();
  }, [triggerFire]);

  const adjustWind = (delta: number) => {
    setWind((w) => Number(Math.max(-5.0, Math.min(5.0, w + delta)).toFixed(1)));
  };

  const downloadBatFile = () => {
    const batContent = `@echo off
title DDTank DDTool Aimbot Web
echo ===================================================
echo     DDTank DDTool Aimbot Web - Executavel 1-Click
echo ===================================================
echo.
echo Verificando dependencias do Node.js...
call npm install --silent
echo.
echo Abrindo o DDTool no seu navegador...
start http://localhost:3000
echo Servidor iniciado na porta 3000!
echo.
npm run dev
pause
`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iniciar_ddtool.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Version */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-rose-600 p-0.5 shadow-lg shadow-blue-900/40">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Target className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-game font-bold text-lg text-slate-100 tracking-wide">
                  DDTool <span className="text-blue-400">Aimbot</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/30 font-semibold">
                  Multi-Tela 60FPS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Captura de tela em tempo real, jogador azul & inimigo vermelho'
                  : 'Real-time multi-monitor screen capture, blue player & red enemy'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('screen_capture')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'screen_capture'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>{lang === 'pt' ? 'Captura da Outra Tela' : 'Screen Capture'}</span>
            </button>

            <button
              onClick={() => setActiveTab('simulation_arena')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'simulation_arena'
                  ? 'bg-slate-800 text-emerald-400 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>{lang === 'pt' ? 'Arena de Treino' : 'Practice Arena'}</span>
            </button>
          </div>

          {/* Quick Wind Bar */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-teal-400" />
              <span className="text-xs text-slate-400 font-mono">
                {lang === 'pt' ? 'Vento:' : 'Wind:'}
              </span>
              <strong className={`font-mono text-sm ${wind >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>
                {wind > 0 ? `+${wind.toFixed(1)}` : wind.toFixed(1)}
              </strong>
            </div>

            <button
              onClick={() => adjustWind(-0.5)}
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
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
              className="w-20 accent-teal-400 cursor-pointer"
            />
            <button
              onClick={() => adjustWind(+0.5)}
              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              +
            </button>
          </div>

          {/* Actions & Language */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCheatSheetOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700/60"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{lang === 'pt' ? 'Tabela' : 'Tables'}</span>
            </button>

            <button
              onClick={downloadBatFile}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/40"
              title="Baixar executável iniciar_ddtool.bat para rodar com 1 clique"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'pt' ? 'Baixar .BAT' : 'Download .BAT'}</span>
            </button>

            <button
              onClick={() => setIsInstructionsOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700/60"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{lang === 'pt' ? 'Manual' : 'Guide'}</span>
            </button>

            <button
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700/60"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Real-time Angle & Ballistics Controller Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Current In-game Angle Input */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {lang === 'pt' ? 'Seu Ângulo Atual no Jogo' : 'Your In-Game Angle'}
              </span>
              <button
                onClick={() => setUseExactAngleSolver(true)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-mono transition-colors ${
                  useExactAngleSolver ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-800'
                }`}
              >
                {useExactAngleSolver ? '✓ Solucionador Ativo' : 'Ativar Ângulo Atual'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-game font-bold text-2xl text-blue-400">{currentAngle}°</span>
              <input
                type="range"
                min="10"
                max="89"
                value={currentAngle}
                onChange={(e) => {
                  setCurrentAngle(parseInt(e.target.value));
                  setUseExactAngleSolver(true);
                }}
                className="flex-1 accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Distance Readout */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              {lang === 'pt' ? 'Distância do Alvo' : 'Target Distance'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-game font-bold text-2xl text-slate-100">
                {distanceUnits} <span className="text-xs text-slate-400 font-sans">un</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({(distanceUnits / 10).toFixed(2)} Telas / {Math.round(distancePx)}px)
              </span>
            </div>
          </div>

          {/* Elevation Difference Readout */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
              {lang === 'pt' ? 'Desnível Altura (ΔH)' : 'Elevation (ΔH)'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-game font-bold text-2xl ${
                  heightDeltaUnits > 0 ? 'text-sky-400' : heightDeltaUnits < 0 ? 'text-amber-400' : 'text-slate-100'
                }`}
              >
                {heightDeltaUnits > 0 ? `+${heightDeltaUnits}` : heightDeltaUnits} un
              </span>
              <span className="text-xs text-slate-500">
                {heightDeltaUnits > 0
                  ? lang === 'pt' ? 'Alvo Mais Alto' : 'Target Higher'
                  : heightDeltaUnits < 0
                  ? lang === 'pt' ? 'Alvo Mais Baixo' : 'Target Lower'
                  : lang === 'pt' ? 'Plano' : 'Level'}
              </span>
            </div>
          </div>

          {/* Calculated Power For Angle */}
          <div className="bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-3 rounded-xl border border-amber-500/40">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-bold">
              {lang === 'pt' ? 'Força Exata Calculada' : 'Calculated Power'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-game font-bold text-3xl text-amber-400">
                {activeTargetPower.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({Math.round((activeTargetPower / 100) * 1800)}ms no Espaço)
              </span>
            </div>
          </div>
        </div>

        {/* Screen Capture Mode vs Practice Arena Mode */}
        {activeTab === 'screen_capture' ? (
          <ScreenCaptureOverlay
            playerPos={playerPos}
            targetPos={targetPos}
            onPlayerPosChange={setPlayerPos}
            onTargetPosChange={setTargetPos}
            angle={activeDisplayAngle}
            power={activeTargetPower}
            wind={effectiveWind}
            facingRight={facingRight}
            onFire={triggerFire}
            lang={lang}
          />
        ) : (
          <ArenaCanvas
            playerPos={playerPos}
            targetPos={targetPos}
            onPlayerPosChange={setPlayerPos}
            onTargetPosChange={setTargetPos}
            angle={activeDisplayAngle}
            power={activeTargetPower}
            wind={effectiveWind}
            facingRight={facingRight}
            showThreeLines={showThreeLines}
            onToggleThreeLines={() => setShowThreeLines(!showThreeLines)}
            onFire={triggerFire}
            isFiring={isFiring}
            lang={lang}
          />
        )}

        {/* Spacebar Charging Power Bar Trainer (with Auto-Fire on Delete) */}
        <PowerBarTrainer
          targetPower={activeTargetPower}
          onFireWithPower={handleFireWithPower}
          lang={lang}
        />

        {/* Classic Formula Presets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-game font-bold text-lg text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                {lang === 'pt' ? 'Fórmulas Clássicas Predefinidas' : 'Classic Formula Presets'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Ou escolha uma fórmula pronta (65°, 50°, 90° alto, 30° escavação) para ajustar seu ângulo automaticamente'
                  : 'Or pick a classic formula (65°, 50°, 90° high, 30° digger) to automatically set your angle'}
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
          DDTool Aimbot Web • {lang === 'pt' ? 'Inimigo Vermelho 🔴 | Jogador Azul 🔵 | Captura de Tela Multi-Monitor' : 'Enemy Red 🔴 | Player Blue 🔵 | Multi-Monitor Screen Capture'}.
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
