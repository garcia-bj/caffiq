import cors from "cors";

export const corsOptions = cors({
  origin: [
    "http://localhost:8081", // Expo web
    "exp://localhost:8081",  // Expo Go
    /^exp:\/\//,             // Cualquier host Expo
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
