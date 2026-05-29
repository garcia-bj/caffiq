-- Almacena el Expo Push Token del dispositivo para enviar notificaciones push
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
