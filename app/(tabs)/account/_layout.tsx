import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="change-pswd" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}