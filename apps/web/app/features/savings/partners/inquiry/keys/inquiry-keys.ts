export const inquiryKeys = {
  all: ['inquiry'] as const,
  associates: () => [...inquiryKeys.all, 'associate'] as const,
  associate: (cedula: string) => [...inquiryKeys.associates(), cedula] as const,
  movements: () => [...inquiryKeys.all, 'movements'] as const,
  haberes: (id: number) => [...inquiryKeys.movements(), 'haberes', id] as const,
  withdrawals: (id: number) => [...inquiryKeys.movements(), 'withdrawals', id] as const,
  history: (id: number) => [...inquiryKeys.movements(), 'history', id] as const,
  loans: (id: number) => [...inquiryKeys.movements(), 'loans', id] as const,
  credits: (id: number) => [...inquiryKeys.movements(), 'credits', id] as const,
};
