function calcularIndices(peso, talla, cintura, cadera, sexo) {
  const imc = peso / (talla ** 2);
  const icc = cintura / cadera;
  const whtr = cintura / (talla * 100); // talla en m → cm

  let categoriaIMC = "";
  if (imc < 18.5) categoriaIMC = "Bajo peso";
  else if (imc < 25) categoriaIMC = "Normal";
  else if (imc < 30) categoriaIMC = "Sobrepeso";
  else categoriaIMC = "Obesidad";

  const limiteICC = sexo === "M" ? 0.90 : 0.85;
  const riesgoICC = icc > limiteICC ? "↑ riesgo" : "riesgo normal";
  const riesgoWHtR = whtr > 0.5 ? "↑ riesgo" : "riesgo normal";

  return {
    IMC: imc.toFixed(1),
    Categoria: categoriaIMC,
    ICC: icc.toFixed(2),
    Riesgo_ICC: riesgoICC,
    WHtR: whtr.toFixed(2),
    Riesgo_WHtR: riesgoWHtR
  };
}

// Ejemplo de uso:
console.log(calcularIndices(78, 1.75, 92, 100, "M"));
