import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../auth/login';
import { supabase } from '../../lib/supabase';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockFuncionNavegacionSimulada = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockFuncionNavegacionSimulada,
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

describe('Pruebas funcionales de Login con Supabase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Debe mostrar errores si hay campos vacíos', async () => {
    const { getByText } = render(<LoginScreen />);
    
    const botonEntrar = getByText('Entrar');
    fireEvent.press(botonEntrar);

    expect(getByText('Introduce tu correo electrónico')).toBeTruthy();
    expect(getByText('Introduce tu contraseña')).toBeTruthy();
    expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it('Debe iniciar sesión y navegar al home con credenciales válidas', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
      error: null,
      data: { 
        user: { id: '123-estudiante' }, 
        session: { access_token: 'token-valido' } 
      }
    });

    const { getByText, getByPlaceholderText } = render(<LoginScreen />);

    const campoEmail = getByPlaceholderText('correo@ejemplo.com');
    const campoPassword = getByPlaceholderText('••••••••••••');
    
    fireEvent.changeText(campoEmail, 'test@estudiante.com');
    fireEvent.changeText(campoPassword, 'segura123');

    const botonEntrar = getByText('Entrar');
    fireEvent.press(botonEntrar);

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@estudiante.com',
        password: 'segura123',
      });
      expect(mockFuncionNavegacionSimulada).toHaveBeenCalledWith('/(tabs)/workout');
    });
  });
});


