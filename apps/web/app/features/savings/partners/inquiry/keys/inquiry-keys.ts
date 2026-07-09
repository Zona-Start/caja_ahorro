export const inquiryKeys = {
  all: ['inquiry'] as const,
  associates: () => [...inquiryKeys.all, 'associate'] as const,
  associate: (cedula: string) => [...inquiryKeys.associates(), cedula] as const,
  movements: () => [...inquiryKeys.all, 'movements'] as const,
  haberes: (id: string) => [...inquiryKeys.movements(), 'haberes', id] as const,
  withdrawals: (id: string) =>
    [...inquiryKeys.movements(), 'withdrawals', id] as const,
  history: (id: string) => [...inquiryKeys.movements(), 'history', id] as const,
  loans: (id: string) => [...inquiryKeys.movements(), 'loans', id] as const,
  credits: (id: string) => [...inquiryKeys.movements(), 'credits', id] as const,
};
