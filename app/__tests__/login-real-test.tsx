import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../auth/login';
import { supabase } from '../../lib/supabase';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  Link: 'Link',
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

jest.spyOn(Alert, 'alert');

describe('Pruebas funcionales de la pantalla de Login (Supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Login fallido: Debe bloquear la ejecución y mostrar error si hay campos vacíos', async () => {
    const { getByText } = render(<LoginScreen />);
    
    const submitButton = getByText('Entrar');
    fireEvent.press(submitButton);

    expect(getByText('Introduce tu correo electrónico')).toBeTruthy();
    expect(getByText('Introduce tu contraseña')).toBeTruthy();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('Login exitoso: Debe autenticar con Supabase y navegar al Dashboard con credenciales válidas', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      error: null,
      data: { user: { id: '123' }, session: {} }
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('correo@ejemplo.com'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('••••••••••••'), 'password123');

    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/workout');
    });
  });
});
