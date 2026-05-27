import React from 'react';
import { fireEvent, render } from "@testing-library/react-native";
import LoginScreen from "../auth/login";

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  Link: ({ children }: any) => children,
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe("Pruebas de Login", () => {
  test("Debe mostrar el título de bienvenida", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("Bienvenido")).toBeTruthy();
    expect(getByText("Inicia sesión para continuar")).toBeTruthy();
  });

  test("Debe escribir en el campo de correo", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);
    const campoEmail = getByPlaceholderText("correo@ejemplo.com");
    fireEvent.changeText(campoEmail, "alumno@tfg.com");
    expect(campoEmail.props.value).toBe("alumno@tfg.com");
  });

  test("Debe mostrar el botón de entrar", () => {
    const { getByText } = render(<LoginScreen />);
    expect(getByText("Entrar")).toBeTruthy();
  });
});


