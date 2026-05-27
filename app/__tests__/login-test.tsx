import { fireEvent, render } from "@testing-library/react-native";
import LoginScreen from "../auth/login";

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
  Link: ({ children }: any) => children,
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe("Pruebas funcionales de la pantalla de Login", () => {
  test("Debe renderizar el título y el subtítulo en español", () => {
    const { getByText } = render(<LoginScreen />);

    expect(getByText("Bienvenido")).toBeTruthy();
    expect(getByText("Inicia sesión para continuar")).toBeTruthy();
  });

  test("Debe permitir escribir en el campo de correo", () => {
    const { getByPlaceholderText } = render(<LoginScreen />);

    const inputEmail = getByPlaceholderText("correo@ejemplo.com");
    fireEvent.changeText(inputEmail, "alumno@tfg.com");
    expect(inputEmail.props.value).toBe("alumno@tfg.com");
  });

  test("Debe mostrar el botón de Entrar", () => {
    const { getByText } = render(<LoginScreen />);
    const boton = getByText("Entrar");

    expect(boton).toBeTruthy();
  });
});
