"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmarPagamentoVencimentoDialog } from "@/features/dashboard/components/ConfirmarPagamentoVencimentoDialog";
import { ApiResponse, Vencimento } from "@/types";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i);

export default function ContasVencimentoPage() {
  const queryClient = useQueryClient();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVencimento, setSelectedVencimento] = useState<Vencimento | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: vencimentos, isLoading } = useQuery<Vencimento[]>({
    queryKey: ["vencimentos-todos", mes, ano],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Vencimento[]>>(`/dashboard/vencimentos?mes=${mes}&ano=${ano}`);
      return data.data;
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr + "T12:00:00Z"), "dd/MM/yyyy", { locale: ptBR });
  };

  const handlePagar = (v: Vencimento) => {
    setSelectedVencimento(v);
    setIsConfirmOpen(true);
  };

  const nextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  };

  const prevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const filteredVencimentos = vencimentos?.filter(v => 
    v.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.conta.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const contasAPagar = filteredVencimentos.filter(v => v.tipo === "DESPESA");
  const contasAReceber = filteredVencimentos.filter(v => v.tipo === "RECEITA");

  const renderTable = (list: Vencimento[], emptyMessage: string) => (
    <div className="glass-panel rounded-lg overflow-hidden border-border/40">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40 hover:bg-transparent">
            <TableHead className="text-muted-foreground w-[120px]">Vencimento</TableHead>
            <TableHead className="text-muted-foreground">Descrição</TableHead>
            <TableHead className="text-muted-foreground">Origem / Conta</TableHead>
            <TableHead className="text-muted-foreground text-right">Valor</TableHead>
            <TableHead className="text-muted-foreground text-center">Status</TableHead>
            <TableHead className="text-muted-foreground text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <Calendar size={32} className="opacity-20" />
                  <p>{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            list.map((v) => (
              <TableRow key={v.idUnico} className="border-border/20 hover:bg-white/5 transition-colors">
                <TableCell className="text-white font-medium">
                  {formatDate(v.dataVencimento)}
                </TableCell>
                <TableCell className="text-white font-semibold">
                  {v.descricao}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  <div className="flex flex-col">
                    <span className="font-medium text-primary/80 uppercase tracking-tighter text-[10px]">{v.origem}</span>
                    <span>{v.conta}</span>
                  </div>
                </TableCell>
                <TableCell className={`text-right font-bold ${v.tipo === "RECEITA" ? "text-green-400" : "text-white"}`}>
                  {v.tipo === "RECEITA" ? "+" : ""}{formatCurrency(v.valor)}
                </TableCell>
                <TableCell className="text-center">
                  {v.atrasado ? (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1 mx-auto w-fit">
                      <AlertCircle size={10} /> Atrasado
                    </Badge>
                  ) : v.venceHoje ? (
                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 mx-auto w-fit">
                      <Clock size={10} /> Vence Hoje
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground border-border/50 flex items-center gap-1 mx-auto w-fit">
                      <Calendar size={10} /> Em dia
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handlePagar(v)}
                    className="bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/40 h-8 gap-1"
                  >
                    <CheckCircle size={14} />
                    {v.tipo === "RECEITA" ? "Receber" : "Pagar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Contas a Pagar & Receber</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Gerencie seus compromissos financeiros agendados
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-border/40">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-9 w-9">
              <ChevronLeft size={18} />
            </Button>
            
            <Select value={mes.toString()} onValueChange={(val) => val && setMes(parseInt(val))}>
              <SelectTrigger className="w-[130px] bg-transparent border-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/40">
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ano.toString()} onValueChange={(val) => val && setAno(parseInt(val))}>
              <SelectTrigger className="w-[90px] bg-transparent border-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/40">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-9 w-9">
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-xl border border-red-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full -translate-y-4 translate-x-4" />
              <p className="text-[10px] text-red-400 uppercase tracking-widest font-semibold mb-1">Atrasados</p>
              <p className="text-2xl font-black text-red-400">{filteredVencimentos.filter(v => v.atrasado).length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(filteredVencimentos.filter(v => v.atrasado).reduce((acc, v) => acc + v.valor, 0))}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-yellow-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/5 rounded-full -translate-y-4 translate-x-4" />
              <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-semibold mb-1">Vence Hoje</p>
              <p className="text-2xl font-black text-yellow-400">{filteredVencimentos.filter(v => v.venceHoje).length}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatCurrency(filteredVencimentos.filter(v => v.venceHoje).reduce((acc, v) => acc + v.valor, 0))}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-red-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full -translate-y-4 translate-x-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total a Pagar</p>
              <p className="text-2xl font-black text-red-400">
                {formatCurrency(contasAPagar.reduce((acc, v) => acc + v.valor, 0))}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{contasAPagar.length} compromisso(s)</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-green-500/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/5 rounded-full -translate-y-4 translate-x-4" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">Total a Receber</p>
              <p className="text-2xl font-black text-green-400">
                {formatCurrency(contasAReceber.reduce((acc, v) => acc + v.valor, 0))}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{contasAReceber.length} compromisso(s)</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Buscar por descrição ou conta..." 
                className="pl-10 bg-black/40 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <Tabs defaultValue="pagar" className="w-full">
          <TabsList className="bg-black/40 border border-border/40 p-1">
            <TabsTrigger value="pagar" className="gap-2">
              <ArrowDownRight size={16} className="text-red-400" />
              Contas a Pagar ({contasAPagar.length})
            </TabsTrigger>
            <TabsTrigger value="receber" className="gap-2">
              <ArrowUpRight size={16} className="text-green-400" />
              Contas a Receber ({contasAReceber.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pagar" className="mt-4">
             {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">Carregando compromissos...</div>
             ) : renderTable(contasAPagar, "Nenhuma conta a pagar encontrada para este mês.")}
          </TabsContent>
          
          <TabsContent value="receber" className="mt-4">
             {isLoading ? (
                <div className="py-20 text-center text-muted-foreground">Carregando compromissos...</div>
             ) : renderTable(contasAReceber, "Nenhuma conta a receber encontrada para este mês.")}
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmarPagamentoVencimentoDialog 
        open={isConfirmOpen}
        onOpenChange={(isOpen) => {
          setIsConfirmOpen(isOpen);
          if (!isOpen) {
             // Invalida a query ao fechar para atualizar a lista
             queryClient.invalidateQueries({ queryKey: ["vencimentos-todos"] });
          }
        }}
        vencimento={selectedVencimento}
      />
    </AppLayout>
  );
}
