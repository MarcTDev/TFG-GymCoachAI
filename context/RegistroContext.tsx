import React, { createContext, useContext, useState } from 'react';

export interface RegistroData {
  nombre: string;
  apellidos: string;
  nombreUsuario: string;
  edad: string;
  peso: string;
  altura: string;
  objetivo: string;
  actividad: string;
  email: string;
  password: string;
  infoAdicional: string;
  viaGoogle: boolean;
  googleUserId: string;
}

const defaultData: RegistroData = {
  nombre: '',
  apellidos: '',
  nombreUsuario: '',
  edad: '',
  peso: '',
  altura: '',
  objetivo: '',
  actividad: '',
  email: '',
  password: '',
  infoAdicional: '',
  viaGoogle: false,
  googleUserId: '',
};

interface RegistroContextType {
  data: RegistroData;
  setData: (partial: Partial<RegistroData>) => void;
  resetData: () => void;
}

const RegistroContext = createContext<RegistroContextType>({
  data: defaultData,
  setData: () => {},
  resetData: () => {},
});

export function RegistroProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<RegistroData>(defaultData);

  const setData = (partial: Partial<RegistroData>) => {
    setDataState((prev) => ({ ...prev, ...partial }));
  };

  const resetData = () => {
    setDataState(defaultData);
  };

  return (
    <RegistroContext.Provider value={{ data, setData, resetData }}>
      {children}
    </RegistroContext.Provider>
  );
}

export const useRegistro = () => useContext(RegistroContext);