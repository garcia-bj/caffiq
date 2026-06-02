import { useWindowDimensions } from "react-native";

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const clampedScale = scale < 0.85 ? 0.85 : scale;
  const wp = (p: number) => (width * p) / 100;
  const hp = (p: number) => (height * p) / 100;
  const fs = (size: number) => Math.round(size * clampedScale);
  return { scale: clampedScale, wp, hp, fs, width, height };
}
