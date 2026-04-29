// import { NodePgDatabase } from 'drizzle-orm/node-postgres';
// import * as schema from '../index';
// import { company } from '../index';

// export async function seedCompany(db: NodePgDatabase<typeof schema>) {
//   try {
//     await db
//       .insert(company)
//       .values({
//         rif: 'J-30370874-9',
//         name: 'CAPREBICENTENARIO',
//         address:
//           'CALLE INDEPENDENCIA CON COROMOTO, EDIF ONNIS, PISO 12, URB BELLO CAMPO',
//         phone: '04165339790',
//         email: 'caja@caprebicentenario.com.ve',
//         contactPerson: 'KARIM MIRANDA',
//         contactPhone: '04165339790',
//         contactEmail: 'karimmiranda@gmail.com',
//       })
//       .onConflictDoNothing();

//     console.log('SavingBank seeded successfully');
//   } catch (error) {
//     console.error('Error creating SavingBank:', error);
//   }
// }
