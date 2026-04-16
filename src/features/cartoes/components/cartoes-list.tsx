"use client";

import { useState } from "react";
import { useCartoesQuery } from "../hooks/use-cartoes-query";
import { CartaoFormDialog } from "./cartao-form-dialog";
import { FaturasDialog } from "./faturas-dialog";
import { useDeletarCartaoMutation } from "../hooks/use-cartoes-mutation";
import { CartaoCredito } from "../types";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, CreditCard, Calendar, Trash2, Eye, Edit2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

function CartaoCard({ cartao, onEdit }: { cartao: CartaoCredito, onEdit: (c: CartaoCredito) => void }) {
  const deletarMut = useDeletarCartaoMutation();
  const [faturasOpen, setFaturasOpen] = useState(false);

  const percentual = Math.min((cartao.utilizado / cartao.limiteTotal) * 100, 100);
  
  // Cores semânticas baseadas no risco (Nível Fintech)
  const getProgressColor = (pct: number) => {
    if (pct >= 80) return "bg-red-500";
    if (pct >= 50) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative group shadow-lg">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
            <CreditCard size={22} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">{cartao.bandeira}</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Conta: {cartao.contaNome}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(cartao)} className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10">
            <Edit2 size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
              if(confirm("Deseja realmente excluir este cartão?")) deletarMut.mutate(cartao.id);
          }} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
               <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Limite Disponível</p>
               <p className="text-2xl font-black text-white">{formatCurrency(cartao.disponivel)}</p>
            </div>
            <div className="text-right">
               <p className="text-[10px] text-muted-foreground">Total: {formatCurrency(cartao.limiteTotal)}</p>
            </div>
          </div>
          
          <div className="relative pt-1">
             <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className={`text-[10px] font-semibold inline-block py-1 px-2 uppercase rounded-full ${percentual >= 80 ? 'text-red-400 bg-red-400/10' : 'text-primary bg-primary/10'}`}>
                    {percentual.toFixed(1)}% utilizado
                  </span>
                </div>
             </div>
             <div className="overflow-hidden h-1.5 text-xs flex rounded-full bg-white/5">
                <div 
                  style={{ width: `${percentual}%` }} 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${getProgressColor(percentual)}`}
                ></div>
             </div>
          </div>
        </div>

        {percentual >= 80 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
            <AlertTriangle size={14} />
            <span>Alerta: Evite utilizar mais de 80% do seu limite total.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mb-6">
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[9px] text-muted-foreground uppercase font-medium mb-1 flex items-center gap-1">
            <Calendar size={10} /> Fatura Atual
          </p>
          <p className="text-sm font-bold text-white">{formatCurrency(cartao.valorFaturaAberta)}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
          <p className="text-[9px] text-muted-foreground uppercase font-medium mb-1 flex items-center gap-1">
             {cartao.valorFaturasFechadas > 0 ? <AlertTriangle size={10} className="text-yellow-500" /> : <CheckCircle2 size={10} className="text-emerald-500" />} 
             Fechadas
          </p>
          <p className={`text-sm font-bold ${cartao.valorFaturasFechadas > 0 ? 'text-yellow-500' : 'text-white'}`}>
            {formatCurrency(cartao.valorFaturasFechadas)}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 px-1">
        <div className="space-y-1">
           <Badge variant="outline" className="text-[9px] bg-emerald-500/5 text-emerald-400 border-emerald-500/20 py-0 px-2 h-5">
              Melhor dia: {cartao.melhorDiaCompra}
           </Badge>
        </div>
        <div className="text-right">
           <p className="text-[10px] text-muted-foreground">Fecha em {cartao.diasParaFechar} {cartao.diasParaFechar === 1 ? 'dia' : 'dias'}</p>
        </div>
      </div>

      <Button onClick={() => setFaturasOpen(true)} className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 h-10 rounded-xl">
        <Eye className="mr-2" size={16} /> Detalhes das Faturas
      </Button>

      <FaturasDialog open={faturasOpen} onOpenChange={setFaturasOpen} cartao={cartao} />
    </div>
  );
}

export function CartoesList() {
  const { data: cartoes, isLoading } = useCartoesQuery();
  const [formOpen, setFormOpen] = useState(false);
  const [cartaoEdit, setCartaoEdit] = useState<CartaoCredito | undefined>(undefined);

  const handleOpenNew = () => {
    setCartaoEdit(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (c: CartaoCredito) => {
    setCartaoEdit(c);
    setFormOpen(true);
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando cartões...</div>;

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Button onClick={handleOpenNew}>
          <PlusCircle className="mr-2" size={18} /> Novo Cartão
        </Button>
      </div>

      {!cartoes || cartoes.length === 0 ? (
        <div className="text-center p-12 glass-panel border border-border/40 rounded-xl">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum cartão cadastrado</h3>
          <p className="text-muted-foreground mb-4">Adicione seu primeiro cartão de crédito para gerenciar suas faturas.</p>
          <Button onClick={handleOpenNew}>Adicionar Cartão</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cartoes.map((cartao) => (
            <CartaoCard key={cartao.id} cartao={cartao} onEdit={handleOpenEdit} />
          ))}
        </div>
      )}

      {/* Ao fechar o form, limpamos o estado de edição após fechar p/ evitar flicker. O React Hook form pegará o initialValues. */}
      {formOpen && (
        <CartaoFormDialog 
          open={formOpen} 
          onOpenChange={(val) => { if(!val) setTimeout(() => setCartaoEdit(undefined), 300); setFormOpen(val); }} 
          cartaoParaEditar={cartaoEdit} 
        />
      )}
    </div>
  );
}
