"use client";

import { useState, useEffect } from "react";
import { useOrcamentosSugestaoQuery } from "../hooks/use-orcamentos-query";
import { useSalvarLoteOrcamentosMutation } from "../hooks/use-orcamentos-mutation";
import { OrcamentoSugestaoResponse } from "../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, Wand2, ArrowUpRight, ArrowDownRight, RefreshCw, Percent, Calculator } from "lucide-react";

interface GerarOrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mes: number;
  ano: number;
}

interface CategoriaAjuste {
  categoriaId: number;
  categoriaNome: string;
  categoriaCor: string;
  mediaHistorica: number;
  percentualAjuste: number; // e.g. 10 for +10%, -5 for -5%
  limiteCalculado: number;
}

export function GerarOrcamentoDialog({ open, onOpenChange, mes, ano }: GerarOrcamentoDialogProps) {
  const [mesesHistorico, setMesesHistorico] = useState<number>(3);
  const [globalPercent, setGlobalPercent] = useState<number>(0);
  const [itensAjuste, setItensAjuste] = useState<CategoriaAjuste[]>([]);

  const { data: sugestoes, isLoading, refetch } = useOrcamentosSugestaoQuery(mes, ano, mesesHistorico, open);
  const salvarLoteMutation = useSalvarLoteOrcamentosMutation(mes, ano);

  useEffect(() => {
    if (sugestoes) {
      setItensAjuste(
        sugestoes.map((s) => {
          const baseValue = s.limiteSugerido > 0 ? s.limiteSugerido : s.mediaHistorica;
          return {
            categoriaId: s.categoriaId,
            categoriaNome: s.categoriaNome,
            categoriaCor: s.categoriaCor,
            mediaHistorica: s.mediaHistorica,
            percentualAjuste: 0,
            limiteCalculado: baseValue,
          };
        })
      );
    }
  }, [sugestoes]);

  const handleGlobalPercentChange = (val: number) => {
    setGlobalPercent(val);
    setItensAjuste((prev) =>
      prev.map((item) => {
        const base = item.mediaHistorica > 0 ? item.mediaHistorica : item.limiteCalculado;
        const novoCalculado = Math.max(0, base * (1 + val / 100));
        return {
          ...item,
          percentualAjuste: val,
          limiteCalculado: Number(novoCalculado.toFixed(2)),
        };
      })
    );
  };

  const handleCategoryPercentChange = (catId: number, percent: number) => {
    setItensAjuste((prev) =>
      prev.map((item) => {
        if (item.categoriaId !== catId) return item;
        const base = item.mediaHistorica > 0 ? item.mediaHistorica : item.limiteCalculado;
        const novoCalculado = Math.max(0, base * (1 + percent / 100));
        return {
          ...item,
          percentualAjuste: percent,
          limiteCalculado: Number(novoCalculado.toFixed(2)),
        };
      })
    );
  };

  const handleCategoryValueChange = (catId: number, valor: number) => {
    setItensAjuste((prev) =>
      prev.map((item) => {
        if (item.categoriaId !== catId) return item;
        const base = item.mediaHistorica;
        let p = 0;
        if (base > 0) {
          p = Number((((valor - base) / base) * 100).toFixed(1));
        }
        return {
          ...item,
          percentualAjuste: p,
          limiteCalculado: Math.max(0, valor),
        };
      })
    );
  };

  const totalHistorico = itensAjuste.reduce((acc, i) => acc + i.mediaHistorica, 0);
  const totalCalculado = itensAjuste.reduce((acc, i) => acc + i.limiteCalculado, 0);
  const diferencaTotal = totalCalculado - totalHistorico;
  const percentualTotalGlobal = totalHistorico > 0 ? (diferencaTotal / totalHistorico) * 100 : 0;

  const handleConfirmar = () => {
    salvarLoteMutation.mutate(
      {
        mes,
        ano,
        orcamentos: itensAjuste.map((i) => ({
          categoriaId: i.categoriaId,
          limite: i.limiteCalculado,
        })),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col glass-panel border-border/40 bg-zinc-950/95 text-white p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]">
              <Wand2 size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                Gerar Orçamento Automático
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                Calcule sugestões com base no seu histórico e ajuste os percentuais por modalidade.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Controls Bar: Historical Period & Global Percentage Adjustment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-border/30">
            {/* Historical Window */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Janela do Histórico
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "1 Mês", value: 1 },
                  { label: "3 Meses", value: 3 },
                  { label: "6 Meses", value: 6 },
                ].map((window) => (
                  <Button
                    key={window.value}
                    type="button"
                    variant={mesesHistorico === window.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMesesHistorico(window.value)}
                    className={`flex-1 text-xs h-8 ${
                      mesesHistorico === window.value
                        ? "bg-primary text-black font-bold"
                        : "bg-white/5 border-border/30 hover:bg-white/10 text-white/80"
                    }`}
                  >
                    {window.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Global Percentage Adjuster */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Ajuste Global (% em todas)
              </label>
              <div className="flex items-center gap-1.5">
                {[-10, -5, 0, 5, 10].map((pct) => (
                  <Button
                    key={pct}
                    type="button"
                    variant={globalPercent === pct ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleGlobalPercentChange(pct)}
                    className={`flex-1 text-xs h-8 ${
                      globalPercent === pct
                        ? "bg-primary text-black font-bold"
                        : "bg-white/5 border-border/30 hover:bg-white/10 text-white/80"
                    }`}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Categories / Modalities List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Calculator size={16} className="text-primary" />
                Modalidades de Despesa ({itensAjuste.length})
              </h3>
              <span className="text-xs text-muted-foreground">
                Insira o % de acréscimo/redução ou edite o valor diretamente
              </span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Analisando histórico de despesas...</p>
              </div>
            ) : itensAjuste.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-xl text-muted-foreground">
                Nenhuma categoria de despesa cadastrada para calcular orçamento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {itensAjuste.map((item) => {
                  const isPositive = item.percentualAjuste > 0;
                  const isNegative = item.percentualAjuste < 0;

                  return (
                    <div
                      key={item.categoriaId}
                      className="glass-panel p-3.5 rounded-xl border border-border/30 hover:border-border/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20"
                    >
                      {/* Category Info & History */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.categoriaCor || "#10B981" }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-white leading-tight">
                            {item.categoriaNome}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Média: <span className="text-white/80 font-medium">{formatCurrency(item.mediaHistorica)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Percent Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-black/50 border border-border/40 rounded-lg p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded text-muted-foreground hover:text-white"
                            onClick={() => handleCategoryPercentChange(item.categoriaId, item.percentualAjuste - 5)}
                          >
                            -5%
                          </Button>
                          <div className="relative w-16 px-1">
                            <Input
                              type="number"
                              value={item.percentualAjuste === 0 ? "0" : item.percentualAjuste}
                              onChange={(e) =>
                                handleCategoryPercentChange(item.categoriaId, parseFloat(e.target.value) || 0)
                              }
                              className="h-7 text-xs text-center p-0 bg-transparent border-0 font-bold text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded text-muted-foreground hover:text-white"
                            onClick={() => handleCategoryPercentChange(item.categoriaId, item.percentualAjuste + 5)}
                          >
                            +5%
                          </Button>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">%</span>
                      </div>

                      {/* Calculated Limit Input */}
                      <div className="flex items-center gap-2 justify-end min-w-[140px]">
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">Orçamento Final</span>
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.limiteCalculado}
                              onChange={(e) =>
                                handleCategoryValueChange(item.categoriaId, parseFloat(e.target.value) || 0)
                              }
                              className="h-8 w-28 text-right text-xs font-bold bg-black/40 border-border/40 text-primary focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Summary */}
        <DialogFooter className="p-4 px-6 border-t border-border/20 bg-black/60 flex-row items-center justify-between sm:justify-between">
          <div className="text-left">
            <span className="text-xs text-muted-foreground block">Total Orçamento Previsto</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white">{formatCurrency(totalCalculado)}</span>
              {percentualTotalGlobal !== 0 && (
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    percentualTotalGlobal > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {percentualTotalGlobal > 0 ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {Math.abs(percentualTotalGlobal).toFixed(1)}% vs histórico
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmar}
              disabled={salvarLoteMutation.isPending || itensAjuste.length === 0}
              className="bg-primary text-black font-bold hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            >
              {salvarLoteMutation.isPending ? (
                <RefreshCw size={16} className="animate-spin mr-2" />
              ) : (
                <Sparkles size={16} className="mr-2" />
              )}
              Confirmar e Salvar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
