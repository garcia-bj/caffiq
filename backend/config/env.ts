import dotenv from "dotenv";
dotenv.config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno requerida no definida: ${key}`);
  return value;
};

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),

  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },

  whatsapp: {
    webhookUrl: process.env.WHATSAPP_WEBHOOK_URL ?? "https://asc-n8n.autosalescloser.com/webhook/cf0419a1-536b-4296-94f4-824762d1c786",
  },

  google: {
    redirectUrl: process.env.GOOGLE_REDIRECT_URL ?? "http://localhost:3000/api/auth/google/callback",
  },
};
