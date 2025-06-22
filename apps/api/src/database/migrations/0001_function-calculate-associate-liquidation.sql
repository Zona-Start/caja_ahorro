-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION savings_banks.calculate_associate_liquidation(p_identification_number character varying)
 RETURNS TABLE(associate_id integer, fullname character varying, cedula character varying, admission_date date, phone character varying, email character varying, is_payroll_credit boolean, associate_account_id integer, account_number character varying, currency_code currency_code_enum, total_savings_balance numeric, haberes_contribution numeric, haberes_voluntary numeric, haberes_employer numeric, surpluses numeric, total_withdrawals numeric, total_withdrawal_fees numeric, total_outstanding_loans numeric, total_outstanding_credits numeric, net_liquidation_amount numeric)
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_associate_id INT;
    v_associate_fullname VARCHAR;
    v_associate_cedula VARCHAR;
    v_associate_admission_date DATE;
    v_associate_phone VARCHAR;
    v_associate_email VARCHAR;
    v_associate_is_payroll_credit BOOLEAN;
    v_main_account_id INT;
    v_main_account_number VARCHAR;
    v_liquidation_currency currency_code_enum := 'VES';
    v_total_savings NUMERIC := 0;
    v_haberes_contribution NUMERIC := 0;
    v_haberes_voluntary NUMERIC := 0;
    v_haberes_employer NUMERIC := 0;
    v_surpluses NUMERIC := 0;
    v_total_withdrawals NUMERIC := 0;       -- Nueva variable
    v_total_withdrawal_fees NUMERIC := 0;   -- Nueva variable
    v_total_loans NUMERIC := 0;
    v_total_credits NUMERIC := 0;
    v_net_liquidation NUMERIC := 0;
BEGIN
    -- 1. Obtener información básica del asociado y su cuenta principal (en VES)
    SELECT
        a.id,
        a.fullname,
        a.cedula,
        a.admission_date,
        a.phone,
        a.email,
        a.is_payroll_credit,
        aa.id,
        aa.account_number
    INTO
        v_associate_id,
        v_associate_fullname,
        v_associate_cedula,
        v_associate_admission_date,
        v_associate_phone,
        v_associate_email,
        v_associate_is_payroll_credit,
        v_main_account_id,
        v_main_account_number
    FROM
        savings_banks.associates a
    JOIN
        savings_banks.associate_accounts aa ON a.id = aa.associated_id
    WHERE
        a.cedula = p_identification_number
        AND aa.currency_code = v_liquidation_currency
        AND a.status = 'ACTIVE'
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN; -- Esto terminará la función y devolverá un conjunto de resultados vacío.
    END IF;

    -- 2. Calcular el total de ahorros/aportes (Haberes Patrimoniales) y su desglose
    SELECT
        COALESCE(SUM(sahb.haberes_balance), 0),
        COALESCE(SUM(sahb.haberes_contribution), 0),
        COALESCE(SUM(sahb.haberes_voluntary), 0),
        COALESCE(SUM(sahb.haberes_employer), 0),
        COALESCE(SUM(sahb.surpluses), 0),
        COALESCE(SUM(sahb.total_withdrawals), 0),       -- Se obtiene la nueva columna
        COALESCE(SUM(sahb.total_withdrawal_fees), 0)    -- Se obtiene la nueva columna
    INTO
        v_total_savings,
        v_haberes_contribution,
        v_haberes_voluntary,
        v_haberes_employer,
        v_surpluses,
        v_total_withdrawals,       -- Se asigna a la nueva variable
        v_total_withdrawal_fees    -- Se asigna a la nueva variable
    FROM savings_banks.associate_haberes_balance sahb
    WHERE sahb.associate_account_id = v_main_account_id;

    -- 3. Calcular el total de préstamos pendientes (Deducción)
    SELECT COALESCE(SUM(outstanding_total_balance), 0)
    INTO v_total_loans
    FROM savings_banks.loan_outstanding_balance l
    WHERE l.associate_id = v_associate_id
      AND l.currency_code = v_liquidation_currency;

    -- 4. Calcular el total de créditos pendientes (Deducción)
    SELECT COALESCE(SUM(outstanding_total_balance), 0)
    INTO v_total_credits
    FROM savings_banks.credit_outstanding_balance c
    WHERE c.associate_id = v_associate_id
      AND c.currency_code = v_liquidation_currency;

    -- 5. Calcular el monto neto de liquidación
    v_net_liquidation := v_total_savings - v_total_loans - v_total_credits;

    -- 6. Retornar los resultados, incluyendo todas las nuevas columnas
    RETURN QUERY
    SELECT
        v_associate_id AS associate_id,
        v_associate_fullname AS fullname,
        v_associate_cedula AS cedula,
        v_associate_admission_date AS admission_date,
        v_associate_phone AS phone,
        v_associate_email AS email,
        v_associate_is_payroll_credit AS is_payroll_credit,
        v_main_account_id AS associate_account_id,
        v_main_account_number AS account_number,
        v_liquidation_currency AS currency_code,
        v_total_savings AS total_savings_balance,
        v_haberes_contribution AS haberes_contribution,
        v_haberes_voluntary AS haberes_voluntary,
        v_haberes_employer AS haberes_employer,
        v_surpluses AS surpluses,
        v_total_withdrawals AS total_withdrawals,         -- Se devuelve la nueva variable
        v_total_withdrawal_fees AS total_withdrawal_fees, -- Se devuelve la nueva variable
        v_total_loans AS total_outstanding_loans,
        v_total_credits AS total_outstanding_credits,
        v_net_liquidation AS net_liquidation_amount;
END;
$function$
;