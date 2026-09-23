export interface InquiryPaginationParams {
  page: number;
  limit: number;
}

export const inquiryKeys = {
  all: ['inquiry'] as const,
  associates: () => [...inquiryKeys.all, 'associate'] as const,
  associate: (cedula: string) => [...inquiryKeys.associates(), cedula] as const,
  movements: () => [...inquiryKeys.all, 'movements'] as const,
  haberes: (id: string, params: InquiryPaginationParams) =>
    [...inquiryKeys.movements(), 'haberes', id, params] as const,
  withdrawals: (id: string, params: InquiryPaginationParams) =>
    [...inquiryKeys.movements(), 'withdrawals', id, params] as const,
  history: (id: string, params: InquiryPaginationParams) =>
    [...inquiryKeys.movements(), 'history', id, params] as const,
  loans: (id: string, params: InquiryPaginationParams) =>
    [...inquiryKeys.movements(), 'loans', id, params] as const,
  credits: (id: string, params: InquiryPaginationParams) =>
    [...inquiryKeys.movements(), 'credits', id, params] as const,
};
