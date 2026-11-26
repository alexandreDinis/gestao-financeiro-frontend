"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Eye,
  EyeOff,
  ReceiptText,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import { useRelatorioGastos } from "@/hooks/use-relatorio-gastos";
import { useRelatorioReceitas } from "@/hooks/use-relatorio-receitas";
import { formatCurrency } from "@/lib/utils";
import type { CategoriaRelatorio } from "@/types";
import { CategoriaAccordion } from "@/features/relatorios/components/CategoriaAccordion";
import { MonthYearSelector } from "@/features/relatorios/components/MonthYearSelector";
import { RelatorioTrendChart } from "@/features/relatorios/components/RelatorioTrendChart";

const SEGMENT_COLORS = [
  "#ffffff",
  "#a3a3a3",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#60a5fa",
  "#c084fc",
  "#38bdf8",
];

function countTransactions(cats: CategoriaRelatorio[]): number {
  return cats.reduce(
    (acc, c) =>
      acc +
      c.transacoesDiretas.length +
      c.subcategorias.reduce((s, sub) => s + sub.transacoes.length, 0),
    0
  );
}

export default function RelatoriosPage() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [activeType, setActiveType] = useState<"saidas" | "entradas">("saidas");
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  const { privacyMode, togglePrivacyMode } = usePrivacy();

  const gastosQuery = useRelatorioGastos(ano, mes);
  const receitasQuery = useRelatorioReceitas(ano, mes);

  const isLoading = gastosQuery.isLoading || receitasQuery.isLoading;
  const isError = gastosQuery.isError || receitasQuery.isError;
  const isFetching = gastosQuery.isFetching || receitasQuery.isFetching;

  const totalEntradas = receitasQuery.data?.totalMes ?? 0;
  const totalEntradasAno = receitasQuery.data?.totalAno ?? 0;
  const mediaMensalEntradas = receitasQuery.data?.mediaMensal ?? 0;
  const totalSaidas = gastosQuery.data?.totalGeral ?? 0;
  const saldoLiquido = totalEntradas - totalSaidas;
  const taxaPoupanca =
    totalEntradas > 0 ? Math.max(0, Math.min(100, (saldoLiquido / totalEntradas) * 100)) : 0;

  const gastosCats = useMemo(() => gastosQuery.data?.categorias ?? [], [gastosQuery.data]);
  const receitasCats = useMemo(() => receitasQuery.data?.categorias ?? [], [receitasQuery.data]);

  const activeCats = activeType === "saidas" ? gastosCats : receitasCats;
  const activeTotal = activeType === "saidas" ? totalSaidas : totalEntradas;

  const top3Percent = useMemo(
    () => gastosCats.slice(0, 3).reduce((acc, c) => acc + (c.percentual || 0), 0),
    [gastosCats]
  );

  const totalTxSaidas = useMemo(() => countTransactions(gastosCats), [gastosCats]);
  const ticketMedio = totalTxSaidas > 0 ? totalSaidas / totalTxSaidas : 0;

  const filteredCats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeCats;
    return activeCats.filter((cat) => {
      if (cat.nome.toLowerCase().includes(q)) return true;
      if (cat.transacoesDiretas.some((t) => t.descricao.toLowerCase().includes(q))) return true;
      return cat.subcategorias.some(
        (sub) =>
          sub.nome.toLowerCase().includes(q) ||
          sub.transacoes.some((t) => t.descricao.toLowerCase().includes(q))
      );
    });
  }, [activeCats, search]);

  const getCatKey = (cat: CategoriaRelatorio) =>
    `${activeType}-${cat.categoriaId ?? "sem-categoria"}`;

  const toggleCat = (key: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const focusCat = (cat: CategoriaRelatorio) => {
    const key = getCatKey(cat);
    setOpenIds((prev) => new Set(prev).add(key));
    const el = document.getElementById(`categoria-${cat.categoriaId ?? "sem-categoria"}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleToggleExpandAll = () => {
    if (expandAll) {
      setOpenIds(new Set());
      setExpandAll(false);
    } else {
      setOpenIds(new Set(activeCats.map(getCatKey)));
      setExpandAll(true);
    }
  };

  const handleMonthChange = (newAno: number, newMes: number) => {
    setAno(newAno);
    setMes(newMes);
    setOpenIds(new Set());
    setExpandAll(false);
  };

  const handleRefresh = () => {
    gastosQuery.refetch();
    receitasQuery.refetch();
  };

  const handleExportCsv = () => {
    if (activeCats.length === 0) {
      toast.info("Sem dados no período selecionado para exportar.");
      return;
    }

    const rows: string[][] = [
      ["Tipo", "Categoria", "Subcategoria", "Descrição", "Data", "Origem", "Valor"],
    ];
    const tipoLabel = activeType === "saidas" ? "SAIDA" : "ENTRADA";

    for (const cat of activeCats) {
      for (const tx of cat.transacoesDiretas) {
        rows.push([
          tipoLabel,
          cat.nome,
          "Direta",
          tx.descricao,
          tx.data,
          tx.origem || "CONTA",
          tx.valor.toFixed(2).replace(".", ","),
        ]);
      }
      for (const sub of cat.subcategorias) {
        for (const tx of sub.transacoes) {
          rows.push([
            tipoLabel,
            cat.nome,
            sub.nome,
            tx.descricao,
            tx.data,
            tx.origem || "CONTA",
            tx.valor.toFixed(2).replace(".", ","),
          ]);
        }
      }
    }

    const csv =
      "\uFEFF" +
      rows
        .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${activeType}-${ano}-${String(mes).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };

  const ringCirc = 2 * Math.PI * 18;
  const ringOffset = ringCirc * (1 - taxaPoupanca / 100);
  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        {/* Header Unificado */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Analytics &amp; Relatórios
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-muted-foreground">
                Somente pagos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Visão sincronizada de entradas, saídas hierárquicas e tendência mensal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MonthYearSelector mes={mes} ano={ano} onChange={handleMonthChange} />

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetching}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={togglePrivacyMode}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-foreground hover:border-white/25 transition-colors inline-flex items-center gap-1.5"
            >
              {privacyMode ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">{privacyMode ? "Mostrar" : "Privacidade"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <Download size={14} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Erro */}
        {isError && (
          <div className="glass-panel rounded-2xl border border-red-500/35 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400 shrink-0" size={20} />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Erro ao carregar os relatórios do período
                </p>
                <p className="text-xs text-muted-foreground">
                  Verifique a conexão com o servidor e tente novamente.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* 1. Bento Resumo Executivo (4 KPIs) */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Entradas */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Entradas no Mês
                </span>
                <ArrowUpRight size={15} className="text-emerald-400" />
              </div>
              <div className={`text-2xl font-bold text-emerald-400 mt-2 ${moneyClass}`}>
                {formatCurrency(totalEntradas)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Média:{" "}
                  <strong className={`text-foreground ${moneyClass}`}>
                    {formatCurrency(mediaMensalEntradas)}
                  </strong>
                </span>
                <span>
                  {ano}:{" "}
                  <strong className={`text-foreground ${moneyClass}`}>
                    {formatCurrency(totalEntradasAno)}
                  </strong>
                </span>
              </div>
            </div>

            {/* Saídas */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Saídas no Mês
                </span>
                <ArrowDownRight size={15} className="text-red-400" />
              </div>
              <div className={`text-2xl font-bold text-red-400 mt-2 ${moneyClass}`}>
                {formatCurrency(totalSaidas)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground gap-2">
                <span className="shrink-0">{gastosCats.length} categorias</span>
                <span className="text-foreground font-medium truncate">
                  {gastosCats[0]
                    ? `Top: ${gastosCats[0].nome} (${gastosCats[0].percentual.toFixed(0)}%)`
                    : "Sem gastos"}
                </span>
              </div>
            </div>

            {/* Resultado Líquido + Anel */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Resultado Líquido
                </span>
                <span className="text-[11px] text-muted-foreground">Eficiência</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className={`text-2xl font-bold truncate ${
                      saldoLiquido >= 0 ? "text-foreground" : "text-red-400"
                    } ${moneyClass}`}
                  >
                    {saldoLiquido >= 0 ? "+" : ""}
                    {formatCurrency(saldoLiquido)}
                  </div>
                  <p
                    className={`text-xs mt-0.5 ${
                      saldoLiquido >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {saldoLiquido >= 0 ? "Superávit no período" : "Déficit no período"}
                  </p>
                </div>

                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke="rgba(255,255,255,0.10)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      fill="none"
                      stroke={saldoLiquido >= 0 ? "var(--primary)" : "var(--destructive)"}
                      strokeWidth="4"
                      strokeDasharray={ringCirc}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold tabular-nums text-foreground">
                    {taxaPoupanca.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-white/10 flex justify-between text-xs text-muted-foreground">
                <span>Taxa de poupança</span>
                <span className="text-foreground font-medium tabular-nums">
                  {taxaPoupanca.toFixed(1)}% das entradas
                </span>
              </div>
            </div>

            {/* Concentração & Ticket Médio */}
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Concentração (Top 3)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-400/15 text-amber-300">
                  {top3Percent.toFixed(0)}%
                </span>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {totalTxSaidas}{" "}
                  <span className="text-sm font-normal text-muted-foreground">saídas pagas</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ticket médio:{" "}
                  <strong className={`text-foreground ${moneyClass}`}>
                    {formatCurrency(ticketMedio)}
                  </strong>
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-muted-foreground truncate">
                {gastosCats
                  .slice(0, 3)
                  .map((c) => c.nome)
                  .join(" · ") || "Sem categorias"}
              </div>
            </div>
          </section>
        )}

        {/* 2. Tendência Histórica (6M / 12M) */}
        <RelatorioTrendChart />

        {/* 3. Explorador Hierárquico */}
        <section className="glass-panel rounded-2xl p-5 space-y-5">
          {/* Controles do Explorador */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveType("saidas");
                  setExpandAll(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
                  activeType === "saidas"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowDownRight size={14} />
                Saídas Detalhadas
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveType("entradas");
                  setExpandAll(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
                  activeType === "entradas"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpRight size={14} />
                Entradas Detalhadas
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 md:justify-end">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex-1 md:max-w-xs">
                <Search size={14} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filtrar categoria, subcategoria ou lançamento..."
                  className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              {activeCats.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleExpandAll}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-foreground hover:border-white/25 transition-colors"
                >
                  {expandAll ? "Recolher tudo" : "Expandir tudo"}
                </button>
              )}
            </div>
          </div>

          {/* Barra Proporcional Clicável */}
          {!isLoading && activeCats.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Distribuição por categoria (clique em uma fatia para abrir)</span>
                <span className={`font-mono font-semibold text-foreground ${moneyClass}`}>
                  Total: {formatCurrency(activeTotal)}
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full overflow-hidden flex gap-0.5 bg-black/50 p-0.5 border border-white/10">
                {activeCats.map((cat, i) => {
                  const color = cat.cor || SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                  return (
                    <button
                      key={getCatKey(cat)}
                      type="button"
                      onClick={() => focusCat(cat)}
                      style={{
                        width: `${Math.max(cat.percentual, 1.5)}%`,
                        backgroundColor: color,
                      }}
                      className="h-full rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                      title={`${cat.nome}: ${formatCurrency(cat.totalCategoria)} (${cat.percentual.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {activeCats.slice(0, 6).map((cat, i) => {
                  const color = cat.cor || SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                  return (
                    <button
                      key={`leg-${getCatKey(cat)}`}
                      type="button"
                      onClick={() => focusCat(cat)}
                      className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span>
                        {cat.nome}{" "}
                        <strong className="text-foreground tabular-nums">
                          {cat.percentual.toFixed(0)}%
                        </strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Acordeões */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl bg-white/5" />
              ))}
            </div>
          ) : filteredCats.length === 0 ? (
            <div className="py-12 text-center">
              <ReceiptText size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm font-semibold text-foreground">
                {search.trim()
                  ? `Nenhum item encontrado para "${search}"`
                  : activeType === "saidas"
                    ? "Nenhum gasto pago neste mês"
                    : "Nenhuma receita recebida neste mês"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Apenas transações efetivamente pagas/recebidas entram no relatório.
              </p>
            </div>
          ) : (
            <div className="space-y-3" id="categorias-list">
              {filteredCats.map((cat, idx) => {
                const key = getCatKey(cat);
                const isExpanded =
                  search.trim().length > 0 || openIds.has(key) || (openIds.size === 0 && !expandAll && idx === 0);
                return (
                  <CategoriaAccordion
                    key={key}
                    categoria={cat}
                    rank={idx + 1}
                    expanded={isExpanded}
                    onToggle={() => toggleCat(key)}
                    accentColor={cat.cor || SEGMENT_COLORS[idx % SEGMENT_COLORS.length]}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
