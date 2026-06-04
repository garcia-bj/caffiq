import React, { useRef, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

export const DRUM_H = 50;
const VISIBLE = 5;

interface ColumnProps {
  items: string[];
  initialValue: string;
  onChanged: (v: string) => void;
  width: number;
  fontSize?: number;
  accentColor?: string;
}

export function DrumColumn({
  items,
  initialValue,
  onChanged,
  width,
  fontSize = 32,
  accentColor = "#2C1819",
}: ColumnProps) {
  const ref = useRef<ScrollView>(null);
  const layoutDone = useRef(false);
  const [selIdx, setSelIdx] = useState(() => {
    const i = items.indexOf(initialValue);
    return i >= 0 ? i : 0;
  });

  const handleLayout = () => {
    if (layoutDone.current) return;
    layoutDone.current = true;
    const i = items.indexOf(initialValue);
    const target = i >= 0 ? i : 0;
    ref.current?.scrollTo({ y: target * DRUM_H, animated: false });
  };

  const snap = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(Math.round(y / DRUM_H), items.length - 1));
    ref.current?.scrollTo({ y: idx * DRUM_H, animated: false });
    if (idx !== selIdx) {
      setSelIdx(idx);
      onChanged(items[idx]);
    }
  };

  return (
    <View style={{ width, height: DRUM_H * VISIBLE, overflow: "hidden" }}>
      <ScrollView
        ref={ref}
        onLayout={handleLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={DRUM_H}
        decelerationRate="fast"
        onScrollEndDrag={snap}
        onMomentumScrollEnd={snap}
        contentContainerStyle={{ paddingVertical: DRUM_H * 2 }}
        nestedScrollEnabled
      >
        {items.map((v, i) => {
          const d = Math.abs(i - selIdx);
          return (
            <View
              key={i}
              style={{ height: DRUM_H, alignItems: "center", justifyContent: "center" }}
            >
              <Text
                style={{
                  fontSize:
                    d === 0 ? fontSize : d === 1 ? fontSize * 0.7 : fontSize * 0.53,
                  fontWeight: d === 0 ? "800" : d === 1 ? "500" : "400",
                  color:
                    d === 0 ? accentColor : d === 1 ? "#9DB5AE" : "#D1DDD9",
                }}
              >
                {v}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Two-column (HH : MM) — for sucursal forms ──────────────────────────────

interface TimePickerProps {
  hours: string[];
  minutes: string[];
  initialHour: string;
  initialMinute: string;
  onHourChange: (h: string) => void;
  onMinuteChange: (m: string) => void;
  accentColor?: string;
}

export function DrumRollTimePicker({
  hours,
  minutes,
  initialHour,
  initialMinute,
  onHourChange,
  onMinuteChange,
  accentColor = "#2C1819",
}: TimePickerProps) {
  return (
    <View style={styles.twoCol}>
      <DrumColumn
        items={hours}
        initialValue={initialHour}
        onChanged={onHourChange}
        width={80}
        accentColor={accentColor}
      />
      <Text style={[styles.sep, { color: accentColor }]}>:</Text>
      <DrumColumn
        items={minutes}
        initialValue={initialMinute}
        onChanged={onMinuteChange}
        width={80}
        accentColor={accentColor}
      />
      <View pointerEvents="none" style={[styles.band, { top: DRUM_H * 2 }]} />
    </View>
  );
}

// ── Single-column ("HH:MM" slots) — for carrito ────────────────────────────

interface SinglePickerProps {
  items: string[];
  initialValue: string;
  onChange: (v: string) => void;
  accentColor?: string;
  width?: number;
}

export function DrumRollPicker({
  items,
  initialValue,
  onChange,
  accentColor = "#B45309",
  width = 140,
}: SinglePickerProps) {
  return (
    <View style={[styles.single, { width }]}>
      <DrumColumn
        items={items}
        initialValue={initialValue}
        onChanged={onChange}
        width={width}
        fontSize={28}
        accentColor={accentColor}
      />
      <View pointerEvents="none" style={[styles.bandSingle, { top: DRUM_H * 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  twoCol: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7FAF9",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#C8DDD7",
    overflow: "hidden",
    alignSelf: "center",
  },
  sep: {
    fontSize: 36,
    fontWeight: "800",
    marginHorizontal: 2,
    lineHeight: DRUM_H,
  },
  band: {
    position: "absolute",
    left: 10,
    right: 10,
    height: DRUM_H,
    backgroundColor: "rgba(13,90,82,0.07)",
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#0D5A52",
    borderRadius: 10,
  },
  single: {
    backgroundColor: "#FFFBF0",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
    overflow: "hidden",
    alignSelf: "center",
  },
  bandSingle: {
    position: "absolute",
    left: 8,
    right: 8,
    height: DRUM_H,
    backgroundColor: "rgba(180,83,9,0.08)",
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#B45309",
    borderRadius: 10,
  },
});
