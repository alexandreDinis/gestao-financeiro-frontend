"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";
import { CheckCircle2 } from "lucide-react";

import { useRegistrarAmortizacaoMutation } from "../hooks/use-dividas-mutation";
import type { Divida } from "../types";
import type { ApiResponse, Conta } from "@/types";
import { useAuth } from "@/hooks/use-auth";

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divida: Divida | null;
}

const schema = z.object({
  contaId: z.number().min(1, "Selecione uma conta"),
  valorPago: z.number().positive("O valor deve ser maior que zero"),
  dataPagamento: z.string().nonempty("Data é obrigatória"),
});

type FormValues = z.infer<typeof schema>;

export function AmortizarSaldoDialog({ open, onOpenChange, divida }: Props) {
  const { user } = useAuth();
  const amortizarMutation = useRegistrarAmortizacaoMutation();

  const { data: contas } = useQuery({
    queryKey: ["contas", user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    },
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
      valorPago: 0,
    },
  });

  const valorPagoWatch = watch("valorPago") || 0;

  useEffect(() => {
    if (open && divida) {
      setValue("valorPago", 0);
      setValue("dataPagamento", new Date().toISOString().split("T")[0]);
    }
  }, [open, divida, setValue]);

  useEffect(() => {
    const currentContaId = watch("contaId");
    if (contas && contas.length > 0 && !currentContaId) {
      setValue("contaId", contas[0].id);
    }
  }, [contas, setValue, watch]);

  if (!divida) return null;

  const isReceber = divida.tipo === "A_RECEBER";
  const jaPago = Math.max(0, (divida.valorTotal || 0) - (divida.valorRestante || 0));
  const novoSaldo = Math.max(0, (divida.valorRestante || 0) - valorPagoWatch);
  const vaiQuitar = valorPagoWatch > 0 && novoSaldo === 0;

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const onSubmit = async (data: FormValues) => {
    await amortizarMutation.mutateAsync({
      dividaId: divida.id,
      request: {
        contaId: data.contaId,
        valorPago: data.valorPago,
        dataPagamento: data.dataPagamento,
      },
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/15 sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isReceber ? "Registrar Recebimento (Saldo Aberto)" : "Registrar Pagamento (Saldo Aberto)"}
          </DialogTitle>
          <DialogDescription>
            {divida.descricao}
            {divida.pessoaNome && divida.pessoaNome !== "Não vinculada" ? ` · ${divida.pessoaNome}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          {/* Resumo do Contrato */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
            <div>
              <div className="text-muted-foreground">Original</div>
              <div className="font-bold text-foreground tabular-nums mt-0.5">
                {fmtBRL(divida.valorTotal)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Já abatido</div>
              <div className="font-bold text-emerald-400 tabular-nums mt-0.5">
                {fmtBRL(jaPago)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground">Saldo atual</div>
              <div className="font-bold text-amber-300 tabular-nums mt-0.5">
                {fmtBRL(divida.valorRestante)}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Valor {isReceber ? "recebido" : "pago"} agora (R$)
            </Label>
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
                  placeholder="R$ 0,00"
                  onValueChange={(v) => onChange(v.floatValue || 0)}
                  customInput={Input}
                  autoFocus
                  className="bg-black/40 text-lg font-bold border-white/15 tabular-nums"
                />
              )}
            />
            {errors.valorPago && <p className="text-red-400 text-xs">{errors.valorPago.message}</p>}
          </div>

          {/* Simulação do Novo Saldo */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/20 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Novo saldo devedor</div>
              {vaiQuitar ? (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                  <CheckCircle2 size={12} /> Quita o empréstimo integralmente!
                </div>
              ) : (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Lançado no extrato sem alterar parcelas
                </div>
              )}
            </div>
            <div
              className={`text-lg font-bold tabular-nums ${
                vaiQuitar ? "text-emerald-400" : "text-foreground"
              }`}
            >
              {fmtBRL(novoSaldo)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Conta</Label>
              <Controller
                name="contaId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                    value={field.value?.toString() || ""}
                  >
                    <SelectTrigger className="bg-black/40 border-white/15">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-white/15">
                      {contas?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.contaId && <p className="text-red-400 text-xs">{errors.contaId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                className="bg-black/40 border-white/15"
                {...register("dataPagamento")}
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={amortizarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={amortizarMutation.isPending || valorPagoWatch <= 0}
              className="bg-primary text-primary-foreground hover:opacity-90 font-semibold"
            >
              {amortizarMutation.isPending ? "Registrando..." : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
