export type StatusFatura = 'ABERTA' | 'FECHADA' | 'PAGA' | 'ATRASADA';

export interface Parcela {
  id: number;
  transacaoId: number;
  numeroParcela: number;
  totalParcelas: number;
  valorParcela: number;
  dataVencimento: string;
  paga: boolean;
}

export interface FaturaCartao {
  id: number;
  cartaoId: number;
  cartaoBandeira: string;
  mesReferencia: number;
  anoReferencia: number;
  valorTotal: number;
  dataVencimento: string;
  status: StatusFatura;
  parcelas: Parcela[];
  createdAt: string;
}

export interface CartaoCredito {
  id: number;
  contaId: number;
  contaNome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  createdAt: string;
}

export interface CartaoCreditoRequest {
  nomeCartao: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
}

export interface CompraCartaoRequest {
  cartaoId: number;
  categoriaId: number;
  descricao: string;
  valor: number;
  parcelas: number;
  data: string;
}
