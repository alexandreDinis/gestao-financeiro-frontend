"use client";

import { useState, useMemo } from "react";
import { usePessoasQuery } from "../hooks/use-pessoas-query";
import { useDeletarPessoaMutation } from "../hooks/use-pessoas-mutation";
import { Pessoa } from "../types";
import { ScoreBadge } from "./score-badge";
import { PessoaFormDialog } from "./pessoa-form-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Search,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PessoasList() {
  const { data: pessoas, isLoading } = usePessoasQuery();
  const deletarMutation = useDeletarPessoaMutation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [pessoaParaEditar, setPessoaParaEditar] = useState<Pessoa | undefined>(undefined);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pessoaToDelete, setPessoaToDelete] = useState<number | null>(null);

  // Sorting: Highest score / most reliable first
  const orderMap = {
    "EXCELENTE": 5,
    "BOM": 4,
    "REGULAR": 3,
    "RISCO_BAIXO": 2,
    "RISCO_ALTO": 1
  };

  const filteredAndSortedPessoas = useMemo(() => {
    if (!pessoas) return [];
    
    return pessoas
      .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   (p.telefone && p.telefone.includes(searchTerm)))
      .sort((a, b) => {
        // Sort by score group first
        const scoreA = orderMap[a.score] || 0;
        const scoreB = orderMap[b.score] || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // Tie breaker: total pagos em dia vs atrasados
        const performanceA = a.totalEmprestimos > 0 ? (a.totalPagosEmDia / a.totalEmprestimos) : 0;
        const performanceB = b.totalEmprestimos > 0 ? (b.totalPagosEmDia / b.totalEmprestimos) : 0;
        return performanceB - performanceA;
      });
  }, [pessoas, searchTerm]);

  const handleEdit = (pessoa: Pessoa) => {
    setPessoaParaEditar(pessoa);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setPessoaParaEditar(undefined);
    setFormOpen(true);
  };

  const handleDelete = (id: number) => {
    setPessoaToDelete(id);
    setConfirmDeleteOpen(true);
  };

  const onConfirmDelete = () => {
    if (pessoaToDelete) {
      deletarMutation.mutate(pessoaToDelete);
      setConfirmDeleteOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Buscar pessoa..." 
            className="pl-9 bg-black/40 border-border/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={handleCreate} className="bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(var(--primary),0.3)] w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Contato
        </Button>
      </div>

      <div className="glass-panel rounded-xl border border-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-black/20 border-b border-border/40">
              <tr>
                <th className="px-4 py-3 font-medium">Nome / Contato</th>
                <th className="px-4 py-3 font-medium">Score de Confiabilidade</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Empréstimos</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Observações</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPessoas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma pessoa encontrada.
                  </td>
                </tr>
              ) : (
                filteredAndSortedPessoas.map((pessoa) => (
                  <tr key={pessoa.id} className="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{pessoa.nome}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{pessoa.telefone || "Sem telefone"}</div>
                    </td>
                    <td className="px-4 py-3">
                       <ScoreBadge 
                          score={pessoa.score}
                          totalEmprestimos={pessoa.totalEmprestimos}
                          totalPagosEmDia={pessoa.totalPagosEmDia}
                          totalAtrasados={pessoa.totalAtrasados}
                       />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs">
                       <div className="flex gap-2 text-muted-foreground">
                         <span title="Pagos em Dia" className="text-green-400">✔{pessoa.totalPagosEmDia}</span>
                         <span title="Atrasados" className="text-red-400">✖{pessoa.totalAtrasados}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                      {pessoa.observacao || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="glass-panel border-border/40">
                          <DropdownMenuItem onClick={() => handleEdit(pessoa)} className="cursor-pointer">
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-border/40" />
                          <DropdownMenuItem onClick={() => handleDelete(pessoa.id)} className="cursor-pointer text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PessoaFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
        pessoaParams={pessoaParaEditar} 
      />

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Excluir Contato?"
        description="Tem certeza que deseja excluir esta pessoa? Não é possível excluir se houver dívidas ou empréstimos ativos vinculados."
        onConfirm={onConfirmDelete}
        confirmText="Excluir Contato"
        variant="danger"
        isLoading={deletarMutation.isPending}
      />
    </div>
  );
}
