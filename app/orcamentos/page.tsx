"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { OrcamentosList } from "@/features/orcamentos/components/orcamentos-list";
import { Target, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subMonths, addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function OrcamentosPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const mesAtual = currentDate.getMonth() + 1;
  const anoAtual = currentDate.getFullYear();

  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header com Navegação de Meses */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Metas e Orçamentos</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Target size={18} className="text-primary" />
              Estipule tetos de gastos e acompanhe sua saúde financeira
            </p>
          </div>

          <div className="flex items-center gap-4 bg-black/40 border border-border/50 rounded-full p-1 shadow-inner">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <ChevronLeft size={20} />
            </Button>
            
            <div className="w-[140px] text-center">
              <span className="font-semibold text-white capitalize text-lg">
                {format(currentDate, "MMMM", { locale: ptBR })}
              </span>
              <span className="text-muted-foreground ml-1 font-medium">
                {format(currentDate, "yyyy")}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="rounded-full hover:bg-white/10 text-muted-foreground hover:text-white"
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>

        {/* Módulo Principal */}
        <OrcamentosList mes={mesAtual} ano={anoAtual} />
        
      </div>
    </AppLayout>
  );
}
