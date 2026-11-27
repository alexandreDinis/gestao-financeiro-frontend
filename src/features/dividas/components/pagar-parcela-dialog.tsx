"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { NumericFormat } from "react-number-format";

import {
  usePagarMultiplasParcelasMutation,
  usePagarParcelaMutation,
} from "../hooks/use-dividas-mutation";
import { DividaPausadaAlert } from "./divida-pausada-alert";
import { Divida, ParcelaDivida, TipoDivida } from "../types";
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
import { AlertCircle, CheckCircle2, Info, Sparkles } from "lucide-react";

interface PagarParcelaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcela: ParcelaDivida | null;
  tipo: TipoDivida;
  divida?: Divida | null;
  dividaId?: number | null;
  pausarPrevisao?: boolean | null;
}

type ModoPagamento = "quitar" | "parcial";
type TipoAjuste = "none" | "desconto" | "juros";

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export function PagarParcelaDialog({
  open,
  onOpenChange,
  parcela,
  tipo,
  divida,
  dividaId,
  pausarPrevisao,
}: PagarParcelaDialogProps) {
  const { user } = useAuth();
  const pagarMutation = usePagarParcelaMutation();
  const pagarMultiplasMutation = usePagarMultiplasParcelasMutation();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modo, setModo] = useState<ModoPagamento>("quitar");
  const [adjType, setAdjType] = useState<TipoAjuste>("none");
  const [adjReais, setAdjReais] = useState<number>(0);
  const [pctInput, setPctInput] = useState<string>("0.00");
  const [soAntecipadas, setSoAntecipadas] = useState<boolean>(true);
  const [valorParcial, setValorParcial] = useState<number>(0);
  const [contaId, setContaId] = useState<number | null>(null);
  const [dataPagamento, setDataPagamento] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const { data: contas } = useQuery({
    queryKey: ["contas", user?.tenantId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    },
    enabled: !!user,
  });

  // Lista ordenada de parcelas pendentes da dívida (quando disponível)
  const parcelasPendentes = useMemo(() => {
    if (!divida?.parcelas) return parcela ? [parcela] : [];
    const pend = divida.parcelas
      .filter((p) => p.status !== "PAGO" && p.status !== "CANCELADO")
      .sort((a, b) => a.numeroParcela - b.numeroParcela);
    if (pend.length === 0 && parcela) return [parcela];
    return pend;
  }, [divida, parcela]);

  const atualParcela = parcelasPendentes[0] || parcela;
  const ultimaParcela = parcelasPendentes[parcelasPendentes.length - 1] || parcela;
  const hasMultiplePendentes = parcelasPendentes.length > 1;

  // Inicializa estado quando o modal abre
  useEffect(() => {
    if (!open) return;
    const initialParcela = parcela || parcelasPendentes[0] || null;
    if (!initialParcela) return;

    setSelectedIds([initialParcela.id]);
    setModo("quitar");
    // Se abriu clicando direto na última parcela (diferente da atual), pré-seleciona Desconto
    const clicouFutura =
      atualParcela && initialParcela.id !== atualParcela.id && parcelasPendentes.length > 1;
    setAdjType(clicouFutura ? "desconto" : "none");
    setAdjReais(0);
    setPctInput("0.00");
    setSoAntecipadas(true);
    setValorParcial(initialParcela.valor);
    setDataPagamento(new Date().toISOString().split("T")[0]);
  }, [open, parcela?.id, divida?.id]);

  // Seleciona primeira conta por padrão
  useEffect(() => {
    if (contas && contas.length > 0 && !contaId) {
      setContaId(contas[0].id);
    }
  }, [contas, contaId]);

  const selectedParcelas = useMemo(() => {
    const setIds = new Set(selectedIds);
    const list = parcelasPendentes.filter((p) => setIds.has(p.id));
    if (list.length === 0 && parcela) return [parcela];
    return list;
  }, [parcelasPendentes, selectedIds, parcela]);

  // Se selecionou mais de 1 parcela, força modo "quitar"
  useEffect(() => {
    if (selectedParcelas.length > 1 && modo === "parcial") {
      setModo("quitar");
    }
  }, [selectedParcelas.length, modo]);

  if (!parcela && selectedParcelas.length === 0) return null;

  const isReceber = tipo === "A_RECEBER";
  const resolvedDividaId = dividaId ?? divida?.id ?? null;
  const resolvedPausar = pausarPrevisao ?? divida?.pausarPrevisao ?? false;
  const nomeDivida = divida?.descricao || parcela?.nomeDivida || "Dívida";

  const totalOriginal = round2(
    selectedParcelas.reduce((acc, p) => acc + (p.valor || 0), 0)
  );
  const hasAtualSelected = Boolean(
    atualParcela && selectedParcelas.some((p) => p.id === atualParcela.id)
  );
  const antecipadasSelected = atualParcela
    ? selectedParcelas.filter((p) => p.id !== atualParcela.id)
    : [];
  const totalAntecipadas = round2(
    antecipadasSelected.reduce((acc, p) => acc + (p.valor || 0), 0)
  );
  const canScopeAntecipadas =
    adjType === "desconto" && hasAtualSelected && antecipadasSelected.length > 0;
  const basePct =
    canScopeAntecipadas && soAntecipadas ? totalAntecipadas : totalOriginal;

  const safeAdjReais =
    adjType === "desconto"
      ? Math.min(Math.max(0, adjReais), Math.max(0, totalOriginal - 0.01))
      : adjType === "juros"
      ? Math.max(0, adjReais)
      : 0;

  const valorFinal =
    modo === "parcial"
      ? Math.min(Math.max(0, valorParcial), totalOriginal)
      : adjType === "desconto"
      ? round2(totalOriginal - safeAdjReais)
      : adjType === "juros"
      ? round2(totalOriginal + safeAdjReais)
      : totalOriginal;

  const valorAbater = modo === "parcial" ? valorFinal : totalOriginal;
  const pctAtual = basePct > 0 ? round2((safeAdjReais / basePct) * 100) : 0;

  const saldoAntes = divida?.valorRestante;
  const saldoDepois =
    saldoAntes !== undefined ? Math.max(0, round2(saldoAntes - valorAbater)) : undefined;

  // Handlers bidirecionais (% <-> R$ <-> Valor Final)
  const handlePctChange = (raw: string) => {
    setPctInput(raw);
    const parsed = parseFloat(raw.replace(",", "."));
    const pct = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const calcReais = round2(basePct * (pct / 100));
    setAdjReais(calcReais);
  };

  const handleReaisChange = (val: number) => {
    const clean = Math.max(0, val || 0);
    setAdjReais(clean);
    const calcPct = basePct > 0 ? round2((clean / basePct) * 100) : 0;
    setPctInput(calcPct.toFixed(2));
  };

  const handleValorFinalChange = (val: number) => {
    const fin = Math.max(0, val || 0);
    if (fin < totalOriginal) {
      setAdjType("desconto");
      const diff = round2(totalOriginal - fin);
      setAdjReais(diff);
      const nextBase =
        hasAtualSelected && antecipadasSelected.length > 0 && soAntecipadas
          ? totalAntecipadas
          : totalOriginal;
      setPctInput((nextBase > 0 ? round2((diff / nextBase) * 100) : 0).toFixed(2));
    } else if (fin > totalOriginal) {
      setAdjType("juros");
      const diff = round2(fin - totalOriginal);
      setAdjReais(diff);
      setPctInput(
        (totalOriginal > 0 ? round2((diff / totalOriginal) * 100) : 0).toFixed(2)
      );
    } else {
      setAdjReais(0);
      setPctInput("0.00");
    }
  };

  const handleToggleSoAntecipadas = (checked: boolean) => {
    setSoAntecipadas(checked);
    const nextBase =
      adjType === "desconto" && hasAtualSelected && antecipadasSelected.length > 0 && checked
        ? totalAntecipadas
        : totalOriginal;
    const pct = parseFloat(pctInput.replace(",", ".")) || 0;
    setAdjReais(round2(nextBase * (pct / 100)));
  };

  const applyPreset = (preset: "atual" | "atual+1" | "atual+3" | "ultima" | "3ultimas") => {
    if (!atualParcela || !ultimaParcela) return;
    let ids: number[] = [];
    const n = parcelasPendentes.length;
    if (preset === "atual") {
      ids = [atualParcela.id];
      setAdjType("none");
      setAdjReais(0);
      setPctInput("0.00");
    } else if (preset === "atual+1") {
      ids = Array.from(new Set([atualParcela.id, ultimaParcela.id]));
      setAdjType("desconto");
    } else if (preset === "atual+3") {
      const last3 = parcelasPendentes.slice(Math.max(0, n - 3)).map((p) => p.id);
      ids = Array.from(new Set([atualParcela.id, ...last3]));
      setAdjType("desconto");
    } else if (preset === "ultima") {
      ids = [ultimaParcela.id];
      setAdjType("desconto");
    } else if (preset === "3ultimas") {
      ids = parcelasPendentes.slice(Math.max(0, n - 3)).map((p) => p.id);
      setAdjType("desconto");
    }
    setSelectedIds(ids);
    setModo("quitar");
    if (preset !== "atual") {
      setAdjReais(0);
      setPctInput("0.00");
    }
  };

  const toggleParcelaChip = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // mantém ao menos 1
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
    setAdjReais(0);
    setPctInput("0.00");
  };

  const isPending = pagarMutation.isPending || pagarMultiplasMutation.isPending;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contaId || valorFinal <= 0) return;

    if (selectedParcelas.length === 1) {
      const target = selectedParcelas[0];
      const usaAjuste = modo === "quitar" && adjType !== "none" && safeAdjReais > 0;
      await pagarMutation.mutateAsync({
        parcelaId: target.id,
        request: {
          contaId,
          dataPagamento,
          ...(usaAjuste
            ? {
                valorJuros: adjType === "juros" ? safeAdjReais : 0,
                valorDesconto: adjType === "desconto" ? safeAdjReais : 0,
              }
            : {
                valorPago: modo === "quitar" ? target.valor : valorFinal,
              }),
        },
      });
    } else {
      await pagarMultiplasMutation.mutateAsync({
        parcelaIds: selectedParcelas.map((p) => p.id),
        contaId,
        dataPagamento,
        desconto: adjType === "desconto" ? safeAdjReais : 0,
        juros: adjType === "juros" ? safeAdjReais : 0,
      });
    }

    onOpenChange(false);
  };

  const resumoParcelasStr = selectedParcelas.map((p) => `#${p.numeroParcela}`).join(", ");
  const isParcialResidual =
    modo === "parcial" && valorFinal > 0 && valorFinal < totalOriginal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-white/15 sm:max-w-[560px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReceber
              ? "Registrar Recebimento"
              : hasMultiplePendentes
              ? "Pagar / Adiantar Parcelas"
              : "Pagar Boleto / Parcela"}
          </DialogTitle>
          <DialogDescription>
            {nomeDivida}
            {divida?.credor ? ` · ${divida.credor}` : ""}
            {!hasMultiplePendentes && selectedParcelas[0]
              ? ` · Parcela #${selectedParcelas[0].numeroParcela} (vence em ${format(
                  new Date(selectedParcelas[0].dataVencimento + "T12:00:00"),
                  "dd/MM/yyyy"
                )})`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4 mt-1">
          <DividaPausadaAlert
            dividaId={resolvedDividaId}
            pausarPrevisao={resolvedPausar}
          />

          {/* 1. Seletor Multi-Parcelas (para financiamentos/parcelamentos com 2+ pendentes) */}
          {hasMultiplePendentes && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>1. Quais parcelas você vai pagar?</span>
                <span className="text-foreground">
                  {selectedParcelas.length}{" "}
                  {selectedParcelas.length === 1 ? "selecionada" : "selecionadas"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("atual")}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors"
                >
                  Só atual (#{atualParcela?.numeroParcela})
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("atual+1")}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                >
                  Atual + Última (#{atualParcela?.numeroParcela}, #{ultimaParcela?.numeroParcela})
                </button>
                {parcelasPendentes.length >= 4 && (
                  <button
                    type="button"
                    onClick={() => applyPreset("atual+3")}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    Atual + 3 Últimas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => applyPreset("ultima")}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors"
                >
                  Só Última (#{ultimaParcela?.numeroParcela})
                </button>
                {parcelasPendentes.length >= 3 && (
                  <button
                    type="button"
                    onClick={() => applyPreset("3ultimas")}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors"
                  >
                    3 Últimas
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/40 border border-white/10">
                {parcelasPendentes.map((p) => {
                  const isSel = selectedIds.includes(p.id);
                  const isAtual = atualParcela && p.id === atualParcela.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleParcelaChip(p.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSel
                          ? isAtual
                            ? "bg-white/15 border-white/60 text-foreground"
                            : "bg-emerald-500/15 border-emerald-400/55 text-foreground"
                          : "bg-white/[0.02] border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span>#{p.numeroParcela}</span>
                        {isAtual ? (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-white/15 text-foreground">
                            Atual
                          </span>
                        ) : isSel ? (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/25 text-emerald-300">
                            Antec.
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[10px] opacity-75 mt-0.5 tabular-nums">
                        {format(new Date(p.dataVencimento + "T12:00:00"), "dd/MM/yy")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Tipo de Baixa */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setModo("quitar")}
              className={`py-2 px-2 rounded-lg font-medium transition-colors ${
                modo === "quitar"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Quitar (com ou sem Desconto / Juros)
            </button>
            <button
              type="button"
              disabled={selectedParcelas.length > 1}
              onClick={() => {
                setModo("parcial");
                setValorParcial(totalOriginal);
              }}
              title={
                selectedParcelas.length > 1
                  ? "Pagamento parcial disponível apenas para 1 parcela"
                  : ""
              }
              className={`py-2 px-2 rounded-lg font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${
                modo === "parcial"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pagamento Parcial
            </button>
          </div>

          {/* 3A. Quitar com Desconto / Juros Bidirecional */}
          {modo === "quitar" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAdjType("none");
                    setAdjReais(0);
                    setPctInput("0.00");
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                    adjType === "none"
                      ? "bg-white/15 border-white/40 text-foreground"
                      : "bg-black/35 border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sem ajuste
                </button>
                <button
                  type="button"
                  onClick={() => setAdjType("desconto")}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                    adjType === "desconto"
                      ? "bg-emerald-500/15 border-emerald-400/50 text-emerald-300"
                      : "bg-black/35 border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Desconto (-)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjType("juros")}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-colors ${
                    adjType === "juros"
                      ? "bg-rose-500/15 border-rose-400/50 text-rose-300"
                      : "bg-black/35 border-white/10 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Juros / Multa (+)
                </button>
              </div>

              {adjType !== "none" && (
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        {adjType === "desconto" ? "Desconto (%)" : "Juros / Multa (%)"}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={adjType === "desconto" ? "99.99" : undefined}
                          value={pctInput}
                          onChange={(e) => handlePctChange(e.target.value)}
                          className="bg-black/50 border-white/15 pr-7 font-bold tabular-nums"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        {adjType === "desconto" ? "Desconto (R$)" : "Juros / Multa (R$)"}
                      </Label>
                      <NumericFormat
                        value={safeAdjReais}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(v) => handleReaisChange(v.floatValue || 0)}
                        customInput={Input}
                        className="bg-black/50 border-white/15 font-bold tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Valor Final Pago
                      </Label>
                      <NumericFormat
                        value={valorFinal}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(v) => handleValorFinalChange(v.floatValue || 0)}
                        customInput={Input}
                        className="bg-black/50 border-white/25 font-bold tabular-nums"
                      />
                    </div>
                  </div>

                  {canScopeAntecipadas && (
                    <label className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[11px] text-muted-foreground cursor-pointer">
                      <span className="flex items-center gap-2 text-foreground">
                        <input
                          type="checkbox"
                          checked={soAntecipadas}
                          onChange={(e) => handleToggleSoAntecipadas(e.target.checked)}
                          className="rounded border-white/20"
                        />
                        Calcular % apenas sobre antecipadas ({fmtBRL(totalAntecipadas)})
                      </span>
                      <span className="text-[10px]">
                        (#{atualParcela?.numeroParcela} cheia)
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 3B. Pagamento Parcial */
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
              <Label className="text-xs">
                Valor {isReceber ? "recebido" : "pago"} agora (R$)
              </Label>
              <NumericFormat
                value={valorParcial || ""}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onValueChange={(v) => setValorParcial(v.floatValue || 0)}
                customInput={Input}
                className="bg-black/50 text-base font-bold border-white/15 tabular-nums"
              />
              {isParcialResidual && (
                <p className="text-amber-300 text-xs flex items-center gap-1.5">
                  <AlertCircle size={13} className="shrink-0" />
                  Saldo residual de{" "}
                  <strong>{fmtBRL(round2(totalOriginal - valorFinal))}</strong> continuará
                  pendente.
                </p>
              )}
            </div>
          )}

          {/* 4. Conferência Contábil */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/15 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Parcelas selecionadas</span>
              <strong className="text-foreground tabular-nums">
                {resumoParcelasStr} ({selectedParcelas.length}{" "}
                {selectedParcelas.length === 1 ? "parcela" : "parcelas"})
              </strong>
            </div>

            <div className="flex items-center justify-between text-muted-foreground">
              <span>Abate do saldo da dívida</span>
              <strong className="text-foreground tabular-nums">
                {fmtBRL(valorAbater)}
              </strong>
            </div>

            {modo === "quitar" && adjType !== "none" && safeAdjReais > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>
                  {adjType === "desconto"
                    ? "Economia / Desconto obtido"
                    : "Juros / Multa pagos"}
                </span>
                <strong
                  className={`tabular-nums ${
                    adjType === "desconto" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {adjType === "desconto" ? "- " : "+ "}
                  {fmtBRL(safeAdjReais)} ({pctAtual.toFixed(2)}%)
                </strong>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-foreground font-medium">
                {isReceber ? "Entra na conta (Extrato)" : "Sai da conta (Extrato)"}
              </span>
              <strong className="text-base font-extrabold text-foreground tabular-nums">
                {fmtBRL(valorFinal)}
              </strong>
            </div>

            {saldoAntes !== undefined && saldoDepois !== undefined && (
              <div className="flex items-center justify-between text-muted-foreground pt-1">
                <span>Novo saldo devedor da dívida</span>
                <span className="tabular-nums">
                  <span className="line-through opacity-55 mr-2">
                    {fmtBRL(saldoAntes)}
                  </span>
                  <strong className="text-emerald-400">{fmtBRL(saldoDepois)}</strong>
                </span>
              </div>
            )}
          </div>

          {modo === "quitar" && adjType === "desconto" && safeAdjReais > 0 && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200 flex items-start gap-2">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400 mt-0.5" />
              <span>
                <strong>Cálculo contábil protegido:</strong> sai{" "}
                <strong>{fmtBRL(valorFinal)}</strong> da conta, mas abate{" "}
                <strong>{fmtBRL(valorAbater)}</strong> integrais da dívida (economia de{" "}
                <strong>{fmtBRL(safeAdjReais)}</strong> registrada).
              </span>
            </div>
          )}

          {modo === "quitar" && adjType === "juros" && safeAdjReais > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
              <Info size={14} className="shrink-0 text-amber-400 mt-0.5" />
              <span>
                <strong>Juros separados do principal:</strong> sai{" "}
                <strong>{fmtBRL(valorFinal)}</strong> da conta e abate{" "}
                <strong>{fmtBRL(valorAbater)}</strong> da dívida sem alterar parcelas
                futuras.
              </span>
            </div>
          )}

          {/* Conta e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Conta</Label>
              <Select
                onValueChange={(val) => setContaId(val ? Number(val) : null)}
                value={contaId?.toString() || ""}
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
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Data do Pagamento</Label>
              <Input
                type="date"
                className="bg-black/40 border-white/15"
                value={dataPagamento}
                onChange={(e) => setDataPagamento(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !contaId || valorFinal <= 0}
              className="bg-primary text-primary-foreground hover:opacity-90 font-semibold"
            >
              {isPending
                ? "Processando..."
                : selectedParcelas.length > 1
                ? `Confirmar (${selectedParcelas.length} parcelas)`
                : "Confirmar Baixa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
