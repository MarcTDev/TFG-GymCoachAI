import React from 'react';
import { fireEvent, render } from "@testing-library/react-native";
import RegistroStep1 from "../auth/registro/index";
import RegistroStep2 from "../auth/registro/step2";
import RegistroStep3 from "../auth/registro/step3";
import RegistroStep4 from "../auth/registro/step4";

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock("expo-router", () => ({
  useRouter: () => ({ 
    push: jest.fn(), 
    replace: jest.fn() 
  }),
  Link: ({ children }: any) => children,
}));

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe("Pruebas de Registro", () => {
  test("Paso 1: Debe rellenar datos personales", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep1 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Empieza tu camino fitness hoy")).toBeTruthy();

    const campoNombre = getByPlaceholderText("Tu nombre");
    fireEvent.changeText(campoNombre, "Marc");
    expect(campoNombre.props.value).toBe("Marc");

    const campoApellidos = getByPlaceholderText("Tus apellidos");
    fireEvent.changeText(campoApellidos, "García");
    expect(campoApellidos.props.value).toBe("García");

    const campoUsuario = getByPlaceholderText("Elige un nombre de usuario");
    fireEvent.changeText(campoUsuario, "marcg23");
    expect(campoUsuario.props.value).toBe("marcg23");

    expect(getByText("Siguiente")).toBeTruthy();
  });

  test("Paso 2: Debe rellenar datos físicos", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep2 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Cuéntanos sobre ti")).toBeTruthy();

    const campoEdad = getByPlaceholderText("Tu edad");
    fireEvent.changeText(campoEdad, "25");
    expect(campoEdad.props.value).toBe("25");

    const campoPeso = getByPlaceholderText("Tu peso en kg");
    fireEvent.changeText(campoPeso, "75");
    expect(campoPeso.props.value).toBe("75");

    const campoAltura = getByPlaceholderText("Tu altura en cm");
    fireEvent.changeText(campoAltura, "180");
    expect(campoAltura.props.value).toBe("180");

    expect(getByText("Siguiente")).toBeTruthy();
  });

  test("Paso 3: Debe mostrar objetivo y actividad", () => {
    const { getByText } = render(<RegistroStep3 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Define tus objetivos")).toBeTruthy();
    expect(getByText("¿Cuál es tu objetivo?")).toBeTruthy();
    expect(getByText("¿Cuánto entrenas?")).toBeTruthy();
    expect(getByText("Siguiente")).toBeTruthy();
  });

  test("Paso 4: Debe rellenar salud y finalizar", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep4 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Casi listo, un último paso")).toBeTruthy();
    expect(getByText("Información adicional (opcional)")).toBeTruthy();

    const campoInfoMedica = getByPlaceholderText("Enfermedades, alergias, lesiones...");
    fireEvent.changeText(campoInfoMedica, "Alergia al gluten");
    expect(campoInfoMedica.props.value).toBe("Alergia al gluten");

    expect(getByText("Finalizar")).toBeTruthy();
  });
});


