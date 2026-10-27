import React from 'react';
import { CalculationResult, FormulaType } from '../types';
import { Compass, Wind, ArrowUpRight, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface FormulaCardsProps {
  results: CalculationResult[];
  selectedFormula: FormulaType;
  onSelectFormula: (formula: FormulaType) => void;
  lang: 'pt' | 'en';
}

export const FormulaCards: React.FC<FormulaCardsProps> = ({
  results,
  selectedFormula,
  onSelectFormula,
  lang,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {results.map((item) => {
        const isSelected = selectedFormula === item.formulaId;

        return (
          <div
            key={item.formulaId}
            onClick={() => onSelectFormula(item.formulaId)}
            className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
              isSelected
                ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900/90 border-indigo-500 shadow-lg shadow-indigo-950/50 ring-2 ring-indigo-500/30'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
            }`}
          >
            {/* Top Title & Indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                  }`}
                >
                  {item.formulaId}°
                </span>
                <h4 className="font-game font-bold text-sm text-slate-100">{item.formulaName}</h4>
              </div>

              {isSelected && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === 'pt' ? 'Ativo' : 'Active'}
                </span>
              )}
            </div>

            {/* Angle & Power Primary Stat Boxes */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* Angle Box */}
              <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  {lang === 'pt' ? 'Ângulo' : 'Angle'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-game font-bold text-2xl text-emerald-400">
                    {item.recommendedAngle}°
                  </span>
                  {item.windCorrectionAngle !== 0 && (
                    <span
                      className={`text-[10px] font-mono ${
                        item.windCorrectionAngle > 0 ? 'text-teal-400' : 'text-rose-400'
                      }`}
                    >
                      ({item.windCorrectionAngle > 0 ? '+' : ''}{item.windCorrectionAngle})
                    </span>
                  )}
                </div>
              </div>

              {/* Power Box */}
              <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  {lang === 'pt' ? 'Força' : 'Power'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-game font-bold text-2xl text-amber-400">
                    {item.recommendedPower.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
                </div>
              </div>
            </div>

            {/* Notes & Explanation */}
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
              {item.notes}
            </p>

            {/* Bottom Details Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
              <span>
                {lang === 'pt' ? 'Alt:' : 'Elev:'} {item.heightCorrectionAngle > 0 ? `+${item.heightCorrectionAngle}°` : `${item.heightCorrectionAngle}°`}
              </span>
              <span className="flex items-center gap-0.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                {lang === 'pt' ? 'Aplicar' : 'Use'} <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
