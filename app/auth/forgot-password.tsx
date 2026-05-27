import { useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import FontAwesome from '@expo/vector-icons/FontAwesome5'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { InputField } from '../../components/InputField'
import { Colors, ColorScheme } from '../../constants/Colors'
import { useTheme } from '../../context/ThemeContext'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorEmail, setErrorEmail] = useState('')

  const handleEnviar = async () => {
    if (email.trim() === "" || email.includes('@') === false) {
      setErrorEmail('Introduce un correo válido')
      return
    }

    setLoading(true)
    setErrorEmail('')

    const res = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gymcoachai://auth/reset-password',
    })

    setLoading(false)

    if (res.error) {
      setErrorEmail(res.error.message)
    } else {
      setEnviado(true)
    }
  }

  if (enviado) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successBox}>
          <View style={styles.iconCircle}>
            <FontAwesome name="envelope" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Revisa tu email</Text>
          <Text style={styles.subtitle}>
            Te hemos enviado un enlace para restablecer tu contraseña. Puede tardar unos minutos.
          </Text>
          <Button title="Volver al inicio de sesión" onPress={() => router.replace('/auth/login')} style={{ marginTop: 8 }} />
        </View>
      </View>
    )
  }

  let btnText = "Enviar enlace";
  if (loading) {
    btnText = "Enviando...";
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={18} color={colors.text} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <FontAwesome name="lock" size={28} color={Colors.primary} />
        </View>

        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>Introduce tu correo y te enviaremos un enlace para restablecerla.</Text>

        <View style={styles.card}>
          <InputField
            label="Correo electrónico"
            placeholder="correo@ejemplo.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrorEmail('') }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errorEmail}
          />
        </View>

        <Button title={btnText} onPress={handleEnviar} loading={loading} style={{ marginTop: 8 }} />
      </View>
    </View>
  )
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24 },
  backButton: { paddingTop: 16, paddingBottom: 8, padding: 8, alignSelf: 'flex-start' },
  content: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  successBox: { flex: 1, justifyContent: 'center', paddingBottom: 40 },
  iconCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primarySubtle, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'NotoSans', fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontFamily: 'NotoSans', fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 28 },
  card: { backgroundColor: colors.surface, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 16 },
})