"use client";

import { useTransacoes, usePagarTransacao, useCancelarTransacao, useDeleteTransacao, useTornarManualTransacao } from "@/hooks/use-transacoes";
import { TransacaoResponse, StatusTransacao, TipoTransacao } from "@/types";
import { statusColors, statusLabels, tipoTransacaoColors, tipoTransacaoLabels } from "@/lib/ui-mappers";
import { canDelete, canEdit } from "@/lib/rbac";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, CheckCircle, XCircle, Trash2, ArrowLeftRight, Clock, Building, Hand } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TransacoesTable({ filters }: { filters: any }) {
  const { data, isLoading, isError } = useTransacoes(filters);
  const { user } = useAuth();
  
  const pagarMutation = usePagarTransacao();
  const cancelarMutation = useCancelarTransacao();
  const deleteMutation = useDeleteTransacao();
  const tornarManualMutation = useTornarManualTransacao();

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const transacoes = data?.data || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handlePagar = (id: number) => pagarMutation.mutate(id);
  const handleCancelar = (id: number) => cancelarMutation.mutate(id);
  const handleTornarManual = (id: number) => tornarManualMutation.mutate(id);
  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  // State checks for Empty / Loading / Error
  if (isLoading) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg border-border/40">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <p className="text-muted-foreground neon-text animate-pulse">Carregando transações...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-panel p-8 text-center rounded-lg border-red-500/30">
        <p className="text-red-400 font-medium">Erro ao carregar transações. Tente novamente.</p>
      </div>
    );
  }

  if (transacoes.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-lg border-border/40 flex flex-col items-center">
        <ArrowLeftRight size={48} className="text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-bold text-white tracking-widest uppercase mb-2">Nenhum Lançamento Encontrado</h3>
        <p className="text-muted-foreground">Tente limpar os filtros ou criar um novo lançamento.</p>
      </div>
    );
  }

  // Row Renderer for the standard table
  const DesktopRow = ({ t }: { t: TransacaoResponse }) => (
    <TableRow key={t.id} className={`border-border/20 transition-colors group ${t.geradoAutomaticamente ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'}`}>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {t.data.split('-').reverse().join('/')}
      </TableCell>
      <TableCell className="font-medium text-white max-w-[200px] truncate" title={t.descricao}>
        <div className="flex items-center gap-2">
          <span className="truncate">{t.descricao}</span>
          {t.geradoAutomaticamente && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center gap-1 shadow-[0_0_8px_rgba(var(--primary),0.2)]">⚙️ Automático</span>}
          {t.tipoDespesa === 'FIXA' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Fixa</span>}
          {t.tipoDespesa === 'VARIAVEL' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">Variável</span>}
        </div>
        {t.categoria && (
          <span className="block text-xs font-normal text-muted-foreground mt-0.5 truncate">
            {t.categoria.nome}
          </span>
        )}
      </TableCell>
      <TableCell>
        <span className={`text-sm ${tipoTransacaoColors[t.tipo]}`}>
          {tipoTransacaoLabels[t.tipo]}
        </span>
      </TableCell>
      <TableCell>
         {/* Simple visualization of Account involvement. If it's a transfer, we'd ideally show Origem -> Destino */}
         <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
           <Building size={14} className="opacity-50" />
           <span className="truncate max-w-[120px]">
             {t.lancamentos[0]?.contaNome || "Conta Padrão"}
           </span>
         </div>
      </TableCell>
      <TableCell>
        <Badge className={`text-xs ${statusColors[t.status]}`}>
          {statusLabels[t.status]}
        </Badge>
      </TableCell>
      <TableCell className={`text-right font-medium whitespace-nowrap ${t.tipo === TipoTransacao.DESPESA ? 'text-red-400' : t.tipo === TipoTransacao.RECEITA ? 'text-green-400' : 'text-blue-400'}`}>
        {t.tipo === TipoTransacao.DESPESA ? "-" : t.tipo === TipoTransacao.RECEITA ? "+" : ""}
        {formatCurrency(t.valor)}
      </TableCell>
      <TableCell className="text-right">
        {/* Kebab Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-8 w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <MoreVertical size={16} />
                <span className="sr-only">Abrir menu</span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="glass-panel border-border/40 w-[160px]">
            {canEdit(user) && (t.status === StatusTransacao.PENDENTE || t.status === StatusTransacao.ATRASADO) && (
              <DropdownMenuItem onClick={() => handlePagar(t.id)} className="text-green-400 cursor-pointer focus:bg-green-500/10 focus:text-green-400">
                <CheckCircle size={14} className="mr-2" /> Pagar
              </DropdownMenuItem>
            )}
            {canEdit(user) && t.status !== StatusTransacao.CANCELADO && (
              <DropdownMenuItem onClick={() => handleCancelar(t.id)} className="text-yellow-400 cursor-pointer focus:bg-yellow-500/10 focus:text-yellow-400">
                <XCircle size={14} className="mr-2" /> Cancelar
              </DropdownMenuItem>
            )}
            
            {(canEdit(user) && (t.status === StatusTransacao.PENDENTE || t.status === StatusTransacao.ATRASADO)) && (
               <DropdownMenuSeparator className="bg-border/40" />
            )}

            {t.geradoAutomaticamente && (
              <DropdownMenuItem onClick={() => handleTornarManual(t.id)} className="text-primary cursor-pointer focus:bg-primary/10 focus:text-primary">
                <Hand size={14} className="mr-2" /> Tornar Manual
              </DropdownMenuItem>
            )}

            {canDelete(user) && (
              <DropdownMenuItem onClick={() => setDeleteConfirmId(t.id)} className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                <Trash2 size={14} className="mr-2" /> Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  // Card Renderer for Mobile
  const MobileCard = ({ t }: { t: TransacaoResponse }) => (
    <div key={t.id} className="glass-panel border-border/40 p-4 rounded-lg flex flex-col gap-3 relative">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-white text-base flex flex-wrap items-center gap-2">
            <span className="truncate max-w-[150px]">{t.descricao}</span>
            {t.geradoAutomaticamente && <span className="text-[9px] px-1 py-0 rounded bg-primary/20 text-primary border border-primary/30 whitespace-nowrap">⚙️ Automático</span>}
            {t.tipoDespesa === 'FIXA' && <span className="text-[9px] px-1 py-0 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 whitespace-nowrap">Fixa</span>}
            {t.tipoDespesa === 'VARIAVEL' && <span className="text-[9px] px-1 py-0 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap">Variável</span>}
          </h4>
          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
             <Clock size={12} /> {t.data.split('-').reverse().join('/')}
          </span>
        </div>
        <Badge className={`text-[10px] px-1.5 py-0 h-5 ${statusColors[t.status]}`}>
          {statusLabels[t.status]}
        </Badge>
      </div>
      
      <div className="flex justify-between items-end mt-1">
        <div className="flex flex-col gap-1">
           <span className="text-xs text-muted-foreground">
             {t.categoria?.nome || "Sem categoria"}
           </span>
           <span className="text-xs text-muted-foreground flex items-center gap-1">
             <Building size={12} className="opacity-50" /> {t.lancamentos[0]?.contaNome}
           </span>
        </div>
        <div className="flex flex-col items-end gap-2">
           <span className={`font-bold ${t.tipo === TipoTransacao.DESPESA ? 'text-red-400' : t.tipo === TipoTransacao.RECEITA ? 'text-green-400' : 'text-blue-400'}`}>
             {t.tipo === TipoTransacao.DESPESA ? "-" : t.tipo === TipoTransacao.RECEITA ? "+" : ""}
             {formatCurrency(t.valor)}
           </span>
           
           {/* Mobile Actions directly exposed or in Kebab */}
           <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground">
                  Opções <MoreVertical size={12} className="ml-1" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="glass-panel border-border/40">
              {canEdit(user) && (t.status === StatusTransacao.PENDENTE || t.status === StatusTransacao.ATRASADO) && (
                <DropdownMenuItem onClick={() => handlePagar(t.id)} className="text-green-400 cursor-pointer">
                  <CheckCircle size={14} className="mr-2" /> Pagar
                </DropdownMenuItem>
              )}
              {canEdit(user) && t.status !== StatusTransacao.CANCELADO && (
                <DropdownMenuItem onClick={() => handleCancelar(t.id)} className="text-yellow-400 cursor-pointer">
                  <XCircle size={14} className="mr-2" /> Cancelar
                </DropdownMenuItem>
              )}
              {canDelete(user) && (
                <>
                  <DropdownMenuSeparator className="bg-border/40" />
                  <DropdownMenuItem onClick={() => setDeleteConfirmId(t.id)} className="text-destructive cursor-pointer">
                    <Trash2 size={14} className="mr-2" /> Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="rounded-lg overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block glass-panel">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-muted-foreground w-[120px]">Data</TableHead>
                <TableHead className="text-muted-foreground min-w-[200px]">Descrição/Categoria</TableHead>
                <TableHead className="text-muted-foreground w-[130px]">Tipo</TableHead>
                <TableHead className="text-muted-foreground w-[150px]">Conta</TableHead>
                <TableHead className="text-muted-foreground w-[120px]">Status</TableHead>
                <TableHead className="text-muted-foreground text-right w-[150px]">Valor</TableHead>
                <TableHead className="text-right w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transacoes.map((t) => <DesktopRow key={t.id} t={t} />)}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {transacoes.map((t) => <MobileCard key={t.id} t={t} />)}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="glass-panel border-border/40 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja apagar permanentemente este lançamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-border/50 hover:bg-white/5 transition-colors">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir Definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
