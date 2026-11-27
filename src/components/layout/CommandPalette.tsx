"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LineChart,
  FileBarChart,
  ArrowLeftRight,
  Clock,
  CreditCard,
  RefreshCcw,
  Wallet,
  Target,
  Tags,
  Users,
  Settings,
  Eye,
  EyeOff,
  Search,
  Plus,
} from "lucide-react";
import { usePrivacy } from "@/hooks/use-privacy";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  group: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = useMemo<CommandItem[]>(
    () => [
      {
        id: "new-tx",
        label: "Novo Lançamento (Transações)",
        group: "Ações Rápidas",
        keywords: "criar lancar receita despesa transacao novo",
        icon: Plus,
        action: () => router.push("/lancamentos"),
      },
      {
        id: "privacy",
        label: privacyMode ? "Mostrar Valores (Desativar Privacidade)" : "Ocultar Valores (Modo Privacidade)",
        group: "Ações Rápidas",
        keywords: "privacidade ocultar esconder valores seguranca blur",
        icon: privacyMode ? Eye : EyeOff,
        action: () => togglePrivacyMode(),
      },
      {
        id: "dashboard",
        label: "Dashboard",
        group: "Inteligência",
        keywords: "inicio resumo home kpi visao geral",
        icon: LayoutDashboard,
        action: () => router.push("/dashboard"),
      },
      {
        id: "previsao",
        label: "Previsão de Caixa",
        group: "Inteligência",
        keywords: "projecao futuro saldo fluxo caixa",
        icon: LineChart,
        action: () => router.push("/previsao"),
      },
      {
        id: "relatorios",
        label: "Relatórios",
        group: "Inteligência",
        keywords: "gastos receitas graficos analise mensal",
        icon: FileBarChart,
        action: () => router.push("/relatorios"),
      },
      {
        id: "lancamentos",
        label: "Transações",
        group: "Operações",
        keywords: "lancamentos extrato historico movimentacoes",
        icon: ArrowLeftRight,
        action: () => router.push("/lancamentos"),
      },
      {
        id: "contas",
        label: "Contas a Pagar",
        group: "Operações",
        keywords: "vencimentos boletos pagar receber pendencias",
        icon: Clock,
        action: () => router.push("/contas"),
      },
      {
        id: "cartoes",
        label: "Cartões de Crédito",
        group: "Operações",
        keywords: "fatura limite parcelas compra cartao",
        icon: CreditCard,
        action: () => router.push("/cartoes"),
      },
      {
        id: "recorrencias",
        label: "Assinaturas & Fixas",
        group: "Operações",
        keywords: "recorrencias fixas mensalidade assinatura",
        icon: RefreshCcw,
        action: () => router.push("/recorrencias"),
      },
      {
        id: "bancos",
        label: "Bancos & Saldos",
        group: "Patrimônio",
        keywords: "contas bancarias saldo banco",
        icon: Wallet,
        action: () => router.push("/bancos"),
      },
      {
        id: "orcamentos",
        label: "Orçamentos",
        group: "Patrimônio",
        keywords: "limite categoria meta mensal",
        icon: Target,
        action: () => router.push("/orcamentos"),
      },
      {
        id: "categorias",
        label: "Categorias",
        group: "Patrimônio",
        keywords: "subcategorias tags classificacao",
        icon: Tags,
        action: () => router.push("/categorias"),
      },
      {
        id: "dividas",
        label: "Boletos, Parcelamentos & Dívidas",
        group: "Patrimônio",
        keywords: "boletos carnes financiamentos emprestimos parcelas pessoas dividas pdf",
        icon: Users,
        action: () => router.push("/dividas"),
      },
      {
        id: "configuracoes",
        label: "Configurações",
        group: "Sistema",
        keywords: "perfil conta plano usuario config",
        icon: Settings,
        action: () => router.push("/configuracoes"),
      },
    ],
    [privacyMode, router, togglePrivacyMode]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.keywords.includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (open && e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      } else if (open && e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      } else if (open && e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (open && e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault();
        filtered[selectedIndex].action();
        onOpenChange(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtered, onOpenChange, open, selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[14vh] p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onOpenChange(false);
          setQuery("");
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl glass-panel border border-white/15 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar tela, ação rápida ou alternar privacidade..."
            autoFocus
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhum comando encontrado para &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    item.action();
                    onOpenChange(false);
                    setQuery("");
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-foreground hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md shrink-0 ${
                      isSelected
                        ? "bg-black/15 text-primary-foreground"
                        : "bg-white/5 text-muted-foreground border border-white/10"
                    }`}
                  >
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
