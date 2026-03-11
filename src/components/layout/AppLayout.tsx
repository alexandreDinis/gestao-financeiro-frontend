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
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Contas", href: "/contas", icon: Wallet },
  { name: "Categorias", href: "/categorias", icon: Tags },
  { name: "Lançamentos", href: "/lancamentos", icon: ArrowLeftRight },
  { name: "Cartões", href: "/cartoes", icon: CreditCard },
  { name: "Pessoas & Dívidas", href: "/dividas", icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 glass-panel border-r border-border/40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center px-6 mb-8">
            <div className="flex items-center justify-between w-full">
              <span className="text-xl font-bold neon-text tracking-wider">GESTÃO SAAS</span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <nav className="mt-5 flex-1 px-4 space-y-2 relative">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/50 border border-transparent"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex-shrink-0 flex border-t border-border/40 p-4 mt-auto">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{user?.nome || "Usuário"}</p>
                  <p className="text-xs font-medium text-muted-foreground truncate">{user?.email || "usuario@tenant.com"}</p>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                  title="Sair"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
        <header className="flex-shrink-0 h-16 glass-panel border-b border-border/40 flex items-center px-4 sm:px-6 lg:px-8 absolute top-0 w-full z-10 hidden sm:flex">
          <div className="flex-1 flex justify-between items-center">
             <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
             >
                <span className="sr-only">Open sidebar</span>
                <Menu size={24} aria-hidden="true" />
             </button>
             <div className="flex-1">
               {/* Search or Breadcrumbs can go here */}
             </div>
          </div>
        </header>

        {/* Mobile header (outside the hidden toggle) */}
        <div className="sm:hidden flex items-center justify-between glass-panel border-b border-border/40 px-4 py-3 z-10">
            <span className="text-lg font-bold neon-text">GESTÃO SAAS</span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
            >
              <Menu size={24} />
            </button>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none pt-4 sm:pt-20 pb-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
