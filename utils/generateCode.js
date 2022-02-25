const generateCode = () => {
  const min = Math.ceil(0);
  const max = Math.floor(9999);
  
  let code = Math.floor(Math.random() * (max - min + 1) + min);

  if (code.length < 4) {
    code = code.padStart(4, '0');
  }

  return code;
}

export default generateCode;