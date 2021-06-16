const setYear = (num) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - num);
  return date;
};

export default setYear;