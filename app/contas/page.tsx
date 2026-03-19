"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";

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
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Landmark,
  PiggyBank,
  Briefcase,
  CreditCard,
  Banknote,
} from "lucide-react";

import type {
  ApiResponse,
  Conta,
  ContaRequest,
} from "@/types";
import {
  TipoConta,
  TIPO_CONTA_LABELS,
} from "@/types";

// ===== Icon map for account types =====
const TIPO_CONTA_ICONS: Record<TipoConta, React.ReactNode> = {
  [TipoConta.CORRENTE]: <Landmark size={16} />,
  [TipoConta.POUPANCA]: <PiggyBank size={16} />,
  [TipoConta.CARTEIRA]: <Banknote size={16} />,
  [TipoConta.INVESTIMENTO]: <Briefcase size={16} />,
  [TipoConta.CARTAO_CREDITO]: <CreditCard size={16} />,
};

const EMPTY_FORM: ContaRequest = {
  nome: "",
  tipo: TipoConta.CORRENTE,
  saldoInicial: 0,
  cor: "",
  icone: "",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function ContasPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ContaRequest>({ ...EMPTY_FORM });
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ===== Queries =====
  const { data: contas, isLoading } = useQuery<Conta[]>({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    },
  });

  // ===== Mutations =====
  const createMutation = useMutation({
    mutationFn: (req: ContaRequest) => api.post("/contas", req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas"] });
      toast.success("Conta criada com sucesso!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao criar conta."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, req }: { id: number; req: ContaRequest }) =>
      api.put(`/contas/${id}`, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas"] });
      toast.success("Conta atualizada com sucesso!");
      closeDialog();
    },
    onError: () => toast.error("Erro ao atualizar conta."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/contas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas"] });
      toast.success("Conta excluída com sucesso!");
      setDeleteConfirmId(null);
    },
    onError: () => toast.error("Erro ao excluir conta."),
  });

  // ===== Handlers =====
  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (conta: Conta) => {
    setEditingId(conta.id);
    setForm({
      nome: conta.nome,
      tipo: conta.tipo,
      saldoInicial: conta.saldoInicial,
      cor: conta.cor || "",
      icone: conta.icone || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, req: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Contas</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Wallet size={18} className="text-primary" />
              Gerencie suas contas bancárias e carteiras
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-primary/80 hover:bg-primary text-white shadow-[0_0_15px_rgba(var(--primary),0.3)] transition-all duration-300"
          >
            <Plus size={18} />
            Nova Conta
          </Button>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground text-right">Saldo Inicial</TableHead>
                <TableHead className="text-muted-foreground text-right">Saldo Atual</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando contas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !contas?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet size={32} className="text-primary/40" />
                      Nenhuma conta cadastrada. Clique em &quot;Nova Conta&quot; para começar.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contas.map((conta) => (
                  <TableRow key={conta.id} className="border-border/20 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{TIPO_CONTA_ICONS[conta.tipo]}</span>
                        {conta.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/15 text-primary border border-primary/30 text-xs">
                        {TIPO_CONTA_LABELS[conta.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(conta.saldoInicial)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${conta.saldoAtual >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {formatCurrency(conta.saldoAtual)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={conta.ativa ? "default" : "destructive"} className={conta.ativa ? "bg-green-500/20 text-green-400 border border-green-500/30" : ""}>
                        {conta.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(conta)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirmId(conta.id)}
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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel border-border/40 sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {editingId ? "Editar Conta" : "Nova Conta"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Altere os dados da conta abaixo."
                : "Preencha os dados para criar uma nova conta."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="conta-nome">Nome</Label>
              <Input
                id="conta-nome"
                placeholder="Ex: Nubank, Itaú, Carteira"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="bg-black/40 border-border/50 focus:border-primary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta-tipo">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(val) => setForm({ ...form, tipo: val as TipoConta })}
              >
                <SelectTrigger id="conta-tipo" className="bg-black/40 border-border/50">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="glass-panel border-border/40">
                  {Object.values(TipoConta).map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      <span className="flex items-center gap-2">
                        {TIPO_CONTA_ICONS[tipo]}
                        {TIPO_CONTA_LABELS[tipo]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conta-saldo">Saldo Inicial</Label>
              <Input
                id="conta-saldo"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={form.saldoInicial || ""}
                onChange={(e) => setForm({ ...form, saldoInicial: parseFloat(e.target.value) || 0 })}
                className="bg-black/40 border-border/50 focus:border-primary/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="conta-cor">Cor (opcional)</Label>
                <Input
                  id="conta-cor"
                  type="color"
                  value={form.cor || "#3b82f6"}
                  onChange={(e) => setForm({ ...form, cor: e.target.value })}
                  className="bg-black/40 border-border/50 h-10 p-1 cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="conta-icone">Ícone (opcional)</Label>
                <Input
                  id="conta-icone"
                  placeholder="wallet"
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
                onClick={closeDialog}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="glass-panel border-border/40 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-white">Excluir Conta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
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
