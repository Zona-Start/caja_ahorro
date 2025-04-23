import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../index';
import { bankDirectory } from '../index';
export async function seedBankDirectory(db: NodePgDatabase<typeof schema>) {
    try {
      const banks = [
        { code: '0001', name: 'Banco Central de Venezuela' },
        { code: '0003', name: 'Banco Industrial de Venezuela' },
        { code: '0006', name: 'Banco Coro' },
        { code: '0008', name: 'Banco Guayana' },
        { code: '0102', name: 'Banco de Venezuela, S.A. Banco Universal' },
        { code: '0104', name: 'Banco Venezolano de Crédito, S.A. Banco Universal' },
        { code: '0105', name: 'Banco Mercantil C.A., Banco Universal' },
        { code: '0108', name: 'Banco Provincial, S.A. Banco Universal' },
        { code: '0114', name: 'Banco del Caribe C.A., Banco Universal' },
        { code: '0115', name: 'Banco Exterior C.A., Banco Universal' },
        { code: '0116', name: 'Banco Occidental de Descuento' },
        { code: '0121', name: 'Corp Banca' },
        { code: '0128', name: 'Banco Caroní C.A., Banco Universal' },
        { code: '0133', name: 'Banco Federal' },
        { code: '0134', name: 'Banesco Banco Universal, C.A.' },
        { code: '0137', name: 'Banco Sofitasa Banco Universal, C.A.' },
        { code: '0138', name: 'Banco Plaza, Banco Universal' },
        { code: '0146', name: 'Banco de la Gente Emprendedora C.A. (Bangente)' },
        { code: '0148', name: 'Total Bank' },
        { code: '0151', name: 'Banco Fondo Común, C.A Banco Universal' },
        { code: '0156', name: '100% Banco, Banco Comercial, C.A' },
        { code: '0157', name: 'DelSur, Banco Universal C.A.' },
        { code: '0162', name: 'Banvalor' },
        { code: '0163', name: 'Banco del Tesoro C.A., Banco Universal' },
        { code: '0166', name: 'Banco Agrícola de Venezuela C.A., Banco Universal' },
        { code: '0168', name: 'Bancrecer S.A., Banco Microfinanciero' },
        { code: '0169', name: 'Mi Banco, Banco Microfinanciero, C.A.' },
        { code: '0171', name: 'Banco Activo C.A., Banco Universal' },
        { code: '0172', name: 'Bancamiga Banco Universal, C.A.' },
        { code: '0173', name: 'Banco Internacional de Desarrollo C.A., Banco Universal' },
        { code: '0174', name: 'Banplus Banco Universal, C.A.' },
        { code: '0175', name: 'Banco Bicentenario del Pueblo, Banco Universal C.A.' },
        { code: '0177', name: 'Banco de la Fuerza Armada Nacional Bolivariana, Banco Universal' },
        { code: '0190', name: 'Citibank' },
        { code: '0191', name: 'Banco Nacional de Crédito C.A., Banco Universal' },
        { code: '0194', name: 'Helm Bank de Venezuela' },
        { code: '0196', name: 'ABN-AMRO Bank N.V.' },
        { code: '0601', name: 'Instituto Municipal de Crédito Popular' },
      ];
  
      for (const bank of banks) {
        await db
          .insert(bankDirectory)
          .values({
            code: bank.code,
            name: bank.name,
            countryCode: 'VEN',
            isActive: true,
            createdById: 1,
            updatedById: 1,
          })
          .onConflictDoNothing();
      }
  
      console.log('Bank directory seeded successfully');
    } catch (error) {
      console.error('Error seeding bank directory:', error);
    }
  }
  