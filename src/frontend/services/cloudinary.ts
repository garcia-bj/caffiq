const CLOUD_NAME     = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET  = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const subirImagenCloudinary = async (uri: string): Promise<string> => {
  const data = new FormData();
  data.append("file", { uri, type: "image/jpeg", name: "foto.jpg" } as any);
  data.append("upload_preset", UPLOAD_PRESET!);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: data },
  );

  if (!res.ok) throw new Error("Error al subir imagen a Cloudinary");
  const result = await res.json();
  return result.secure_url as string;
};
