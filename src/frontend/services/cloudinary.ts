export const subirImagenCloudinary = async (uri: string) => {
  const data = new FormData();

  data.append("file", {
    uri,
    type: "image/jpeg",
    name: "foto.jpg",
  } as any);

  data.append("upload_preset", "mi_caffiq");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dplqfkkh4/image/upload",
    {
      method: "POST",
      body: data,
    },
  );

  const result = await res.json();

  console.log("CLOUDINARY:", result);

  return result.secure_url;
};
