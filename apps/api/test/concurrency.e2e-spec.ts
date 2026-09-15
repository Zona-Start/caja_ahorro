import { Pool } from 'pg';

/**
 * Pruebas de concurrencia (integración sobre PostgreSQL real).
 *
 * Verifican que los patrones atómicos SQL y el bloqueo pesimista aplicados en
 * los servicios eliminan las condiciones de carrera (lost updates / sobregiro)
 * en los saldos mutables (accounts_payable, products).
 *
 * NOTA: Requiere una base de datos migrada (DATABASE_URL) y crea/limpia sus
 * propios fixtures con un prefijo único para no afectar datos reales.
 */

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres:local**@localhost:5432/caja_ahorro?options=-c%20search_path=auth,core,tenant,accounting,savings,inventory,purchasing,treasury,audit,public';

describe('Concurrency: atomic updates & pessimistic locking', () => {
  const pool = new Pool({ connectionString, max: 8 });

  const ts = Date.now();
  const tenantId = '00000000-0000-0000-0000-000000000001';
  let categoryId: string;
  let productId: string;
  let supplierId: string;
  let payableId: string;

  beforeAll(async () => {
    // Tenant
    await pool.query(
      `INSERT INTO tenant.tenants (id, name, rif, email) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING`,
      [tenantId, 'Concurrency Test', `J-${ts}`, `conc-${ts}@test.com`],
    );

    // Categoría de inventario
    const catRes = await pool.query(
      `INSERT INTO inventory.inventories_categories (tenant_id, "group", name) VALUES ($1,$2,$3) RETURNING id`,
      [tenantId, 'Concurrency', `ConcCat-${ts}`],
    );
    categoryId = catRes.rows[0].id;

    // Producto con stock físico 100
    const prodRes = await pool.query(
      `INSERT INTO inventory.products
        (tenant_id, category_id, internal_code, sku, name, stock_on_hand, stock_committed, status)
       VALUES ($1,$2,$3,$4,$5,100,0,'AVAILABLE') RETURNING id`,
      [tenantId, categoryId, `PC-${ts}`, `SKU-${ts}`, 'Producto Concurrency'],
    );
    productId = prodRes.rows[0].id;

    // Proveedor
    const supRes = await pool.query(
      `INSERT INTO purchasing.suppliers (tenant_id, internal_code, name, tax_id, category)
       VALUES ($1,$2,$3,$4,'GENERAL') RETURNING id`,
      [tenantId, `SUP-${ts}`, 'Proveedor Concurrency', `RIF-${ts}`],
    );
    supplierId = supRes.rows[0].id;

    // Cuenta por pagar: original 100, pagado 0, restante 100
    const payRes = await pool.query(
      `INSERT INTO purchasing.accounts_payable
        (tenant_id, supplier_id, ap_number, original_amount, paid_amount, remaining_amount, currency_code, status)
       VALUES ($1,$2,$3,100,0,100,'VES','PENDING') RETURNING id`,
      [tenantId, supplierId, `AP-${ts}`],
    );
    payableId = payRes.rows[0].id;
  }, 20000);

  afterAll(async () => {
    try {
      await pool.query(`DELETE FROM purchasing.accounts_payable WHERE id=$1`, [
        payableId,
      ]);
      await pool.query(`DELETE FROM purchasing.suppliers WHERE id=$1`, [
        supplierId,
      ]);
      await pool.query(`DELETE FROM inventory.products WHERE id=$1`, [
        productId,
      ]);
      await pool.query(`DELETE FROM inventory.inventories_categories WHERE id=$1`, [
        categoryId,
      ]);
      await pool.query(`DELETE FROM tenant.tenants WHERE id=$1`, [tenantId]);
    } finally {
      await pool.end();
    }
  }, 20000);

  it('atomic UPDATE con guarda evita sobregiro en accounts_payable bajo concurrencia', async () => {
    // Dos pagos concurrentes de 60 sobre un saldo de 100.
    // El patrón atómico (col = col ± x WHERE remaining >= x) debe permitir solo uno.
    const runPayment = (client: any) =>
      client.query('BEGIN').then(() =>
        client
          .query(
            `UPDATE purchasing.accounts_payable
               SET paid_amount = paid_amount + 60,
                   remaining_amount = remaining_amount - 60,
                   status = CASE WHEN remaining_amount - 60 <= 0 THEN 'PAID'::payment_accounts_payable ELSE 'PARTIALLY_PAID'::payment_accounts_payable END
             WHERE id = $1 AND remaining_amount >= 60`,
            [payableId],
          )
          .then((res: any) => client.query('COMMIT').then(() => res.rowCount))
          .catch((err: any) =>
            client.query('ROLLBACK').then(() => {
              throw err;
            }),
          ),
      );

    const [c1, c2] = await Promise.all([
      pool.connect(),
      pool.connect(),
    ]);
    const results = await Promise.all([runPayment(c1), runPayment(c2)]);
    c1.release();
    c2.release();

    const affected = results.filter((n) => n === 1).length;
    expect(affected).toBe(1);

    const { rows } = await pool.query(
      `SELECT paid_amount, remaining_amount FROM purchasing.accounts_payable WHERE id=$1`,
      [payableId],
    );
    expect(Number(rows[0].remaining_amount)).toBe(40);
    expect(Number(rows[0].paid_amount)).toBe(60);
  });

  it('atomic UPDATE con guarda evita stock negativo en products bajo concurrencia', async () => {
    const runOutflow = (client: any) =>
      client.query('BEGIN').then(() =>
        client
          .query(
            `UPDATE inventory.products
               SET stock_on_hand = stock_on_hand - 60
             WHERE id = $1 AND stock_on_hand >= 60`,
            [productId],
          )
          .then((res: any) => client.query('COMMIT').then(() => res.rowCount))
          .catch((err: any) =>
            client.query('ROLLBACK').then(() => {
              throw err;
            }),
          ),
      );

    const [c1, c2] = await Promise.all([pool.connect(), pool.connect()]);
    const results = await Promise.all([runOutflow(c1), runOutflow(c2)]);
    c1.release();
    c2.release();

    const affected = results.filter((n) => n === 1).length;
    expect(affected).toBe(1);

    const { rows } = await pool.query(
      `SELECT stock_on_hand FROM inventory.products WHERE id=$1`,
      [productId],
    );
    expect(Number(rows[0].stock_on_hand)).toBe(40);
  });

  it('SELECT ... FOR UPDATE serializa actualizaciones concurrentes (sin lost update)', async () => {
    // Dos transacciones incrementan un contador sobre la misma fila.
    // El bloqueo pesimista debe serializarlas: resultado final = 2.
    const runIncrement = (client: any) =>
      client.query('BEGIN').then(() =>
        client
          .query(
            `SELECT stock_committed FROM inventory.products WHERE id=$1 FOR UPDATE`,
            [productId],
          )
          .then((res: any) => {
            const current = Number(res.rows[0].stock_committed);
            return client
              .query(
                `UPDATE inventory.products SET stock_committed = $2 WHERE id=$1`,
                [productId, current + 1],
              )
              .then(() => client.query('COMMIT'));
          })
          .catch((err: any) =>
            client.query('ROLLBACK').then(() => {
              throw err;
            }),
          ),
      );

    const [c1, c2] = await Promise.all([pool.connect(), pool.connect()]);
    await Promise.all([runIncrement(c1), runIncrement(c2)]);
    c1.release();
    c2.release();

    const { rows } = await pool.query(
      `SELECT stock_committed FROM inventory.products WHERE id=$1`,
      [productId],
    );
    expect(Number(rows[0].stock_committed)).toBe(2);
  });

  it('patrón Read-Then-Write antiguo produce sobregiro (demostración del bug)', async () => {
    // Reestablece el saldo para la demostración.
    await pool.query(
      `UPDATE purchasing.accounts_payable SET paid_amount=0, remaining_amount=100 WHERE id=$1`,
      [payableId],
    );

    // Patrón INCORRECTO: leer en JS -> calcular -> escribir (lost update).
    const runOld = (client: any) =>
      client
        .query('BEGIN')
        .then(() =>
          client.query(
            `SELECT paid_amount, remaining_amount FROM purchasing.accounts_payable WHERE id=$1`,
            [payableId],
          ),
        )
        .then((res: any) => {
          const newPaid = Number(res.rows[0].paid_amount) + 60;
          const newRem = Number(res.rows[0].remaining_amount) - 60;
          return client
            .query(
              `UPDATE purchasing.accounts_payable SET paid_amount=$2, remaining_amount=$3 WHERE id=$1`,
              [payableId, newPaid, newRem],
            )
            .then(() => client.query('COMMIT'));
        })
        .catch((err: any) =>
          client.query('ROLLBACK').then(() => {
            throw err;
          }),
        );

    const [c1, c2] = await Promise.all([pool.connect(), pool.connect()]);
    await Promise.all([runOld(c1), runOld(c2)]);
    c1.release();
    c2.release();

    const { rows } = await pool.query(
      `SELECT paid_amount, remaining_amount FROM purchasing.accounts_payable WHERE id=$1`,
      [payableId],
    );
    // Ambos pagos "pasaron" (se permitieron 120 de saldo), pero el contador
    // quedó en 60 y el restante en 40 -> sobregiro/desincronización.
    expect(Number(rows[0].paid_amount)).toBe(60);
    expect(Number(rows[0].remaining_amount)).toBe(40);

    // Restaurar para no afectar los siguientes tests.
    await pool.query(
      `UPDATE purchasing.accounts_payable SET paid_amount=0, remaining_amount=100 WHERE id=$1`,
      [payableId],
    );
  });
});
