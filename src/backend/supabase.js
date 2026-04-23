// src/backend/supabase.js
import dotenv from "dotenv";
dotenv.config(); // Esto debe ir antes de usar cualquier process.env
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Verificación de seguridad para depuración
if (!supabaseUrl || !supabaseKey) {
  console.log("❌ Error: No se encontraron las variables en el .env");
  console.log("Variable URL leída:", supabaseUrl);
} else {
  console.log("✅ Conexión a Supabase configurada para:", supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseKey);
