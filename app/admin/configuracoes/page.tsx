"use client";

import { Settings, Globe, Mail, Shield, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "@/lib/toast";

export default function ConfiguracoesPage() {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulação — conectar com backend futuramente
    await new Promise(r => setTimeout(r, 800));
    toast.success("Configurações Salvas", "As alterações foram aplicadas com sucesso.");
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Settings className="text-[#Eab308]" />
          Configurações <span className="text-[#Eab308]">da Plataforma</span>
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as configurações globais do seu SaaS financeiro.</p>
      </div>

      {/* Dados da Plataforma */}
      <section className="glass-panel rounded-xl p-6 border-border/40 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="h-5 w-5 text-[#Eab308]" />
          <h3 className="text-lg font-semibold text-white">Dados da Plataforma</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Nome da Plataforma</Label>
            <Input defaultValue="Gestão Financeiro SaaS" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>Domínio Base</Label>
            <Input defaultValue="seusaas.com" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>URL do Frontend</Label>
            <Input defaultValue="https://app.seusaas.com" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>URL da API</Label>
            <Input defaultValue="https://api.seusaas.com" className="bg-black/40 border-border/50" />
          </div>
        </div>
      </section>

      {/* E-mail & Notificações */}
      <section className="glass-panel rounded-xl p-6 border-border/40 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">E-mail & Notificações</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>SMTP Host</Label>
            <Input placeholder="smtp.mailgun.org" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>SMTP Porta</Label>
            <Input placeholder="587" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>E-mail Remetente</Label>
            <Input placeholder="noreply@seusaas.com" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>Nome do Remetente</Label>
            <Input placeholder="Gestão Financeiro" className="bg-black/40 border-border/50" />
          </div>
        </div>
      </section>

      {/* Segurança */}
      <section className="glass-panel rounded-xl p-6 border-border/40 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Segurança</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Expiração do Token JWT (minutos)</Label>
            <Input type="number" defaultValue="60" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>Máximo de Tentativas de Login</Label>
            <Input type="number" defaultValue="5" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>Tempo de Bloqueio (minutos)</Label>
            <Input type="number" defaultValue="15" className="bg-black/40 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label>Força Mínima da Senha</Label>
            <Input type="number" defaultValue="6" min={4} className="bg-black/40 border-border/50" />
            <p className="text-xs text-muted-foreground">Caracteres mínimos exigidos</p>
          </div>
        </div>
      </section>

      {/* Ações */}
      <div className="flex justify-end pt-2 pb-8">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#Eab308] hover:bg-[#Eab308]/90 text-black font-semibold px-8 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
