"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";

import { usePagarParcelaMutation } from "../hooks/use-dividas-mutation";
import { ParcelaDivida, TipoDivida } from "../types";
import { Conta, ApiResponse } from "@/types";

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
import { AlertCircle } from "lucide-react";

interface PagarParcelaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: ParcelaDivida | null;
  tipo: TipoDivida;
}

const pagarSchema = z.object({
  contaId: z.number().min(1, "Selecione uma conta"),
  valorPago: z.number().positive("O valor deve ser maior que zero"),
  dataPagamento: z.string().nonempty("Data é obrigatória"),
});

type PagarFormValues = z.infer<typeof pagarSchema>;

export function PagarParcelaDialog({ open, onOpenChange, parcela, tipo }: PagarParcelaDialogProps) {
  const pagarMutation = usePagarParcelaMutation();

  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    }
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<PagarFormValues>({
    resolver: zodResolver(pagarSchema) as any,
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
    }
  });

  const valorPagoWatch = watch("valorPago");

  // Ao abrir o modal e ter a parcela, seta o valor real
  useEffect(() => {
    if (parcela) {
      setValue("valorPago", parcela.valor);
    }
  }, [parcela, setValue]);

  // Auto-selecionar primeira conta se houver
  useEffect(() => {
    const currentContaId = watch("contaId");
    if (contas && contas.length > 0 && !currentContaId) {
      setValue("contaId", contas[0].id);
    }
  }, [contas, setValue, watch]);

  const onSubmit = async (data: PagarFormValues) => {
    if (!parcela) return;

    await pagarMutation.mutateAsync({
      parcelaId: parcela.id,
      request: {
        contaId: data.contaId,
        valorPago: data.valorPago,
        dataPagamento: data.dataPagamento
      }
    });
    
    reset();
    onOpenChange(false);
  };

  const isPartial = parcela && valorPagoWatch && valorPagoWatch < parcela.valor;

  if (!parcela) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tipo === "A_RECEBER" ? "Registrar Recebimento" : "Pagar Parcela"}</DialogTitle>
          <DialogDescription>
            Confirme os detalhes do {tipo === "A_RECEBER" ? "recebimento" : "pagamento"} abaixo. Você pode ajustar o valor para pagamentos parciais.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          
          <div className="bg-black/20 p-3 rounded text-sm border border-border/20">
             <div className="flex justify-between text-muted-foreground mb-1">
                <span>Parcela {parcela.numeroParcela}</span>
                <span>Vencimento: {format(new Date(parcela.dataVencimento), "dd/MM/yyyy")}</span>
             </div>
             <div className="text-xl font-bold {tipo === 'A_RECEBER' ? 'text-green-400' : 'text-white'}">
                R$ {parcela.valor.toFixed(2).replace('.', ',')} pendentes
             </div>
          </div>

          <div className="space-y-2">
            <Label>Valor a ser computado (R$)</Label>
            <Controller
              name="valorPago"
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
                   className={`bg-black/40 text-lg border-border/50 ${errors.valorPago ? 'border-red-500/50' : ''}`}
                 />
              )}
            />
            {errors.valorPago && <p className="text-red-400 text-xs">{errors.valorPago.message}</p>}
            
            {isPartial && (
              <p className="text-orange-400 text-xs flex items-center gap-1 mt-1">
                <AlertCircle size={12} />
                Pagamento parcial detectado. O restante (R$ {(parcela.valor - valorPagoWatch).toFixed(2).replace('.', ',')}) continuará pendente.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Conta</Label>
            <Controller
              name="contaId"
              control={control}
              render={({ field }) => (
                <Select 
                  key={`select-conta-${contas?.length || 0}-${field.value}`}
                  onValueChange={(val) => field.onChange(val ? Number(val) : null)} 
                  value={field.value?.toString() || ""}
                >
                  <SelectTrigger className={`bg-black/40 border-border/50 ${errors.contaId ? 'border-red-500/50' : ''}`}>
                    <SelectValue placeholder="Selecione a conta">
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

          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              className="bg-black/40 border-border/50"
              {...register("dataPagamento")}
            />
            {errors.dataPagamento && <p className="text-red-400 text-xs">{errors.dataPagamento.message}</p>}
          </div>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
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
              disabled={pagarMutation.isPending}
              className={`${tipo === 'A_RECEBER' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-white'}`}
            >
              {pagarMutation.isPending ? "Processando..." : (tipo === 'A_RECEBER' ? "Confirmar Recebimento" : "Confirmar Pagamento")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
