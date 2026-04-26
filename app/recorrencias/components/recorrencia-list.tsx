"use client";

import { useRecorrencias, useDeleteRecorrencia } from "@/hooks/use-recorrencias";
import { Recorrencia, StatusRecorrencia } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
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
  Edit2,
  AlertCircle,
 
  Tag, 
  Building
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { useState } from "react";

const statusColors: any = {
  ativa: "bg-green-500/20 text-green-400 border-green-500/30",
  ATIVA: "bg-green-500/20 text-green-400 border-green-500/30",
  PAUSADA: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ENCERRADA: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface RecorrenciaListProps {
  onEdit?: (recorrencia: any) => void;
}

export function RecorrenciaList({ onEdit }: RecorrenciaListProps) {
  const { data: recorrencias, isLoading, refetch, isError } = useRecorrencias();
  const deleteMutation = useDeleteRecorrencia();
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: categoriasData } = useQuery<any>({
    queryKey: ["categorias"],
    queryFn: () => api.get("/categorias").then(res => res.data)
  });
  const categorias = categoriasData?.data || [];

  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());

  const toggleCategory = (catId: number) => {
    const next = new Set(selectedCategories);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setSelectedCategories(next);
  };

  if (isLoading) return <div className="text-center p-8">Carregando...</div>;
  if (isError) return <div className="text-center p-8 text-red-400">Erro ao carregar recorrências.</div>;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const filteredRecorrencias = recorrencias?.filter((rec: any) => {
    if (selectedCategories.size === 0) return true;
    if (!rec.categoria) return false;
    return selectedCategories.has(rec.categoria.id);
  });

  const totalValue = filteredRecorrencias?.reduce((acc: number, rec: any) => acc + rec.valor, 0) || 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros e Resumo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/20 p-4 rounded-xl border border-border/20">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="outline" className="border-border/30 bg-transparent text-white">
                <Tag size={14} className="mr-2 text-muted-foreground" />
                Categorias {selectedCategories.size > 0 && `(${selectedCategories.size})`}
              </Button>
            } />
            <DropdownMenuContent align="start" className="glass-panel border-border/40 w-56">
              <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/20" />
              {categorias.map((cat: any) => {
                const isSelected = selectedCategories.has(cat.id);
                return (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={(e) => { e.preventDefault(); toggleCategory(cat.id); }}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <div className={`w-4 h-4 flex items-center justify-center border rounded-sm ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    {cat.nome}
                  </DropdownMenuItem>
                );
              })}
              {selectedCategories.size > 0 && (
                <>
                  <DropdownMenuSeparator className="bg-border/20" />
                  <DropdownMenuItem 
                    className="cursor-pointer text-center justify-center text-muted-foreground hover:text-white"
                    onClick={() => setSelectedCategories(new Set())}
                  >
                    Limpar Filtros
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">Total Previsto</span>
          <span className="text-xl font-bold text-white">{formatCurrency(totalValue)}</span>
        </div>
      </div>

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
          {filteredRecorrencias?.map((rec: any) => (
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
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${rec.valorVariavel ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                  {rec.valorVariavel ? 'Estimativa' : 'Valor Fixo'}
                </span>
              </TableCell>
              <TableCell className="text-white font-semibold">
                 <div className="flex flex-col">
                   <span>{formatCurrency(rec.valor)}</span>
                   {rec.valorVariavel && <span className="text-[10px] text-muted-foreground font-normal -mt-0.5">Valor esperado</span>}
                 </div>
              </TableCell>
              <TableCell>
                <Badge className={`text-[10px] px-2 py-0 font-medium border ${statusColors[rec.status || "ativa"] || "bg-muted text-muted-foreground"}`}>
                  {(rec.status || "ativa").toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="glass-panel border-border/40">
                    <DropdownMenuItem 
                      onClick={() => onEdit?.(rec)}
                      className="cursor-pointer"
                    >
                      <Edit2 size={14} className="mr-2" /> Editar
                    </DropdownMenuItem>
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
          {(!filteredRecorrencias || filteredRecorrencias.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                Nenhuma recorrência cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}
