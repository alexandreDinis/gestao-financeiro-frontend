"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";
import { toast } from "sonner";
import { Check, CheckCircle2 } from "lucide-react";

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
import { Conta, ApiResponse } from "@/types";
import { DividaPausadaAlert } from "@/features/dividas/components/divida-pausada-alert";

const pagarSchema = z.object({
  contaId: z.number().min(1, "Selecione uma conta"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  dataPagamento: z.string().nonempty("Data é obrigatória"),
});

type PagarFormValues = z.infer<typeof pagarSchema>;
type TipoAjuste = "none" | "desconto" | "juros";

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface ConfirmarPagamentoVencimentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vencimento: any | null;
}

export function ConfirmarPagamentoVencimentoDialog({
  open,
  onOpenChange,
  vencimento,
}: ConfirmarPagamentoVencimentoDialogProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ajuste de Desconto / Juros para parcelas de dívida (evita que desconto vire pagamento parcial)
  const [adjType, setAdjType] = useState<TipoAjuste>("none");
  const [adjReais, setAdjReais] = useState<number>(0);
  const [pctInput, setPctInput] = useState<string>("0.00");

  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    },
  });

  const {
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PagarFormValues>({
    resolver: zodResolver(pagarSchema) as any,
    defaultValues: {
      dataPagamento: new Date().toISOString().split("T")[0],
    },
  });

  const isParcelaDivida = Boolean(vencimento?.idUnico?.startsWith("PARCELA-DIVIDA-"));
  const valorOriginal = vencimento?.valor || 0;

  useEffect(() => {
    if (vencimento && open) {
      setValue("valor", vencimento.valor);
      setValue("dataPagamento", new Date().toISOString().split("T")[0]);
      setAdjType("none");
      setAdjReais(0);
      setPctInput("0.00");

      if (contas && vencimento.conta) {
        const contaEncontrada = contas.find((c) => c.nome === vencimento.conta);
        if (contaEncontrada) {
          setValue("contaId", contaEncontrada.id);
        }
      } else if (contas && contas.length > 0) {
        setValue("contaId", contas[0].id);
      }
    }
  }, [vencimento, open, setValue, contas]);

  const handlePctChange = (raw: string) => {
    setPctInput(raw);
    const parsed = parseFloat(raw.replace(",", "."));
    const pct = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const calc = round2(valorOriginal * (pct / 100));
    setAdjReais(calc);
    const finalVal =
      adjType === "desconto"
        ? Math.max(0.01, round2(valorOriginal - calc))
        : adjType === "juros"
        ? round2(valorOriginal + calc)
        : valorOriginal;
    setValue("valor", finalVal);
  };

  const handleReaisChange = (val: number) => {
    const clean = Math.max(0, val || 0);
    setAdjReais(clean);
    setPctInput((valorOriginal > 0 ? round2((clean / valorOriginal) * 100) : 0).toFixed(2));
    const finalVal =
      adjType === "desconto"
        ? Math.max(0.01, round2(valorOriginal - clean))
        : adjType === "juros"
        ? round2(valorOriginal + clean)
        : valorOriginal;
    setValue("valor", finalVal);
  };

  const handleValorFinalChange = (val: number, onChange: (v: number) => void) => {
    const fin = Math.max(0, val || 0);
    onChange(fin);
    if (!isParcelaDivida) return;
    if (fin < valorOriginal) {
      setAdjType("desconto");
      const diff = round2(valorOriginal - fin);
      setAdjReais(diff);
      setPctInput((valorOriginal > 0 ? round2((diff / valorOriginal) * 100) : 0).toFixed(2));
    } else if (fin > valorOriginal) {
      setAdjType("juros");
      const diff = round2(fin - valorOriginal);
      setAdjReais(diff);
      setPctInput((valorOriginal > 0 ? round2((diff / valorOriginal) * 100) : 0).toFixed(2));
    } else {
      setAdjType("none");
      setAdjReais(0);
      setPctInput("0.00");
    }
  };

  const onSubmit = async (data: PagarFormValues) => {
    if (!vencimento) return;

    setIsSubmitting(true);
    try {
      const idUnico = vencimento.idUnico || "";

      if (idUnico.startsWith("TRANSACAO-")) {
        await api.put(`/transacoes/${vencimento.transacaoId}/pagar`, {
          contaId: data.contaId,
          valor: data.valor,
          dataPagamento: data.dataPagamento,
        });
      } else if (idUnico.startsWith("PARCELA-DIVIDA-")) {
        const usaAjuste = adjType !== "none" && adjReais > 0;
        await api.put(`/dividas/parcelas/${vencimento.parcelaId}/pagar`, {
          contaId: data.contaId,
          dataPagamento: data.dataPagamento,
          ...(usaAjuste
            ? {
                valorDesconto: adjType === "desconto" ? adjReais : 0,
                valorJuros: adjType === "juros" ? adjReais : 0,
              }
            : {
                valorPago: data.valor,
              }),
        });
      } else if (idUnico.startsWith("SALDO-ABERTO-")) {
        const dividaId = vencimento.dividaId || vencimento.parcelaId || Number(idUnico.split("-")[2]);
        await api.post(`/dividas/${dividaId}/amortizacoes`, {
          contaId: data.contaId,
          valorPago: data.valor,
          dataPagamento: data.dataPagamento,
        });
      } else if (idUnico.startsWith("FATURA-")) {
        await api.put(`/cartoes/faturas/${vencimento.parcelaId}/pagar`, {
          contaId: data.contaId,
          dataPagamento: data.dataPagamento,
        });
      } else if (idUnico.startsWith("RECORRENCIA-PROJ-")) {
        const parts = idUnico.split("-");
        const recId = parts[2];
        const ref = parts[3] + "-" + parts[4];
        const materializarRes = await api.post(`/recorrencias/${recId}/materializar?referencia=${ref}`);
        const realTransId = materializarRes.data.data.id;

        await api.put(`/transacoes/${realTransId}/pagar`, {
          contaId: data.contaId,
          valor: data.valor,
          dataPagamento: data.dataPagamento,
        });
      } else if (idUnico.startsWith("PARCELA-CARTAO-")) {
        toast.info("Parcelas de cartão são pagas através da fatura mensal.");
        setIsSubmitting(false);
        return;
      } else if (idUnico.startsWith("VIRTUAL-FATURA-")) {
        toast.info(
          "Esta é uma fatura projetada (composta apenas por assinaturas previstas). Ela poderá ser paga quando o ciclo for fechado ou a primeira transação real for lançada."
        );
        setIsSubmitting(false);
        return;
      } else {
        toast.error("Tipo de vencimento não suportado para pagamento direto.");
        setIsSubmitting(false);
        return;
      }

      toast.success("Pagamento registrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["dashboard-v2"] });
      queryClient.invalidateQueries({ queryKey: ["vencimentos-todos"] });
      queryClient.invalidateQueries({ queryKey: ["dividas"] });
      queryClient.invalidateQueries({ queryKey: ["previsao-caixa"] });
      queryClient.invalidateQueries({ queryKey: ["contas"] });
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao registrar pagamento: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vencimento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="text-green-500" size={20} />
            Confirmar Pagamento
          </DialogTitle>
          <DialogDescription>
            Ajuste o valor real e selecione a conta para confirmar o pagamento de:
            <strong className="block text-white mt-1">{vencimento.descricao}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <DividaPausadaAlert
            dividaId={vencimento.dividaId}
            pausarPrevisao={vencimento.pausarPrevisao}
          />

          {/* Opção de Desconto / Juros para parcelas de dívida */}
          {isParcelaDivida && (
            <div className="space-y-2.5 p-3 rounded-xl bg-black/40 border border-white/10">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Valor original da parcela</span>
                <strong className="text-foreground tabular-nums">{fmtBRL(valorOriginal)}</strong>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAdjType("none");
                    setAdjReais(0);
                    setPctInput("0.00");
                    setValue("valor", valorOriginal);
                  }}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    adjType === "none"
                      ? "bg-white/15 border-white/40 text-foreground"
                      : "bg-black/35 border-white/10 text-muted-foreground"
                  }`}
                >
                  Sem ajuste
                </button>
                <button
                  type="button"
                  onClick={() => setAdjType("desconto")}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    adjType === "desconto"
                      ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-300"
                      : "bg-black/35 border-white/10 text-muted-foreground"
                  }`}
                >
                  Desconto (-)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjType("juros")}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    adjType === "juros"
                      ? "bg-rose-500/15 border-rose-400/50 text-rose-300"
                      : "bg-black/35 border-white/10 text-muted-foreground"
                  }`}
                >
                  Juros (+)
                </button>
              </div>

              {adjType !== "none" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {adjType === "desconto" ? "Desconto (%)" : "Juros (%)"}
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pctInput}
                        onChange={(e) => handlePctChange(e.target.value)}
                        className="bg-black/50 border-white/15 pr-6 text-xs font-bold tabular-nums"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      {adjType === "desconto" ? "Desconto (R$)" : "Juros (R$)"}
                    </Label>
                    <NumericFormat
                      value={adjReais}
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="R$ "
                      decimalScale={2}
                      fixedDecimalScale
                      allowNegative={false}
                      onValueChange={(v) => handleReaisChange(v.floatValue || 0)}
                      customInput={Input}
                      className="bg-black/50 border-white/15 text-xs font-bold tabular-nums"
                    />
                  </div>
                </div>
              )}

              {adjType === "desconto" && adjReais > 0 && (
                <div className="text-[11px] text-emerald-300 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 size={12} className="shrink-0" />
                  Quita integralmente os {fmtBRL(valorOriginal)} da dívida (economia de{" "}
                  {fmtBRL(adjReais)}).
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Valor Pago (R$)</Label>
            <Controller
              name="valor"
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
                  onValueChange={(values) =>
                    handleValorFinalChange(values.floatValue || 0, onChange)
                  }
                  customInput={Input}
                  className={`bg-black/40 text-lg font-bold ${
                    errors.valor ? "border-red-500" : "border-border/50"
                  }`}
                  autoFocus
                />
              )}
            />
            {errors.valor && <p className="text-red-400 text-xs">{errors.valor.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Conta / Banco</Label>
            <Controller
              name="contaId"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                  value={field.value?.toString() || ""}
                >
                  <SelectTrigger
                    className={`bg-black/40 ${
                      errors.contaId ? "border-red-500" : "border-border/50"
                    }`}
                  >
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel border-border/40">
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

          <div className="space-y-2">
            <Label>Data do Pagamento</Label>
            <Input
              type="date"
              className="bg-black/40 border-border/50"
              {...control.register("dataPagamento")}
            />
            {errors.dataPagamento && (
              <p className="text-red-400 text-xs">{errors.dataPagamento.message}</p>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-8"
            >
              {isSubmitting ? "Processando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
