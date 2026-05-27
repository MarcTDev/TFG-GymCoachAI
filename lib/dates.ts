export const localDate = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  
  const year = d.getFullYear();
  
  let month = String(d.getMonth() + 1);
  if (month.length === 1) month = '0' + month;
  
  let day = String(d.getDate());
  if (day.length === 1) day = '0' + day;
  
  return year + "-" + month + "-" + day;
};

export const getDayOfWeek = (): number => {
  const d = new Date().getDay();
  if (d === 0) {
    return 7;
  }
  return d;
};

export const getWeekDate = (diaSemana: number): string => {
  const offset = diaSemana - getDayOfWeek();
  return localDate(offset);
};