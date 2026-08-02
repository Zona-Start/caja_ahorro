import { apiClient } from '@/lib/api-client';

const BASE = '/bankings/reports';

async function downloadFile(url: string, filename: string) {
  const response = await apiClient.get(url, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: response.headers['content-type'] as string || 'application/octet-stream' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

export const bankingReportsService = {
  reconciliationAct: async (id: string) => {
    const r = await apiClient.get(`${BASE}/reconciliation-act/${id}`);
    return r.data;
  },
  downloadReconciliationActExcel: (id: string) =>
    downloadFile(`${BASE}/reconciliation-act/${id}/download-excel`, `acta_conciliacion_${id.slice(0, 8)}.xlsx`),
  downloadReconciliationActPdf: (id: string) =>
    downloadFile(`${BASE}/reconciliation-act/${id}/download-pdf`, `acta_conciliacion_${id.slice(0, 8)}.pdf`),

  pendingItems: async (bankAccountId?: string, daysOld?: number) => {
    const q = new URLSearchParams();
    if (bankAccountId) q.set('bankAccountId', bankAccountId);
    if (daysOld) q.set('daysOld', String(daysOld));
    const r = await apiClient.get(`${BASE}/pending-items?${q.toString()}`);
    return r.data;
  },
  downloadPendingItemsExcel: (bankAccountId?: string, daysOld?: number) => {
    const q = new URLSearchParams();
    if (bankAccountId) q.set('bankAccountId', bankAccountId);
    if (daysOld) q.set('daysOld', String(daysOld));
    return downloadFile(`${BASE}/pending-items/download-excel?${q.toString()}`, 'partidas_pendientes.xlsx');
  },
  downloadPendingItemsPdf: (bankAccountId?: string, daysOld?: number) => {
    const q = new URLSearchParams();
    if (bankAccountId) q.set('bankAccountId', bankAccountId);
    if (daysOld) q.set('daysOld', String(daysOld));
    return downloadFile(`${BASE}/pending-items/download-pdf?${q.toString()}`, 'partidas_pendientes.pdf');
  },

  consolidatedPosition: async () => {
    const r = await apiClient.get(`${BASE}/consolidated-position`);
    return r.data;
  },
  downloadConsolidatedPositionExcel: () =>
    downloadFile(`${BASE}/consolidated-position/download-excel`, 'posicion_consolidada.xlsx'),
  downloadConsolidatedPositionPdf: () =>
    downloadFile(`${BASE}/consolidated-position/download-pdf`, 'posicion_consolidada.pdf'),

  auxiliaryBook: async (bankAccountId: string, dateFrom?: string, dateTo?: string) => {
    const q = new URLSearchParams();
    q.set('bankAccountId', bankAccountId);
    if (dateFrom) q.set('dateFrom', dateFrom);
    if (dateTo) q.set('dateTo', dateTo);
    const r = await apiClient.get(`${BASE}/auxiliary-book?${q.toString()}`);
    return r.data;
  },
  downloadAuxiliaryBookExcel: (bankAccountId: string, dateFrom?: string, dateTo?: string) => {
    const q = new URLSearchParams();
    q.set('bankAccountId', bankAccountId);
    if (dateFrom) q.set('dateFrom', dateFrom);
    if (dateTo) q.set('dateTo', dateTo);
    return downloadFile(`${BASE}/auxiliary-book/download-excel?${q.toString()}`, `auxiliar_bancos.xlsx`);
  },
  downloadAuxiliaryBookPdf: (bankAccountId: string, dateFrom?: string, dateTo?: string) => {
    const q = new URLSearchParams();
    q.set('bankAccountId', bankAccountId);
    if (dateFrom) q.set('dateFrom', dateFrom);
    if (dateTo) q.set('dateTo', dateTo);
    return downloadFile(`${BASE}/auxiliary-book/download-pdf?${q.toString()}`, `auxiliar_bancos.pdf`);
  },
};
