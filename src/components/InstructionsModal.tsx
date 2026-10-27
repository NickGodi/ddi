import React, { useState } from 'react';
import { X, HelpCircle, Keyboard, MousePointer, Info, Sparkles, Download, Check, Copy, Terminal } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'pt' | 'en';
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose, lang }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  const downloadBat = () => {
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

  const copyBatCode = () => {
    navigator.clipboard.writeText(batContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-game font-bold text-lg text-slate-100">
                {lang === 'pt' ? 'Como Usar o DDTool & Executar no PC' : 'How to Use DDTool & Run on PC'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Instruções de execução com 1 clique e guia clássico'
                  : '1-click PC startup instructions and classic guide'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Section: 1-Click Local Execution (.BAT file) */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-slate-950 to-slate-950 p-4 rounded-xl border border-indigo-500/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-game font-bold text-base text-indigo-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                {lang === 'pt' ? 'Como Rodar com 1 Clique (iniciar_ddtool.bat)' : '1-Click Local Execution (.bat)'}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadBat}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-900/40 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'pt' ? 'Baixar iniciar_ddtool.bat' : 'Download .bat'}</span>
                </button>
                <button
                  onClick={copyBatCode}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (lang === 'pt' ? 'Copiado!' : 'Copied!') : (lang === 'pt' ? 'Copiar' : 'Copy')}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'pt'
                ? 'Para rodar no seu computador com apenas 1 clique: baixe o arquivo iniciar_ddtool.bat e coloque na pasta do projeto. Basta dar dois cliques nele para instalar dependências e abrir automaticamente!'
                : 'To run on your computer with 1 click: download the iniciar_ddtool.bat file and place it in the project root. Double-click it to auto-install dependencies and open in browser!'}
            </p>

            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <pre>{batContent}</pre>
            </div>
          </div>

          {/* Section: Shortcuts & Controls */}
          <div>
            <h4 className="font-game font-bold text-base text-blue-400 mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              {lang === 'pt' ? 'Atalhos e Controles Clássicos' : 'Classic Controls & Shortcuts'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs">Del</kbd>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Auto-Tiro (Segura & Solta)' : 'Auto Fire (Hold & Release)'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Calcula a força e segura a barra de espaço, soltando com 100% de precisão.'
                    : 'Calculates power, auto-charges spacebar, and releases at the exact mark.'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Jogador Azul' : 'Player Blue'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Clique no botão "Jogador Azul" ou segure Shift e clique na tela para posicionar seu tanque.'
                    : 'Click "Player Blue" or hold Shift + Click to place your tank on the map.'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Inimigo Vermelho' : 'Enemy Red'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Clique em qualquer ponto da tela para marcar o inimigo vermelho e traçar a trajetória.'
                    : 'Click anywhere to place the red enemy target and project the live trajectory.'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs">Shift</kbd>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Mostrar 3 Linhas' : 'Show 3 Lines'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Ativa as 3 trajetórias para controlar o tiro 1-2 e escavação de crateras.'
                    : 'Shows 3 trajectory arcs for 1-2 spread attack and crater digging.'}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Original FAQ & Tips */}
          <div>
            <h4 className="font-game font-bold text-base text-emerald-400 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" />
              {lang === 'pt' ? 'Dicas do Manual Original' : 'Original Manual Tips & FAQ'}
            </h4>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                🖥️ <strong>{lang === 'pt' ? 'Captura de Outra Tela / Multi-Monitor:' : 'Multi-Monitor Screen Capture:'}</strong>{' '}
                {lang === 'pt'
                  ? 'Basta clicar no botão "Detectar Outra Tela / Monitor" na aba principal. O navegador perguntará qual tela você deseja compartilhar: escolha sua Tela 2 (ou a janela do jogo) para que o DDTool exiba a mira diretamente por cima do jogo!'
                  : 'Click "Capture Other Screen" in the main tab. The browser will ask which screen you want to capture: pick Screen 2 or your game window to project the aim directly over your game!'}
              </p>
              <p>
                🎯 <strong>{lang === 'pt' ? 'Medição de Distância (Telas):' : 'Distance Measurement (Screens):'}</strong>{' '}
                {lang === 'pt'
                  ? 'No DDTank clássico, 1 tela cheia equivale a 10 unidades. Meia tela equivale a 5 unidades. 2 telas equivalem a 20 unidades.'
                  : 'In classic DDTank, 1 full screen equals 10 units. Half screen equals 5 units. 2 full screens equal 20 units.'}
              </p>
              <p>
                💨 <strong>{lang === 'pt' ? 'Direção do Vento:' : 'Wind Direction:'}</strong>{' '}
                {lang === 'pt'
                  ? 'Vento positivo (verde, seta para a direita) acelera o projétil para a frente. Vento negativo (vermelho, seta para a esquerda) desacelera o tiro.'
                  : 'Positive wind pushes projectile forward. Negative wind slows it down.'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            {lang === 'pt' ? 'Entendido' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
