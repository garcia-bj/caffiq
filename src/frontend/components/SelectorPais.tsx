import { useMemo, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Caffiq } from "@/frontend/constants/theme";
import { useResponsive } from "@/frontend/hooks/use-responsive";

export interface Pais { bandera: string; nombre: string; codigo: string; }

export const PAISES: Pais[] = [
  { bandera: "🇧🇴", nombre: "Bolivia",          codigo: "+591" },
  { bandera: "🇦🇷", nombre: "Argentina",         codigo: "+54"  },
  { bandera: "🇧🇷", nombre: "Brasil",            codigo: "+55"  },
  { bandera: "🇨🇱", nombre: "Chile",             codigo: "+56"  },
  { bandera: "🇨🇴", nombre: "Colombia",          codigo: "+57"  },
  { bandera: "🇪🇨", nombre: "Ecuador",           codigo: "+593" },
  { bandera: "🇲🇽", nombre: "México",            codigo: "+52"  },
  { bandera: "🇵🇪", nombre: "Perú",              codigo: "+51"  },
  { bandera: "🇵🇾", nombre: "Paraguay",          codigo: "+595" },
  { bandera: "🇺🇾", nombre: "Uruguay",           codigo: "+598" },
  { bandera: "🇻🇪", nombre: "Venezuela",         codigo: "+58"  },
  { bandera: "🇵🇦", nombre: "Panamá",            codigo: "+507" },
  { bandera: "🇨🇷", nombre: "Costa Rica",        codigo: "+506" },
  { bandera: "🇬🇹", nombre: "Guatemala",         codigo: "+502" },
  { bandera: "🇭🇳", nombre: "Honduras",          codigo: "+504" },
  { bandera: "🇸🇻", nombre: "El Salvador",       codigo: "+503" },
  { bandera: "🇳🇮", nombre: "Nicaragua",         codigo: "+505" },
  { bandera: "🇩🇴", nombre: "Rep. Dominicana",   codigo: "+1"   },
  { bandera: "🇨🇺", nombre: "Cuba",              codigo: "+53"  },
  { bandera: "🇪🇸", nombre: "España",            codigo: "+34"  },
  { bandera: "🇺🇸", nombre: "Estados Unidos",    codigo: "+1"   },
  { bandera: "🇬🇧", nombre: "Reino Unido",       codigo: "+44"  },
  { bandera: "🇩🇪", nombre: "Alemania",          codigo: "+49"  },
  { bandera: "🇫🇷", nombre: "Francia",           codigo: "+33"  },
  { bandera: "🇮🇹", nombre: "Italia",            codigo: "+39"  },
  { bandera: "🇵🇹", nombre: "Portugal",          codigo: "+351" },
];

export function SelectorPais({ pais, onSelect }: { pais: Pais; onSelect: (p: Pais) => void }) {
  const { fs } = useResponsive();
  const [open, setOpen]     = useState(false);
  const [buscar, setBuscar] = useState("");

  const filtrados = useMemo(() =>
    buscar.trim()
      ? PAISES.filter(p =>
          p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
          p.codigo.includes(buscar))
      : PAISES,
  [buscar]);

  return (
    <>
      <TouchableOpacity style={styles.paisBtn} onPress={() => setOpen(true)} activeOpacity={0.75}>
        <Text style={styles.paisBandera}>{pais.bandera}</Text>
        <Text style={styles.paisCodigo}>{pais.codigo}</Text>
        <Ionicons name="chevron-down" size={13} color={Caffiq.placeholder} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.box}>
            <View style={styles.header}>
              <Text style={styles.titulo}>Código de país</Text>
              <TouchableOpacity onPress={() => { setOpen(false); setBuscar(""); }}>
                <Ionicons name="close" size={22} color={Caffiq.textDark} />
              </TouchableOpacity>
            </View>

            <View style={styles.buscador}>
              <Ionicons name="search-outline" size={16} color={Caffiq.placeholder} />
              <TextInput
                style={styles.buscadorInput}
                placeholder="Buscar país..."
                placeholderTextColor={Caffiq.placeholder}
                value={buscar}
                onChangeText={setBuscar}
                autoFocus
              />
            </View>

            <FlatList
              data={filtrados}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => {
                const activo = item.codigo === pais.codigo && item.nombre === pais.nombre;
                return (
                  <TouchableOpacity
                    style={[styles.item, activo && styles.itemActivo]}
                    onPress={() => { onSelect(item); setOpen(false); setBuscar(""); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemBandera}>{item.bandera}</Text>
                    <Text style={styles.itemNombre}>{item.nombre}</Text>
                    <Text style={styles.itemCodigo}>{item.codigo}</Text>
                    {activo && <Ionicons name="checkmark" size={16} color={Caffiq.pineTeal} />}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export const styles = StyleSheet.create({
  paisBtn:     { flexDirection: "row", alignItems: "center", gap: 4, paddingRight: 8 },
  paisBandera: { fontSize: 20 },
  paisCodigo:  { fontSize: 13, fontWeight: "700", color: "#2C1819" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  box:     { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 24 },
  header:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#e5e5e5" },
  titulo:  { fontSize: 17, fontWeight: "700", color: "#2C1819" },

  buscador:      { flexDirection: "row", alignItems: "center", gap: 8, margin: 12, backgroundColor: "#f5f5f5", borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: "#e5e5e5" },
  buscadorInput: { flex: 1, fontSize: 15, color: "#2C1819" },

  item:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#f5f5f5" },
  itemActivo: { backgroundColor: "#f0faf7" },
  itemBandera:{ fontSize: 22 },
  itemNombre: { flex: 1, fontSize: 14, color: "#2C1819", fontWeight: "500" },
  itemCodigo: { fontSize: 13, color: "#7a9a8a", fontWeight: "600" },
});
