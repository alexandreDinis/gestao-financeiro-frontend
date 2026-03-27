export type ScoreConfiabilidade = 'EXCELENTE' | 'BOM' | 'REGULAR' | 'RISCO_BAIXO' | 'RISCO_ALTO';

export interface Pessoa {
  id: number;
  nome: string;
  telefone?: string;
  observacao?: string;
  score: ScoreConfiabilidade;
  totalEmprestimos: number;
  totalPagosEmDia: number;
  totalAtrasados: number;
  createdAt: string;
}

export interface PessoaRequest {
  nome: string;
  telefone?: string;
  observacao?: string;
}
