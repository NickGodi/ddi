import React, { useState } from 'react';
import { X, BookOpen, Wind, Compass, Zap } from 'lucide-react';
import { POWER_TABLE_65, POWER_TABLE_50, POWER_TABLE_30, POWER_TABLE_45, POWER_TABLE_20 } from '../formulas';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'pt' | 'en';
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<'65' | '50' | '90' | '30' | '45' | '20'>('65');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-game font-bold text-lg text-slate-100">
                {lang === 'pt' ? 'Tabela Clássica de Fórmulas DDTank' : 'DDTank Formula Reference Tables'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'pt'
                  ? 'Fórmulas originais de força e compensação de vento'
                  : 'Original power tables and wind compensation rules'}
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

        {/* Formula Selector Tabs */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          {[
            { id: '65', label: lang === 'pt' ? 'Fórmula 65°' : '65° Formula' },
            { id: '90', label: lang === 'pt' ? 'Ângulo Alto 90°' : 'High 90°' },
            { id: '50', label: lang === 'pt' ? 'Fórmula 50°' : '50° Formula' },
            { id: '30', label: lang === 'pt' ? 'Fórmula 30°' : '30° Formula' },
            { id: '45', label: lang === 'pt' ? 'Fórmula 45°' : '45° Formula' },
            { id: '20', label: lang === 'pt' ? 'Fórmula 20°' : '20° Formula' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Formula Rule Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              {lang === 'pt' ? 'Regra de Cálculo' : 'Calculation Rule'}
            </h4>
            <div className="font-mono text-sm text-slate-200 space-y-1">
              {activeTab === '65' && (
                <>
                  <p>• <strong>{lang === 'pt' ? 'Ângulo Base' : 'Base Angle'}:</strong> 65°</p>
                  <p>• <strong>{lang === 'pt' ? 'Compensação Vento' : 'Wind Adjustment'}:</strong> Ângulo = 65 ± (Vento × 2)</p>
                  <p>• <strong>{lang === 'pt' ? 'Compensação Altura' : 'Height Adjustment'}:</strong> Alvo acima: +1° por ~1.2 un | Alvo abaixo: -1° por ~1.2 un</p>
                </>
              )}
              {activeTab === '90' && (
                <>
                  <p>• <strong>{lang === 'pt' ? 'Fórmula' : 'Formula'}:</strong> Ângulo = 90 - Distância ± (Vento × 2)</p>
                  <p>• <strong>{lang === 'pt' ? 'Força Fixa' : 'Fixed Power'}:</strong> 95 (Alvo acima: 97 | Alvo abaixo: 92-94)</p>
                  <p>• <strong>{lang === 'pt' ? 'Dica' : 'Tip'}:</strong> Não erra mesmo com obstáculos no meio do mapa!</p>
                </>
              )}
              {activeTab === '50' && (
                <>
                  <p>• <strong>{lang === 'pt' ? 'Ângulo Base' : 'Base Angle'}:</strong> 50°</p>
                  <p>• <strong>{lang === 'pt' ? 'Compensação Vento' : 'Wind Adjustment'}:</strong> Ângulo = 50 ± (Vento × 2)</p>
                  <p>• <strong>{lang === 'pt' ? 'Vantagem' : 'Advantage'}:</strong> Trajetória intermediária rápida</p>
                </>
              )}
              {activeTab === '30' && (
                <>
                  <p>• <strong>{lang === 'pt' ? 'Ângulo Base' : 'Base Angle'}:</strong> 30°</p>
                  <p>• <strong>{lang === 'pt' ? 'Compensação Vento' : 'Wind Adjustment'}:</strong> Ângulo = 30 ± (Vento × 1)</p>
                  <p>• <strong>{lang === 'pt' ? 'Vantagem' : 'Advantage'}:</strong> Tiro rasante para escavação ("tatu"), resistente ao vento</p>
                </>
              )}
              {activeTab === '45' && (
                <>
                  <p>• <strong>{lang === 'pt' ? 'Ângulo Base' : 'Base Angle'}:</strong> 45°</p>
                  <p>• <strong>{lang === 'pt' ? 'Compensação Vento' : 'Wind Adjustment'}:</strong> Ângulo = 45 ± (Vento × 2)</p>
                </>
              )}
              {activeTab === '20' && (
                <>
                  <p>• <strong>{lang === 'pt' ? 'Ângulo Base' : 'Base Angle'}:</strong> 20°</p>
                  <p>• <strong>{lang === 'pt' ? 'Compensação Vento' : 'Wind Adjustment'}:</strong> Ângulo = 20 ± (Vento × 0.5)</p>
                </>
              )}
            </div>
          </div>

          {/* Table of Distance vs Power */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              {lang === 'pt' ? 'Tabela de Força por Distância (1 a 20 Unidades)' : 'Power by Distance Table (1 to 20 Units)'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((dist) => {
                let powerVal = 0;
                if (activeTab === '65') powerVal = POWER_TABLE_65[dist];
                else if (activeTab === '50') powerVal = POWER_TABLE_50[dist];
                else if (activeTab === '30') powerVal = POWER_TABLE_30[dist];
                else if (activeTab === '45') powerVal = POWER_TABLE_45[dist];
                else if (activeTab === '20') powerVal = POWER_TABLE_20[dist];
                else if (activeTab === '90') powerVal = 95;

                return (
                  <div
                    key={dist}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 text-center flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-slate-500 font-mono">
                      {lang === 'pt' ? 'Dist' : 'Dist'} {dist} {dist === 10 ? '⭐ (1 Tela)' : ''}
                    </span>
                    <span className="font-game font-bold text-base text-amber-400 mt-1">
                      {powerVal.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            {lang === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
