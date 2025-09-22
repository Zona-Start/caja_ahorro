DO $$
DECLARE
    -- Variables para Activos
    activo_id integer;
    disponibilidad_id integer;
    efectivo_id integer;
    bancos_id integer;
    sector_publico_id integer;
    moneda_nacional_sp_id integer;
    moneda_extranjera_sp_id integer;
    sector_privado_id integer;
    moneda_nacional_spr_id integer;
    moneda_extranjera_spr_id integer;
    disponibilidad_restringida_id integer;
    sector_publico_dr_id integer;
    sector_privado_dr_id integer;
    inversiones_id integer;
    inv_corto_plazo_id integer;
    titulos_negociados_id integer;
    inv_largo_plazo_id integer;
    titulos_no_negociados_id integer;
    cartera_creditos_id integer;
    creditos_otorgados_id integer;
    creditos_en_mora_id integer;
    otros_activos_id integer;
    cuentas_por_cobrar_id integer;
    inventarios_id integer;
    gastos_anticipados_id integer;
    propiedad_planta_equipo_id integer;
    depreciacion_acumulada_id integer;

    -- Variables para Pasivos
    pasivo_id integer;
    obligaciones_publico_id integer;
    depositos_ahorro_id integer;
    depositos_plazo_id integer;
    cuentas_por_pagar_id integer;
    obligaciones_financieras_id integer;
    provisiones_id integer;

    -- Variables para Patrimonio
    patrimonio_id integer;
    capital_social_id integer;
    reservas_id integer;
    resultados_id integer;

    -- Variables para Ingresos
    ingresos_id integer;
    ingresos_operaciones_id integer;
    otros_ingresos_id integer;

    -- Variables para Egresos
    egresos_id integer;
    gastos_operacion_id integer;
    otros_egresos_id integer;

    -- Variables para Cuentas de Orden
    cuentas_orden_id integer;
    deudoras_id integer;
    acreedoras_id integer;
    otras_cuentas_orden_id integer;
    cuentas_orden_acreedoras_id integer;
    garantias_recibidas_id integer;
    garantias_otorgadas_id integer;
    fondos_administrados_id integer;
    cuentas_registro_id integer;

BEGIN
    -- Rubro 100: ACTIVO (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '100.00.00.00', 'ACTIVO', NULL, 'ASSET', 'DEBIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO activo_id;

    -- Grupo 110: Disponibilidad (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '110.00.00.00', 'DISPONIBILIDAD', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, activo_id)
    RETURNING id INTO disponibilidad_id;

    -- Cuentas de Disponibilidad (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '111.00.00.00', 'EFECTIVO', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, disponibilidad_id)
    RETURNING id INTO efectivo_id;

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.00.00.00', 'BANCOS', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, disponibilidad_id)
    RETURNING id INTO bancos_id;

    -- Subcuentas de BANCOS (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.01.00.00', 'SECTOR PÚBLICO', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, bancos_id)
    RETURNING id INTO sector_publico_id;

    -- 1ra-Subcuentas de SECTOR PÚBLICO (Nivel 5)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.01.01.00', 'MONEDA NACIONAL', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, sector_publico_id),
    (1, '112.01.02.00', 'MONEDA EXTRANJERA', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, sector_publico_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.02.00.00', 'SECTOR PRIVADO', NULL, 'ASSET', 'DEBIT', 4, FALSE, TRUE, bancos_id)
    RETURNING id INTO sector_privado_id;

    -- 1ra-Subcuentas de SECTOR PRIVADO (Nivel 5)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '112.02.01.00', 'MONEDA NACIONAL', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, sector_privado_id),
    (1, '112.02.02.00', 'MONEDA EXTRANJERA', NULL, 'ASSET', 'DEBIT', 5, TRUE, TRUE, sector_privado_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '113.00.00.00', 'DISPONIBILIDAD RESTRINGIDA', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, disponibilidad_id)
    RETURNING id INTO disponibilidad_restringida_id;

    -- Subcuentas de DISPONIBILIDAD RESTRINGIDA (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '113.01.00.00', 'SECTOR PÚBLICO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, disponibilidad_restringida_id),
    (1, '113.02.00.00', 'SECTOR PRIVADO', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, disponibilidad_restringida_id);

    -- Grupo 120: Inversiones (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '120.00.00.00', 'INVERSIONES', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, activo_id)
    RETURNING id INTO inversiones_id;

    -- Cuentas de Inversiones (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '121.00.00.00', 'INVERSIONES A CORTO PLAZO', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, inversiones_id)
    RETURNING id INTO inv_corto_plazo_id;

    -- Subcuentas de INVERSIONES A CORTO PLAZO (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '121.01.00.00', 'TÍTULOS VALORES NEGOCIADOS', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, inv_corto_plazo_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '122.00.00.00', 'INVERSIONES A LARGO PLAZO', NULL, 'ASSET', 'DEBIT', 3, FALSE, TRUE, inversiones_id)
    RETURNING id INTO inv_largo_plazo_id;

    -- Subcuentas de INVERSIONES A LARGO PLAZO (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '122.01.00.00', 'TÍTULOS VALORES NO NEGOCIADOS', NULL, 'ASSET', 'DEBIT', 4, TRUE, TRUE, inv_largo_plazo_id);

    -- Grupo 130: Cartera de Créditos (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '130.00.00.00', 'CARTERA DE CRÉDITOS', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, activo_id)
    RETURNING id INTO cartera_creditos_id;

    -- Cuentas de Cartera de Créditos (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '131.00.00.00', 'CRÉDITOS OTORGADOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, cartera_creditos_id),
    (1, '132.00.00.00', 'CRÉDITOS EN MORA', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, cartera_creditos_id),
    (1, '139.00.00.00', 'PROVISIÓN PARA CRÉDITOS INCOBRABLES', NULL, 'ASSET', 'CREDIT', 3, TRUE, TRUE, cartera_creditos_id);

    -- Grupo 140: Otros Activos (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '140.00.00.00', 'OTROS ACTIVOS', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, activo_id)
    RETURNING id INTO otros_activos_id;

    -- Cuentas de Otros Activos (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '141.00.00.00', 'CUENTAS POR COBRAR', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, otros_activos_id),
    (1, '142.00.00.00', 'INVENTARIOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, otros_activos_id),
    (1, '143.00.00.00', 'GASTOS PAGADOS POR ANTICIPADO', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, otros_activos_id),
    (1, '149.00.00.00', 'OTROS ACTIVOS DIVERSOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, otros_activos_id);

    -- Grupo 150: Propiedad, Planta y Equipo (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '150.00.00.00', 'PROPIEDAD, PLANTA Y EQUIPO', NULL, 'ASSET', 'DEBIT', 2, FALSE, TRUE, activo_id)
    RETURNING id INTO propiedad_planta_equipo_id;

    -- Cuentas de 'PROPIEDAD, PLANTA Y EQUIPO' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '151.00.00.00', 'TERRENOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, propiedad_planta_equipo_id),
    (1, '152.00.00.00', 'EDIFICIOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, propiedad_planta_equipo_id),
    (1, '153.00.00.00', 'MOBILIARIO Y EQUIPOS DE OFICINA', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, propiedad_planta_equipo_id),
    (1, '154.00.00.00', 'EQUIPOS DE COMPUTACIÓN', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, propiedad_planta_equipo_id),
    (1, '155.00.00.00', 'VEHÍCULOS', NULL, 'ASSET', 'DEBIT', 3, TRUE, TRUE, propiedad_planta_equipo_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '159.00.00.00', 'DEPRECIACIÓN ACUMULADA', NULL, 'ASSET', 'CREDIT', 3, FALSE, TRUE, propiedad_planta_equipo_id)
    RETURNING id INTO depreciacion_acumulada_id;

    -- Subcuentas de 'DEPRECIACIÓN ACUMULADA' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '159.01.00.00', 'DEPRECIACIÓN ACUMULADA DE EDIFICIOS', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, depreciacion_acumulada_id),
    (1, '159.02.00.00', 'DEPRECIACIÓN ACUMULADA DE MOBILIARIO Y EQUIPOS DE OFICINA', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, depreciacion_acumulada_id),
    (1, '159.03.00.00', 'DEPRECIACIÓN ACUMULADA DE EQUIPOS DE COMPUTACIÓN', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, depreciacion_acumulada_id),
    (1, '159.04.00.00', 'DEPRECIACIÓN ACUMULADA DE VEHÍCULOS', NULL, 'ASSET', 'CREDIT', 4, TRUE, TRUE, depreciacion_acumulada_id);

    -- Rubro 200: PASIVO (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '200.00.00.00', 'PASIVO', NULL, 'LIABILITY', 'CREDIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO pasivo_id;

    -- Grupo 210: Obligaciones con el Público (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '210.00.00.00', 'OBLIGACIONES CON EL PÚBLICO', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, pasivo_id)
    RETURNING id INTO obligaciones_publico_id;

    -- Cuentas de 'OBLIGACIONES CON EL PÚBLICO' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '211.00.00.00', 'DEPÓSITOS DE AHORRO', NULL, 'LIABILITY', 'CREDIT', 3, FALSE, TRUE, obligaciones_publico_id)
    RETURNING id INTO depositos_ahorro_id;

    -- Subcuentas de 'DEPÓSITOS DE AHORRO' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '211.01.00.00', 'AHORROS DE ASOCIADOS', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, depositos_ahorro_id),
    (1, '211.02.00.00', 'AHORROS DE NO ASOCIADOS', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, depositos_ahorro_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '212.00.00.00', 'DEPÓSITOS A PLAZO', NULL, 'LIABILITY', 'CREDIT', 3, FALSE, TRUE, obligaciones_publico_id)
    RETURNING id INTO depositos_plazo_id;

    -- Subcuentas de 'DEPÓSITOS A PLAZO' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '212.01.00.00', 'DEPÓSITOS A PLAZO FIJO', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, depositos_plazo_id),
    (1, '212.02.00.00', 'CERTIFICADOS DE DEPÓSITO', NULL, 'LIABILITY', 'CREDIT', 4, TRUE, TRUE, depositos_plazo_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '219.00.00.00', 'OTRAS OBLIGACIONES CON EL PÚBLICO', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, obligaciones_publico_id);

    -- Grupo 220: Cuentas por Pagar (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '220.00.00.00', 'CUENTAS POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, pasivo_id)
    RETURNING id INTO cuentas_por_pagar_id;

    -- Cuentas de 'CUENTAS POR PAGAR' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '221.00.00.00', 'CUENTAS POR PAGAR A PROVEEDORES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, cuentas_por_pagar_id),
    (1, '222.00.00.00', 'CUENTAS POR PAGAR A EMPLEADOS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, cuentas_por_pagar_id),
    (1, '223.00.00.00', 'IMPUESTOS POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, cuentas_por_pagar_id),
    (1, '224.00.00.00', 'RETENCIONES POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, cuentas_por_pagar_id),
    (1, '229.00.00.00', 'OTRAS CUENTAS POR PAGAR', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, cuentas_por_pagar_id);

    -- Grupo 230: Obligaciones Financieras (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '230.00.00.00', 'OBLIGACIONES FINANCIERAS', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, pasivo_id)
    RETURNING id INTO obligaciones_financieras_id;

    -- Cuentas de 'OBLIGACIONES FINANCIERAS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '231.00.00.00', 'PRÉSTAMOS BANCARIOS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, obligaciones_financieras_id),
    (1, '232.00.00.00', 'OBLIGACIONES CON INSTITUCIONES FINANCIERAS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, obligaciones_financieras_id),
    (1, '239.00.00.00', 'OTRAS OBLIGACIONES FINANCIERAS', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, obligaciones_financieras_id);

    -- Grupo 240: Provisiones (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '240.00.00.00', 'PROVISIONES', NULL, 'LIABILITY', 'CREDIT', 2, FALSE, TRUE, pasivo_id)
    RETURNING id INTO provisiones_id;

    -- Cuentas de 'PROVISIONES' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '241.00.00.00', 'PROVISIÓN PARA PRESTACIONES SOCIALES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, provisiones_id),
    (1, '242.00.00.00', 'PROVISIÓN PARA VACACIONES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, provisiones_id),
    (1, '249.00.00.00', 'OTRAS PROVISIONES', NULL, 'LIABILITY', 'CREDIT', 3, TRUE, TRUE, provisiones_id);

    -- Rubro 300: PATRIMONIO (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '300.00.00.00', 'PATRIMONIO', NULL, 'EQUITY', 'CREDIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO patrimonio_id;

    -- Grupo 310: Capital Social (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '310.00.00.00', 'CAPITAL SOCIAL', NULL, 'EQUITY', 'CREDIT', 2, FALSE, TRUE, patrimonio_id)
    RETURNING id INTO capital_social_id;

    -- Cuentas de 'CAPITAL SOCIAL' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '311.00.00.00', 'CAPITAL SUSCRITO Y PAGADO', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, capital_social_id),
    (1, '312.00.00.00', 'CAPITAL NO SUSCRITO', NULL, 'EQUITY', 'DEBIT', 3, TRUE, TRUE, capital_social_id);

    -- Grupo 320: Reservas (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '320.00.00.00', 'RESERVAS', NULL, 'EQUITY', 'CREDIT', 2, FALSE, TRUE, patrimonio_id)
    RETURNING id INTO reservas_id;

    -- Cuentas de 'RESERVAS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '321.00.00.00', 'RESERVA LEGAL', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, reservas_id),
    (1, '322.00.00.00', 'RESERVAS ESTATUTARIAS', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, reservas_id),
    (1, '329.00.00.00', 'OTRAS RESERVAS', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, reservas_id);

    -- Grupo 330: Resultados (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '330.00.00.00', 'RESULTADOS', NULL, 'EQUITY', 'CREDIT', 2, FALSE, TRUE, patrimonio_id)
    RETURNING id INTO resultados_id;

    -- Cuentas de 'RESULTADOS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '331.00.00.00', 'RESULTADOS ACUMULADOS', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, resultados_id),
    (1, '332.00.00.00', 'RESULTADO DEL EJERCICIO', NULL, 'EQUITY', 'CREDIT', 3, TRUE, TRUE, resultados_id);

    -- Rubro 400: INGRESOS (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '400.00.00.00', 'INGRESOS', NULL, 'REVENUE', 'CREDIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO ingresos_id;

    -- Grupo 410: Ingresos por Operaciones (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '410.00.00.00', 'INGRESOS POR OPERACIONES', NULL, 'REVENUE', 'CREDIT', 2, FALSE, TRUE, ingresos_id)
    RETURNING id INTO ingresos_operaciones_id;

    -- Cuentas de 'INGRESOS POR OPERACIONES' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '411.00.00.00', 'INTERESES GANADOS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, ingresos_operaciones_id),
    (1, '412.00.00.00', 'COMISIONES GANADAS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, ingresos_operaciones_id),
    (1, '419.00.00.00', 'OTROS INGRESOS POR OPERACIONES', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, ingresos_operaciones_id);

    -- Grupo 420: Otros Ingresos (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '420.00.00.00', 'OTROS INGRESOS', NULL, 'REVENUE', 'CREDIT', 2, FALSE, TRUE, ingresos_id)
    RETURNING id INTO otros_ingresos_id;

    -- Cuentas de 'OTROS INGRESOS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '421.00.00.00', 'INGRESOS POR ALQUILERES', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, otros_ingresos_id),
    (1, '422.00.00.00', 'INGRESOS POR VENTA DE ACTIVOS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, otros_ingresos_id),
    (1, '429.00.00.00', 'OTROS INGRESOS DIVERSOS', NULL, 'REVENUE', 'CREDIT', 3, TRUE, TRUE, otros_ingresos_id);

    -- Rubro 500: EGRESOS (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '500.00.00.00', 'EGRESOS', NULL, 'EXPENSE', 'DEBIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO egresos_id;

    -- Grupo 510: Gastos de Operación (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '510.00.00.00', 'GASTOS DE OPERACIÓN', NULL, 'EXPENSE', 'DEBIT', 2, FALSE, TRUE, egresos_id)
    RETURNING id INTO gastos_operacion_id;

    -- Cuentas de 'GASTOS DE OPERACIÓN' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '511.00.00.00', 'GASTOS DE PERSONAL', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, gastos_operacion_id),
    (1, '512.00.00.00', 'GASTOS ADMINISTRATIVOS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, gastos_operacion_id),
    (1, '513.00.00.00', 'GASTOS DE VENTAS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, gastos_operacion_id),
    (1, '514.00.00.00', 'GASTOS FINANCIEROS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, gastos_operacion_id),
    (1, '519.00.00.00', 'OTROS GASTOS DE OPERACIÓN', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, gastos_operacion_id);

    -- Grupo 520: Otros Egresos (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '520.00.00.00', 'OTROS EGRESOS', NULL, 'EXPENSE', 'DEBIT', 2, FALSE, TRUE, egresos_id)
    RETURNING id INTO otros_egresos_id;

    -- Cuentas de 'OTROS EGRESOS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '521.00.00.00', 'GASTOS POR DEPRECIACIÓN', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, otros_egresos_id),
    (1, '522.00.00.00', 'GASTOS POR AMORTIZACIÓN', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, otros_egresos_id),
    (1, '529.00.00.00', 'OTROS EGRESOS DIVERSOS', NULL, 'EXPENSE', 'DEBIT', 3, TRUE, TRUE, otros_egresos_id);

    -- Rubro 600: CUENTAS DE ORDEN (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '600.00.00.00', 'CUENTAS DE ORDEN', NULL, 'MEMORANDUM', 'DEBIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO cuentas_orden_id;

    -- Grupo 610: Deudoras (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '610.00.00.00', 'DEUDORAS', NULL, 'MEMORANDUM', 'DEBIT', 2, FALSE, TRUE, cuentas_orden_id)
    RETURNING id INTO deudoras_id;

    -- Cuentas de 'DEUDORAS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '611.00.00.00', 'VALORES EN CUSTODIA', NULL, 'MEMORANDUM', 'DEBIT', 3, TRUE, TRUE, deudoras_id),
    (1, '612.00.00.00', 'BIENES RECIBIDOS EN GARANTÍA', NULL, 'MEMORANDUM', 'DEBIT', 3, TRUE, TRUE, deudoras_id),
    (1, '619.00.00.00', 'OTRAS CUENTAS DE ORDEN DEUDORAS', NULL, 'MEMORANDUM', 'DEBIT', 3, TRUE, TRUE, deudoras_id);

    -- Grupo 620: Acreedoras (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '620.00.00.00', 'ACREEDORAS', NULL, 'MEMORANDUM', 'CREDIT', 2, FALSE, TRUE, cuentas_orden_id)
    RETURNING id INTO acreedoras_id;

    -- Cuentas de 'ACREEDORAS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '621.00.00.00', 'RESPONSABILIDAD POR VALORES EN CUSTODIA', NULL, 'MEMORANDUM', 'CREDIT', 3, TRUE, TRUE, acreedoras_id),
    (1, '622.00.00.00', 'RESPONSABILIDAD POR BIENES RECIBIDOS EN GARANTÍA', NULL, 'MEMORANDUM', 'CREDIT', 3, TRUE, TRUE, acreedoras_id),
    (1, '629.00.00.00', 'OTRAS CUENTAS DE ORDEN ACREEDORAS', NULL, 'MEMORANDUM', 'CREDIT', 3, TRUE, TRUE, acreedoras_id);

    -- Rubro 700: OTRAS CUENTAS DE ORDEN (Nivel 1)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '700.00.00.00', 'OTRAS CUENTAS DE ORDEN', 'Rubro adicional para cuentas de orden no clasificadas en los grupos 610 y 620.', 'MEMORANDUM', 'DEBIT', 1, FALSE, TRUE, NULL)
    RETURNING id INTO otras_cuentas_orden_id;

    -- Grupo 710: CUENTAS DE ORDEN ACREEDORAS (Nivel 2)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '710.00.00.00', 'CUENTAS DE ORDEN ACREEDORAS', 'Representa la responsabilidad de la asociación frente a asociados por los bienes que le han sido entregados en encargos de confianza o en garantía de otras operaciones; así como, las contra cuentas de operaciones de registro que son utilizadas para un adecuado control de las mismas por parte de la asociación.', 'MEMORANDUM', 'CREDIT', 2, FALSE, TRUE, otras_cuentas_orden_id)
    RETURNING id INTO cuentas_orden_acreedoras_id;

    -- Cuentas de 'CUENTAS DE ORDEN ACREEDORAS' (Nivel 3)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '711.00.00.00', 'GARANTÍAS RECIBIDAS', NULL, 'MEMORANDUM', 'CREDIT', 3, FALSE, TRUE, cuentas_orden_acreedoras_id)
    RETURNING id INTO garantias_recibidas_id;

    -- Subcuentas de 'GARANTÍAS RECIBIDAS' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '711.01.00.00', 'FIANZAS', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, garantias_recibidas_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '712.00.00.00', 'GARANTÍAS OTORGADAS', NULL, 'MEMORANDUM', 'DEBIT', 3, FALSE, TRUE, cuentas_orden_acreedoras_id)
    RETURNING id INTO garantias_otorgadas_id;

    -- Subcuentas de 'GARANTÍAS OTORGADAS' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '712.01.00.00', 'FIANZAS', NULL, 'MEMORANDUM', 'DEBIT', 4, TRUE, TRUE, garantias_otorgadas_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '713.00.00.00', 'FONDOS ADMINISTRADOS', NULL, 'MEMORANDUM', 'CREDIT', 3, FALSE, TRUE, cuentas_orden_acreedoras_id)
    RETURNING id INTO fondos_administrados_id;

    -- Subcuentas de 'FONDOS ADMINISTRADOS' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '713.01.00.00', 'MONTEPÍO', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, fondos_administrados_id),
    (1, '713.02.00.00', 'MUTUO AUXILIO', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, fondos_administrados_id),
    (1, '713.03.00.00', 'PRESTACIONES SOCIALES FIDEICOMISO', NULL, 'MEMORANDUM', 'CREDIT', 4, TRUE, TRUE, fondos_administrados_id);

    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '714.00.00.00', 'CUENTAS DE REGISTRO', NULL, 'MEMORANDUM', 'DEBIT', 3, FALSE, TRUE, cuentas_orden_acreedoras_id)
    RETURNING id INTO cuentas_registro_id;

    -- Subcuentas de 'CUENTAS DE REGISTRO' (Nivel 4)
    INSERT INTO accounting.account_plan (company_id, code, name, description, account_type, nature, level, allows_movements, is_active, parent_account_id) VALUES
    (1, '714.01.00.00', 'EXCEDENTES Y HABERES NO RECLAMADOS', NULL, 'MEMORANDUM', 'DEBIT', 4, TRUE, TRUE, cuentas_registro_id),
    (1, '714.99.00.00', 'OTRAS CUENTAS DE REGISTROS', NULL, 'MEMORANDUM', 'DEBIT', 4, TRUE, TRUE, cuentas_registro_id);

END $$;