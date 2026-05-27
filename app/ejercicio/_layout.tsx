import { Stack } from "expo-router";

export default function EjercicioLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="biblioteca" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}