export const generateUniqueReference = (): string => {
  // Genera un número aleatorio entre 0 (inclusive) y 10^12 (exclusivo).
  // Math.random() * 10^12 puede generar un número con hasta 12 dígitos antes de la coma.
  // Math.floor() lo convierte en un entero.
  const randomNumber = Math.floor(Math.random() * Math.pow(10, 12));

  // Convierte el número a string y rellena con ceros a la izquierda
  // hasta que tenga exactamente 12 dígitos.
  // Por ejemplo, si randomNumber es 12345, se convierte en "000000012345".
  const reference = randomNumber.toString().padStart(12, '0');

  return reference;
};
