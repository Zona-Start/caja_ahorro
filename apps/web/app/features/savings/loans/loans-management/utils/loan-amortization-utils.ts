export interface AmortRow {
  installmentNumber: number;
  dueDate: string;
  principalAmount: string;
  interestAmount: string;
  totalInstallmentAmount: string;
  principalBalancePending: string;
}

export interface AmortResult {
  monthlyPayment: number;
  totalInterest: number;
  capital: number;
  expenseAmount: number;
  netAmount: number;
  schedule: AmortRow[];
}

function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getNextBiweeklyDueDate(current: Date, isFirstHalf: boolean): Date {
  const year = current.getFullYear();
  const month = current.getMonth();
  let targetMonth = month;
  let targetYear = year;
  if (isFirstHalf) {
    if (current.getDate() > 16) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
    }
    return new Date(targetYear, targetMonth, 16);
  } else {
    const lastDay = getLastDayOfMonth(new Date(targetYear, targetMonth, 1));
    if (current.getDate() > lastDay.getDate() - 1) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
    }
    return new Date(targetYear, targetMonth + 1, 0);
  }
}

export function calculateFrenchAmortization(
  amount: number,
  annualRate: number,
  numInstallments: number,
  termType: 'installments' | 'quotas',
  startDate: Date,
  expensesPercentage: number = 0,
): AmortResult {
  const expenseAmount = (amount * expensesPercentage) / 100;
  const capital = amount;
  const expensePerInstallment = expenseAmount / numInstallments;

  const periodsPerYear = termType === 'installments' ? 24 : 12;
  const r = annualRate / 100 / periodsPerYear;
  const n = numInstallments;

  const factor = r === 0 ? 1 : Math.pow(1 + r, n);
  const frenchInstallment =
    r === 0
      ? capital / n
      : (capital * r * factor) / (factor - 1);

  const totalInstallmentAmount = frenchInstallment + expensePerInstallment;

  const schedule: AmortRow[] = [];
  let remaining = capital;
  let totalInterest = 0;

  const start = new Date(startDate);
  let nextDueDate: Date;
  if (termType === 'installments') {
    if (start.getDate() <= 15) {
      nextDueDate = getNextBiweeklyDueDate(start, false);
    } else {
      nextDueDate = getNextBiweeklyDueDate(start, true);
    }
  } else {
    nextDueDate = getLastDayOfMonth(start);
  }

  for (let i = 1; i <= n; i++) {
    const interestThisPeriod = remaining * r;
    let principalThisPeriod = frenchInstallment - interestThisPeriod;
    let total = totalInstallmentAmount;

    if (i === n) {
      principalThisPeriod = remaining;
      total = principalThisPeriod + interestThisPeriod + expensePerInstallment;
      if (isNaN(total)) total = 0;
    }

    remaining -= principalThisPeriod;
    totalInterest += interestThisPeriod;

    schedule.push({
      installmentNumber: i,
      dueDate: new Date(nextDueDate).toISOString(),
      principalAmount: parseFloat(principalThisPeriod.toFixed(6)).toString(),
      interestAmount: parseFloat(interestThisPeriod.toFixed(6)).toString(),
      totalInstallmentAmount: parseFloat(total.toFixed(6)).toString(),
      principalBalancePending: parseFloat(
        Math.max(0, remaining).toFixed(6),
      ).toString(),
    });

    if (termType === 'installments') {
      if (nextDueDate.getDate() === 16) {
        nextDueDate = getNextBiweeklyDueDate(nextDueDate, false);
      } else {
        nextDueDate = getNextBiweeklyDueDate(nextDueDate, true);
      }
    } else {
      nextDueDate = getLastDayOfMonth(
        new Date(nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, 1),
      );
    }
  }

  return {
    monthlyPayment: parseFloat(totalInstallmentAmount.toFixed(6)),
    totalInterest: parseFloat(totalInterest.toFixed(6)),
    capital: parseFloat(capital.toFixed(6)),
    expenseAmount: parseFloat(expenseAmount.toFixed(6)),
    netAmount: parseFloat(amount.toFixed(6)),
    schedule,
  };
}
