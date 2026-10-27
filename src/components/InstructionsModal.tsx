import React from 'react';
import { X, HelpCircle, Keyboard, MousePointer, Info, Sparkles } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'pt' | 'en';
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

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
                {lang === 'pt' ? 'Como Usar o DDTool & Aimbot' : 'How to Use DDTool & Aimbot'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Manual original do DDTool v4.1.3b migrado para a web'
                  : 'Original DDTool v4.1.3b instructions migrated to web'}
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
          {/* Section: Shortcuts & Controls */}
          <div>
            <h4 className="font-game font-bold text-base text-indigo-400 mb-3 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              {lang === 'pt' ? 'Atalhos e Controles Clássicos' : 'Classic Controls & Shortcuts'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs">Del</kbd>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Disparo Automático' : 'Auto Fire'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Dispara imediatamente com a força recomendada calculada pelo DDTool.'
                    : 'Immediately fires the shot with the exact calculated formula power.'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs">Shift</kbd>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Mostrar 3 Linhas' : 'Show 3 Lines'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Ativa a pré-visualização da propagação tridental (1-2 spread) para escavação.'
                    : 'Shows 3 ballistic trajectories for 1-2 combination attacks and crater digging.'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs">~ / Clique</kbd>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Posicionar Inimigo' : 'Target Location'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Clique em qualquer lugar do mapa para marcar o inimigo (círculo vermelho).'
                    : 'Click anywhere on arena or map to place target marker (red circle).'}
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-400 font-mono text-xs">Shift + Clique</kbd>
                  <strong className="text-slate-200">{lang === 'pt' ? 'Posicionar Você' : 'Player Location'}</strong>
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'pt'
                    ? 'Segure Shift e clique para mover sua posição no terreno (círculo verde).'
                    : 'Hold Shift and click to reposition your tank on terrain (green circle).'}
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
                🎯 <strong>{lang === 'pt' ? 'Medição de Distância (Telas):' : 'Distance Measurement (Screens):'}</strong>{' '}
                {lang === 'pt'
                  ? 'No DDTank clássico, 1 tela cheia equivale a 10 unidades. Meia tela equivale a 5 unidades. 2 telas equivalem a 20 unidades.'
                  : 'In classic DDTank, 1 full screen equals 10 units. Half screen equals 5 units. 2 full screens equal 20 units.'}
              </p>
              <p>
                💨 <strong>{lang === 'pt' ? 'Direção do Vento:' : 'Wind Direction:'}</strong>{' '}
                {lang === 'pt'
                  ? 'Vento a favor (positivo) empurra o projétil para a frente, aumentando o ângulo necessário. Vento contra (negativo) freia o tiro, exigindo ângulo menor.'
                  : 'Tailwind (positive) accelerates the projectile forward, increasing required angle. Headwind (negative) pushes back, lowering angle.'}
              </p>
              <p>
                🏔️ <strong>{lang === 'pt' ? 'Diferença de Altura (ΔH):' : 'Height Difference (ΔH):'}</strong>{' '}
                {lang === 'pt'
                  ? 'Quando o inimigo estiver em um ponto mais alto que você, adicione graus ao seu ângulo ou force mais. Se estiver mais baixo, diminua.'
                  : 'When target is situated higher than you, raise angle or increase power. When lower, decrease angle.'}
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
