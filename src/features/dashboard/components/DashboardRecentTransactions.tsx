"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import type { ProximosVencimentosDashboard, UltimaTransacao, Vencimento } from "@/types";
import { ConfirmarPagamentoVencimentoDialog } from "./ConfirmarPagamentoVencimentoDialog";

interface Props {
  recentes: UltimaTransacao[];
  proximosVencimentos?: ProximosVencimentosDashboard;
  loading: boolean;
  activeTab?: "vencimentos" | "recentes";
  onTabChange?: (tab: "vencimentos" | "recentes") => void;
}

export function DashboardRecentTransactions({
  recentes,
  proximosVencimentos,
  loading,
  activeTab,
  onTabChange,
}: Props) {
  const { privacyMode } = usePrivacy();
  const [internalTab, setInternalTab] = useState<"vencimentos" | "recentes">("vencimentos");
  const [windowDays, setWindowDays] = useState<7 | 15 | 30>(7);
  const [selectedVencimento, setSelectedVencimento] = useState<Vencimento | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const tab = activeTab ?? internalTab;
  const setTab = (next: "vencimentos" | "recentes") => {
    setInternalTab(next);
    onTabChange?.(next);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00Z");
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  };

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  const vencimentosLista: Vencimento[] =
    windowDays === 7
      ? proximosVencimentos?.proximos7Dias ?? []
      : windowDays === 15
        ? proximosVencimentos?.proximos15Dias ?? []
        : proximosVencimentos?.proximos30Dias ?? [];

  const canPayDirectly = (v: Vencimento) => {
    const id = v.idUnico || "";
    return (
      id.startsWith("TRANSACAO-") ||
      id.startsWith("PARCELA-DIVIDA-") ||
      id.startsWith("FATURA-") ||
      id.startsWith("RECORRENCIA-PROJ-")
    );
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-9 w-44 bg-white/10 rounded-xl" />
          <Skeleton className="h-7 w-24 bg-white/5 rounded-lg" />
        </div>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel rounded-2xl p-5 flex flex-col">
        {/* Header com Abas + Janela 7d / 15d / 30d */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setTab("vencimentos")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                tab === "vencimentos"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Vencimentos
              {(proximosVencimentos?.proximos7Dias?.length ?? 0) > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                    tab === "vencimentos"
                      ? "bg-black/20 text-primary-foreground"
                      : "bg-amber-400/20 text-amber-300"
                  }`}
                >
                  {proximosVencimentos?.proximos7Dias.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab("recentes")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                tab === "recentes"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Recentes
            </button>
          </div>

          {tab === "vencimentos" && (
            <div className="flex items-center gap-1 text-xs">
              {([7, 15, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setWindowDays(d)}
                  className={`px-2 py-1 rounded-md font-mono transition-colors ${
                    windowDays === d
                      ? "bg-white/15 text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Vencimentos */}
        {tab === "vencimentos" ? (
          vencimentosLista.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Calendar size={28} className="opacity-25" />
              <p className="text-xs">Nenhum vencimento nos próximos {windowDays} dias.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
              {vencimentosLista.map((v) => {
                const isReceita = v.tipo === "RECEITA";
                const toneClass = v.atrasado
                  ? "bg-red-500/10 border-red-500/25"
                  : v.venceHoje
                    ? "bg-amber-400/10 border-amber-400/25"
                    : "bg-black/30 border-white/10 hover:border-white/20";

                return (
                  <div
                    key={v.idUnico}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-colors ${toneClass}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isReceita
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {isReceita ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">{v.descricao}</p>
                          {v.atrasado && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500 text-white shrink-0">
                              Atrasado
                            </span>
                          )}
                          {v.venceHoje && !v.atrasado && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-400 text-black shrink-0">
                              Hoje
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <Clock size={10} />
                          <span>{formatDate(v.dataVencimento)}</span>
                          <span>·</span>
                          <span className="truncate">{v.conta || "Sem conta"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-sm font-semibold ${
                            isReceita ? "text-emerald-400" : "text-foreground"
                          } ${moneyClass}`}
                        >
                          {isReceita ? "+" : ""}
                          {formatCurrency(v.valor)}
                        </div>
                      </div>
                      {canPayDirectly(v) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVencimento(v);
                            setDialogOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          {isReceita ? "Receber" : "Pagar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <Link
                href="/contas"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-colors text-foreground text-xs font-medium mt-2"
              >
                <ExternalLink size={13} />
                Gerenciar todas em Contas a Pagar
              </Link>
            </div>
          )
        ) : recentes.length === 0 ? (
          <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Calendar size={28} className="opacity-25" />
            <p className="text-xs">Nenhuma transação recente encontrada.</p>
          </div>
        ) : (
          <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
            {recentes.map((tx, idx) => {
              const isReceita = tx.tipo === "RECEITA";
              return (
                <div
                  key={`tx-${tx.id}-${idx}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isReceita
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      {isReceita ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.descricao}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <span>{formatDate(tx.data)}</span>
                        <span>·</span>
                        <span className="truncate">{tx.categoria || tx.conta}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm font-semibold ${
                        isReceita ? "text-emerald-400" : "text-foreground"
                      } ${moneyClass}`}
                    >
                      {isReceita ? "+" : "-"}
                      {formatCurrency(tx.valor)}
                    </div>
                    {tx.valorPrevisto !== undefined && tx.valorPrevisto !== null && (
                      <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1 mt-0.5">
                        {tx.valor === tx.valorPrevisto ? (
                          <>
                            <CheckCircle size={10} /> Esperado
                          </>
                        ) : tx.valor > tx.valorPrevisto ? (
                          <span className="text-red-400">
                            +{formatCurrency(tx.valor - tx.valorPrevisto)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">
                            -{formatCurrency(tx.valorPrevisto - tx.valor)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmarPagamentoVencimentoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vencimento={selectedVencimento}
      />
    </>
  );
}
