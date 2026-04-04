"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, Calendar, Clock } from "lucide-react";
import { UltimaTransacao, Vencimento } from "@/types";

interface Props {
  recentes: UltimaTransacao[];
  proximos: Vencimento[];
  loading: boolean;
}

export function DashboardRecentTransactions({ recentes, proximos, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T12:00:00Z");
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const renderTransactionList = (transactions: any[], emptyMessage: string, isVencimento = false) => {
    if (transactions.length === 0) {
      return (
        <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground gap-2 animate-in fade-in duration-500">
          <Calendar size={32} className="opacity-20" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 pr-2 custom-scrollbar overflow-y-auto max-h-[320px] pt-1">
        {transactions.map((tx, idx) => {
          const key = isVencimento ? (tx as Vencimento).idUnico : `tx-${(tx as UltimaTransacao).id}-${idx}`;

          const data = isVencimento ? (tx as Vencimento).dataVencimento : (tx as UltimaTransacao).data;
          const tipo = isVencimento ? (tx as Vencimento).tipo : ((tx as UltimaTransacao).tipo || 'DESPESA');
          
          const isAtrasado = isVencimento && (tx as Vencimento).atrasado;
          const isVenceHoje = isVencimento && (tx as Vencimento).venceHoje;

          return (
            <div 
              key={key} 
              className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 group border
                ${isAtrasado 
                  ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30' 
                  : isVenceHoje
                    ? 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20 hover:border-yellow-500/30'
                    : 'bg-black/20 border-white/5 hover:bg-black/40 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-full shrink-0 group-hover:scale-110 transition-transform 
                  ${tipo === 'RECEITA' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-400'}`}>
                  {tipo === 'RECEITA' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate max-w-[140px] md:max-w-full">
                      {tx.descricao}
                    </p>
                    {isAtrasado && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500 text-white uppercase tracking-wider">
                        Atrasado
                      </span>
                    )}
                    {isVenceHoje && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-yellow-500 text-black uppercase tracking-wider">
                        Hoje
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(data)}
                    </span>
                    <span>•</span>
                    <span className="truncate">{isVencimento ? (tx as Vencimento).conta : (tx as UltimaTransacao).categoria}</span>
                  </div>
                </div>
              </div>
              <div className={`text-sm font-bold ml-2 shrink-0 ${tipo === 'RECEITA' ? 'text-green-400' : 'text-white'}`}>
                {tipo === 'RECEITA' ? '+' : ''}{formatCurrency(tx.valor)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="glass-panel h-full">
        <CardHeader>
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {[...Array(5)].map((_, i) => (
                 <div key={i} className="flex justify-between items-center bg-black/10 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-white/5 animate-pulse" />
                            <div className="h-3 w-20 bg-white/5 animate-pulse" />
                        </div>
                    </div>
                 </div>
             ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel h-full border-t-0 border-white/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Movimentações</CardTitle>
        <CardDescription>Acompanhe sua atividade recente</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="recentes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-white/5 p-1 mb-4 h-9">
            <TabsTrigger 
                value="recentes" 
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all"
            >
              Recentes
            </TabsTrigger>
            <TabsTrigger 
                value="proximas" 
                className="text-xs data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-2"
            >
              Vencimentos
              {proximos.length > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recentes" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            {renderTransactionList(recentes, "Nenhuma transação recente encontrada.")}
          </TabsContent>
          <TabsContent value="proximas" className="m-0 focus-visible:outline-none focus-visible:ring-0">
            {renderTransactionList(proximos, "Nenhum vencimento próximo.", true)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
