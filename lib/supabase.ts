import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

let storageOptions = {};
if (Platform.OS !== 'web') {
  storageOptions = { storage: AsyncStorage };
}

let sessionUrlOption = false;
if (Platform.OS === 'web') {
  sessionUrlOption = true;
}

const authOptions = {
  ...storageOptions,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: sessionUrlOption,
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: authOptions }
);