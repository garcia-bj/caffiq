import { env } from "@config/env";
import { AppError } from "@shared/errors/AppError";
import { verificacionRepository } from "./verificacion.repository";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generarCodigo = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

const calcularExpiracion = (): string =>
  new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos

// ─── Envio via Webhook WhatsApp (n8n) ────────────────────────────────────────
//
// El webhook espera este payload:
// {
//   "telefono":  "+521XXXXXXXXXX",   — numero destino WhatsApp
//   "codigo":    "123456",           — codigo OTP de 6 digitos
//   "nombre":    "Juan García",      — nombre del usuario (para personalizar mensaje)
//   "mensaje":   "Tu código...",     — mensaje completo listo para enviar
// }
//
const enviarWhatsApp = async (
  num_telefono: string,
  codigo: string,
  nombre: string
): Promise<void> => {
  const mensaje = `Hola ${nombre} 👋\n\nTu código de verificación *Caffiq* es:\n\n🔑 *${codigo}*\n\nEste código expira en *10 minutos*. No lo compartas con nadie.`;

  const payload = {
    telefono: num_telefono,
    codigo,
    nombre,
    mensaje,
  };

  const res = await fetch(env.whatsapp.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // No bloqueamos el registro si el webhook falla, solo logueamos
    console.error(`[WEBHOOK ERROR] Status: ${res.status} | Telefono: ${num_telefono}`);
    return;
  }

  console.log(`[WHATSAPP OTP] Codigo enviado a ${num_telefono}`);
};

// ─── Servicio ─────────────────────────────────────────────────────────────────

export const verificacionService = {

  // ── Crear y enviar codigo ────────────────────────────────────────────────
  async enviarCodigo(usuario_id: string, num_telefono: string, nombre: string): Promise<void> {
    const codigo    = generarCodigo();
    const expira_en = calcularExpiracion();

    await verificacionRepository.invalidarAnteriores(usuario_id);
    await verificacionRepository.guardar(usuario_id, num_telefono, codigo, expira_en);
    await enviarWhatsApp(num_telefono, codigo, nombre);
  },

  // ── Verificar el codigo ingresado ────────────────────────────────────────
  async verificarCodigo(usuario_id: string, codigo: string): Promise<void> {
    const registro = await verificacionRepository.buscarValido(usuario_id, codigo);
    if (!registro) throw new AppError("Código inválido o expirado", 400);
    await verificacionRepository.marcarUsado(registro.id);
  },

  // ── Reenviar (rate limit: 1 por minuto) ──────────────────────────────────
  async reenviarCodigo(usuario_id: string, num_telefono: string, nombre: string): Promise<void> {
    const tieneReciente = await verificacionRepository.tieneCodigoReciente(usuario_id);
    if (tieneReciente) throw new AppError("Debes esperar 1 minuto antes de solicitar otro código", 429);
    await this.enviarCodigo(usuario_id, num_telefono, nombre);
  },
};
