"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Calendar, Building, Tag } from "lucide-react";
import { TipoTransacao, StatusTransacao, TipoDespesa, Conta, Categoria, ApiResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function TransacoesFilters({ currentFilters }: { currentFilters: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for debouncing the search text
  const [search, setSearch] = useState(searchParams.get("busca") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Native debounce implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch options for filters
  const { data: contas } = useQuery({
    queryKey: ["contas"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Conta[]>>("/contas");
      return data.data;
    }
  });

  const { data: categorias } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Categoria[]>>("/categorias");
      return data.data;
    }
  });

  const updateUrl = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      
      // Default to page 0 when filters change
      if (key !== "page") {
        params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  // Sync debounced search to URL
  useEffect(() => {
    const currentBusca = searchParams.get("busca") || "";
    if (debouncedSearch !== currentBusca) {
      updateUrl("busca", debouncedSearch);
    }
  }, [debouncedSearch, searchParams, updateUrl]);

  return (
    <div className="flex flex-col md:flex-row gap-3 glass-panel p-4 rounded-lg border-border/40">
      {/* Search Bar - Flex Grow */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          placeholder="Buscar descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-black/40 border-border/50 h-10 w-full"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <Select
            value={searchParams.get("mes") || String(new Date().getMonth() + 1)}
            onValueChange={(val) => updateUrl("mes", val)}
          >
            <SelectTrigger className="w-[150px] bg-black/40 border-border/50 h-10">
              <SelectValue>
                {[
                  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                ][Number(searchParams.get("mes") || new Date().getMonth() + 1) - 1]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              {[
                "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
              ].map((month, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-muted-foreground hidden sm:block" />
          <Select
            value={searchParams.get("tipo") || "ALL"}
            onValueChange={(val) => updateUrl("tipo", val)}
          >
            <SelectTrigger className="w-[140px] bg-black/40 border-border/50 h-10">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="ALL">Todos os Tipos</SelectItem>
              <SelectItem value={TipoTransacao.RECEITA}>Receitas</SelectItem>
              <SelectItem value={TipoTransacao.DESPESA}>Despesas</SelectItem>
              <SelectItem value={TipoTransacao.TRANSFERENCIA}>Transferências</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Despesa Filter (Only if Tipo is Despesa) */}
        {searchParams.get("tipo") === TipoTransacao.DESPESA && (
          <div className="flex items-center gap-2">
            <Select
              value={searchParams.get("tipoDespesa") || "ALL"}
              onValueChange={(val) => updateUrl("tipoDespesa", val)}
            >
              <SelectTrigger className="w-[140px] bg-black/40 border-border/50 h-10">
                <SelectValue placeholder="Comportamento" />
              </SelectTrigger>
              <SelectContent className="glass-panel border-border/40">
                <SelectItem value="ALL">Fixo + Variável</SelectItem>
                <SelectItem value="FIXA">Fixas</SelectItem>
                <SelectItem value="VARIAVEL">Variáveis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Status Filter */}
        <Select
          value={searchParams.get("status") || "ALL"}
          onValueChange={(val) => updateUrl("status", val)}
        >
          <SelectTrigger className="w-[140px] bg-black/40 border-border/50 h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-panel border-border/40">
            <SelectItem value="ALL">Qualquer Status</SelectItem>
            <SelectItem value={StatusTransacao.PENDENTE}>Pendentes</SelectItem>
            <SelectItem value={StatusTransacao.PAGO}>Pagos</SelectItem>
            <SelectItem value={StatusTransacao.ATRASADO}>Atrasados</SelectItem>
            <SelectItem value={StatusTransacao.CANCELADO}>Cancelados</SelectItem>
          </SelectContent>
        </Select>

        {/* Origem Filter */}
        <Select
          value={searchParams.get("origem") || "ALL"}
          onValueChange={(val) => updateUrl("origem", val)}
        >
          <SelectTrigger className="w-[140px] bg-black/40 border-border/50 h-10">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent className="glass-panel border-border/40">
            <SelectItem value="ALL">Todas Origens</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
            <SelectItem value="AUTOMATICA">Automática</SelectItem>
          </SelectContent>
        </Select>

        {/* Conta Filter */}
        <div className="flex items-center gap-2">
          <Building size={16} className="text-muted-foreground hidden lg:block" />
          <Select
            value={searchParams.get("contaId") || "ALL"}
            onValueChange={(val) => updateUrl("contaId", val)}
          >
            <SelectTrigger className="w-[160px] bg-black/40 border-border/50 h-10">
              <SelectValue placeholder="Todas as Contas" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="ALL">Todas as Contas</SelectItem>
              {contas?.map(conta => (
                <SelectItem key={conta.id} value={String(conta.id)}>{conta.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Categoria Filter */}
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-muted-foreground hidden lg:block" />
          <Select
            value={searchParams.get("categoriaId") || "ALL"}
            onValueChange={(val) => updateUrl("categoriaId", val)}
          >
            <SelectTrigger className="w-[160px] bg-black/40 border-border/50 h-10">
              <SelectValue placeholder="Todas Categorias" />
            </SelectTrigger>
            <SelectContent className="glass-panel border-border/40">
              <SelectItem value="ALL">Todas Categorias</SelectItem>
              {categorias?.map(cat => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
