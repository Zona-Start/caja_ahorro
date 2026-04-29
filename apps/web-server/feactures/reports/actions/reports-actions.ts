'use server';

import { fetchApiFile } from '@/lib/fetch.file.api';
import { ReportDebtValues } from '../schemas/reports.schema';

export const getAssociatedDebtsReportAction = async (
  values: ReportDebtValues,
) => {
  const params = new URLSearchParams({
    startDate: values.startDate.toISOString(),
    endDate: values.endDate.toISOString(),
  });
  try {
    const blob = await fetchApiFile(
      `/reports/associated-debts?${params}`,
      'GET',
    );
    return blob;
  } catch (error) {
    console.error('Error fetching report:', error);
    throw new Error('Failed to generate report');
  }
};
