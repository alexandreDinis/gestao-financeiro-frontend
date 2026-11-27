"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";

import { usePagarParcelaMutation } from "../hooks/use-dividas-mutation";
import { DividaPausadaAlert } from "./divida-pausada-alert";
import { ParcelaDivida, TipoDivida } from "../types";
import { Conta, ApiResponse } from "@/types";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface PagarParcelaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: ParcelaDivida | null;
  tipo: TipoDivida;
  dividaId?: number | null;
  pausarPrevisao?: boolean | null;
}

const pagarSchema = z.object({
  contaId: z.number().min(1, "Selecione uma conta"),
  valorPago: z.number().positive("O valor deve ser maior que zero"),
  valorJuros: z.number().min(0, "Juros não pode ser negativo").optional(),
  valorDesconto: z.number().min(0, "Desconto não pode ser negativo").optional(),
  dataPagamento: z.string().nonempty("Data é obrigatória"),
  descontarExcedenteDe: z.enum(["PROXIMA", "ULTIMA"]).optional(),
  linhaDigitavel: z.string().optional(),
});

type PagarFormValues = z.infer<typeof pagarSchema>;

export function PagarParcelaDialog({
  open,
  onOpenChange,
  parcela,
  tipo,
  dividaId,
  pausarPrevisao,
}: PagarParcelaDialogProps) {
  const { user } = useAuth();
  const pagarMutation = usePagarParcelaMutation();
  const [modoAjuste, setModoAjuste] = useState<"encargos" | "parcial">("encargos");

  const { data: contas } = useQuery({
    queryKey: ["contas", user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    },
    enabled: !!user,
  });

  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm<PagarFormValues>({
    resolver: zodResolver(pagarSchema) as any,
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
      descontarExcedenteDe: "PROXIMA",
      valorJuros: 0,
      valorDesconto: 0,
      linhaDigitavel: "",
    },
  });

  const valorPagoWatch = watch("valorPago") || 0;
  const valorJurosWatch = watch("valorJuros") || 0;
  const valorDescontoWatch = watch("valorDesconto") || 0;

  useEffect(() => {
    if (parcela && open) {
      setModoAjuste("encargos");
      setValue("valorPago", parcela.valor);
      setValue("valorJuros", 0);
      setValue("valorDesconto", 0);
      setValue("linhaDigitavel", parcela.linhaDigitavel || "");
      setValue("dataPagamento", new Date().toISOString().split("T")[0]);
    }
  }, [parcela, open, setValue]);

  useEffect(() => {
    const currentContaId = watch("contaId");
    if (contas && contas.length > 0 && !currentContaId) {
      setValue("contaId", contas[0].id);
    }
  }, [contas, setValue, watch]);

  if (!parcela) return null;

  const totalComEncargos = Math.max(0, parcela.valor + valorJurosWatch - valorDescontoWatch);
  const usaJurosOuDesconto = modoAjuste === "encargos" && (valorJurosWatch > 0 || valorDescontoWatch > 0);
  const isPartial = modoAjuste === "parcial" && valorPagoWatch > 0 && valorPagoWatch < parcela.valor;
  const isSurplus = modoAjuste === "parcial" && valorPagoWatch > parcela.valor;

  const fmtBRL = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const onSubmit = async (data: PagarFormValues) => {
    await pagarMutation.mutateAsync({
      parcelaId: parcela.id,
      request: {
        contaId: data.contaId,
        dataPagamento: data.dataPagamento,
        linhaDigitavel: data.linhaDigitavel?.trim() || undefined,
        ...(usaJurosOuDesconto
          ? {
              valorJuros: data.valorJuros || 0,
              valorDesconto: data.valorDesconto || 0,
            }
          : {
              valorPago: modoAjuste === "encargos" ? parcela.valor : data.valorPago,
              descontarExcedenteDe:
                modoAjuste === "parcial" && data.valorPago > parcela.valor
                  ? data.descontarExcedenteDe || "PROXIMA"
                  : undefined,
            }),
      },
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/15 sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {tipo === "A_RECEBER" ? "Registrar Recebimento" : "Pagar Boleto / Parcela"}
          </DialogTitle>
          <DialogDescription>
            {parcela.nomeDivida} · Parcela {parcela.numeroParcela} (vence em{" "}
            {format(new Date(parcela.dataVencimento + "T12:00:00"), "dd/MM/yyyy")})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-1">
          <DividaPausadaAlert
            dividaId={dividaId}
            pausarPrevisao={pausarPrevisao}
          />

          {/* Resumo Original */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Valor original da parcela</span>
            <strong className="text-base font-bold text-foreground tabular-nums">
              {fmtBRL(parcela.valor)}
            </strong>
          </div>

          {/* Toggle de Modo */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setModoAjuste("encargos");
                setValue("valorPago", parcela.valor);
              }}
              className={`py-1.5 rounded-lg font-medium transition-colors ${
                modoAjuste === "encargos"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Boleto / Juros &amp; Desconto
            </button>
            <button
              type="button"
              onClick={() => {
                setModoAjuste("parcial");
                setValue("valorJuros", 0);
                setValue("valorDesconto", 0);
              }}
              className={`py-1.5 rounded-lg font-medium transition-colors ${
                modoAjuste === "parcial"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Parcial / Adiantamento
            </button>
          </div>

          {modoAjuste === "encargos" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Juros / Multa (+ R$)</Label>
                  <Controller
                    name="valorJuros"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <NumericFormat
                        value={value ?? 0}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(v) => onChange(v.floatValue || 0)}
                        customInput={Input}
                        className="bg-black/40 border-white/15 tabular-nums"
                      />
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Desconto (- R$)</Label>
                  <Controller
                    name="valorDesconto"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <NumericFormat
                        value={value ?? 0}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(v) => onChange(v.floatValue || 0)}
                        customInput={Input}
                        className="bg-black/40 border-white/15 tabular-nums"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/20 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Total a {tipo === "A_RECEBER" ? "creditar" : "debitar"}
                  </div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} />
                    Quita integralmente sem alterar parcelas futuras
                  </div>
                </div>
                <div className="text-lg font-bold text-foreground tabular-nums">
                  {fmtBRL(totalComEncargos)}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Valor pago / recebido (R$)</Label>
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
                    onValueChange={(v) => onChange(v.floatValue || 0)}
                    customInput={Input}
                    className="bg-black/40 text-base font-bold border-white/15 tabular-nums"
                  />
                )}
              />
              {isPartial && (
                <p className="text-amber-300 text-xs flex items-center gap-1">
                  <AlertCircle size={12} />
                  Saldo residual de {fmtBRL(parcela.valor - valorPagoWatch)} continuará pendente.
                </p>
              )}
              {isSurplus && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/15 space-y-2">
                  <p className="text-xs text-foreground font-medium">
                    Excedente de {fmtBRL(valorPagoWatch - parcela.valor)} — abater de:
                  </p>
                  <Controller
                    name="descontarExcedenteDe"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("PROXIMA")}
                          className={`p-2 rounded-lg text-xs border transition-colors ${
                            field.value !== "ULTIMA"
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-black/30 border-white/10 text-muted-foreground"
                          }`}
                        >
                          Próxima Parcela
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange("ULTIMA")}
                          className={`p-2 rounded-lg text-xs border transition-colors ${
                            field.value === "ULTIMA"
                              ? "bg-primary text-primary-foreground border-primary font-semibold"
                              : "bg-black/30 border-white/10 text-muted-foreground"
                          }`}
                        >
                          Última Parcela
                        </button>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          )}

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
              <Label className="text-xs">Data do Pagamento</Label>
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
              disabled={pagarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pagarMutation.isPending || (modoAjuste === "encargos" && totalComEncargos <= 0)}
              className="bg-primary text-primary-foreground hover:opacity-90 font-semibold"
            >
              {pagarMutation.isPending ? "Processando..." : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
