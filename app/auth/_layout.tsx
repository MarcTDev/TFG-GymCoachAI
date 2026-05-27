import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="registro" options={{ title: 'Registro', headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="generating" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="callback" options={{ headerShown: false }} />
    </Stack>
  );
}