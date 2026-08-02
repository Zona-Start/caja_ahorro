export const formatCurrency = (value: number, currency: 'VES' | 'USD' | 'EUR' | string) => {
  const formatted = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

  if (currency === 'VES') {
    return formatted.replace('Bs.S', 'Bs.');
  }

  return formatted;
};

export const formatNumber = (value: string | number) => {
  const cleanValue = String(value).replace(/[^\d.]/g, '');
  const decimalPointIndex = cleanValue.indexOf('.');

  let integerPart;
  let decimalPart = '';

  if (decimalPointIndex !== -1) {
    integerPart = cleanValue.substring(0, decimalPointIndex);
    decimalPart = cleanValue.substring(decimalPointIndex + 1);
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }
  } else {
    integerPart = cleanValue;
  }

  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );

  if (decimalPointIndex !== -1) {
    return `${formattedIntegerPart},${decimalPart}`;
  } else {
    return formattedIntegerPart;
  }
};

export const formatDbDate = (value: string | Date | undefined | null): string => {
  if (!value) return '-';
  if (typeof value === 'string') {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return value.toLocaleDateString('es-VE');
};
