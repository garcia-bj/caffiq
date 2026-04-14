import "./config/env"; // valida variables de entorno al arrancar
import app from "./app";
import { env } from "./config/env";

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`\n🚀 Caffiq API corriendo en http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Auth:   http://localhost:${PORT}/api/auth\n`);
});
