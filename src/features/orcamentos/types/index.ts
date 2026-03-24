export interface OrcamentoResponse {
  id: number;
  categoria: { id: number; nome: string };
  limite: number;
  mes: number;
  ano: number;
}

export interface OrcamentoResumoResponse {
  orcamentoId: number;
  categoriaId: number;
  categoriaNome: string;
  categoriaCor: string;
  limite: number;
  gasto: number;
  restante: number;
  percentual: number;
}

export interface OrcamentoRequest {
  categoriaId: number;
  mes: number;
  ano: number;
  limite: number;
}
