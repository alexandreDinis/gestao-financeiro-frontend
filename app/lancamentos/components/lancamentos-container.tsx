"use client";

import { useSearchParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeftRight } from "lucide-react";

import { TransacoesFilters } from "./transacoes-filters";
import { TransacoesTable } from "./transacoes-table";
import { TransacaoFormDialog } from "./transacao-form-dialog";

export function LancamentosContainer() {
  const searchParams = useSearchParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<any | null>(null);

  const handleOpenForm = () => {
    setEditingTransacao(null);
    setIsFormOpen(true);
  };

  const handleEdit = (t: any) => {
    setEditingTransacao(t);
    setIsFormOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) setEditingTransacao(null);
  };

  // Page state for pagination
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Reset page when filters change (URL params)
  const filterKey = searchParams.toString();
  useEffect(() => {
    setPage(0);
  }, [filterKey]);

  // Parse filters from URL — use filterKey as dependency to ensure recomputation
  const filters = useMemo(() => ({
    mes: searchParams.get("mes") ? Number(searchParams.get("mes")) : new Date().getMonth() + 1,
    ano: searchParams.get("ano") ? Number(searchParams.get("ano")) : new Date().getFullYear(),
    busca: searchParams.get("busca") || undefined,
    tipo: searchParams.get("tipo") || undefined,
    status: searchParams.get("status") || undefined,
    tipoDespesa: searchParams.get("tipoDespesa") || undefined,
    origem: searchParams.get("origem") || undefined,
    categoriaId: searchParams.get("categoriaId") ? Number(searchParams.get("categoriaId")) : undefined,
    contaId: searchParams.get("contaId") ? Number(searchParams.get("contaId")) : undefined,
    page,
    size: pageSize,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [filterKey, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Transações / Extrato</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-primary" />
            Gerencie suas receitas, despesas e transferências
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleOpenForm}
            className="bg-primary/80 hover:bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300"
          >
            <Plus size={18} />
            Novo Lançamento
          </Button>
        </div>
      </div>

      <TransacoesFilters currentFilters={filters} />
      
      <TransacoesTable filters={filters} onEdit={handleEdit} page={page} onPageChange={setPage} />

      <TransacaoFormDialog 
        open={isFormOpen} 
        onOpenChange={handleOpenChange} 
        initialData={editingTransacao} 
      />
    </div>
  );
}
