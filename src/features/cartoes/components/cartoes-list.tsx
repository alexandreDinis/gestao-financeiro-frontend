"use client";

import { useState } from "react";
import { useCartoesQuery } from "../hooks/use-cartoes-query";
import { CartaoFormDialog } from "./cartao-form-dialog";
import { FaturasDialog } from "./faturas-dialog";
import { useDeletarCartaoMutation } from "../hooks/use-cartoes-mutation";
import { CartaoCredito } from "../types";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, CreditCard, Calendar, Trash2, Eye, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function CartaoCard({ cartao, onEdit }: { cartao: CartaoCredito, onEdit: (c: CartaoCredito) => void }) {
  const deletarMut = useDeletarCartaoMutation();
  const [faturasOpen, setFaturasOpen] = useState(false);

  // Todo: Aqui usaríamos o limite ocupado se a API providenciasse. Por enquanto é estático o total.
  const limiteUtilizado = 0; // Exemplo didático
  const percentual = Math.min((limiteUtilizado / cartao.limite) * 100, 100);

  return (
    <div className="glass-panel p-5 rounded-xl border border-border/40 hover:border-border/80 transition-colors relative group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            {cartao.bandeira}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Conta Base: {cartao.contaNome}</p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(cartao)} className="text-muted-foreground hover:text-white hover:bg-white/10">
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => {
              if(confirm("Deseja realmente excluir este cartão?")) deletarMut.mutate(cartao.id);
          }} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Limite Total</span>
          <span className="font-semibold text-white">{formatCurrency(cartao.limite)}</span>
        </div>
        {/*
        <div className="w-full bg-black/40 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full" style={{ width: `${percentual}%` }}></div>
        </div>
        */}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20 mb-4">
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <Calendar size={12} /> Fechamento
          </p>
          <p className="font-medium text-white">Dia {cartao.diaFechamento}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
            <Calendar size={12} /> Vencimento
          </p>
          <p className="font-medium text-white">Dia {cartao.diaVencimento}</p>
        </div>
      </div>

      <Button onClick={() => setFaturasOpen(true)} className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50">
        <Eye className="mr-2" size={16} /> Ver Faturas
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
