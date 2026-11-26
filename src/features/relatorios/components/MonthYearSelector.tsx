"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface MonthYearSelectorProps {
  mes: number;
  ano: number;
  onChange: (ano: number, mes: number) => void;
}

export function MonthYearSelector({ mes, ano, onChange }: MonthYearSelectorProps) {
  const goToPrevious = () => {
    if (mes === 1) onChange(ano - 1, 12);
    else onChange(ano, mes - 1);
  };

  const goToNext = () => {
    if (mes === 12) onChange(ano + 1, 1);
    else onChange(ano, mes + 1);
  };

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-1 rounded-xl glass-panel border border-white/10"
      id="month-year-selector"
    >
      <button
        type="button"
        onClick={goToPrevious}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Mês anterior"
        id="btn-previous-month"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="min-w-[146px] text-center px-2">
        <span className="text-sm font-semibold text-foreground">{MESES[mes - 1]}</span>
        <span className="text-sm text-muted-foreground ml-1.5 tabular-nums">{ano}</span>
      </div>

      <button
        type="button"
        onClick={goToNext}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Próximo mês"
        id="btn-next-month"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
