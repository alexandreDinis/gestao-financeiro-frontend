"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CreditCard, AlertCircle } from "lucide-react";
import { ResumoCartao } from "@/types";

interface Props {
  cartoes: ResumoCartao[];
  loading: boolean;
}

export function DashboardCreditCards({ cartoes, loading }: Props) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  if (loading) {
    return (
      <Card className="glass-panel h-full">
        <CardHeader>
           <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
           {[...Array(2)].map((_, i) => (
               <div key={i} className="space-y-2">
                  <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                  <div className="h-2 w-full bg-white/5 rounded animate-pulse" />
               </div>
           ))}
        </CardContent>
      </Card>
    );
  }

  if (!cartoes || cartoes.length === 0) return null;

  return (
    <Card className="glass-panel h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Cartões de Crédito
        </CardTitle>
        <CardDescription>Uso do limite e faturas atuais</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6 overflow-y-auto max-h-[350px] custom-scrollbar">
        {cartoes.map((cartao, index) => {
           const isHighUsage = cartao.percentualUtilizado >= 80;
           return (
             <div key={index} className="space-y-3 p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="flex justify-between items-start">
                   <div>
                      <p className="text-sm font-bold text-white">{cartao.nome}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        Disponível: {formatCurrency(cartao.disponivel)}
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatCurrency(cartao.faturaAtual)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Fatura atual</p>
                   </div>
                </div>
                
                <div className="space-y-1">
                   <div className="flex justify-between text-[10px] mb-1">
                      <span className={isHighUsage ? 'text-yellow-400 font-medium' : 'text-muted-foreground'}>
                         {cartao.percentualUtilizado.toFixed(1)}% do limite
                      </span>
                      <span className="text-muted-foreground">{formatCurrency(cartao.limite)}</span>
                   </div>
                   <Progress 
                      value={Math.min(cartao.percentualUtilizado, 100)} 
                      className="h-1.5 bg-black/40"
                      indicatorColor={isHighUsage ? 'bg-yellow-500' : 'bg-primary'}
                   />
                </div>

                {isHighUsage && (
                   <div className="flex items-center gap-1.5 text-[10px] text-yellow-400/80 bg-yellow-400/5 p-1.5 rounded border border-yellow-400/10">
                      <AlertCircle size={12} />
                      Uso elevado do limite disponível
                   </div>
                )}
             </div>
           );
        })}
      </CardContent>
    </Card>
  );
}
