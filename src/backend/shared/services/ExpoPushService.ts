interface PushMessage {
  to: string;
  sound: "default";
  title: string;
  body: string;
  data?: Record<string, string>;
  badge?: number;
}

export async function enviarPushNotificacion(
  token: string,
  titulo: string,
  cuerpo: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!token?.startsWith("ExponentPushToken[")) return;

  const message: PushMessage = {
    to:    token,
    sound: "default",
    title: titulo,
    body:  cuerpo,
    data:  data ?? {},
    badge: 1,
  };

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method:  "POST",
      headers: {
        "Content-Type":   "application/json",
        "Accept":         "application/json",
        "Accept-Encoding":"gzip, deflate",
      },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.error("[ExpoPush] Error al enviar:", e);
  }
}
