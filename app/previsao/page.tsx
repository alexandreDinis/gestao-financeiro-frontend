"use client";

import { usePrevisaoCaixa } from "@/hooks/use-previsao";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import PrevisaoChart from "./components/previsao-chart";
import PrevisaoTable from "./components/previsao-table";
import PrevisaoAlerts from "./components/previsao-alerts";

export default function PrevisaoPage() {
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
    <div className="flex-1 space-y-6 p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Previsão de Caixa</h1>
        <p className="text-muted-foreground">
          Simule o futuro do seu caixa com base no fluxo existente e ajustes manuais.
        </p>
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
        <h3 className="text-lg font-semibold mb-6">Evolução Projetada (Próximos 12 meses)</h3>
        <PrevisaoChart meses={data.meses} />
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-6">Detalhamento e Ajustes Manuais</h3>
        <PrevisaoTable meses={data.meses} />
      </div>
    </div>
  );
}
