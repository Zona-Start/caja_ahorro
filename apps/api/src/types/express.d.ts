// Augmentación del usuario de Express (lo que las estrategias Passport inyectan
// en `req.user`). Se augmenta `Express.User` — y NO `Request.user` — para
// fusionarse limpiamente con `@types/passport` (que declara `Request.user?: User`).
//
// `export {}` hace que este archivo sea un módulo, requisito para que
// `declare global` aplique la augmentación global.
export {};

declare global {
  namespace Express {
    interface User {
      /** id del usuario (legacy) */
      id?: string;
      /** subject del JWT */
      sub: string;
      /** alias de `sub` usado por la estrategia de refresh */
      userId: string;
      username: string;
      isSystemAdmin: boolean;
    }
  }
}
