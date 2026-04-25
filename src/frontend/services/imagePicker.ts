import * as ImagePicker from "expo-image-picker";

export const seleccionarImagen = async () => {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!res.canceled) {
    return res.assets[0].uri;
  }
};
