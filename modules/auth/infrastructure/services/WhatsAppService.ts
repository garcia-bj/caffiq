import { env } from "@config/env";

export const enviarWhatsApp = async (
  num_telefono: string,
  codigo: string,
  nombre: string
): Promise<void> => {
  const mensaje = `Hola ${nombre} 👋\n\nTu código de verificación *Caffiq* es:\n\n🔑 *${codigo}*\n\nEste código expira en *10 minutos*. No lo compartas con nadie.`;

  const res = await fetch(env.whatsapp.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono: num_telefono, codigo, nombre, mensaje }),
  });

  if (!res.ok) {
    console.error(`[WEBHOOK ERROR] Status: ${res.status} | Telefono: ${num_telefono}`);
  } else {
    console.log(`[WHATSAPP OTP] Codigo enviado a ${num_telefono}`);
  }
};
