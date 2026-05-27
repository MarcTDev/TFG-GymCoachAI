import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";
import { Platform } from "react-native";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "../../constants/Colors";
import { supabase } from "../../lib/supabase";
import { useRegistro } from "../../context/RegistroContext";

export default function AuthCallback() {
  const router = useRouter();
  const { setData } = useRegistro();

  useEffect(() => {
    if (Platform.OS === 'web') {
      supabase.auth.getSession().then(async ({ data }) => {
        const user = data.session?.user;
        if (!user) {
          router.replace('/');
          return;
        }

        const resPerfil = await supabase
          .from('perfil')
          .select('usuario_id')
          .eq('usuario_id', user.id)
          .single();
          
        const perfil = resPerfil.data;

        if (perfil) {
          router.replace('/(tabs)/workout' as any);
        } else {
          let nombreGoogle = "";
          if (user.user_metadata && user.user_metadata.full_name) {
            nombreGoogle = user.user_metadata.full_name;
          }
          const partes = nombreGoogle.split(' ');
          
          let nombre = partes[0];
          if (!nombre) {
            nombre = "";
          }
          
          let apellidos = "";
          for (let i = 1; i < partes.length; i++) {
            apellidos = apellidos + partes[i] + " ";
          }
          apellidos = apellidos.trim();

          setData({
            viaGoogle: true,
            googleUserId: user.id,
            nombre: nombre,
            apellidos: apellidos,
          });
          router.replace('/auth/registro' as any);
        }
      });
    } else {
      WebBrowser.maybeCompleteAuthSession();
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}