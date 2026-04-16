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
  details?: Record<string, any>;
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

export enum OrigemLancamento {
  TRANSACAO = "TRANSACAO",
  PARCELA = "PARCELA",
  AJUSTE = "AJUSTE",
  ESTORNO = "ESTORNO",
  JUROS = "JUROS",
}

export enum TipoMovimentacao {
  RECEITA = "RECEITA",
  DESPESA = "DESPESA",
}

export type TipoDespesa = "FIXA" | "VARIAVEL";
export type TipoRecorrencia = "FIXA" | "VARIAVEL";
export type StatusRecorrencia = "ATIVA" | "PAUSADA" | "ENCERRADA";

export interface Recorrencia {
  id: number;
  descricao: string;
  valor: number;
  diaVencimento: number;
  tipo: TipoRecorrencia;
  status: StatusRecorrencia;
  dataInicio: string;
  dataFim?: string | null;
  categoria?: Categoria;
  conta?: Conta;
  createdAt: string;
}

export interface LancamentoLegResponse {
  id: number;
  contaId: number;
  contaNome: string;
  valor: number;
  direcao: DirecaoLancamento;
  descricao: string;
}

export interface LancamentoResponse {
  id: number;
  descricao: string;
  valor: number;
  dataReferencia: string;
  tipo: TipoTransacao;
  numeroParcela?: number;
  totalParcelas?: number;
  origem: OrigemLancamento;
  categoria?: string;
  conta?: string;
  status: StatusTransacao;
  transacaoId: number;
  geradoAutomaticamente?: boolean;
  tipoDespesa?: TipoDespesa;
}

export interface TransacaoResponse {
  id: number;
  descricao: string;
  valor: number;
  data: string; // ISO date format (YYYY-MM-DD)
  dataVencimento?: string;
  dataPagamento?: string;
  tipo: TipoTransacao;
  tipoDespesa?: TipoDespesa;
  status: StatusTransacao;
  observacao?: string;
  categoria?: Categoria;
  lancamentos: LancamentoLegResponse[];
  createdAt: string;
  geradoAutomaticamente: boolean;
  recorrenciaId?: number;
  referencia?: string; // YYYY-MM
}

export interface TransacaoRequest {
  descricao: string;
  valor: number;
  data: string; // ISO string 
  dataVencimento?: string | null;
  tipo: TipoTransacao;
  tipoDespesa?: TipoDespesa | null;
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

// ==========================================
// DASHBOARD V2
// ==========================================

export interface SaldoConta {
  id: number;
  nome: string;
  tipo: string;
  saldo: number;
}

export interface ResumoMes {
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface ComparativoMes {
  receitasMesAtual: number;
  receitasMesAnterior: number;
  variacaoReceitasPercent: number;
  despesasMesAtual: number;
  despesasMesAnterior: number;
  variacaoDespesasPercent: number;
}

export interface ProjecaoMes {
  diasDecorridos: number;
  diasTotais: number;
  receitasProjetadas: number;
  despesasProjetadas: number;
  saldoProjetado: number;
}

export interface GastoPorCategoria {
  categoriaId: number;
  nomeCategoria: string;
  total: number;
  percentualSobreTotal: number;
}

export interface FluxoMensal {
  ano: number;
  mes: number;
  mesLabel: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface UltimaTransacao {
  id: number;
  descricao: string;
  valor: number;
  tipo: string;
  status: string;
  data: string;
  categoria: string;
  conta: string;
}

export interface Vencimento {
  idUnico: string;
  transacaoId?: number | null;
  parcelaId?: number | null;
  descricao: string;
  valor: number;
  dataVencimento: string;
  diasRestantes: number;
  conta: string;
  origem: OrigemLancamento;
  tipo: TipoMovimentacao;
  atrasado: boolean;
  venceHoje: boolean;
}

export interface ProximosVencimentosDashboard {
  proximos7Dias: Vencimento[];
  proximos15Dias: Vencimento[];
  proximos30Dias: Vencimento[];
  totalVencer7Dias: number;
  totalVencer30Dias: number;
}

export interface ResumoMeta {
  id: number;
  nome: string;
  valorAlvo: number;
  valorAtual: number;
  percentualConcluido: number;
  prazo: string;
  atrasada: boolean;
}

export interface ResumoOrcamento {
  orcamentoId: number;
  categoria: string;
  limite: number;
  gasto: number;
  disponivel: number;
  percentualUtilizado: number;
  estourado: boolean;
}

export interface ResumoCartao {
  cartaoId: number;
  nome: string;
  limite: number;
  utilizado: number;
  disponivel: number;
  percentualUtilizado: number;
  faturaAtual: number;
  proximoVencimento: string;
}

export interface AlertaDashboard {
  tipo: string;
  mensagem: string;
  nivel: "INFO" | "AVISO" | "CRITICO";
  score: number;
}

export interface DashboardResponse {
  saldoTotal: number;
  saldoPorConta: SaldoConta[];
  mesAtual: ResumoMes;
  comparativo: ComparativoMes;
  projecao: ProjecaoMes;
  gastosPorCategoria: GastoPorCategoria[];
  fluxoCaixaSeisMeses: FluxoMensal[];
  ultimasTransacoes: UltimaTransacao[];
  proximosVencimentos: ProximosVencimentosDashboard;
  metas: ResumoMeta[];
  orcamentos: ResumoOrcamento[];
  cartoes: ResumoCartao[];
  alertas: AlertaDashboard[];
}
