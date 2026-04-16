"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface PagarLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divida: Divida | null;
  tipo: TipoDivida;
}

const pagarLoteSchema = z.object({
  contaId: z.number().min(1, "Selecione uma conta"),
  dataPagamento: z.string().nonempty("Data é obrigatória"),
  desconto: z.number().min(0, "Desconto não pode ser negativo").optional(),
});

type PagarLoteFormValues = z.infer<typeof pagarLoteSchema>;

export function PagarLoteDialog({ open, onOpenChange, divida, tipo }: PagarLoteDialogProps) {
  const pagarLoteMutation = usePagarMultiplasParcelasMutation();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    }
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<PagarLoteFormValues>({
    resolver: zodResolver(pagarLoteSchema) as any,
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
      desconto: 0,
    }
  });

  const descontoWatch = watch("desconto") || 0;

  // Reset selection when dialog opens with a new divida
  useEffect(() => {
    if (open && divida) {
      setSelectedIds(new Set());
      reset({
        dataPagamento: new Date().toISOString().split("T")[0],
        desconto: 0,
      });
    }
  }, [open, divida, reset]);

  // Auto-selecionar primeira conta
  useEffect(() => {
    const currentContaId = watch("contaId");
    if (contas && contas.length > 0 && !currentContaId) {
      setValue("contaId", contas[0].id);
    }
  }, [contas, setValue, watch]);

  // Parcelas pendentes ordenadas
  const parcelasPendentes = useMemo(() => {
    if (!divida) return [];
    return [...divida.parcelas]
      .filter(p => p.status !== 'PAGO' && p.status !== 'CANCELADO')
      .sort((a, b) => a.numeroParcela - b.numeroParcela);
  }, [divida]);

  // Cálculos
  const subtotal = useMemo(() => {
    return parcelasPendentes
      .filter(p => selectedIds.has(p.id))
      .reduce((acc, p) => acc + p.valor, 0);
  }, [selectedIds, parcelasPendentes]);

  const totalAPagar = Math.max(0, subtotal - descontoWatch);

  // Toggle de seleção
  const toggleParcela = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Selecionar "próximas N"
  const selecionarProximas = (count: number) => {
    const ids = new Set<number>();
    for (let i = 0; i < Math.min(count, parcelasPendentes.length); i++) {
      ids.add(parcelasPendentes[i].id);
    }
    setSelectedIds(ids);
  };

  const onSubmit = async (data: PagarLoteFormValues) => {
    if (selectedIds.size === 0) return;

    await pagarLoteMutation.mutateAsync({
      parcelaIds: Array.from(selectedIds),
      contaId: data.contaId,
      dataPagamento: data.dataPagamento,
      desconto: data.desconto && data.desconto > 0 ? data.desconto : undefined,
    });

    reset();
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  if (!divida) return null;

  const isReceber = tipo === "A_RECEBER";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[560px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            {isReceber ? "Receber Múltiplas Parcelas" : "Pagar Múltiplas Parcelas"}
          </DialogTitle>
          <DialogDescription>
            Selecione as parcelas que deseja {isReceber ? "receber" : "quitar"} de uma vez.
            {" "}Opcionalmente, aplique um desconto negociado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1 overflow-hidden">
          
          {/* Resumo da dívida */}
          <div className="bg-black/20 p-3 rounded-lg text-sm border border-border/20">
            <div className="flex justify-between text-muted-foreground mb-1">
              <span className="font-medium text-white">{divida.pessoaNome}</span>
              <span>{divida.descricao}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {parcelasPendentes.length} parcela(s) pendente(s) de {divida.totalParcelas}
            </div>
          </div>

          {/* Seleção rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Seleção rápida:</span>
            {[
              { label: "Todas", count: parcelasPendentes.length },
              ...(parcelasPendentes.length > 3 ? [{ label: "3", count: 3 }] : []),
              ...(parcelasPendentes.length > 5 ? [{ label: "5", count: 5 }] : []),
              ...(parcelasPendentes.length > 10 ? [{ label: "10", count: 10 }] : []),
            ].map(opt => (
              <Button
                key={opt.label}
                type="button"
                variant="outline"
                size="sm"
                className={`h-7 text-xs px-3 transition-all ${
                  selectedIds.size === opt.count 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'border-border/50 text-muted-foreground hover:text-white hover:border-primary/50'
                }`}
                onClick={() => selecionarProximas(opt.count)}
              >
                {opt.label === "Todas" ? "Todas" : `Próximas ${opt.label}`}
              </Button>
            ))}
            {selectedIds.size > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-muted-foreground hover:text-white"
                onClick={() => setSelectedIds(new Set())}
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Lista de parcelas com checkboxes */}
          <div className="flex-1 overflow-y-auto border border-border/20 rounded-lg bg-black/10 max-h-[240px]">
            {parcelasPendentes.map((p) => {
              const isSelected = selectedIds.has(p.id);
              const isAtrasado = new Date(p.dataVencimento) < new Date();

              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-border/10 last:border-0 transition-colors
                    ${isSelected ? 'bg-primary/5' : 'hover:bg-white/[0.02]'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleParcela(p.id)}
                    className="h-4 w-4 rounded border-border/50 accent-primary cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        Parcela {p.numeroParcela}/{divida.totalParcelas}
                      </span>
                      {isAtrasado && (
                        <span className="text-[9px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                          ATRASADA
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Vencimento: {format(new Date(p.dataVencimento), "dd/MM/yyyy")}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                    {formatCurrency(p.valor)}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Resumo financeiro */}
          {selectedIds.size > 0 && (
            <div className="bg-gradient-to-r from-primary/5 to-transparent p-4 rounded-lg border border-primary/20 space-y-2 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tag size={12} />
                  Subtotal ({selectedIds.size} parcela{selectedIds.size > 1 ? 's' : ''})
                </span>
                <span className="text-white font-medium">{formatCurrency(subtotal)}</span>
              </div>

              {/* Campo de desconto */}
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

              {descontoWatch > 0 && (
                <div className="text-[10px] text-green-400/80 text-right">
                  Economia de {((descontoWatch / subtotal) * 100).toFixed(1)}% sobre o valor original
                </div>
              )}
            </div>
          )}

          {/* Conta e data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Conta</Label>
              <Controller
                name="contaId"
                control={control}
                render={({ field }) => (
                  <Select 
                    key={`select-conta-lote-${contas?.length || 0}-${field.value}`}
                    onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                    value={field.value?.toString() || ""}
                  >
                    <SelectTrigger className={`bg-black/40 border-border/50 h-9 text-xs ${errors.contaId ? 'border-red-500/50' : ''}`}>
                      <SelectValue placeholder="Conta">
                        {field.value 
                          ? contas?.find(c => c.id === field.value)?.nome 
                          : undefined}
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
              {errors.contaId && <p className="text-red-400 text-xs">{errors.contaId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data do Pagamento</Label>
              <Input
                type="date"
                className="bg-black/40 border-border/50 h-9 text-xs"
                {...register("dataPagamento")}
              />
              {errors.dataPagamento && <p className="text-red-400 text-xs">{errors.dataPagamento.message}</p>}
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
