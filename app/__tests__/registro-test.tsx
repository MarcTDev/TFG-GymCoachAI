import { fireEvent, render } from "@testing-library/react-native";
import RegistroStep1 from "../auth/registro/index";
import RegistroStep2 from "../auth/registro/step2";
import RegistroStep3 from "../auth/registro/step3";
import RegistroStep4 from "../auth/registro/step4";

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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

describe("Pruebas funcionales de las pantallas de Registro", () => {
  test("Paso 1: Debe renderizar título, campos de nombre/apellidos/usuario y botón Siguiente", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep1 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Empieza tu camino fitness hoy")).toBeTruthy();

    const inputNombre = getByPlaceholderText("Tu nombre");
    fireEvent.changeText(inputNombre, "Marc");
    expect(inputNombre.props.value).toBe("Marc");

    const inputApellidos = getByPlaceholderText("Tus apellidos");
    fireEvent.changeText(inputApellidos, "García");
    expect(inputApellidos.props.value).toBe("García");

    const inputUsuario = getByPlaceholderText("Elige un nombre de usuario");
    fireEvent.changeText(inputUsuario, "marcg23");
    expect(inputUsuario.props.value).toBe("marcg23");

    expect(getByText("Siguiente")).toBeTruthy();
  });

  test("Paso 2: Debe renderizar título, campos de edad/peso/altura y botón Siguiente", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep2 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Cuéntanos sobre ti")).toBeTruthy();

    const inputEdad = getByPlaceholderText("Tu edad");
    fireEvent.changeText(inputEdad, "25");
    expect(inputEdad.props.value).toBe("25");

    const inputPeso = getByPlaceholderText("Tu peso en kg");
    fireEvent.changeText(inputPeso, "75");
    expect(inputPeso.props.value).toBe("75");

    const inputAltura = getByPlaceholderText("Tu altura en cm");
    fireEvent.changeText(inputAltura, "180");
    expect(inputAltura.props.value).toBe("180");

    expect(getByText("Siguiente")).toBeTruthy();
  });

  test("Paso 3: Debe renderizar título, campos de objetivo/actividad y botón Siguiente", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep3 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Define tus objetivos")).toBeTruthy();

    expect(getByText("¿Cuál es tu objetivo?")).toBeTruthy();
    expect(getByText("¿Cuánto entrenas?")).toBeTruthy();

    expect(getByText("Siguiente")).toBeTruthy();
  });

  test("Paso 4: Debe renderizar título, campo de información adicional y botón Finalizar", () => {
    const { getByText, getByPlaceholderText } = render(<RegistroStep4 />);

    expect(getByText("Crear cuenta")).toBeTruthy();
    expect(getByText("Casi listo, un último paso")).toBeTruthy();
    expect(getByText("Información adicional (opcional)")).toBeTruthy();

    const inputInfo = getByPlaceholderText(
      "Enfermedades, alergias, lesiones..."
    );
    fireEvent.changeText(inputInfo, "Alergia al gluten");
    expect(inputInfo.props.value).toBe("Alergia al gluten");

    expect(getByText("Finalizar")).toBeTruthy();
  });
});
