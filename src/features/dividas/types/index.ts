export type TipoDivida = 'A_RECEBER' | 'A_PAGAR';
export type StatusDivida = 'PENDENTE' | 'PAGA' | 'ATRASADA';
export type StatusTransacao = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type Periodicidade = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'ANUAL';

export interface ParcelaDivida {
  id: number;
  numeroParcela: number;
  valor: number;
  dataVencimento: string;
  status: StatusTransacao;
  dataPagamento?: string;
  transacaoGeradaId?: number;
}

export interface Divida {
  id: number;
  pessoaId: number;
  pessoaNome: string;
  descricao: string;
  tipo: TipoDivida;
  valorTotal: number;
  valorRestante: number;
  dataInicio: string;
  dataFim?: string;
  status: StatusDivida;
  observacao?: string;
  parcelas: ParcelaDivida[];
  totalParcelas: number;
  createdAt: string;
  recorrente?: boolean;
  periodicidade?: Periodicidade;
  diaVencimento?: number;
  valorParcelaRecorrente?: number;
}

export interface DividaRequest {
  pessoaId: number;
  descricao: string;
  tipo: TipoDivida;
  valorTotal: number;
  dataInicio: string;
  dataFim?: string;
  observacao?: string;
  parcelas?: number;
  recorrente?: boolean;
  periodicidade?: Periodicidade;
  diaVencimento?: number;
  valorParcelaRecorrente?: number;
}

export interface PagarParcelaRequest {
  contaId: number;
  categoriaId?: number; 
  dataPagamento?: string; 
  valorPago?: number; 
}

export interface DividasResumo {
  items: Divida[];
  totalGeral: number;
  totalItems: number;
}

