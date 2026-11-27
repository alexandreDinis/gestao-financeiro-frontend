"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Barcode,
  Check,
  ChevronDown,
  Copy,
  Download,
  Edit3,
  Eye,
  EyeOff,
  Layers,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCcw,
  Search,
  StopCircle,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/hooks/use-privacy";
import { PessoasList } from "@/features/pessoas/components/pessoas-list";
import { usePessoasQuery } from "@/features/pessoas/hooks/use-pessoas-query";
import { useDividasQuery } from "@/features/dividas/hooks/use-dividas-query";
import {
  useAtualizarLinhaDigitavelMutation,
  useCancelarRecorrenciaMutation,
  useDeletarDividaMutation,
  useTogglePausarPrevisaoMutation,
} from "@/features/dividas/hooks/use-dividas-mutation";
import { DividasService } from "@/features/dividas/services/dividas.service";
import { DividaFilters } from "@/features/dividas/components/divida-filters";
import { DividaFormDialog } from "@/features/dividas/components/divida-form-dialog";
import { PagarParcelaDialog } from "@/features/dividas/components/pagar-parcela-dialog";
import { PagarLoteMesDialog } from "@/features/dividas/components/pagar-lote-mes-dialog";
import { AmortizarSaldoDialog } from "@/features/dividas/components/amortizar-saldo-dialog";
import type {
  Divida,
  ModalidadeDivida,
  ParcelaDivida,
  StatusDivida,
  TipoDivida,
} from "@/features/dividas/types";

type ViewTab = "ALL" | "BOLETO" | "FINANCIAMENTO" | "EMPRESTIMO" | "SALDO_ABERTO" | "CONTATOS";

const MESES_LABEL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const MODALIDADE_META: Record<ModalidadeDivida, { label: string; badgeClass: string }> = {
  BOLETO: {
    label: "Boleto / Carnê",
    badgeClass: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  CARNE: {
    label: "Carnê",
    badgeClass: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  },
  FINANCIAMENTO: {
    label: "Financiamento",
    badgeClass: "bg-white/10 text-foreground border-white/15",
  },
  EMPRESTIMO: {
    label: "Pessoa · Empréstimo",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  SALDO_ABERTO: {
    label: "Saldo Aberto · Extrato",
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  OUTROS: {
    label: "Outros",
    badgeClass: "bg-white/5 text-muted-foreground border-white/10",
  },
};

export default function BoletosEDividasPage() {
  const { privacyMode, togglePrivacyMode } = usePrivacy();

  const [activeTab, setActiveTab] = useState<ViewTab>("ALL");
  const [tipoFilter, setTipoFilter] = useState<"TODOS" | TipoDivida>("TODOS");
  const [pessoaId, setPessoaId] = useState<number | undefined>(undefined);
  const [ano, setAno] = useState<number | undefined>(undefined);
  const [mes, setMes] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<StatusDivida | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [dividaToEdit, setDividaToEdit] = useState<Divida | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payingParcela, setPayingParcela] = useState<{
    parcela: ParcelaDivida;
    tipo: TipoDivida;
    dividaId: number;
    pausarPrevisao?: boolean;
  } | null>(null);
  const [amortizarOpen, setAmortizarOpen] = useState(false);
  const [amortizarDivida, setAmortizarDivida] = useState<Divida | null>(null);
  const [loteOpen, setLoteOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [editingBarcodeId, setEditingBarcodeId] = useState<number | null>(null);
  const [barcodeDraft, setBarcodeDraft] = useState("");

  const { data: pessoas } = usePessoasQuery();
  const tipoApi: TipoDivida | undefined = tipoFilter === "TODOS" ? undefined : tipoFilter;

  const { data: resumo, isLoading, isError, refetch } = useDividasQuery(
    tipoApi,
    pessoaId,
    ano,
    mes,
    status
  );

  const deletarMutation = useDeletarDividaMutation();
  const linhaMutation = useAtualizarLinhaDigitavelMutation();
  const cancelarRecorrenciaMutation = useCancelarRecorrenciaMutation();
  const pausarPrevisaoMutation = useTogglePausarPrevisaoMutation();

  const items = useMemo(() => resumo?.items ?? [], [resumo]);

  const selectedPessoa = useMemo(
    () => (pessoaId ? pessoas?.find((p) => p.id === pessoaId) : undefined),
    [pessoaId, pessoas]
  );

  const hasApiFilters = Boolean(pessoaId || ano || mes || status || tipoApi);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00Z");
    return new Intl.DateTimeFormat("pt-BR").format(d);
  };

  const moneyClass = `tabular-nums transition-all duration-200 ${privacyMode ? "privacy-blur" : ""}`;

  // Se o usuário escolher um mês sem escolher ano, assume o ano atual para ativar o filtro mensal no backend
  const handleMesChange = (newMes?: number) => {
    setMes(newMes);
    if (newMes && !ano) {
      setAno(new Date().getFullYear());
    }
  };

  const handleClearFilters = () => {
    setPessoaId(undefined);
    setAno(undefined);
    setMes(undefined);
    setStatus(undefined);
    setTipoFilter("TODOS");
    setSearch("");
  };

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((d) => {
      const mod: ModalidadeDivida = d.modalidade || (d.pessoaId ? "EMPRESTIMO" : "BOLETO");
      if (activeTab === "BOLETO" && mod !== "BOLETO" && mod !== "CARNE") return false;
      if (activeTab === "FINANCIAMENTO" && mod !== "FINANCIAMENTO") return false;
      if (activeTab === "EMPRESTIMO" && mod !== "EMPRESTIMO") return false;
      if (activeTab === "SALDO_ABERTO" && mod !== "SALDO_ABERTO") return false;
      if (!q) return true;
      return (
        d.descricao.toLowerCase().includes(q) ||
        (d.credor || "").toLowerCase().includes(q) ||
        (d.pessoaNome || "").toLowerCase().includes(q) ||
        (d.categoriaNome || "").toLowerCase().includes(q)
      );
    });
  }, [items, activeTab, search]);

  // Métricas consolidadas do Bento (respeitam os filtros ativos!)
  const metrics = useMemo(() => {
    const now = new Date();
    const curYear = ano ?? now.getFullYear();
    const curMonth = mes ?? now.getMonth() + 1;
    const todayStr = now.toISOString().split("T")[0];

    let saldoDevedorPagar = 0;
    let totalContratadoPagar = 0;
    let totalReceberAberto = 0;
    let venceNoMesValor = 0;
    let venceNoMesCount = 0;
    let atrasadosCount = 0;
    let totalJuros = 0;
    let totalDescontos = 0;
    let acordosReceber = 0;
    let ativosPagar = 0;
    let recorrentesCount = 0;
    let parceladasCount = 0;
    let parcelasPendentesFiltradas = 0;
    let somaParcelasFiltradas = 0;

    for (const d of filteredItems) {
      if (d.recorrente) recorrentesCount++;
      else parceladasCount++;

      if (d.tipo === "A_PAGAR") {
        saldoDevedorPagar += d.valorRestante || 0;
        totalContratadoPagar += d.valorTotal || 0;
        if (d.status !== "PAGA") ativosPagar++;
      } else {
        totalReceberAberto += d.valorRestante || 0;
        if (d.status !== "PAGA") acordosReceber++;
      }

      for (const p of d.parcelas || []) {
        totalJuros += p.valorJuros || 0;
        totalDescontos += p.valorDesconto || 0;
        somaParcelasFiltradas += p.valor || 0;

        if (p.status !== "PAGO" && p.status !== "CANCELADO") {
          parcelasPendentesFiltradas++;
          if (p.dataVencimento) {
            const [y, m] = p.dataVencimento.split("-").map(Number);
            if (y === curYear && m === curMonth) {
              venceNoMesValor += p.valor || 0;
              venceNoMesCount++;
            }
            if (p.dataVencimento < todayStr) {
              atrasadosCount++;
            }
          }
        }
      }
    }

    const quitacaoPct =
      totalContratadoPagar > 0
        ? Math.max(0, Math.min(100, ((totalContratadoPagar - saldoDevedorPagar) / totalContratadoPagar) * 100))
        : 0;

    return {
      saldoDevedorPagar,
      quitacaoPct,
      ativosPagar,
      venceNoMesValor,
      venceNoMesCount,
      atrasadosCount,
      totalReceberAberto,
      acordosReceber,
      totalJuros,
      totalDescontos,
      recorrentesCount,
      parceladasCount,
      parcelasPendentesFiltradas,
      somaParcelasFiltradas,
    };
  }, [filteredItems, ano, mes]);

  const toggleCard = (id: number) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyBarcode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Linha digitável copiada!");
    } catch {
      toast.error("Não foi possível copiar o código.");
    }
  };

  const handleSaveBarcode = async (parcelaId: number) => {
    await linhaMutation.mutateAsync({ parcelaId, linhaDigitavel: barcodeDraft });
    setEditingBarcodeId(null);
    setBarcodeDraft("");
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await DividasService.exportarPdf(tipoApi, pessoaId, ano, mes, status);
      toast.success(
        selectedPessoa
          ? `PDF de cobrança de ${selectedPessoa.nome} gerado!`
          : "PDF de compromissos gerado!"
      );
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDelete = (divida: Divida) => {
    if (!window.confirm(`Deseja excluir "${divida.descricao}"?`)) return;
    deletarMutation.mutate(divida.id);
  };

  const handleCancelarRecorrencia = (divida: Divida) => {
    if (!window.confirm(`Encerrar a recorrência mensal de "${divida.descricao}"?`)) return;
    cancelarRecorrenciaMutation.mutate(divida.id);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const periodoTexto = mes && ano ? `${MESES_LABEL[mes - 1]}/${ano}` : ano ? `Ano ${ano}` : "Todos os períodos";
  const loteTipo: TipoDivida = tipoApi || (filteredItems[0]?.tipo ?? "A_RECEBER");

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Boletos, Parcelamentos &amp; Dívidas
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Carnês, boletos com linha digitável, financiamentos, contas recorrentes e cobranças por pessoa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-foreground hover:border-white/25 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download size={14} />
              {exportingPdf
                ? "Gerando PDF..."
                : selectedPessoa
                  ? `PDF de ${selectedPessoa.nome}`
                  : "Exportar PDF"}
            </button>

            <button
              type="button"
              onClick={() => {
                setDividaToEdit(null);
                setFormOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              Novo Compromisso
            </button>
          </div>
        </div>

        {/* Bento KPIs (4 cards) */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Saldo Devedor (A Pagar)
                </span>
                <span className="text-[11px] font-mono text-red-400">
                  {metrics.ativosPagar} ativos
                </span>
              </div>
              <div className={`text-2xl font-bold text-foreground mt-2 ${moneyClass}`}>
                {formatCurrency(metrics.saldoDevedorPagar)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Quitação global</span>
                  <strong className="text-foreground tabular-nums">
                    {metrics.quitacaoPct.toFixed(0)}%
                  </strong>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${metrics.quitacaoPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`glass-panel rounded-2xl p-5 flex flex-col justify-between ${
                metrics.atrasadosCount > 0 ? "border-amber-400/35" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {mes && ano ? `Vence em ${MESES_LABEL[mes - 1]}` : "Vence neste Mês"}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400/15 text-amber-300">
                  {metrics.venceNoMesCount} pendentes
                </span>
              </div>
              <div className={`text-2xl font-bold text-amber-300 mt-2 ${moneyClass}`}>
                {formatCurrency(metrics.venceNoMesValor)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between text-xs text-muted-foreground">
                <span>Em atraso</span>
                <strong className={metrics.atrasadosCount > 0 ? "text-red-400" : "text-emerald-400"}>
                  {metrics.atrasadosCount > 0 ? `${metrics.atrasadosCount} parcela(s)` : "Em dia"}
                </strong>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  A Receber (Pessoas)
                </span>
                <ArrowUpRight size={15} className="text-emerald-400" />
              </div>
              <div className={`text-2xl font-bold text-emerald-400 mt-2 ${moneyClass}`}>
                {formatCurrency(metrics.totalReceberAberto)}
              </div>
              <div className="mt-3 pt-2.5 border-t border-white/10 flex justify-between text-xs text-muted-foreground">
                <span>Acordos ativos</span>
                <strong className="text-foreground">{metrics.acordosReceber}</strong>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Juros vs Descontos
                </span>
                <Barcode size={14} className="text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <div>
                  <div className={`text-lg font-bold text-emerald-400 ${moneyClass}`}>
                    -{formatCurrency(metrics.totalDescontos)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Descontos</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold text-red-400 ${moneyClass}`}>
                    +{formatCurrency(metrics.totalJuros)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">Juros pagos</div>
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-muted-foreground">
                {metrics.parceladasCount} parcelada(s) · {metrics.recorrentesCount} recorrente(s)
              </div>
            </div>
          </section>
        )}

        {/* Erro */}
        {isError && (
          <div className="glass-panel rounded-2xl border border-red-500/35 p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-400" size={20} />
              <p className="text-sm text-foreground">Erro ao carregar compromissos.</p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Barra de Abas + Filtros Completos (Pessoa, Ano, Mês, Situação, Tipo e Busca) */}
        <section className="glass-panel rounded-2xl p-4 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
              {(
                [
                  { id: "ALL", label: `Todos (${items.length})` },
                  { id: "BOLETO", label: "Boletos & Carnês" },
                  { id: "FINANCIAMENTO", label: "Financiamentos" },
                  { id: "EMPRESTIMO", label: "Pessoas (Fixo)" },
                  { id: "SALDO_ABERTO", label: "Saldo Aberto (Extrato)" },
                  { id: "CONTATOS", label: "Agenda de Contatos", icon: Users },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {"icon" in tab && tab.icon && <tab.icon size={13} />}
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab !== "CONTATOS" && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                  {(["TODOS", "A_PAGAR", "A_RECEBER"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipoFilter(t)}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        tipoFilter === t
                          ? "bg-white/15 text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "TODOS" ? "Todos" : t === "A_PAGAR" ? "A Pagar" : "A Receber"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 border border-white/10 flex-1 sm:w-64">
                  <Search size={14} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar credor, pessoa ou descrição..."
                    className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {activeTab !== "CONTATOS" && (
            <div className="pt-3 border-t border-white/10">
              <DividaFilters
                pessoaId={pessoaId}
                onPessoaChange={setPessoaId}
                ano={ano}
                onAnoChange={(newAno) => {
                  setAno(newAno);
                  if (!newAno) setMes(undefined);
                }}
                mes={mes}
                onMesChange={handleMesChange}
                status={status}
                onStatusChange={setStatus}
                onClear={handleClearFilters}
              />
            </div>
          )}
        </section>

        {/* PAINEL DE EXTRATO / COBRANÇA DO FILTRO ATIVO (Pessoa e/ou Mês) */}
        {activeTab !== "CONTATOS" && hasApiFilters && !isLoading && (
          <section className="glass-panel rounded-2xl border border-white/20 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground">
                  Resumo Filtrado
                </span>
                {selectedPessoa && (
                  <span className="text-xs font-semibold text-foreground">
                    Pessoa: {selectedPessoa.nome}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">· {periodoTexto}</span>
                {status && <span className="text-xs text-muted-foreground">· {status}</span>}
              </div>

              <div className="flex flex-wrap items-baseline gap-3 pt-1">
                <span className={`text-2xl font-bold text-foreground ${moneyClass}`}>
                  {formatCurrency(resumo?.totalGeral ?? metrics.somaParcelasFiltradas)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ano
                    ? `Total das parcelas em ${periodoTexto}`
                    : selectedPessoa
                      ? `Saldo total em aberto de ${selectedPessoa.nome}`
                      : "Total filtrado em aberto"}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                {filteredItems.length} compromisso(s) ({metrics.parceladasCount} parcelado(s) e{" "}
                {metrics.recorrentesCount} recorrente(s)) · {metrics.parcelasPendentesFiltradas}{" "}
                parcela(s) pendente(s)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {metrics.parcelasPendentesFiltradas > 0 && (
                <button
                  type="button"
                  onClick={() => setLoteOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/15 text-foreground hover:border-white/30 transition-colors inline-flex items-center gap-1.5"
                >
                  <Layers size={14} />
                  Quitar Lote ({metrics.parcelasPendentesFiltradas})
                </button>
              )}

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={14} />
                {selectedPessoa
                  ? `Gerar PDF de Cobrança (${selectedPessoa.nome})`
                  : "Exportar PDF Filtrado"}
              </button>
            </div>
          </section>
        )}

        {/* Conteúdo: Contatos ou Lista de Compromissos */}
        {activeTab === "CONTATOS" ? (
          <div className="glass-panel rounded-2xl p-5">
            <PessoasList />
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-2">
            <Barcode size={36} className="mx-auto text-muted-foreground/30" />
            <p className="text-sm font-semibold text-foreground">
              Nenhum compromisso encontrado para este filtro
            </p>
            <p className="text-xs text-muted-foreground">
              Ajuste os filtros acima ou clique em &ldquo;+ Novo Compromisso&rdquo;.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((divida) => {
              const mod: ModalidadeDivida = divida.modalidade || (divida.pessoaId ? "EMPRESTIMO" : "BOLETO");
              const meta = MODALIDADE_META[mod] || MODALIDADE_META.OUTROS;
              const isSaldoAberto = mod === "SALDO_ABERTO";
              const isOpen = openIds.has(divida.id) || Boolean(ano && mes);
              const isReceber = divida.tipo === "A_RECEBER";
              const totalParc = divida.totalParcelas || divida.parcelas?.length || 1;
              const pagasCount = (divida.parcelas || []).filter((p) => p.status === "PAGO").length;
              const valorJaPago = Math.max(0, (divida.valorTotal || 0) - (divida.valorRestante || 0));
              const pct = isSaldoAberto
                ? divida.valorTotal > 0
                  ? Math.round((valorJaPago / divida.valorTotal) * 100)
                  : 0
                : divida.recorrente
                  ? 100
                  : Math.round((pagasCount / Math.max(1, totalParc)) * 100);
              const titular =
                divida.credor ||
                (divida.pessoaNome && divida.pessoaNome !== "Não vinculada" ? divida.pessoaNome : "Sem credor");

              const somaParcelasVisiveis = (divida.parcelas || []).reduce(
                (acc, p) => acc + (p.valor || 0),
                0
              );

              // Extrato acumulado para SALDO_ABERTO
              let saldoCorrendo = divida.valorTotal || 0;
              const extratoLinhas = isSaldoAberto
                ? [...(divida.parcelas || [])]
                    .sort((a, b) => (a.dataPagamento || a.dataVencimento).localeCompare(b.dataPagamento || b.dataVencimento))
                    .map((p) => {
                      saldoCorrendo = Math.max(0, saldoCorrendo - (p.valor || 0));
                      return { ...p, saldoApos: saldoCorrendo };
                    })
                : [];

              return (
                <div
                  key={divida.id}
                  className="glass-panel rounded-2xl border border-white/10 hover:border-white/20 overflow-hidden transition-colors"
                >
                  <div className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => toggleCard(divida.id)}
                      className="flex-1 min-w-[220px] text-left space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                        {divida.recorrente && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            <RefreshCcw size={10} /> Recorrente Mensal
                          </span>
                        )}
                        {divida.pausarPrevisao && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-500/20 text-zinc-300 border border-zinc-500/35">
                            <PauseCircle size={10} /> Fora da Previsão
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          {isReceber ? (
                            <ArrowUpRight size={12} className="text-emerald-400" />
                          ) : (
                            <ArrowDownRight size={12} className="text-red-400" />
                          )}
                          {titular}
                          {divida.categoriaNome ? ` · ${divida.categoriaNome}` : ""}
                        </span>
                      </div>
                      <div className="text-base font-bold text-foreground">{divida.descricao}</div>
                    </button>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                      {!divida.recorrente && (
                        <div className="w-40 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
                            <span>
                              {isSaldoAberto
                                ? `${pagasCount} lanç. · ${pct}%`
                                : `${pagasCount}/${totalParc} pagas`}
                            </span>
                            <strong className="text-foreground">{pct}%</strong>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isSaldoAberto
                                  ? "bg-sky-400"
                                  : isReceber
                                    ? "bg-emerald-400"
                                    : "bg-primary"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {isSaldoAberto && divida.status !== "PAGA" && divida.valorRestante > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAmortizarDivida(divida);
                            setAmortizarOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                        >
                          <Plus size={13} />
                          {isReceber ? "Registrar Recebimento" : "Registrar Pagamento"}
                        </button>
                      )}

                      <div className="text-right min-w-[115px]">
                        <div className="text-[11px] text-muted-foreground">
                          {ano && mes
                            ? `No mês (${MESES_LABEL[mes - 1]})`
                            : divida.recorrente
                              ? "Valor mensal"
                              : "Restante"}
                        </div>
                        <div className={`text-base font-bold text-foreground ${moneyClass}`}>
                          {formatCurrency(
                            ano && mes
                              ? somaParcelasVisiveis
                              : divida.recorrente
                                ? divida.valorParcelaRecorrente || divida.valorTotal
                                : divida.valorRestante
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {divida.status !== "PAGA" && (
                          <button
                            type="button"
                            onClick={() =>
                              pausarPrevisaoMutation.mutate({
                                id: divida.id,
                                pausarPrevisao: !divida.pausarPrevisao,
                              })
                            }
                            className={`p-2 rounded-lg transition-colors ${
                              divida.pausarPrevisao
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-muted-foreground hover:text-amber-300 hover:bg-amber-500/10"
                            }`}
                            title={
                              divida.pausarPrevisao
                                ? "Retomar na Previsão de Caixa"
                                : "Pausar da Previsão de Caixa (Inadimplente)"
                            }
                          >
                            {divida.pausarPrevisao ? (
                              <PlayCircle size={15} />
                            ) : (
                              <PauseCircle size={15} />
                            )}
                          </button>
                        )}
                        {divida.recorrente && (
                          <button
                            type="button"
                            onClick={() => handleCancelarRecorrencia(divida)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                            title="Encerrar recorrência mensal"
                          >
                            <StopCircle size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setDividaToEdit(divida);
                            setFormOpen(true);
                          }}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(divida)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleCard(divida.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                          aria-label="Expandir parcelas"
                        >
                          <ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/10 space-y-2.5">
                      {isSaldoAberto ? (
                        <div className="space-y-2">
                          {/* Linha inicial do extrato */}
                          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-300">
                                INÍCIO
                              </span>
                              <span className="text-foreground font-medium">
                                Valor original do empréstimo ({formatDate(divida.dataInicio)})
                              </span>
                            </div>
                            <span className={`font-bold text-foreground ${moneyClass}`}>
                              {formatCurrency(divida.valorTotal)}
                            </span>
                          </div>

                          {extratoLinhas.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-3 text-center">
                              Nenhum pagamento registrado ainda. Clique em &ldquo;Registrar {isReceber ? "Recebimento" : "Pagamento"}&rdquo; para abater do saldo.
                            </p>
                          ) : (
                            extratoLinhas.map((linha) => (
                              <div
                                key={linha.id}
                                className="p-3 rounded-xl bg-black/35 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                                    #{linha.numeroParcela}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {formatDate(linha.dataPagamento || linha.dataVencimento)}
                                  </span>
                                  <span className="text-foreground font-medium">
                                    {isReceber ? "Recebimento abatido" : "Pagamento abatido"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`font-bold text-emerald-400 ${moneyClass}`}>
                                    -{formatCurrency(linha.valor)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Saldo:{" "}
                                    <strong className={`text-foreground ${moneyClass}`}>
                                      {formatCurrency(linha.saldoApos)}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (divida.parcelas || []).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">
                          Nenhuma parcela neste filtro.
                        </p>
                      ) : (
                        divida.parcelas.map((p) => {
                          const isPago = p.status === "PAGO";
                          const isAtrasado = !isPago && p.dataVencimento && p.dataVencimento < todayStr;
                          const isEditingCode = editingBarcodeId === p.id;

                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl bg-black/35 border flex flex-wrap items-center justify-between gap-3 ${
                                isAtrasado ? "border-red-500/35" : "border-white/10"
                              }`}
                            >
                              <div className="space-y-1.5 min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-foreground">
                                    {divida.recorrente ? `Mês #${p.numeroParcela}` : `${p.numeroParcela}/${totalParc}`}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Venc:{" "}
                                    <strong className="text-foreground">
                                      {formatDate(p.dataVencimento)}
                                    </strong>
                                  </span>
                                  {isAtrasado && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400">
                                      Atrasado
                                    </span>
                                  )}
                                  {isPago && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                                      Pago {p.dataPagamento ? `em ${formatDate(p.dataPagamento)}` : ""}
                                    </span>
                                  )}
                                  {p.valorJuros && p.valorJuros > 0 ? (
                                    <span className="text-red-400 font-mono">
                                      +{formatCurrency(p.valorJuros)} juros
                                    </span>
                                  ) : null}
                                  {p.valorDesconto && p.valorDesconto > 0 ? (
                                    <span className="text-emerald-400 font-mono">
                                      -{formatCurrency(p.valorDesconto)} desc.
                                    </span>
                                  ) : null}
                                </div>

                                {isEditingCode ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      type="text"
                                      value={barcodeDraft}
                                      onChange={(e) => setBarcodeDraft(e.target.value)}
                                      placeholder="Cole a linha digitável do boleto..."
                                      className="flex-1 min-w-[200px] px-2.5 py-1 rounded-lg bg-black/60 border border-white/20 text-xs font-mono text-foreground outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveBarcode(p.id)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary text-primary-foreground inline-flex items-center gap-1"
                                    >
                                      <Check size={12} /> Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingBarcodeId(null)}
                                      className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : p.linhaDigitavel ? (
                                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-muted-foreground">
                                    <Barcode size={13} className="shrink-0" />
                                    <span className="truncate max-w-[240px] sm:max-w-[400px]">
                                      {p.linhaDigitavel}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyBarcode(p.linhaDigitavel!)}
                                      className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-foreground hover:border-white/30 inline-flex items-center gap-1"
                                    >
                                      <Copy size={11} /> Copiar
                                    </button>
                                    {!isPago && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingBarcodeId(p.id);
                                          setBarcodeDraft(p.linhaDigitavel || "");
                                        }}
                                        className="text-[11px] text-muted-foreground hover:text-foreground underline"
                                      >
                                        Editar
                                      </button>
                                    )}
                                  </div>
                                ) : !isPago && mod !== "EMPRESTIMO" ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBarcodeId(p.id);
                                      setBarcodeDraft("");
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                  >
                                    <Barcode size={12} /> + Adicionar linha digitável
                                  </button>
                                ) : null}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className={`text-sm font-bold text-foreground ${moneyClass}`}>
                                  {formatCurrency(p.valor)}
                                </span>
                                {!isPago ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPayingParcela({
                                        parcela: p,
                                        tipo: divida.tipo,
                                        dividaId: divida.id,
                                        pausarPrevisao: divida.pausarPrevisao,
                                      });
                                      setPayOpen(true);
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                  >
                                    {isReceber ? "Receber" : "Pagar"}
                                  </button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Quitada</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DividaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tipoDefault={tipoApi || "A_PAGAR"}
        dividaToEdit={dividaToEdit}
      />

      <PagarParcelaDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        parcela={payingParcela?.parcela || null}
        tipo={payingParcela?.tipo || "A_PAGAR"}
        dividaId={payingParcela?.dividaId}
        pausarPrevisao={payingParcela?.pausarPrevisao}
      />

      <PagarLoteMesDialog
        open={loteOpen}
        onOpenChange={setLoteOpen}
        dividas={filteredItems}
        tipo={loteTipo}
        mes={mes}
        ano={ano}
      />

      <AmortizarSaldoDialog
        open={amortizarOpen}
        onOpenChange={setAmortizarOpen}
        divida={amortizarDivida}
      />
    </AppLayout>
  );
}
