"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  Settings, 
  LogOut,
  Menu,
  X,
  CreditCard,
  LayoutDashboard
} from "lucide-react";
import { deleteCookie } from "@/lib/cookies";

const navigation = [
  { name: "Visão Global", href: "/admin", icon: LayoutDashboard },
  { name: "Gerenciar Tenants", href: "/admin/tenants", icon: Building2 },
  { name: "Planos SaaS", href: "/admin/planos", icon: CreditCard },
  { name: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    deleteCookie("access_token");
    deleteCookie("refresh_token");
    window.location.href = "/login";
  };

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
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 bg-black/50 backdrop-blur-xl border-r border-[#Eab308]/30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center px-6 mb-8">
            <div className="flex items-center justify-between w-full">
              <span className="text-xl font-bold tracking-wider text-[#Eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">SaaS ADMIN</span>
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
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive
                      ? "bg-[#Eab308]/20 text-[#Eab308] border border-[#Eab308]/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:border-border/50 border border-transparent"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 shrink-0 ${
                      isActive ? "text-[#Eab308]" : "text-muted-foreground group-hover:text-foreground"
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="shrink-0 flex border-t border-[#Eab308]/30 p-4 mt-auto">
            <div className="shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-[#Eab308]">Super Administrador</p>
                  <p className="text-xs font-medium text-muted-foreground">Master Control</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
                  title="Sair do SaaS"
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
        <header className="shrink-0 h-16 bg-black/30 backdrop-blur-md border-b border-[#Eab308]/30 items-center px-4 sm:px-6 lg:px-8 absolute top-0 w-full z-10 hidden sm:flex">
          <div className="flex-1 flex justify-between items-center h-full">
             <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground"
             >
                <Menu size={24} aria-hidden="true" />
             </button>
             <div className="flex-1 flex items-center justify-end">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#Eab308]/10 border border-[#Eab308]/30 text-[#Eab308] mr-4 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                   <Building2 size={14} />
                   <span className="text-sm font-medium tracking-wide">ÁREA RESTRITA SaaS</span>
                </div>
             </div>
          </div>
        </header>

        {/* Mobile header */}
        <div className="sm:hidden flex items-center justify-between bg-black/50 backdrop-blur-md border-b border-[#Eab308]/30 px-4 py-3 z-10">
            <span className="text-lg font-bold text-[#Eab308] drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">SaaS ADMIN</span>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -mr-2 text-[#Eab308] hover:text-white"
            >
              <Menu size={24} />
            </button>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none pt-4 sm:pt-20 pb-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-black">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
}
