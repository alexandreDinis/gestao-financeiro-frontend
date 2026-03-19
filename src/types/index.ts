// ===== API Response Wrapper =====
export interface ApiMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
  errors?: ApiError[];
}

// ===== Enums =====
export enum TipoConta {
  CORRENTE = "CORRENTE",
  POUPANCA = "POUPANCA",
  CARTEIRA = "CARTEIRA",
  INVESTIMENTO = "INVESTIMENTO",
  CARTAO_CREDITO = "CARTAO_CREDITO",
}

export const TIPO_CONTA_LABELS: Record<TipoConta, string> = {
  [TipoConta.CORRENTE]: "Corrente",
  [TipoConta.POUPANCA]: "Poupança",
  [TipoConta.CARTEIRA]: "Carteira",
  [TipoConta.INVESTIMENTO]: "Investimento",
  [TipoConta.CARTAO_CREDITO]: "Cartão de Crédito",
};

export enum TipoCategoria {
  RECEITA = "RECEITA",
  DESPESA = "DESPESA",
}

export const TIPO_CATEGORIA_LABELS: Record<TipoCategoria, string> = {
  [TipoCategoria.RECEITA]: "Receita",
  [TipoCategoria.DESPESA]: "Despesa",
};

// ==========================================
// TRANSAÇÕES (Lançamentos)
// ==========================================

export enum TipoTransacao {
  RECEITA = "RECEITA",
  DESPESA = "DESPESA",
  TRANSFERENCIA = "TRANSFERENCIA",
}

export enum StatusTransacao {
  PENDENTE = "PENDENTE",
  PAGO = "PAGO",
  ATRASADO = "ATRASADO",
  CANCELADO = "CANCELADO",
}

export enum DirecaoLancamento {
  DEBITO = "DEBITO",
  CREDITO = "CREDITO",
}

export interface LancamentoResponse {
  id: number;
  contaId: number;
  contaNome: string;
  valor: number;
  direcao: DirecaoLancamento;
  descricao: string;
}

export interface TransacaoResponse {
  id: number;
  descricao: string;
  valor: number;
  data: string; // ISO date format (YYYY-MM-DD)
  dataVencimento?: string;
  dataPagamento?: string;
  tipo: TipoTransacao;
  status: StatusTransacao;
  observacao?: string;
  categoria?: Categoria;
  lancamentos: LancamentoResponse[];
  createdAt: string;
}

export interface TransacaoRequest {
  descricao: string;
  valor: number;
  data: string; // ISO string 
  dataVencimento?: string | null;
  tipo: TipoTransacao;
  categoriaId?: number | null;
  contaOrigemId: number; // For Receita/Despesa, the primary account. For Transfer, the source account.
  contaDestinoId?: number | null; // Used only for transfers
  observacao?: string;
  idempotencyKey?: string;
}

// ===== Conta (Account) =====
export interface Conta {
  id: number;
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  saldoAtual: number;
  cor: string | null;
  icone: string | null;
  ativa: boolean;
  createdAt: string;
}

export interface ContaRequest {
  nome: string;
  tipo: TipoConta;
  saldoInicial: number;
  cor?: string;
  icone?: string;
}

// ===== Categoria (Category) =====
export interface Categoria {
  id: number;
  nome: string;
  tipo: TipoCategoria;
  cor: string | null;
  icone: string | null;
  categoriaPaiId: number | null;
  categoriaPaiNome: string | null;
  createdAt: string;
}

export interface CategoriaRequest {
  nome: string;
  tipo: TipoCategoria;
  cor?: string;
  icone?: string;
  categoriaPaiId?: number | null;
}
