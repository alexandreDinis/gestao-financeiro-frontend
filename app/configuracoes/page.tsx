"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Settings, 
  ShieldAlert, 
  Trash2, 
  RotateCcw,
  Info,
  Database
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfiguracoesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight neon-text flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary shrink-0" />
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie sua conta, preferências e manutenção de dados.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Sessão de Manutenção Crítica */}


          {/* Cards de Info Adicional (Placeholder para futuras configurações) */}
          <Card className="glass-panel border-border/40">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Dados do Tenant
              </CardTitle>
              <CardDescription>Informações sobre o armazenamento.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo de Plano:</span>
                  <span className="font-medium">Enterprise SaaS</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Localização:</span>
                  <span className="font-medium">São Paulo, BR</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[15%] shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                </div>
                <p className="text-[10px] text-muted-foreground text-center">Espaço em uso: 1.2MB / 50MB</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/40 opacity-50 cursor-not-allowed">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                <Settings className="h-5 w-5" />
                Preferências de UI
              </CardTitle>
              <CardDescription>Cores e efeitos neon.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-6 italic text-xs text-muted-foreground">
              Disponível em breve no Dashboard v2
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
