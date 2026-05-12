import type { Metadata } from 'react';
import CreditTypesList from '../components/credit-types-list';

export const metadata: Metadata = {
  title: 'Tipos de Créditos - Caja de Ahorro',
};

export default function CreditTypesPage() {
  return <CreditTypesList />;
}