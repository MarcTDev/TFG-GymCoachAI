import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import FontAwesome from '@expo/vector-icons/FontAwesome5'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/Button'
import { InputField } from '../../components/InputField'
import { Colors, ColorScheme } from '../../constants/Colors'
import { useTheme } from '../../context/ThemeContext'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const styles = makeStyles(colors)

  const [preparado, setPreparado] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [listo, setListo] = useState(false)
  const [errores, setErrores] = useState({ password: '', confirm: '', general: '' })

  useEffect(() => {
    const extraerTokenDelEnlace = (url: string) => {
      try {
        const hash = url.split('#')[1]
        if (!hash) {
          setTokenError(true)
          return
        }

        const params = new URLSearchParams(hash)
        const token = params.get('access_token')
        const refresh = params.get('refresh_token')
        const type = params.get('type')

        if (!token || !refresh || type !== 'recovery') {
          setTokenError(true)
          return
        }

        setAccessToken(token)
        setRefreshToken(refresh)
        setPreparado(true)
      } catch (error) {
        setTokenError(true)
      }
    }

    Linking.getInitialURL().then((url) => { 
      if (url) {
        extraerTokenDelEnlace(url) 
      }
    })

    const sub = Linking.addEventListener('url', ({ url }) => {
      extraerTokenDelEnlace(url)
    })
    
    return () => {
      sub.remove()
    }
  }, [])

  const handleReset = async () => {
    let errPassword = '';
    let errConfirm = '';
    let hayError = false;
    
    if (password.length < 6) {
      errPassword = 'Mínimo 6 caracteres';
      hayError = true;
    }
    
    if (password !== confirm) {
      errConfirm = 'Las contraseñas no coinciden';
      hayError = true;
    }

    setErrores({ password: errPassword, confirm: errConfirm, general: '' })
    
    if (hayError) {
      return;
    }

    if (!accessToken || !refreshToken) {
      setErrores({ password: '', confirm: '', general: 'Token de recuperación no disponible' })
      return
    }

    setLoading(true)
    try {
      const resSession = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (resSession.error) {
        setErrores({ password: '', confirm: '', general: 'Sesión inválida o expirada' })
        return
      }

      const resUpdate = await supabase.auth.updateUser({ password: password })
      if (resUpdate.error) {
        setErrores({ password: '', confirm: '', general: resUpdate.error.message })
        return
      }

      setListo(true)
      setTimeout(() => {
        router.replace('/(tabs)/workout')
      }, 2500)
    } catch (error: any) {
      let msg = 'Error desconocido';
      if (error && error.message) {
        msg = error.message;
      }
      setErrores({ password: '', confirm: '', general: msg })
    } finally {
      setLoading(false)
    }
  }

  if (listo) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome name="check-circle" size={56} color={Colors.secondary} solid />
        <Text style={[styles.title, { marginTop: 20 }]}>¡Contraseña actualizada!</Text>
        <Text style={styles.subtitle}>Redirigiendo al inicio de sesión...</Text>
      </View>
    )
  }

  if (tokenError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <FontAwesome name="exclamation-circle" size={56} color="#DC2626" />
        <Text style={[styles.title, { marginTop: 20 }]}>Enlace inválido</Text>
        <Text style={styles.subtitle}>El enlace ha expirado o no es válido. Solicita uno nuevo.</Text>
        <Button title="Volver al inicio de sesión" onPress={() => router.replace('/auth/login')} style={{ marginTop: 24, width: '100%' }} />
      </View>
    )
  }

  if (!preparado) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.subtitle, { marginTop: 16 }]}>Verificando enlace...</Text>
      </View>
    )
  }

  let btnText = 'Guardar contraseña';
  if (loading) {
    btnText = 'Guardando...';
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={styles.iconCircle}>
        <FontAwesome name="key" size={28} color={Colors.primary} solid />
      </View>

      <Text style={styles.title}>Nueva contraseña</Text>
      <Text style={styles.subtitle}>Elige una contraseña segura para tu cuenta.</Text>

      <View style={styles.card}>
        <InputField
          label="Nueva contraseña"
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          value={password}
          onChangeText={(v) => { setPassword(v); setErrores((p) => ({ ...p, password: '', general: '' })) }}
          error={errores.password}
        />
        <InputField
          label="Confirmar contraseña"
          placeholder="Repite la contraseña"
          secureTextEntry
          value={confirm}
          onChangeText={(v) => { setConfirm(v); setErrores((p) => ({ ...p, confirm: '' })) }}
          error={errores.confirm}
        />
        {errores.general !== '' && <Text style={styles.generalError}>{errores.general}</Text>}
      </View>

      <Button title={btnText} onPress={handleReset} loading={loading} style={{ marginTop: 8 }} />
    </View>
  )
}

const makeStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingBottom: 40 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primarySubtle, borderWidth: 2, borderColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: 'NotoSans', fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontFamily: 'NotoSans', fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 28, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 15, padding: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 16 },
  generalError: { fontFamily: 'NotoSans', fontSize: 14, color: '#DC2626', fontWeight: '600', marginTop: 4, marginLeft: 4 },
})