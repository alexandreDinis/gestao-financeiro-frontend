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
    if (mes === 1) {
      onChange(ano - 1, 12);
    } else {
      onChange(ano, mes - 1);
    }
  };

  const goToNext = () => {
    if (mes === 12) {
      onChange(ano + 1, 1);
    } else {
      onChange(ano, mes + 1);
    }
  };

  return (
    <div className="flex items-center gap-3" id="month-year-selector">
      <button
        onClick={goToPrevious}
        className="p-2 rounded-lg border border-border/40 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 text-muted-foreground hover:text-primary"
        aria-label="Mês anterior"
        id="btn-previous-month"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="min-w-[180px] text-center px-4 py-2 rounded-lg border border-primary/20 bg-primary/5">
        <span className="text-lg font-bold text-white tracking-wide">
          {MESES[mes - 1]}
        </span>
        <span className="text-lg font-light text-muted-foreground ml-2">
          {ano}
        </span>
      </div>

      <button
        onClick={goToNext}
        className="p-2 rounded-lg border border-border/40 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 text-muted-foreground hover:text-primary"
        aria-label="Próximo mês"
        id="btn-next-month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
