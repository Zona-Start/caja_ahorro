CREATE VIEW "accounts_payable"."accounts_payable_summary" AS (
  SELECT
    SUM("accounts_payable"."accounts_payable"."total_amount") AS total_amount,
    SUM(CASE WHEN "accounts_payable"."accounts_payable"."status" = 'PENDING' THEN "accounts_payable"."accounts_payable"."remaining_amount" ELSE 0 END) AS pending_amount,
    SUM(CASE WHEN "accounts_payable"."accounts_payable"."status" = 'PAID' THEN "accounts_payable"."accounts_payable"."paid_amount" ELSE 0 END) AS paid_amount,
    SUM(
      CASE
        WHEN "accounts_payable"."accounts_payable"."status" = 'PENDING' AND "accounts_payable"."accounts_payable"."due_date" < CURRENT_DATE THEN "accounts_payable"."accounts_payable"."remaining_amount"
        ELSE 0
      END
    ) AS overdue_amount
  FROM "accounts_payable"."accounts_payable"
);