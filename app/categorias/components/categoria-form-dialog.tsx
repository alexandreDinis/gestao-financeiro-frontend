"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { ArrowUpRight, ArrowDownRight, FolderTree } from "lucide-react";

import type { Categoria, CategoriaRequest, ApiResponse } from "@/types";
import { TipoCategoria } from "@/types";

const EMPTY_FORM: CategoriaRequest = {
  nome: "",
  tipo: TipoCategoria.DESPESA,
  cor: "",
  icone: "",
  categoriaPaiId: null,
};

interface CategoriaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId?: number | null;
  initialData?: Partial<CategoriaRequest>;
  onSuccess?: (newCategory?: Categoria) => void;
}

export function CategoriaFormDialog({
  open,
  onOpenChange,
  editingId,
  initialData,
  onSuccess,
}: CategoriaFormDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoriaRequest>({ ...EMPTY_FORM });

  // Update form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        ...(initialData || {}),
      });
    }
  }, [open, initialData, editingId]);

  // All categories for parent-select (unfiltered)
  const { data: allCategorias } = useQuery<Categoria[]>({
    queryKey: ["categorias", "ALL"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Categoria[]>>("/categorias");
      return data.data;
    },
    enabled: open, // Only fetch when dialog is open
  });

  const createMutation = useMutation({
    mutationFn: async (req: CategoriaRequest) => {
      const { data } = await api.post<ApiResponse<Categoria>>("/categorias", req);
      return data.data; // Return the created category
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada com sucesso!");
      onOpenChange(false);
      if (onSuccess) onSuccess(newCat);
    },
    onError: () => toast.error("Erro ao criar categoria."),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, req }: { id: number; req: CategoriaRequest }) => {
      const { data } = await api.put<ApiResponse<Categoria>>(`/categorias/${id}`, req);
      return data.data;
    },
    onSuccess: (updatedCat) => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria atualizada com sucesso!");
      onOpenChange(false);
      if (onSuccess) onSuccess(updatedCat);
    },
    onError: () => toast.error("Erro ao atualizar categoria."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      categoriaPaiId: form.categoriaPaiId || null,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, req: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Parent categories for select (exclude current editing category)
  const parentOptions = (allCategorias || []).filter(
    (c) => c.id !== editingId && c.categoriaPaiId === null && c.tipo === form.tipo
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel border-border/40 sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">
            {editingId ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {editingId
              ? "Altere os dados da categoria abaixo."
              : "Preencha os dados para criar uma nova categoria."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="cat-nome">Nome</Label>
            <Input
              id="cat-nome"
              placeholder="Ex: Alimentação, Salário, Transporte"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="bg-black/40 border-border/50 focus:border-primary/50"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-tipo">Tipo</Label>
            <Select
              value={form.tipo}
              onValueChange={(val) => setForm({ ...form, tipo: (val as TipoCategoria) || TipoCategoria.DESPESA, categoriaPaiId: null })}
            >
              <SelectTrigger id="cat-tipo" className="bg-black/40 border-border/50">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/40">
                <SelectItem value="RECEITA">
                  <span className="flex items-center gap-2">
                    <ArrowUpRight size={16} className="text-green-400" />
                    Receita
                  </span>
                </SelectItem>
                <SelectItem value="DESPESA">
                  <span className="flex items-center gap-2">
                    <ArrowDownRight size={16} className="text-red-400" />
                    Despesa
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cat-pai">Categoria Pai (opcional)</Label>
            <Select
              value={form.categoriaPaiId?.toString() || "NONE"}
              onValueChange={(val) =>
                setForm({ ...form, categoriaPaiId: (!val || val === "NONE") ? null : Number(val) })
              }
            >
              <SelectTrigger id="cat-pai" className="bg-black/40 border-border/50">
                <SelectValue placeholder="Nenhuma (raiz)" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/40">
                <SelectItem value="NONE">Nenhuma (raiz)</SelectItem>
                {parentOptions.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id.toString()}>
                    <span className="flex items-center gap-2">
                      <FolderTree size={14} className="text-primary/60" />
                      {parent.nome}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-cor">Cor (opcional)</Label>
              <Input
                id="cat-cor"
                type="color"
                value={form.cor || "#3b82f6"}
                onChange={(e) => setForm({ ...form, cor: e.target.value })}
                className="bg-black/40 border-border/50 h-10 p-1 cursor-pointer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-icone">Ícone (opcional)</Label>
              <Input
                id="cat-icone"
                placeholder="tag"
                value={form.icone || ""}
                onChange={(e) => setForm({ ...form, icone: e.target.value })}
                className="bg-black/40 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary/80 hover:bg-primary text-white shadow-[0_0_12px_rgba(var(--primary),0.3)]"
            >
              {isSaving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
