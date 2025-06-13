---
---
-- Calcula la liquidación de haberes para un asociado específico, combinando saldos
-- de ahorro y deudas de préstamos (y créditos) en tiempo real, utilizando las vistas especificadas.

CREATE OR REPLACE FUNCTION savings_banks.calculate_associate_liquidation(p_identification_number  VARCHAR)
RETURNS TABLE (
    associate_id INT,
    fullname VARCHAR,
    admission_date DATE,
    currency_code currency_code_enum, -- Es importante calificar el tipo ENUM también
    total_savings_balance NUMERIC,
    total_outstanding_loans NUMERIC,
    total_outstanding_credits NUMERIC,
    net_liquidation_amount NUMERIC
) AS $$
DECLARE
    v_associate_id INT;
    v_total_savings NUMERIC := 0;
    v_total_loans NUMERIC := 0;
    v_total_credits NUMERIC := 0;
    v_net_liquidation NUMERIC := 0;
    v_associate_fullname VARCHAR;
    v_associate_admission_date DATE;
    v_liquidation_currency currency_code_enum := 'VES'; -- Calificar el tipo ENUM aquí también
BEGIN
    -- 1. Obtener información básica del asociado
    SELECT a.id, a.fullname, a.admission_date INTO v_associate_id, v_associate_fullname, v_associate_admission_date
    FROM savings_banks.associates a -- Tabla 'associates' calificada
    WHERE a.cedula = p_identification_number;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Asociado con ID % no encontrado.', p_associate_id;
    END IF;

    -- 2. Calcular el total de ahorros/aportes (Haberes)
    -- Desde la vista 'associate_account_balances', calificada con el esquema
    SELECT COALESCE(SUM(calculated_balance), 0)
    INTO v_total_savings
    FROM savings_banks.associate_account_balances s-- Vista calificada
    WHERE s.associated_id = v_associate_id
      AND s.currency_code = v_liquidation_currency;

    -- 3. Calcular el total de préstamos pendientes (Deducción)
    -- Desde la vista 'loan_outstanding_balance', calificada con el esquema
    SELECT COALESCE(SUM(outstanding_principal_balance), 0)
    INTO v_total_loans
    FROM savings_banks.loan_outstanding_balance l -- Vista calificada
    WHERE l.associate_id = v_associate_id
      AND l.currency_code = v_liquidation_currency;

    -- 4. Calcular el total de créditos pendientes (Deducción) - Descomentar si aplica
    -- Desde la vista 'credit_outstanding_balance', calificada con el esquema
    SELECT COALESCE(SUM(outstanding_principal_balance), 0)
    INTO v_total_credits
    FROM savings_banks.credit_outstanding_balance c -- Vista calificada
    WHERE c.associate_id = v_associate_id
      AND c.currency_code = v_liquidation_currency;

    -- 5. Calcular el monto neto de liquidación
    v_net_liquidation := v_total_savings - v_total_loans - v_total_credits;

    -- 6. Retornar los resultados
    RETURN QUERY
    SELECT
        v_associate_id  AS associate_id,
        v_associate_fullname AS fullname,
        v_associate_admission_date AS admission_date,
        v_liquidation_currency AS currency_code,
        v_total_savings AS total_savings_balance,
        v_total_loans AS total_outstanding_loans,
        v_total_credits AS total_outstanding_credits,
        v_net_liquidation AS net_liquidation_amount;
END;
$$ LANGUAGE plpgsql;