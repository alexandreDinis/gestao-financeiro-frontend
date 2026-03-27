"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DividasList } from "@/features/dividas/components/dividas-list";
import { PessoasList } from "@/features/pessoas/components/pessoas-list";
import { DividasResumo } from "@/features/dividas/components/dividas-resumo";
import { Users, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function PessoasEDividasPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Gestão de <span className="text-primary neon-text">Pessoas & Empréstimos</span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Acompanhe o que você emprestou, o que pegou emprestado e gerencie sua agenda de contatos.
          </p>
        </div>

        <DividasResumo />

        <Tabs defaultValue="receber" className="w-full">
          <TabsList className="glass-panel border-border/40 grid w-full grid-cols-3 mb-6 p-1">
            <TabsTrigger 
              value="receber" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:shadow-none
                         hover:text-green-300 transition-colors hidden sm:flex"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Contas a Receber
            </TabsTrigger>
            <TabsTrigger 
              value="receber" 
              className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:shadow-none
                         hover:text-green-300 transition-colors sm:hidden"
            >
              <ArrowUpRight className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger 
              value="pagar"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=active]:shadow-none
                         hover:text-red-300 transition-colors hidden sm:flex"
            >
              <ArrowDownRight className="w-4 h-4 mr-2" />
              Contas a Pagar
            </TabsTrigger>
            <TabsTrigger 
              value="pagar"
              className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=active]:shadow-none
                         hover:text-red-300 transition-colors sm:hidden"
            >
              <ArrowDownRight className="w-4 h-4" />
            </TabsTrigger>

            <TabsTrigger 
              value="pessoas"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-none
                         hover:text-blue-300 transition-colors hidden sm:flex"
            >
              <Users className="w-4 h-4 mr-2" />
              Contatos
            </TabsTrigger>
            <TabsTrigger 
              value="pessoas"
              className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:shadow-none
                         hover:text-blue-300 transition-colors sm:hidden"
            >
              <Users className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="receber" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <DividasList tipo="A_RECEBER" />
          </TabsContent>
          
          <TabsContent value="pagar" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <DividasList tipo="A_PAGAR" />
          </TabsContent>

          <TabsContent value="pessoas" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <div className="glass-panel p-4 border border-border/40 rounded-xl">
               <div className="mb-4">
                 <h3 className="text-lg font-medium text-blue-400 flex items-center gap-2">
                   Agenda Baseada em Reputação
                 </h3>
                 <p className="text-sm text-muted-foreground">
                   Rankeamento automático guiado pelo histórico de transações entre vocês.
                 </p>
               </div>
               <PessoasList />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
