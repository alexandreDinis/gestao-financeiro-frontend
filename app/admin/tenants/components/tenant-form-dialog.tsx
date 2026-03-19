"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTenant, TenantCreateRequest } from "@/hooks/use-admin";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Mail, Lock, User, Globe, CreditCard } from "lucide-react";

const tenantSchema = z.object({
  tenantNome: z.string().min(3, "Nome da empresa muito curto"),
  subdominio: z.string().min(3, "Subdomínio muito curto").regex(/^[a-z0-9-]+$/, "Apenas minúsculas, números e hífens"),
  planoId: z.number().min(1, "Selecione um plano"),
  adminNome: z.string().min(3, "Nome muito curto"),
  adminEmail: z.string().email("Endereço de email inválido"),
  adminSenha: z.string().min(6, "No mínimo 6 caracteres"),
});

export function TenantFormDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const createMutation = useCreateTenant();

  const { register, handleSubmit, reset, formState: { errors, isValid } } = useForm<TenantCreateRequest>({
    resolver: zodResolver(tenantSchema),
    mode: "onChange",
    defaultValues: { planoId: 1 } // MVP: Hardcoded plan ID assumption 
  });

  const onSubmit = async (data: TenantCreateRequest) => {
    try {
      await createMutation.mutateAsync({
         ...data,
         planoId: Number(data.planoId)
      });
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-[#Eab308]/30 sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <Building2 className="text-[#Eab308]" /> Novo Workspace 
          </DialogTitle>
          <DialogDescription>
            Provisione uma nova infraestrutura isolada (Tenant) para o seu cliente e crie o usuário master do painel dele.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Coluna 1: Dados da Empresa */}
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-[#Eab308] uppercase tracking-wider border-b border-[#Eab308]/20 pb-2">Empresa (Tenant)</h3>
                 
                 <div className="space-y-2 relative">
                    <Label>Nome Fantasia</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Acme Corp" className="pl-10 bg-black/40 border-border/50" {...register("tenantNome")} />
                    </div>
                    {errors.tenantNome && <p className="text-red-400 text-xs">{errors.tenantNome.message}</p>}
                 </div>

                 <div className="space-y-2 relative">
                    <Label>Subdomínio</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="acme" className="pl-10 bg-black/40 border-border/50" {...register("subdominio")} />
                      <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-mono">.seusaas.com</span>
                    </div>
                    {errors.subdominio && <p className="text-red-400 text-xs">{errors.subdominio.message}</p>}
                 </div>

                 <div className="space-y-2 relative">
                    <Label>ID do Plano Base</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" placeholder="1" className="pl-10 bg-black/40 border-border/50" {...register("planoId", { valueAsNumber: true })} />
                    </div>
                    <p className="text-xs text-muted-foreground">ID da tabela Planos</p>
                 </div>
              </div>

              {/* Coluna 2: Master Admin */}
              <div className="space-y-4">
                 <h3 className="text-sm font-semibold text-[#Eab308] uppercase tracking-wider border-b border-[#Eab308]/20 pb-2">Administrador Master</h3>
                 
                 <div className="space-y-2 relative">
                    <Label>Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="João Consultor" className="pl-10 bg-black/40 border-border/50" {...register("adminNome")} />
                    </div>
                    {errors.adminNome && <p className="text-red-400 text-xs">{errors.adminNome.message}</p>}
                 </div>

                 <div className="space-y-2 relative">
                    <Label>Endereço de E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="email" placeholder="joao@acme.com" className="pl-10 bg-black/40 border-border/50" {...register("adminEmail")} />
                    </div>
                    {errors.adminEmail && <p className="text-red-400 text-xs">{errors.adminEmail.message}</p>}
                 </div>

                 <div className="space-y-2 relative">
                    <Label>Senha Temporária</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="******" className="pl-10 bg-black/40 border-border/50" {...register("adminSenha")} />
                    </div>
                    {errors.adminSenha && <p className="text-red-400 text-xs">{errors.adminSenha.message}</p>}
                 </div>
              </div>

           </div>

           <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={!isValid || createMutation.isPending}
                className="bg-[#Eab308] hover:bg-[#Eab308]/90 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]"
              >
                {createMutation.isPending ? "Provisionando Integração..." : "Criar Infraestrutura Tenant"}
              </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
