"use client";

import { useOrcamentosResumoQuery } from "../hooks/use-orcamentos-query";
import { useDeletarOrcamentoMutation } from "../hooks/use-orcamentos-mutation";
import { OrcamentoResumoResponse } from "../types";
import { OrcamentoFormDialog } from "./orcamento-form";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Target, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrcamentosListProps {
  mes: number;
  ano: number;
}

export function OrcamentosList({ mes, ano }: OrcamentosListProps) {
  const { data: orcamentos, isLoading } = useOrcamentosResumoQuery(mes, ano);
  const deletarMutation = useDeletarOrcamentoMutation(mes, ano);

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<OrcamentoResumoResponse | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleEdit = (orcamento: OrcamentoResumoResponse) => {
    setEditingOrcamento(orcamento);
    setFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingOrcamento(undefined);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground animate-pulse">Carregando métricas de orçamento...</p>
      </div>
    );
  }

  const totalOrcado = orcamentos?.reduce((acc, curr) => acc + curr.limite, 0) || 0;
  const totalGasto = orcamentos?.reduce((acc, curr) => acc + curr.gasto, 0) || 0;
  const percentualGeral = totalOrcado > 0 ? (totalGasto / totalOrcado) * 100 : 0;
  const restanteGeral = totalOrcado - totalGasto;

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
    if (percent >= 70) return "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
    return "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]";
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl border border-border/40 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-primary/10 transition-colors">
            <Target size={100} />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1 relative z-10">Total Orçado</p>
          <p className="text-2xl font-bold text-white relative z-10">{formatCurrency(totalOrcado)}</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-border/40">
          <p className="text-sm font-medium text-muted-foreground mb-1">Total Movimentado (Despesas)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{formatCurrency(totalGasto)}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              percentualGeral >= 90 ? "bg-red-500/20 text-red-500" :
              percentualGeral >= 70 ? "bg-yellow-500/20 text-yellow-500" :
              "bg-primary/20 text-primary"
            }`}>
              {percentualGeral.toFixed(1)}% do total
            </span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border border-border/40">
          <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Disponível (Orçamentos)</p>
          <p className={`text-2xl font-bold ${restanteGeral < 0 ? "text-red-500" : "text-green-400"}`}>
            {restanteGeral < 0 ? "-" : "+"}{formatCurrency(Math.abs(restanteGeral))}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracing-wide flex items-center gap-2">
          Detalhamento por Categoria
        </h2>
        <Button onClick={handleCreateNew} className="bg-primary/80 hover:bg-primary text-black">
          Nova Meta
        </Button>
      </div>

      {orcamentos?.length === 0 ? (
        <div className="glass-panel p-10 text-center rounded-xl border border-border/40 flex flex-col items-center">
          <Target size={48} className="text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Sem metas para este mês</h3>
          <p className="text-muted-foreground max-w-md">
            Definir um limite de gastos ajuda a ter mais controle financeiro. Crie uma meta para categorias importantes como Restaurante ou Cartão de Crédito.
          </p>
          <Button onClick={handleCreateNew} className="mt-6 font-bold bg-primary text-black hover:bg-primary/90">
            Começar Agora
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orcamentos?.map((orc) => {
            const isOverBudget = orc.percentual > 100;
            const progressValue = Math.min(orc.percentual, 100);

            return (
              <div key={orc.orcamentoId} className="glass-panel p-5 rounded-xl border border-border/40 transition-all hover:bg-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 border border-white/10"
                    >
                      {orc.categoriaCor ? (
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: orc.categoriaCor }} />
                      ) : (
                        <Target size={18} className="text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{orc.categoriaNome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {isOverBudget 
                          ? <span className="text-red-500 font-medium">Ultrapassou {formatCurrency(Math.abs(orc.restante))}</span>
                          : <span>Restam {formatCurrency(orc.restante)} do limite</span>
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1.5 mb-1">
                        <span className="text-lg font-bold text-white">{formatCurrency(orc.gasto)}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-sm text-primary">{formatCurrency(orc.limite)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 border-l border-border/40 pl-4">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(orc)} className="text-muted-foreground hover:text-white">
                        <Pencil size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        onClick={() => deletarMutation.mutate(orc.orcamentoId)} 
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Intelligent Progress Bar */}
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full ${
                        orc.percentual >= 90 ? "text-red-500 bg-red-500/10" : 
                        orc.percentual >= 70 ? "text-yellow-500 bg-yellow-500/10" : 
                        "text-primary bg-primary/10"
                      }`}>
                        Uso: {orc.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2.5 mb-2 text-xs flex rounded-full bg-black/50 border border-white/5">
                    <div 
                      style={{ width: `${progressValue}%` }}
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out ${getProgressColor(orc.percentual)}`}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
         <OrcamentoFormDialog 
           open={formOpen} 
           onOpenChange={setFormOpen} 
           orcamento={editingOrcamento} 
           mesContexto={mes} 
           anoContexto={ano} 
         />
      )}
    </div>
  );
}
