"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";

import { usePagarMultiplasParcelasMutation } from "../hooks/use-dividas-mutation";
import { Divida, ParcelaDivida, TipoDivida } from "../types";
import { Conta, ApiResponse } from "@/types";
import { formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tag, 
  Minus, 
  Equal, 
  CheckCircle2,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ParcelaComDivida extends ParcelaDivida {
  dividaId: number;
  dividaDescricao: string;
  pessoaNome: string;
}

interface PagarLoteMesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dividas: Divida[];
  tipo: TipoDivida;
  mes?: number;
  ano?: number;
}

interface FormValues {
  contaId: number;
  dataPagamento: string;
  desconto: number;
}

export function PagarLoteMesDialog({ open, onOpenChange, dividas, tipo, mes, ano }: PagarLoteMesDialogProps) {
  const pagarLoteMutation = usePagarMultiplasParcelasMutation();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    }
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
      desconto: 0,
      contaId: 0,
    }
  });

  const descontoWatch = watch("desconto") || 0;

  // Flatten all pending parcelas from all dividas
  const todasParcelas = useMemo((): ParcelaComDivida[] => {
    const result: ParcelaComDivida[] = [];
    for (const divida of dividas) {
      for (const p of divida.parcelas) {
        if (p.status !== 'PAGO' && p.status !== 'CANCELADO') {
          result.push({
            ...p,
            dividaId: divida.id,
            dividaDescricao: divida.descricao,
            pessoaNome: divida.pessoaNome || "Sem pessoa",
          });
        }
      }
    }
    return result.sort((a, b) => a.pessoaNome.localeCompare(b.pessoaNome) || a.dividaDescricao.localeCompare(b.dividaDescricao));
  }, [dividas]);

  // Agrupar por pessoa
  const gruposPorPessoa = useMemo(() => {
    const map = new Map<string, ParcelaComDivida[]>();
    for (const p of todasParcelas) {
      const key = p.pessoaNome;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [todasParcelas]);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      // Auto-select all
      setSelectedIds(new Set(todasParcelas.map(p => p.id)));
      setExpandedGroups(new Set(gruposPorPessoa.keys()));
      reset({
        dataPagamento: new Date().toISOString().split("T")[0],
        desconto: 0,
        contaId: 0,
      });
    }
  }, [open, todasParcelas, gruposPorPessoa, reset]);

  // Auto-select first account
  useEffect(() => {
    if (contas && contas.length > 0 && !watch("contaId")) {
      setValue("contaId", contas[0].id);
    }
  }, [contas, setValue, watch]);

  // Calculations  
  const subtotal = useMemo(() => {
    return todasParcelas
      .filter(p => selectedIds.has(p.id))
      .reduce((acc, p) => acc + p.valor, 0);
  }, [selectedIds, todasParcelas]);

  const totalAPagar = Math.max(0, subtotal - descontoWatch);

  const toggleParcela = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGrupoPessoa = (nome: string) => {
    const parcelas = gruposPorPessoa.get(nome) || [];
    const allSelected = parcelas.every(p => selectedIds.has(p.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      for (const p of parcelas) {
        if (allSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  };

  const toggleExpandGroup = (nome: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(nome)) next.delete(nome);
      else next.add(nome);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(todasParcelas.map(p => p.id)));
  const selectNone = () => setSelectedIds(new Set());

  const onSubmit = async (data: FormValues) => {
    if (selectedIds.size === 0) return;
    if (!data.contaId || data.contaId === 0) return;

    const descontoTotal = data.desconto || 0;

    // Group selected parcelas by divida and calculate subtotals
    const byDivida = new Map<number, { parcelaIds: number[]; subtotal: number }>();
    for (const p of todasParcelas) {
      if (!selectedIds.has(p.id)) continue;
      if (!byDivida.has(p.dividaId)) byDivida.set(p.dividaId, { parcelaIds: [], subtotal: 0 });
      const entry = byDivida.get(p.dividaId)!;
      entry.parcelaIds.push(p.id);
      entry.subtotal += p.valor;
    }

    try {
      // Distribute discount proportionally across dividas
      const totalSelecionado = subtotal;
      
      for (const [, batch] of byDivida) {
        let descontoBatch: number | undefined = undefined;
        if (descontoTotal > 0 && totalSelecionado > 0) {
          // Proportional discount: (batch subtotal / total) * total discount
          descontoBatch = Math.round((batch.subtotal / totalSelecionado) * descontoTotal * 100) / 100;
        }

        await pagarLoteMutation.mutateAsync({
          parcelaIds: batch.parcelaIds,
          contaId: data.contaId,
          dataPagamento: data.dataPagamento,
          desconto: descontoBatch && descontoBatch > 0 ? descontoBatch : undefined,
        });
      }

      reset();
      setSelectedIds(new Set());
      onOpenChange(false);
    } catch (error) {
      // Error is handled by mutation's onError
    }
  };

  const isReceber = tipo === "A_RECEBER";
  const mesLabel = mes ? `${String(mes).padStart(2, '0')}/${ano}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            {isReceber ? "Receber Todas do Mês" : "Pagar Todas do Mês"} {mesLabel && `(${mesLabel})`}
          </DialogTitle>
          <DialogDescription>
            {todasParcelas.length} parcela(s) pendente(s) de {dividas.length} dívida(s).
            Selecione quais deseja {isReceber ? "receber" : "quitar"} de uma vez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(watch()); }} className="flex flex-col gap-3 flex-1 overflow-hidden">
          
          {/* Quick selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Seleção:</span>
            <Button
              type="button" variant="outline" size="sm"
              className={`h-7 text-xs px-3 ${selectedIds.size === todasParcelas.length ? 'bg-primary/20 border-primary text-primary' : 'border-border/50'}`}
              onClick={selectAll}
            >
              Todas ({todasParcelas.length})
            </Button>
            {selectedIds.size > 0 && (
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs px-2 text-muted-foreground" onClick={selectNone}>
                Limpar
              </Button>
            )}
          </div>

          {/* Parcelas grouped by person */}
          <div className="flex-1 overflow-y-auto border border-border/20 rounded-lg bg-black/10 max-h-[300px]">
            {Array.from(gruposPorPessoa.entries()).map(([nome, parcelas]) => {
              const isExpanded = expandedGroups.has(nome);
              const allSelected = parcelas.every(p => selectedIds.has(p.id));
              const someSelected = parcelas.some(p => selectedIds.has(p.id));
              const subtotalGrupo = parcelas.filter(p => selectedIds.has(p.id)).reduce((acc, p) => acc + p.valor, 0);

              return (
                <div key={nome} className="border-b border-border/20 last:border-0">
                  {/* Person header */}
                  <div className="flex items-center gap-3 px-3 py-2.5 bg-black/20 cursor-pointer hover:bg-black/30 transition-colors"
                    onClick={() => toggleExpandGroup(nome)}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                      onChange={(e) => { e.stopPropagation(); toggleGrupoPessoa(nome); }}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded border-border/50 accent-primary cursor-pointer shrink-0"
                    />
                    <User size={14} className="text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white">{nome}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {parcelas.length} parcela(s)
                      </span>
                    </div>
                    <span className="text-sm font-bold text-primary/80 mr-2">
                      {formatCurrency(subtotalGrupo)}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>

                  {/* Parcelas */}
                  {isExpanded && parcelas.map((p) => {
                    const isSelected = selectedIds.has(p.id);
                    const isAtrasado = new Date(p.dataVencimento) < new Date();

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 px-3 pl-10 py-2 cursor-pointer border-b border-border/10 last:border-0 transition-colors
                          ${isSelected ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleParcela(p.id)}
                          className="h-3.5 w-3.5 rounded border-border/50 accent-primary cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-white/80">{p.dividaDescricao}</span>
                            <span className="text-[10px] text-muted-foreground">
                              P{p.numeroParcela}
                            </span>
                            {isAtrasado && (
                              <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1 py-0.5 rounded">
                                ATRASADA
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            Vence: {format(new Date(p.dataVencimento), "dd/MM/yyyy")}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                          {formatCurrency(p.valor)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Financial summary */}
          {selectedIds.size > 0 && (
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border border-primary/20 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag size={12} />
                  Subtotal ({selectedIds.size} parcela{selectedIds.size > 1 ? 's' : ''})
                </span>
                <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Minus size={12} />
                  Desconto
                </span>
                <div className="w-36">
                  <Controller
                    name="desconto"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <NumericFormat
                        value={value || ""}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(values) => onChange(values.floatValue || 0)}
                        customInput={Input}
                        className="bg-black/40 border-border/40 h-8 text-sm text-right text-green-400"
                        placeholder="R$ 0,00"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-primary/20 pt-2 flex justify-between text-sm">
                <span className={`font-bold flex items-center gap-1.5 ${isReceber ? 'text-green-400' : 'text-white'}`}>
                  <Equal size={12} />
                  Total a {isReceber ? 'receber' : 'pagar'}
                </span>
                <span className={`text-lg font-bold ${isReceber ? 'text-green-400' : 'text-primary'}`}>
                  {formatCurrency(totalAPagar)}
                </span>
              </div>
            </div>
          )}

          {/* Account and date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Conta</Label>
              <Controller
                name="contaId"
                control={control}
                render={({ field }) => (
                  <Select 
                    key={`select-conta-mes-${contas?.length || 0}-${field.value}`}
                    onValueChange={(val) => field.onChange(Number(val))} 
                    value={field.value?.toString() || ""}
                  >
                    <SelectTrigger className="bg-black/40 border-border/50 h-9 text-xs">
                      <SelectValue placeholder="Conta">
                        {field.value ? contas?.find(c => c.id === field.value)?.nome : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-border/40">
                      {contas?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data do Pagamento</Label>
              <Input
                type="date"
                className="bg-black/40 border-border/50 h-9 text-xs"
                {...register("dataPagamento")}
              />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-transparent border-border/50 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pagarLoteMutation.isPending || selectedIds.size === 0}
              className={`${isReceber ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'} gap-2`}
            >
              {pagarLoteMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {pagarLoteMutation.isPending 
                ? "Processando..." 
                : `${isReceber ? 'Receber' : 'Pagar'} ${selectedIds.size} Parcela${selectedIds.size > 1 ? 's' : ''}`
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
