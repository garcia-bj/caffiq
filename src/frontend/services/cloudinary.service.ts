const CLOUD_NAME = "dplqfkkh4";
const UPLOAD_PRESET = "mi_caffiq";

export const subirImagenCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: "sucursal.jpg",
  } as unknown as Blob);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) throw new Error("Error al subir imagen a Cloudinary");
  const data = await res.json();
  return data.secure_url as string;
};
