"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, AlertCircle } from "lucide-react";
import { ResumoOrcamento } from "@/types";

interface Props {
  orcamentos: ResumoOrcamento[];
  loading: boolean;
}

export function DashboardBudgets({ orcamentos, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (loading) {
     return (
        <Card className="glass-panel h-full">
            <CardHeader>
                <CardTitle>Orçamentos do Mês</CardTitle>
                <CardDescription>Acompanhamento de gastos por categoria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                            <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded animate-pulse" />
                    </div>
                ))}
            </CardContent>
        </Card>
     );
  }

  if (!orcamentos || orcamentos.length === 0) return null;

  return (
    <Card className="glass-panel h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Orçamentos do Mês</CardTitle>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">Baseado nos orçamentos ativos para o período</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <CardDescription>Limites vs Gastos Reais</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 overflow-y-auto max-h-[350px] custom-scrollbar">
        <div className="space-y-6">
          {orcamentos.map((orcamento, index) => {
            const isNearLimit = orcamento.percentualUtilizado >= 80;
            const isOverLimit = orcamento.estourado || orcamento.percentualUtilizado >= 100;
            
            const progressColor = isOverLimit 
                ? "bg-red-500" 
                : isNearLimit 
                    ? "bg-yellow-500" 
                    : "bg-primary";

            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    {orcamento.categoria}
                    {orcamento.estourado && (
                        <AlertCircle size={14} className="text-red-500 animate-pulse" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatCurrency(orcamento.gasto)} / {formatCurrency(orcamento.limite)}
                  </span>
                </div>
                <div className="relative pt-1">
                   <Progress 
                    value={Math.min(orcamento.percentualUtilizado, 100)} 
                    className="h-2 bg-white/5"
                    indicatorClassName={progressColor}
                   />
                   <div className="flex justify-between mt-1">
                      <span className={`text-[10px] font-bold ${isOverLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-primary-foreground/70'}`}>
                        {orcamento.percentualUtilizado.toFixed(1)}% utilizado
                      </span>
                      {isOverLimit && (
                        <span className="text-[10px] text-red-400 font-bold uppercase">Excedido</span>
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
