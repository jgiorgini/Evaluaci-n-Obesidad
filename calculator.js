// calculator.js — Evaluación Obesidad (v2.0)

// -------------------- FUNCIONES AUXILIARES --------------------
function calcularIndices(peso, tallaM, cinturaCm, caderaCm, sexo) {
  if (![peso, tallaM, cinturaCm, caderaCm].every(v => typeof v === "number" && isFinite(v) && v > 0)) {
    throw new Error("Revisar que todos los valores sean números positivos.");
  }
  if (!["M", "F"].includes(sexo)) {
    throw new Error('Sexo inválido. Use "M" o "F".');
  }

  const imc = peso / (tallaM ** 2);
  const icc = cinturaCm / caderaCm;
  const whtr = cinturaCm / (tallaM * 100); // talla en m → cm

  let categoriaIMC = "";
  if (imc < 18.5) categoriaIMC = "Bajo peso";
  else if (imc < 25) categoriaIMC = "Normal";
  else if (imc < 30) categoriaIMC = "Sobrepeso";
  else categoriaIMC = "Obesidad";

  const limiteICC = sexo === "M" ? 0.90 : 0.85;
  const riesgoICC = icc > limiteICC ? "↑ riesgo" : "riesgo normal";
  const riesgoWHtR = whtr > 0.5 ? "↑ riesgo" : "riesgo normal";

  return {
    IMC: Number(imc.toFixed(1)),
    CategoriaIMC: categoriaIMC,
    ICC: Number(icc.toFixed(2)),
    RiesgoICC: riesgoICC,
    WHtR: Number(whtr.toFixed(2)),
    RiesgoWHtR: riesgoWHtR
  };
}

// Asignación de color por categoría
function riskClassIMC(cat) {
  if (cat === "Normal") return "ok";
  if (cat === "Sobrepeso") return "warn";
  return "high"; // Bajo peso u Obesidad
}
function riskClass(flag) {
  return flag.includes("↑") ? "high" : "ok";
}

// -------------------- INICIALIZACIÓN DEL DOM --------------------
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-indices");
  const out = document.getElementById("output");

  if (!form || !out) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    try {
      const peso = parseFloat(document.getElementById("peso").value);
      const talla = parseFloat(document.getElementById("talla").value);
      const cintura = parseFloat(document.getElementById("cintura").value);
      const cadera = parseFloat(document.getElementById("cadera").value);
      const sexo = document.querySelector('input[name="sexo"]:checked')?.value;

      const r = calcularIndices(peso, talla, cintura, cadera, sexo);

      out.innerHTML = `
        <div><strong>IMC:</strong> ${r.IMC} 
          <span class="badge ${riskClassIMC(r.CategoriaIMC)}">${r.CategoriaIMC}</span>
        </div>

        <div><strong>ICC (cintura/cadera):</strong> ${r.ICC} 
          <span class="badge ${riskClass(r.RiesgoICC)}">${r.RiesgoICC}</span>
        </div>

        <div><strong>WHtR (cintura/talla):</strong> ${r.WHtR} 
          <span class="badge ${riskClass(r.RiesgoWHtR)}">${r.RiesgoWHtR}</span>
        </div>

        <div id="actions">
          <button type="button" id="copy" class="secondary">Copiar JSON</button>
          <button type="button" id="csv" class="secondary">Descargar CSV</button>
        </div>
      `;

      // Copiar como JSON
      document.getElementById("copy").onclick = () => {
        const data = {peso, talla, cintura, cadera, sexo, ...r};
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      };

      // Exportar CSV
      document.getElementById("csv").onclick = () => {
        const headers = ["peso","talla","cintura","cadera","sexo","IMC","CategoriaIMC","ICC","RiesgoICC","WHtR","RiesgoWHtR"];
        const values = [peso,talla,cintura,cadera,sexo,r.IMC,r.CategoriaIMC,r.ICC,r.RiesgoICC,r.WHtR,r.RiesgoWHtR];
        const csv = headers.join(",") + "\n" + values.join(",");
        const blob = new Blob([csv], {type:"text/csv"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "indices_antropometricos.csv";
        a.click();
        URL.revokeObjectURL(a.href);
      };

    } catch (err) {
      out.textContent = err.message;
    }
  });
});
