export const formatCurrency = (value: number, currency: 'VES' | 'USD') => {
  const formatted = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

  // If the currency is VES, replace "Bs.S" with "Bs."
  if (currency === 'VES') {
    return formatted.replace('Bs.S', 'Bs.');
  }

  return formatted;
};

export const formatNumber = (value: string | number) => {
  // 1. Limpia cualquier caracter que no sea un número o un punto.
  const cleanValue = String(value).replace(/[^\d.]/g, '');

  // 2. Encuentra la posición del punto decimal.
  const decimalPointIndex = cleanValue.indexOf('.');

  let integerPart;
  let decimalPart = '';

  if (decimalPointIndex !== -1) {
    // Si hay un punto, separamos las partes entera y decimal.
    integerPart = cleanValue.substring(0, decimalPointIndex);
    decimalPart = cleanValue.substring(decimalPointIndex + 1);

    // Asegura que los decimales no excedan 2 dígitos.
    if (decimalPart.length > 2) {
      decimalPart = decimalPart.substring(0, 2);
    }
  } else {
    // Si no hay un punto, todo es la parte entera.
    integerPart = cleanValue;
  }

  // 3. Formatea la parte entera con puntos para los miles.
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.',
  );

  // 4. Combina las partes, usando una coma como separador decimal.
  if (decimalPointIndex !== -1) {
    return `${formattedIntegerPart},${decimalPart}`;
  } else {
    return formattedIntegerPart;
  }
};
