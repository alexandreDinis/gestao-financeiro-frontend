"use client";

import { usePrevisaoCaixa } from "@/hooks/use-previsao";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import PrevisaoChart from "./components/previsao-chart";
import PrevisaoTable from "./components/previsao-table";
import PrevisaoAlerts from "./components/previsao-alerts";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function PrevisaoPage() {
  const router = useRouter();
  const { data, isLoading } = usePrevisaoCaixa(12);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6 sm:p-8 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-white">Previsão de Caixa</h1>
            <p className="text-muted-foreground text-sm">
              Simule o futuro do seu caixa com base no fluxo existente e ajustes manuais.
            </p>
          </div>
          <div>
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard")}
              className="glass-panel border-border/40 hover:bg-white/5 text-white"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 col-span-1 md:col-span-1 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground font-medium mb-1">Saldo Atual</p>
            <h2 className="text-4xl font-bold text-primary">{formatCurrency(data.saldoAtual)}</h2>
            <p className="text-xs text-muted-foreground mt-2">Ponto de partida para a projeção.</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <PrevisaoAlerts meses={data.meses} />
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6 text-white">Evolução Projetada (Próximos 12 meses)</h3>
          <PrevisaoChart meses={data.meses} />
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-lg font-semibold mb-6 text-white">Detalhamento e Ajustes Manuais</h3>
          <PrevisaoTable meses={data.meses} />
        </div>
      </div>
    </AppLayout>
  );
}
