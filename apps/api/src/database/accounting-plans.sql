-- SQL INSERT statements for the 'account_plan' table
-- This script assumes the 'account_plan' table and its associated ENUM types ('account_type', 'account_nature') already exist.
-- The 'company_id' is set to NULL as it's not specified in the provided document for these accounts.
-- The 'parent_account_id' is determined by a subquery, requiring accounts to be inserted in hierarchical order.

-- Rubro 100: ACTIVO (ASSET, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '100.00.00.00', 'ACTIVOS', NULL, 'ASSET', 'DEBIT', 1, FALSE, TRUE, NULL);

-- Grupo 110: Disponibilidad (ASSET, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '110.00.00.00', 'DISPONIBILIDAD', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '100.00.00.00'));

  -- Cuenta 111: Efectivo (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '111.00.00.00', 'EFECTIVO', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '110.00.00.00'));

    -- 1ra-Subcuenta 111.01: Caja Chica (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '111.01.00.00', 'CAJA CHICA', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '111.00.00.00'));

    -- 1ra-Subcuenta 111.02: Caja Principal (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '111.02.00.00', 'CAJA PRINCIPAL', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '111.00.00.00'));

  -- Cuenta 112: Bancos e Instituciones Financieras (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '112.00.00.00', 'BANCOS E INSTITUCIONES FINANCIERAS', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '110.00.00.00'));

    -- 1ra-Subcuenta 112.01: Sector Público (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.01.00.00', 'SECTOR PÚBLICO', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.00.00.00'));

      -- 2da-Subcuenta 112.01.01: Moneda Nacional (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '112.01.01.00', 'MONEDA NACIONAL', NULL, 'ASSET', 'DEBIT', 5, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.00.00'));

        -- 3ra-Subcuenta 112.01.01.01: Cuentas Corrientes (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.01.01', 'CUENTAS CORRIENTES', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.01.00'));

        -- 3ra-Subcuenta 112.01.01.02: Cuentas de Ahorro (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.01.02', 'CUENTAS DE AHORRO', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.01.00'));

        -- 3ra-Subcuenta 112.01.01.03: Colocaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.01.03', 'COLOCACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.01.00'));

        -- 3ra-Subcuenta 112.01.01.99: Otras Operaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.01.99', 'OTRAS OPERACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.01.00'));

      -- 2da-Subcuenta 112.01.02: Moneda Extranjera (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '112.01.02.00', 'MONEDA EXTRANJERA', NULL, 'ASSET', 'DEBIT', 5, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.00.00'));

        -- 3ra-Subcuenta 112.01.02.01: Cuentas Corriente (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.02.01', 'CUENTAS CORRIENTE', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.02.00'));

        -- 3ra-Subcuenta 112.01.02.02: Cuentas de Ahorro (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.02.02', 'CUENTAS DE AHORRO', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.02.00'));

        -- 3ra-Subcuenta 112.01.02.03: Colocaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.02.03', 'COLOCACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.02.00'));

        -- 3ra-Subcuenta 112.01.02.99: Otras Operaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.01.02.99', 'OTRAS OPERACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.01.02.00'));

    -- 1ra-Subcuenta 112.02: Sector Privado (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.02.00.00', 'SECTOR PRIVADO', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.00.00.00'));

      -- 2da-Subcuenta 112.02.01: Moneda Nacional (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '112.02.01.00', 'MONEDA NACIONAL', NULL, 'ASSET', 'DEBIT', 5, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.00.00'));

        -- 3ra-Subcuenta 112.02.01.01: Cuentas Corrientes (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.01.01', 'CUENTAS CORRIENTES', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.01.00'));

        -- 3ra-Subcuenta 112.02.01.02: Cuentas de Ahorro (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.01.02', 'CUENTAS DE AHORRO', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.01.00'));

        -- 3ra-Subcuenta 112.02.01.03: Colocaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.01.03', 'COLOCACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.01.00'));

        -- 3ra-Subcuenta 112.02.01.99: Otras Operaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.01.99', 'OTRAS OPERACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.01.00'));

      -- 2da-Subcuenta 112.02.02: Moneda Extranjera (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '112.02.02.00', 'MONEDA EXTRANJERA', NULL, 'ASSET', 'DEBIT', 5, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.00.00'));

        -- 3ra-Subcuenta 112.02.02.01: Cuentas Corrientes (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.02.01', 'CUENTAS CORRIENTES', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.02.00'));

        -- 3ra-Subcuenta 112.02.02.02: Cuentas de Ahorro (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.02.02', 'CUENTAS DE AHORRO', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.02.00'));

        -- 3ra-Subcuenta 112.02.02.03: Colocaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.02.03', 'COLOCACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.02.00'));

        -- 3ra-Subcuenta 112.02.02.99: Otras Operaciones Menores o Iguales a Noventa (90) Días (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.02.02.99', 'OTRAS OPERACIONES MENORES O IGUALES A NOVENTA (90) DÍAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.02.02.00'));

    -- 1ra-Subcuenta 112.03: Disponibilidad Restringida (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.03.00.00', 'DISPONIBILIDAD RESTRINGIDA', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.00.00.00'));

      -- 2da-Subcuenta 112.03.01: Sector Público (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '112.03.01.00', 'SECTOR PÚBLICO', NULL, 'ASSET', 'DEBIT', 5, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.00.00'));

        -- 3ra-Subcuenta 112.03.01.01: Reserva de Emergencia (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.03.01.01', 'RESERVA DE EMERGENCIA', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.01.00'));

        -- 3ra-Subcuenta 112.03.01.02: Reservas Especiales (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.03.01.02', 'RESERVAS ESPECIALES', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.01.00'));

        -- 3ra-Subcuenta 112.03.01.99: Otras Reservas (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.03.01.99', 'OTRAS RESERVAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.01.00'));

      -- 2da-Subcuenta 112.03.02: Sector Privado (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '112.03.02.00', 'SECTOR PRIVADO', NULL, 'ASSET', 'DEBIT', 5, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.00.00'));

        -- 3ra-Subcuenta 112.03.02.01: Reserva de Emergencia (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.03.02.01', 'RESERVA DE EMERGENCIA', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.02.00'));

        -- 3ra-Subcuenta 112.03.02.02: Reservas Especiales (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.03.02.02', 'RESERVAS ESPECIALES', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.02.00'));

        -- 3ra-Subcuenta 112.03.02.99: Otras Reservas (ASSET, DEBIT)
        INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
        (1, '112.03.02.99', 'OTRAS RESERVAS', NULL, 'ASSET', 'DEBIT', 6, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '112.03.02.00'));

-- Grupo 120: Inversiones (ASSET, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '120.00.00.00', 'INVERSIONES', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '100.00.00.00'));

  -- Cuenta 121: Inversiones a Corto Plazo (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '121.00.00.00', 'INVERSIONES A CORTO PLAZO', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '120.00.00.00'));

    -- 1ra-Subcuenta 121.01: Títulos Valores Negociados (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '121.01.00.00', 'TÍTULOS VALORES NEGOCIADOS', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '121.00.00.00'));

      -- 2da-Subcuenta 121.01.01: Bonos y Obligaciones de la Deuda Pública Nacional, Estadal y Municipal (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '121.01.01.00', 'BONOS Y OBLIGACIONES DE LA DEUDA PÚBLICA NACIONAL, ESTADAL Y MUNICIPAL', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '121.01.00.00'));

      -- 2da-Subcuenta 121.01.02: Títulos de Crédito de Empresas Privadas (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '121.01.02.00', 'TÍTULOS DE CRÉDITO DE EMPRESAS PRIVADAS', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '121.01.00.00'));

      -- 2da-Subcuenta 121.01.99: Otros Títulos Valores Negociados (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '121.01.99.00', 'OTROS TÍTULOS VALORES NEGOCIADOS', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '121.01.00.00'));

  -- Cuenta 122: Inversiones a Largo Plazo (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '122.00.00.00', 'INVERSIONES A LARGO PLAZO', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '120.00.00.00'));

    -- 1ra-Subcuenta 122.01: Títulos Valores No Negociados (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '122.01.00.00', 'TÍTULOS VALORES NO NEGOCIADOS', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '122.00.00.00'));

      -- 2da-Subcuenta 122.01.01: Bonos y Obligaciones de la Deuda Pública Nacional, Estadal y Municipal (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '122.01.01.00', 'BONOS Y OBLIGACIONES DE LA DEUDA PÚBLICA NACIONAL, ESTADAL Y MUNICIPAL', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '122.01.00.00'));

      -- 2da-Subcuenta 122.01.02: Títulos de Crédito de Empresas Privadas (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '122.01.02.00', 'TÍTULOS DE CRÉDITO DE EMPRESAS PRIVADAS', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '122.01.00.00'));

      -- 2da-Subcuenta 122.01.99: Otros Títulos Valores No Negociados (ASSET, DEBIT)
      INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
      (1, '122.01.99.00', 'OTROS TÍTULOS VALORES NO NEGOCIADOS', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '122.01.00.00'));

-- Grupo 130: Cartera de Créditos (ASSET, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '130.00.00.00', 'CARTERA DE CRÉDITOS', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '100.00.00.00'));

  -- Cuenta 131: Créditos Otorgados (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '131.00.00.00', 'CRÉDITOS OTORGADOS', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '130.00.00.00'));

    -- 1ra-Subcuenta 131.01: Créditos Ordinarios (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '131.01.00.00', 'CRÉDITOS ORDINARIOS', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '131.00.00.00'));

    -- 1ra-Subcuenta 131.02: Créditos Especiales (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '131.02.00.00', 'CRÉDITOS ESPECIALES', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '131.00.00.00'));

    -- 1ra-Subcuenta 131.03: Créditos a Corto Plazo (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '131.03.00.00', 'CRÉDITOS A CORTO PLAZO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '131.00.00.00'));

    -- 1ra-Subcuenta 131.04: Créditos a Largo Plazo (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '131.04.00.00', 'CRÉDITOS A LARGO PLAZO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '131.00.00.00'));

  -- Cuenta 132: Cartera de Créditos en Mora (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '132.00.00.00', 'CARTERA DE CRÉDITOS EN MORA', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '130.00.00.00'));

    -- 1ra-Subcuenta 132.01: Créditos Ordinarios en Mora (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '132.01.00.00', 'CRÉDITOS ORDINARIOS EN MORA', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '132.00.00.00'));

    -- 1ra-Subcuenta 132.02: Créditos Especiales en Mora (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '132.02.00.00', 'CRÉDITOS ESPECIALES EN MORA', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '132.00.00.00'));

  -- Cuenta 133: Estimación para Cuentas Incobrables (ASSET, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '133.00.00.00', 'ESTIMACIÓN PARA CUENTAS INCOBRABLES', NULL, 'ASSET', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '130.00.00.00'));

-- Grupo 140: Otros Activos (ASSET, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '140.00.00.00', 'OTROS ACTIVOS', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '100.00.00.00'));

  -- Cuenta 141: Cuentas por Cobrar (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '141.00.00.00', 'CUENTAS POR COBRAR', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '140.00.00.00'));

    -- 1ra-Subcuenta 141.01: Cuentas por Cobrar a Empleadores (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '141.01.00.00', 'CUENTAS POR COBRAR A EMPLEADORES', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '141.00.00.00'));

    -- 1ra-Subcuenta 141.02: Cuentas por Cobrar a Terceros (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '141.02.00.00', 'CUENTAS POR COBRAR A TERCEROS', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '141.00.00.00'));

    -- 1ra-Subcuenta 141.03: Intereses por Cobrar (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '141.03.00.00', 'INTERESES POR COBRAR', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '141.00.00.00'));

    -- 1ra-Subcuenta 141.04: Alquileres por Cobrar (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '141.04.00.00', 'ALQUILERES POR COBRAR', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '141.00.00.00'));

    -- 1ra-Subcuenta 141.99: Otras Cuentas por Cobrar (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '141.99.00.00', 'OTRAS CUENTAS POR COBRAR', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '141.00.00.00'));

  -- Cuenta 142: Inventarios (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '142.00.00.00', 'INVENTARIOS', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '140.00.00.00'));

    -- 1ra-Subcuenta 142.01: Mercancías para la Venta (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '142.01.00.00', 'MERCANCÍAS PARA LA VENTA', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '142.00.00.00'));

    -- 1ra-Subcuenta 142.02: Suministros de Oficina (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '142.02.00.00', 'SUMINISTROS DE OFICINA', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '142.00.00.00'));

    -- 1ra-Subcuenta 142.99: Otros Inventarios (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '142.99.00.00', 'OTROS INVENTARIOS', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '142.00.00.00'));

  -- Cuenta 143: Gastos Pagados por Anticipado (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '143.00.00.00', 'GASTOS PAGADOS POR ANTICIPADO', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '140.00.00.00'));

    -- 1ra-Subcuenta 143.01: Seguros Pagados por Anticipado (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '143.01.00.00', 'SEGUROS PAGADOS POR ANTICIPADO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '143.00.00.00'));

    -- 1ra-Subcuenta 143.02: Alquileres Pagados por Anticipado (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '143.02.00.00', 'ALQUILERES PAGADOS POR ANTICIPADO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '143.00.00.00'));

    -- 1ra-Subcuenta 143.99: Otros Gastos Pagados por Anticipado (ASSET, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '143.99.00.00', 'OTROS GASTOS PAGADOS POR ANTICIPADO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '143.00.00.00'));

-- Grupo 150: Propiedad, Planta y Equipo (ASSET, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '150.00.00.00', 'PROPIEDAD, PLANTA Y EQUIPO', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '100.00.00.00'));

  -- Cuenta 151: Terrenos (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '151.00.00.00', 'TERRENOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '150.00.00.00'));

  -- Cuenta 152: Edificios (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '152.00.00.00', 'EDIFICIOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '150.00.00.00'));

  -- Cuenta 153: Mobiliario y Equipos de Oficina (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '153.00.00.00', 'MOBILIARIO Y EQUIPOS DE OFICINA', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '150.00.00.00'));

  -- Cuenta 154: Equipos de Computación (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '154.00.00.00', 'EQUIPOS DE COMPUTACIÓN', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '150.00.00.00'));

  -- Cuenta 155: Vehículos (ASSET, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '155.00.00.00', 'VEHÍCULOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '150.00.00.00'));

  -- Cuenta 159: Depreciación Acumulada (ASSET, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '159.00.00.00', 'DEPRECIACIÓN ACUMULADA', NULL, 'ASSET', 'CREDIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '150.00.00.00'));

    -- 1ra-Subcuenta 159.01: Depreciación Acumulada de Edificios (ASSET, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '159.01.00.00', 'DEPRECIACIÓN ACUMULADA DE EDIFICIOS', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '159.00.00.00'));

    -- 1ra-Subcuenta 159.02: Depreciación Acumulada de Mobiliario y Equipos de Oficina (ASSET, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '159.02.00.00', 'DEPRECIACIÓN ACUMULADA DE MOBILIARIO Y EQUIPOS DE OFICINA', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '159.00.00.00'));

    -- 1ra-Subcuenta 159.03: Depreciación Acumulada de Equipos de Computación (ASSET, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '159.03.00.00', 'DEPRECIACIÓN ACUMULADA DE EQUIPOS DE COMPUTACIÓN', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '159.00.00.00'));

    -- 1ra-Subcuenta 159.04: Depreciación Acumulada de Vehículos (ASSET, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '159.04.00.00', 'DEPRECIACIÓN ACUMULADA DE VEHÍCULOS', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '159.00.00.00'));

-- Rubro 200: PASIVO (LIABILITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '200.00.00.00', 'PASIVO', NULL, 'LIABILITY', 'CREDIT', 1, FALSE, TRUE, NULL);

-- Grupo 210: Obligaciones con el Público (LIABILITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '210.00.00.00', 'OBLIGACIONES CON EL PÚBLICO', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '200.00.00.00'));

  -- Cuenta 211: Depósitos de Ahorro (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '211.00.00.00', 'DEPÓSITOS DE AHORRO', NULL, 'LIABILITY', 'CREDIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '210.00.00.00'));

    -- 1ra-Subcuenta 211.01: Ahorros de Asociados (LIABILITY, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '211.01.00.00', 'AHORROS DE ASOCIADOS', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '211.00.00.00'));

    -- 1ra-Subcuenta 211.02: Ahorros de No Asociados (LIABILITY, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '211.02.00.00', 'AHORROS DE NO ASOCIADOS', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '211.00.00.00'));

  -- Cuenta 212: Depósitos a Plazo (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '212.00.00.00', 'DEPÓSITOS A PLAZO', NULL, 'LIABILITY', 'CREDIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '210.00.00.00'));

    -- 1ra-Subcuenta 212.01: Depósitos a Plazo Fijo (LIABILITY, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '212.01.00.00', 'DEPÓSITOS A PLAZO FIJO', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '212.00.00.00'));

    -- 1ra-Subcuenta 212.02: Certificados de Depósito (LIABILITY, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '212.02.00.00', 'CERTIFICADOS DE DEPÓSITO', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '212.00.00.00'));

  -- Cuenta 219: Otras Obligaciones con el Público (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '219.00.00.00', 'OTRAS OBLIGACIONES CON EL PÚBLICO', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '210.00.00.00'));

-- Grupo 220: Cuentas por Pagar (LIABILITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '220.00.00.00', 'CUENTAS POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '200.00.00.00'));

  -- Cuenta 221: Cuentas por Pagar a Proveedores (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '221.00.00.00', 'CUENTAS POR PAGAR A PROVEEDORES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '220.00.00.00'));

  -- Cuenta 222: Cuentas por Pagar a Empleados (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '222.00.00.00', 'CUENTAS POR PAGAR A EMPLEADOS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '220.00.00.00'));

  -- Cuenta 223: Impuestos por Pagar (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '223.00.00.00', 'IMPUESTOS POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '220.00.00.00'));

  -- Cuenta 224: Retenciones por Pagar (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '224.00.00.00', 'RETENCIONES POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '220.00.00.00'));

  -- Cuenta 229: Otras Cuentas por Pagar (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '229.00.00.00', 'OTRAS CUENTAS POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '220.00.00.00'));

-- Grupo 230: Obligaciones Financieras (LIABILITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '230.00.00.00', 'OBLIGACIONES FINANCIERAS', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '200.00.00.00'));

  -- Cuenta 231: Préstamos Bancarios (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '231.00.00.00', 'PRÉSTAMOS BANCARIOS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '230.00.00.00'));

  -- Cuenta 232: Obligaciones con Instituciones Financieras (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '232.00.00.00', 'OBLIGACIONES CON INSTITUCIONES FINANCIERAS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '230.00.00.00'));

  -- Cuenta 239: Otras Obligaciones Financieras (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '239.00.00.00', 'OTRAS OBLIGACIONES FINANCIERAS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '230.00.00.00'));

-- Grupo 240: Provisiones (LIABILITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '240.00.00.00', 'PROVISIONES', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '200.00.00.00'));

  -- Cuenta 241: Provisión para Prestaciones Sociales (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '241.00.00.00', 'PROVISIÓN PARA PRESTACIONES SOCIALES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '240.00.00.00'));

  -- Cuenta 242: Provisión para Vacaciones (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '242.00.00.00', 'PROVISIÓN PARA VACACIONES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '240.00.00.00'));

  -- Cuenta 249: Otras Provisiones (LIABILITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '249.00.00.00', 'OTRAS PROVISIONES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '240.00.00.00'));

-- Rubro 300: PATRIMONIO (EQUITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '300.00.00.00', 'PATRIMONIO', NULL, 'EQUITY', 'CREDIT', 1, FALSE, TRUE, NULL);

-- Grupo 310: Capital Social (EQUITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '310.00.00.00', 'CAPITAL SOCIAL', NULL, 'EQUITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '300.00.00.00'));

  -- Cuenta 311: Capital Suscrito y Pagado (EQUITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '311.00.00.00', 'CAPITAL SUSCRITO Y PAGADO', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '310.00.00.00'));

  -- Cuenta 312: Capital No Suscrito (EQUITY, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '312.00.00.00', 'CAPITAL NO SUSCRITO', NULL, 'EQUITY', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '310.00.00.00'));

-- Grupo 320: Reservas (EQUITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '320.00.00.00', 'RESERVAS', NULL, 'EQUITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '300.00.00.00'));

  -- Cuenta 321: Reserva Legal (EQUITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '321.00.00.00', 'RESERVA LEGAL', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '320.00.00.00'));

  -- Cuenta 322: Reservas Estatutarias (EQUITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '322.00.00.00', 'RESERVAS ESTATUTARIAS', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '320.00.00.00'));

  -- Cuenta 329: Otras Reservas (EQUITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '329.00.00.00', 'OTRAS RESERVAS', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '320.00.00.00'));

-- Grupo 330: Resultados (EQUITY, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '330.00.00.00', 'RESULTADOS', NULL, 'EQUITY', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '300.00.00.00'));

  -- Cuenta 331: Resultados Acumulados (EQUITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '331.00.00.00', 'RESULTADOS ACUMULADOS', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '330.00.00.00'));

  -- Cuenta 332: Resultado del Ejercicio (EQUITY, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '332.00.00.00', 'RESULTADO DEL EJERCICIO', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '330.00.00.00'));

-- Rubro 400: INGRESOS (REVENUE, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '400.00.00.00', 'INGRESOS', NULL, 'REVENUE', 'CREDIT', 1, FALSE, TRUE, NULL);

-- Grupo 410: Ingresos por Operaciones (REVENUE, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '410.00.00.00', 'INGRESOS POR OPERACIONES', NULL, 'REVENUE', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '400.00.00.00'));

  -- Cuenta 411: Intereses Ganados (REVENUE, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '411.00.00.00', 'INTERESES GANADOS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '410.00.00.00'));

  -- Cuenta 412: Comisiones Ganadas (REVENUE, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '412.00.00.00', 'COMISIONES GANADAS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '410.00.00.00'));

  -- Cuenta 419: Otros Ingresos por Operaciones (REVENUE, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '419.00.00.00', 'OTROS INGRESOS POR OPERACIONES', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '410.00.00.00'));

-- Grupo 420: Otros Ingresos (REVENUE, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '420.00.00.00', 'OTROS INGRESOS', NULL, 'REVENUE', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '400.00.00.00'));

  -- Cuenta 421: Ingresos por Alquileres (REVENUE, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '421.00.00.00', 'INGRESOS POR ALQUILERES', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '420.00.00.00'));

  -- Cuenta 422: Ingresos por Venta de Activos (REVENUE, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '422.00.00.00', 'INGRESOS POR VENTA DE ACTIVOS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '420.00.00.00'));

  -- Cuenta 429: Otros Ingresos Diversos (REVENUE, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '429.00.00.00', 'OTROS INGRESOS DIVERSOS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '420.00.00.00'));

-- Rubro 500: EGRESOS (EXPENSE, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '500.00.00.00', 'EGRESOS', NULL, 'EXPENSE', 'DEBIT', 1, FALSE, TRUE, NULL);

-- Grupo 510: Gastos de Operación (EXPENSE, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '510.00.00.00', 'GASTOS DE OPERACIÓN', NULL, 'EXPENSE', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '500.00.00.00'));

  -- Cuenta 511: Gastos de Personal (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '511.00.00.00', 'GASTOS DE PERSONAL', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '510.00.00.00'));

  -- Cuenta 512: Gastos Administrativos (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '512.00.00.00', 'GASTOS ADMINISTRATIVOS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '510.00.00.00'));

  -- Cuenta 513: Gastos de Ventas (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '513.00.00.00', 'GASTOS DE VENTAS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '510.00.00.00'));

  -- Cuenta 514: Gastos Financieros (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '514.00.00.00', 'GASTOS FINANCIEROS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '510.00.00.00'));

  -- Cuenta 519: Otros Gastos de Operación (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '519.00.00.00', 'OTROS GASTOS DE OPERACIÓN', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '510.00.00.00'));

-- Grupo 520: Otros Egresos (EXPENSE, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '520.00.00.00', 'OTROS EGRESOS', NULL, 'EXPENSE', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '500.00.00.00'));

  -- Cuenta 521: Gastos por Depreciación (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '521.00.00.00', 'GASTOS POR DEPRECIACIÓN', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '520.00.00.00'));

  -- Cuenta 522: Gastos por Amortización (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '522.00.00.00', 'GASTOS POR AMORTIZACIÓN', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '520.00.00.00'));

  -- Cuenta 529: Otros Egresos Diversos (EXPENSE, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '529.00.00.00', 'OTROS EGRESOS DIVERSOS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '520.00.00.00'));

-- Rubro 600: CUENTAS DE ORDEN (MEMORANDUM, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '600.00.00.00', 'CUENTAS DE ORDEN', NULL, 'MEMORANDUM', 'DEBIT', 1, FALSE, TRUE, NULL);

-- Grupo 610: Deudoras (MEMORANDUM, DEBIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '610.00.00.00', 'DEUDORAS', NULL, 'MEMORANDUM', 'DEBIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '600.00.00.00'));

  -- Cuenta 611: Valores en Custodia (MEMORANDUM, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '611.00.00.00', 'VALORES EN CUSTODIA', NULL, 'MEMORANDUM', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '610.00.00.00'));

  -- Cuenta 612: Bienes Recibidos en Garantía (MEMORANDUM, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '612.00.00.00', 'BIENES RECIBIDOS EN GARANTÍA', NULL, 'MEMORANDUM', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '610.00.00.00'));

  -- Cuenta 619: Otras Cuentas de Orden Deudoras (MEMORANDUM, DEBIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '619.00.00.00', 'OTRAS CUENTAS DE ORDEN DEUDORAS', NULL, 'MEMORANDUM', 'DEBIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '610.00.00.00'));

-- Grupo 620: Acreedoras (MEMORANDUM, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '620.00.00.00', 'ACREEDORAS', NULL, 'MEMORANDUM', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '600.00.00.00'));

  -- Cuenta 621: Responsabilidad por Valores en Custodia (MEMORANDUM, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '621.00.00.00', 'RESPONSABILIDAD POR VALORES EN CUSTODIA', NULL, 'MEMORANDUM', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '620.00.00.00'));

  -- Cuenta 622: Responsabilidad por Bienes Recibidos en Garantía (MEMORANDUM, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '622.00.00.00', 'RESPONSABILIDAD POR BIENES RECIBIDOS EN GARANTÍA', NULL, 'MEMORANDUM', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '620.00.00.00'));

  -- Cuenta 629: Otras Cuentas de Orden Acreedoras (MEMORANDUM, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '629.00.00.00', 'OTRAS CUENTAS DE ORDEN ACREEDORAS', NULL, 'MEMORANDUM', 'CREDIT', 3, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '620.00.00.00'));

-- Rubro 700: OTRAS CUENTAS DE ORDEN (MEMORANDUM, DEBIT) -- Nuevo rubro para las cuentas adicionales
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '700.00.00.00', 'OTRAS CUENTAS DE ORDEN', 'Rubro adicional para cuentas de orden no clasificadas en los grupos 610 y 620.', 'MEMORANDUM', 'DEBIT', 1, FALSE, TRUE, NULL);

-- Grupo 710: CUENTAS DE ORDEN ACREEDORAS (MEMORANDUM, CREDIT)
INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
(1, '710.00.00.00', 'CUENTAS DE ORDEN ACREEDORAS', 'Representa la responsabilidad de la asociación frente a asociados por los bienes que le han sido entregados en encargos de confianza o en garantía de otras operaciones; así como, las contra cuentas de operaciones de registro que son utilizadas para un adecuado control de las mismas por parte de la asociación.', 'MEMORANDUM', 'CREDIT', 2, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '700.00.00.00'));

  -- Cuenta 711: GARANTÍAS RECIBIDAS (MEMORANDUM, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '711.00.00.00', 'GARANTÍAS RECIBIDAS', NULL, 'MEMORANDUM', 'CREDIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '710.00.00.00'));

    -- 1ra-Subcuenta 711.01: Fianzas (MEMORANDUM, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '711.01.00.00', 'FIANZAS', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '711.00.00.00'));

  -- Cuenta 712: GARANTÍAS OTORGADAS (MEMORANDUM, DEBIT)
  -- Nota: Aunque el grupo 710 es Acreedoras (CREDIT), esta cuenta por su naturaleza es Deudora (DEBIT).
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '712.00.00.00', 'GARANTÍAS OTORGADAS', NULL, 'MEMORANDUM', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '710.00.00.00'));

    -- 1ra-Subcuenta 712.01: Fianzas (MEMORANDUM, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '712.01.00.00', 'FIANZAS', NULL, 'MEMORANDUM', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '712.00.00.00'));

  -- Cuenta 713: FONDOS ADMINISTRADOS (MEMORANDUM, CREDIT)
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '713.00.00.00', 'FONDOS ADMINISTRADOS', NULL, 'MEMORANDUM', 'CREDIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '710.00.00.00'));

    -- 1ra-Subcuenta 713.01: Montepío (MEMORANDUM, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '713.01.00.00', 'MONTEPÍO', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '713.00.00.00'));

    -- 1ra-Subcuenta 713.02: Mutuo Auxilio (MEMORANDUM, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '713.02.00.00', 'MUTUO AUXILIO', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '713.00.00.00'));

    -- 1ra-Subcuenta 713.03: Prestaciones Sociales Fideicomiso (MEMORANDUM, CREDIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '713.03.00.00', 'PRESTACIONES SOCIALES FIDEICOMISO', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '713.00.00.00'));

  -- Cuenta 714: CUENTAS DE REGISTRO (MEMORANDUM, DEBIT)
  -- Nota: La naturaleza de esta cuenta puede variar según su uso específico. Se asume DEBIT para propósitos de registro general.
  INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
  (1, '714.00.00.00', 'CUENTAS DE REGISTRO', NULL, 'MEMORANDUM', 'DEBIT', 3, FALSE, TRUE, (SELECT id FROM account_plan WHERE code = '710.00.00.00'));

    -- 1ra-Subcuenta 714.01: Excedentes y Haberes no Reclamados (MEMORANDUM, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '714.01.00.00', 'EXCEDENTES Y HABERES NO RECLAMADOS', NULL, 'MEMORANDUM', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '714.00.00.00'));

    -- 1ra-Subcuenta 714.99: Otras cuentas de Registros (MEMORANDUM, DEBIT)
    INSERT INTO account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '714.99.00.00', 'OTRAS CUENTAS DE REGISTROS', NULL, 'MEMORANDUM', 'DEBIT', 4, TRUE, TRUE, (SELECT id FROM account_plan WHERE code = '714.00.00.00'));
