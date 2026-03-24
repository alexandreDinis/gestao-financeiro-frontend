export type TipoDivida = 'A_RECEBER' | 'A_PAGAR';
export type StatusDivida = 'PENDENTE' | 'PAGA' | 'ATRASADA';
export type StatusTransacao = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';

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
  createdAt: string;
}

export interface DividaRequest {
  pessoaId: number;
  descricao: string;
  tipo: TipoDivida;
  valorTotal: number;
  dataInicio: string;
  dataFim?: string;
  observacao?: string;
  parcelas: number;
}

export interface PagarParcelaRequest {
  contaId: number;
  categoriaId?: number; // Optional on backend
  dataPagamento?: string; 
  valorPago?: number; // Support for partial payments
}
