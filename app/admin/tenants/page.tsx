"use client";

import { useAdminTenants, useAdminBloquearTenant, useAdminDesbloquearTenant, TenantAdminResponse } from "@/hooks/use-admin";
import { Building2, MoreVertical, Ban, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { TenantFormDialog } from "./components/tenant-form-dialog";

export default function TenantsPage() {
  const { data: tenants, isLoading, isError } = useAdminTenants();
  const bloquearMutation = useAdminBloquearTenant();
  const desbloquearMutation = useAdminDesbloquearTenant();
  
  const [formOpen, setFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="h-8 w-8 border-4 border-[#Eab308] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg border-red-500/30">
         <p className="text-red-400 font-medium">Erro ao carregar os clientes (tenants).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-[#Eab308]" /> 
            Gerenciar <span className="text-[#Eab308]">Tenants</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Provisione e gerencie as instâncias isoladas dos seus clientes.</p>
        </div>
        
        <Button 
          onClick={() => setFormOpen(true)}
          className="bg-[#Eab308] hover:bg-[#Eab308]/90 text-black font-semibold shadow-[0_0_15px_rgba(234,179,8,0.4)]"
        >
          <Plus size={18} className="mr-2" />
          Novo Tenant
        </Button>
      </div>

      <div className="glass-panel rounded-lg overflow-hidden border-border/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-black/40 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="px-6 py-4 font-medium">Tenant</th>
                <th className="px-6 py-4 font-medium">Subdomínio</th>
                <th className="px-6 py-4 font-medium">Plano / MRR</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Criado Em</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {tenants?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum cliente cadastrado no SaaS ainda.
                  </td>
                </tr>
              )}
              {tenants?.map((t: TenantAdminResponse) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{t.nome}</div>
                    <div className="text-xs text-muted-foreground">ID: {t.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#Eab308] font-mono text-xs">{t.subdominio}.seusaas.com</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-blue-400">{t.plano}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.mrr)}/mês
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`
                      ${t.status === 'ATIVO' ? 'border-green-500/50 text-green-400 bg-green-500/10' : ''}
                      ${t.status === 'BLOQUEADO' ? 'border-red-500/50 text-red-400 bg-red-500/10' : ''}
                      ${t.status === 'CANCELADO' ? 'border-muted-foreground text-muted-foreground bg-black/50' : ''}
                    `}>
                      {t.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                            <span className="sr-only">Abrir menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass-panel border-border/40">
                          {t.status === 'ATIVO' ? (
                            <DropdownMenuItem 
                              className="text-red-400 focus:text-red-300 focus:bg-red-500/20 cursor-pointer"
                              onClick={() => bloquearMutation.mutate(t.id)}
                            >
                              <Ban className="mr-2 h-4 w-4" /> Suspender Acesso
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              className="text-green-400 focus:text-green-300 focus:bg-green-500/20 cursor-pointer"
                              onClick={() => desbloquearMutation.mutate(t.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Reativar Acesso
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TenantFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
