"use client";

import { usePessoasQuery } from "@/features/pessoas/hooks/use-pessoas-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";
import { StatusDivida } from "../types";

interface DividaFiltersProps {
  pessoaId?: number;
  onPessoaChange: (id?: number) => void;
  ano?: number;
  onAnoChange: (ano?: number) => void;
  mes?: number;
  onMesChange: (mes?: number) => void;
  status?: StatusDivida;
  onStatusChange: (status?: StatusDivida) => void;
  onClear: () => void;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
const months = [
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

export function DividaFilters({
  pessoaId,
  onPessoaChange,
  ano,
  onAnoChange,
  mes,
  onMesChange,
  status,
  onStatusChange,
  onClear,
}: DividaFiltersProps) {
  const { data: pessoas } = usePessoasQuery();

  const hasFilters = !!pessoaId || !!ano || !!mes || !!status;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pessoa */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Pessoa</label>
          <Select
            value={pessoaId?.toString() || "all"}
            onValueChange={(val) => onPessoaChange(val === "all" ? undefined : Number(val))}
          >
            <SelectTrigger className="bg-black/20 border-border/30 h-9 text-xs">
              <SelectValue placeholder="Todas">
                {pessoaId ? pessoas?.find(p => p.id === pessoaId)?.nome : "Todas"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="all">Todas</SelectItem>
              {pessoas?.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ano */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Ano</label>
          <Select
            value={ano?.toString() || "all"}
            onValueChange={(val) => onAnoChange(val === "all" ? undefined : Number(val))}
          >
            <SelectTrigger className="bg-black/20 border-border/30 h-9 text-xs">
              <SelectValue placeholder="Ano">
                {ano && ano !== currentYear ? ano.toString() : ano || "Ano"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="all">Todos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mês */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Mês</label>
          <Select
            value={mes?.toString() || "all"}
            onValueChange={(val) => onMesChange(val === "all" ? undefined : Number(val))}
          >
            <SelectTrigger className="bg-black/20 border-border/30 h-9 text-xs">
              <SelectValue placeholder="Mês">
                {mes ? months.find(m => m.value === mes)?.label : "Mês"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="all">Todos</SelectItem>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value.toString()}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Situação */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Situação</label>
          <Select
            value={status || "all"}
            onValueChange={(val) => onStatusChange(val === "all" ? undefined : val as StatusDivida)}
          >
            <SelectTrigger className="bg-black/20 border-border/30 h-9 text-xs">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="PAGA">Pagas</SelectItem>
              <SelectItem value="ATRASADA">Em Atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-[11px] h-7 text-muted-foreground hover:text-white hover:bg-white/5 px-2 transition-colors"
          >
            <X className="h-3 w-3 mr-1.5" />
            Limpar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
