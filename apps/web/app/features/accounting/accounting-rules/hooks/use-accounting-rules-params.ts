import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { categoryOptions } from '../constants/operations';
import type { Category } from '../constants/operations';

export function useAccountingRulesParams() {
  const [category, setCategory] = useQueryState<Category>(
    'category',
    parseAsStringLiteral(categoryOptions).withDefault('SAVINGS_BANK'),
  );

  const [operation, setOperation] = useQueryState(
    'operation',
    parseAsString.withDefault(''),
  );

  const [reference, setReference] = useQueryState(
    'reference',
    parseAsString,
  );

  return {
    category,
    setCategory,
    operation,
    setOperation,
    reference,
    setReference,
  };
}
