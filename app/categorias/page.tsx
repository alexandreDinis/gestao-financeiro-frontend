"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import { CategoriaFormDialog } from "./components/categoria-form-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  FolderTree,
  Filter,
} from "lucide-react";

import type {
  ApiResponse,
  Categoria,
  CategoriaRequest,
} from "@/types";
import {
  TipoCategoria,
  TIPO_CATEGORIA_LABELS,
} from "@/types";



export default function CategoriasPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>("ALL");

  // ===== Queries =====
  const { data: categorias, isLoading } = useQuery<Categoria[]>({
    queryKey: ["categorias", tipoFilter],
    queryFn: async () => {
      const params = tipoFilter !== "ALL" ? { tipo: tipoFilter } : {};
      const { data } = await api.get<ApiResponse<Categoria[]>>("/categorias", { params });
      return data.data;
    },
  });

  // All categories for parent-select (unfiltered)
  const { data: allCategorias } = useQuery<Categoria[]>({
    queryKey: ["categorias", "ALL"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Categoria[]>>("/categorias");
      return data.data;
    },
  });

  // ===== Mutations =====


  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/categorias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria excluída com sucesso!");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Erro ao excluir categoria."),
  });

  // ===== Handlers =====
  const openCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditingId(cat.id);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };



  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Categorias</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Tags size={18} className="text-primary" />
              Organize suas receitas e despesas por categorias
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <Select value={tipoFilter} onValueChange={(val) => setTipoFilter(val || "ALL")}>
                <SelectTrigger className="w-[160px] bg-black/40 border-border/50 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-border/40">
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="RECEITA">
                    <span className="flex items-center gap-1.5">
                      <ArrowUpRight size={14} className="text-green-400" />
                      Receitas
                    </span>
                  </SelectItem>
                  <SelectItem value="DESPESA">
                    <span className="flex items-center gap-1.5">
                      <ArrowDownRight size={14} className="text-red-400" />
                      Despesas
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={openCreate}
              className="bg-primary/80 hover:bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300"
            >
              <Plus size={18} />
              Nova Categoria
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Categoria Pai</TableHead>
                <TableHead className="text-muted-foreground text-center">Cor</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando categorias...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !categorias?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Tags size={32} className="text-primary/40" />
                      Nenhuma categoria cadastrada. Clique em &quot;Nova Categoria&quot; para começar.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categorias.map((cat) => (
                  <TableRow key={cat.id} className="border-border/20 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {cat.tipo === TipoCategoria.RECEITA ? (
                          <ArrowUpRight size={16} className="text-green-400" />
                        ) : (
                          <ArrowDownRight size={16} className="text-red-400" />
                        )}
                        {cat.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          cat.tipo === TipoCategoria.RECEITA
                            ? "bg-green-500/15 text-green-400 border border-green-500/30 text-xs"
                            : "bg-red-500/15 text-red-400 border border-red-500/30 text-xs"
                        }
                      >
                        {TIPO_CATEGORIA_LABELS[cat.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cat.categoriaPaiNome ? (
                        <span className="flex items-center gap-1.5">
                          <FolderTree size={14} className="text-primary/60" />
                          {cat.categoriaPaiNome}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {cat.cor ? (
                        <div
                          className="inline-block w-5 h-5 rounded-full border border-white/20"
                          style={{ backgroundColor: cat.cor }}
                          title={cat.cor}
                        />
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(cat)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirmId(cat.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <CategoriaFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingId(null);
        }}
        editingId={editingId}
        initialData={
          editingId
            ? (() => {
                const cat = categorias?.find(c => c.id === editingId);
                return cat ? {
                  nome: cat.nome,
                  tipo: cat.tipo,
                  cor: cat.cor || "",
                  icone: cat.icone || "",
                  categoriaPaiId: cat.categoriaPaiId
                } : undefined;
              })()
            : undefined
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="glass-panel border-border/40 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta categoria? Subcategorias vinculadas também podem ser afetadas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="border-border/50">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
