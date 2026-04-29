declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        isSystemAdmin: boolean;
        // Agrega aquí otras propiedades que tu JWT/Guard inyecte en el request
      };
    }
  }
}
