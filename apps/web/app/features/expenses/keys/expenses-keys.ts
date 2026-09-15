export const expensesKeys = {
  all: ['expenses'] as const,
  lists: () => [...expensesKeys.all, 'list'] as const,
  list: (filters: object) => [...expensesKeys.lists(), filters] as const,
  details: () => [...expensesKeys.all, 'detail'] as const,
  detail: (id: string) => [...expensesKeys.details(), id] as const,
  mode: () => [...expensesKeys.all, 'mode'] as const,
};

export const cashRegistersKeys = {
  all: ['cash-registers'] as const,
  lists: () => [...cashRegistersKeys.all, 'list'] as const,
  list: (filters: object) => [...cashRegistersKeys.lists(), filters] as const,
  details: () => [...cashRegistersKeys.all, 'detail'] as const,
  detail: (id: string) => [...cashRegistersKeys.details(), id] as const,
  activeSession: (id: string) =>
    [...cashRegistersKeys.all, 'active-session', id] as const,
};

export const costCentersKeys = {
  all: ['cost-centers'] as const,
  lists: () => [...costCentersKeys.all, 'list'] as const,
  list: (filters: object) => [...costCentersKeys.lists(), filters] as const,
  details: () => [...costCentersKeys.all, 'detail'] as const,
  detail: (id: string) => [...costCentersKeys.details(), id] as const,
  budgetUsage: (id: string, month?: string) =>
    [...costCentersKeys.all, 'budget-usage', id, month] as const,
};

export const expenseCategoriesKeys = {
  all: ['expense-categories'] as const,
  lists: () => [...expenseCategoriesKeys.all, 'list'] as const,
  list: (filters: object) =>
    [...expenseCategoriesKeys.lists(), filters] as const,
  details: () => [...expenseCategoriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseCategoriesKeys.details(), id] as const,
};

export const pettyCashKeys = {
  all: ['petty-cash'] as const,
  lists: () => [...pettyCashKeys.all, 'list'] as const,
  list: (filters: object) => [...pettyCashKeys.lists(), filters] as const,
  details: () => [...pettyCashKeys.all, 'detail'] as const,
  detail: (id: string) => [...pettyCashKeys.details(), id] as const,
};
