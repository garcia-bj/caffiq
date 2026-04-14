import type { UsuarioPublico } from "../../modules/auth/auth.dto";

declare global {
  namespace Express {
    interface Request {
      user?: UsuarioPublico;
    }
  }
}
