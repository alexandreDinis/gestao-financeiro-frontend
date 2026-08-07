"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { GastosMensaisReport } from "@/features/relatorios/components/GastosMensaisReport";
import { ReceitasMensaisReport } from "@/features/relatorios/components/ReceitasMensaisReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <div className="max-w-[1200px] mx-auto pb-10 space-y-6">
        <Tabs defaultValue="saidas" className="w-full">
          <TabsList className="glass-panel border-border/40 grid w-full max-w-md grid-cols-2 p-1 mb-2">
            <TabsTrigger
              value="saidas"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=active]:shadow-none
                         hover:text-red-300 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowDownRight className="w-4 h-4" />
              Relatório de Saídas
            </TabsTrigger>

            <TabsTrigger
              value="entradas"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-none
                         hover:text-emerald-300 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4" />
              Relatório de Entradas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saidas" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <GastosMensaisReport />
          </TabsContent>

          <TabsContent value="entradas" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <ReceitasMensaisReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
