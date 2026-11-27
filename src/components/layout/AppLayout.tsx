"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Tags,
  ArrowLeftRight,
  CreditCard,
  Users,
  LogOut,
  Menu,
  X,
  Building,
  Target,
  Clock,
  Settings,
  RefreshCcw,
  LineChart,
  FileBarChart,
  Search,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CommandPalette } from "./CommandPalette";

const navGroups = [
  {
    label: "Inteligência",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Previsão de Caixa", href: "/previsao", icon: LineChart },
      { name: "Relatórios", href: "/relatorios", icon: FileBarChart },
    ],
  },
  {
    label: "Operações",
    items: [
      { name: "Transações", href: "/lancamentos", icon: ArrowLeftRight },
      { name: "Contas a Pagar", href: "/contas", icon: Clock },
      { name: "Cartões", href: "/cartoes", icon: CreditCard },
      { name: "Assinaturas & Fixas", href: "/recorrencias", icon: RefreshCcw },
    ],
  },
  {
    label: "Patrimônio",
    items: [
      { name: "Bancos & Saldos", href: "/bancos", icon: Wallet },
      { name: "Orçamentos", href: "/orcamentos", icon: Target },
      { name: "Categorias", href: "/categorias", icon: Tags },
      { name: "Boletos & Dívidas", href: "/dividas", icon: Users },
      { name: "Configurações", href: "/configuracoes", icon: Settings },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex text-foreground items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
            Sincronizando ambiente seguro...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 glass-panel border-r border-border/50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-4 overflow-y-auto">
          {/* Brand */}
          <div className="flex items-center justify-between px-2 pb-4 border-b border-border/50">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground font-extrabold text-xs flex items-center justify-center shadow-[0_0_18px_rgba(255,255,255,0.18)]">
                GF
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-foreground leading-tight">
                  Gestão Financeira
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live · v3
                </div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          </div>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="mt-4 w-full flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search size={13} />
              Comando rápido...
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-foreground">
              ⌘K
            </kbd>
          </button>

          {/* Grouped Navigation */}
          <nav className="mt-5 flex-1 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-[0_0_20px_rgba(255,255,255,0.14)]"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <item.icon
                            className={`h-4 w-4 shrink-0 ${
                              isActive
                                ? "text-primary-foreground"
                                : "text-muted-foreground group-hover:text-foreground"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Footer */}
          <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border/50 pt-4 mt-4 px-1">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{user?.nome || "Usuário"}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user?.email || "usuario@tenant.com"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
              title="Sair"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 h-14 glass-panel border-b border-border/50 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <span className="lg:hidden text-sm font-bold tracking-tight">Gestão Financeira</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground"
            >
              <Search size={13} />
              <span className="font-mono text-[10px]">⌘K</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-foreground">
              <Building size={13} className="text-muted-foreground" />
              <span className="font-medium truncate max-w-[160px] sm:max-w-none">
                {user?.tenantName || "Workspace Pessoal"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1440px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
