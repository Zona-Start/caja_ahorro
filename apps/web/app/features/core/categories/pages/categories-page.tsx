import type { Metadata } from 'react';
import CategoriesList from '../components/categories-list';

export const metadata: Metadata = {
  title: 'Categorías - Caja de Ahorro',
};

export default function CategoriesPage() {
  return <CategoriesList />;
}