"use client";

import { useRecorrencias, useDeleteRecorrencia } from "@/hooks/use-recorrencias";
import { Recorrencia, StatusRecorrencia } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Trash2, 
  Calendar, 
  Settings, 
  Tag, 
  Building
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

const statusColors: any = {
  ativa: "bg-green-500/20 text-green-400 border-green-500/30",
  ATIVA: "bg-green-500/20 text-green-400 border-green-500/30",
  PAUSADA: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ENCERRADA: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function RecorrenciaList() {
  const { data: recorrencias, isLoading, isError } = useRecorrencias();
  const deleteMutation = useDeleteRecorrencia();
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) return <div className="text-center p-8">Carregando...</div>;
  if (isError) return <div className="text-center p-8 text-red-400">Erro ao carregar recorrências.</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="glass-panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableHead className="text-muted-foreground">Descrição</TableHead>
            <TableHead className="text-muted-foreground text-center">Dia Venc.</TableHead>
            <TableHead className="text-muted-foreground">Tipo</TableHead>
            <TableHead className="text-muted-foreground">Valor Previsto</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recorrencias?.map((rec: any) => (
            <TableRow key={rec.id} className="border-border/20 group hover:bg-white/5 transition-colors">
              <TableCell className="font-medium text-white py-4">
                <div className="flex flex-col gap-0.5">
                  <span>{rec.descricao}</span>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-normal">
                    <span className="flex items-center gap-1"><Tag size={10} /> {rec.categoria?.nome || "Sem Categ."}</span>
                    <span className="flex items-center gap-1"><Building size={10} /> {rec.conta?.nome || "Todas Contas"}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                <div className="flex flex-col items-center gap-0.5">
                  <Calendar size={14} className="opacity-40" />
                  <span className="text-xs font-semibold text-white">Dia {rec.diaVencimento}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${rec.tipo === 'FIXA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-orange-500/10 text-orange-400 border-orange-500/30'}`}>
                  {rec.tipo === 'FIXA' ? 'Valor Fixo' : 'Variavel'}
                </span>
              </TableCell>
              <TableCell className="text-white font-semibold">
                 {formatCurrency(rec.valor)}
              </TableCell>
              <TableCell>
                <Badge className={`text-[10px] px-2 py-0 font-medium border ${statusColors[rec.status || "ativa"] || "bg-muted text-muted-foreground"}`}>
                  {(rec.status || "ativa").toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-panel border-border/40">
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate(rec.id)}
                      className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {(!recorrencias || recorrencias.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                Nenhuma recorrência cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
