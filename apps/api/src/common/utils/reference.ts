export const generateUniqueReference = (tipo: string): string => {
    const prefijo = tipo.slice(0, 5).toUpperCase(); // Tomar las primeras 4 letras del tipo y convertir a mayúsculas
    const timestamp = Date.now().toString(36); // Convertir timestamp actual a base36 (alfanumérico)
    const randomComponent = Math.random().toString(36).substring(2, 8).toUpperCase(); // Generar 6 caracteres alfanuméricos aleatorios
  
    return `${prefijo}-${randomComponent}`;
  }