import "./config/env"; // valida variables de entorno al arrancar
import app from "./app";
import { env } from "./config/env";

const PORT = env.port;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Caffiq API corriendo en http://0.0.0.0:${PORT}`);
  console.log(`   Local:  http://localhost:${PORT}/api/health\n`);
});
