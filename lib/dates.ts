export const localDate = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const getDayOfWeek = (): number => {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
};

export const getWeekDate = (diaSemana: number): string => {
  const offset = diaSemana - getDayOfWeek();
  return localDate(offset);
};