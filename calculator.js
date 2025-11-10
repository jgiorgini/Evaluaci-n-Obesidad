// calculator.js — Evaluación Obesidad (v3, sin JSON/CSV)

// ---------- utilidades ----------
function badge(text, kind = "ok") {
  return `<span class="badge ${kind}">${text}</span>`;
}
function riskClassIMC(cat) {
  if (cat === "Normal") return "ok";
  if (cat === "Sobrepeso") return "warn";
  return "high"; // Bajo peso u Obesidad
}
function riskClass(flag) {
  return flag && flag.includes("↑") ? "high" : "ok";
}
function parseNum(el) {
  const v = parseFloat(el?.value);
  return Number.isFinite(v) && v > 0 ? v : null;
}

// ---------- cálculos independientes ----------
function calcIMC(peso, tallaM) {
  if (peso == null || tallaM == null) return null;
  const imc = peso / (tallaM ** 2);
  let categoriaIMC = "";
  if (imc < 18.5) categoriaIMC = "Bajo peso";
  else if (imc < 25) categoriaIMC = "Normal";
  else if (imc < 30) categoriaIMC = "Sobrepeso";
  else categoriaIMC = "Obesidad";
  return { IMC: Number(imc.toFixed(1)), CategoriaIMC: categoriaIMC };
}

function calcICC(cinturaCm, caderaCm, sexo) {
  if (cinturaCm == null || caderaCm == null) return null;
  const icc = cinturaCm / caderaCm;
  let riesgoICC = "—";
  if (sexo === "M" || sexo === "F") {
    const limite = sexo === "M" ? 0.90 : 0.85;
    riesgoICC = icc > limite ? "↑ riesgo" : "riesgo normal";
  }
  return { ICC: Number(icc.toFixed(2)), RiesgoICC: riesgoICC };
}

function calcWHtR(cinturaCm, tallaM) {
  if (cinturaCm == null || tallaM == null) return null;
  const whtr = cinturaCm / (tallaM * 100); // talla m→cm
  const riesgoWHtR = whtr > 0.5 ? "↑ riesgo" : "riesgo normal";
  return { WHtR: Number(whtr.toFixed(2)), RiesgoWHtR: riesgoWHtR };
}

// ---------- render ----------
function renderResultados(out, res) {
  const blocks = [];

  if (res.imc) {
    blocks.push(
      `<div><strong>IMC:</strong> ${res.imc.IMC} 
        ${badge(res.imc.CategoriaIMC, riskClassIMC(res.imc.CategoriaIMC))}
      </div>`
    );
  } else {
    blocks.push(`<div><strong>IMC:</strong> — ${badge("falta peso y/o talla","warn")}</div>`);
  }

  if (res.icc) {
    const chip = res.icc.RiesgoICC === "—"
      ? badge("sin riesgo (sexo no indicado)", "warn")
      : badge(res.icc.RiesgoICC, riskClass(res.icc.RiesgoICC));
    blocks.push(
      `<div><strong>ICC (cintura/cadera):</strong> ${res.icc.ICC} ${chip}</div>`
    );
  } else {
    blocks.push(`<div><strong>ICC:</strong> — ${badge("falta cintura y/o cadera","warn")}</div>`);
  }

  if (res.whtr) {
    blocks.push(
      `<div><strong>WHtR (cintura/talla):</strong> ${res.whtr.WHtR} 
        ${badge(res.whtr.RiesgoWHtR, riskClass(res.whtr.RiesgoWHtR))}
      </div>`
    );
  } else {
    blocks.push(`<div><strong>WHtR:</strong> — ${badge("falta cintura y/o talla","warn")}</div>`);
  }

  out.innerHTML = blocks.join("\n"); // ← sin botones
}

// ---------- wiring DOM ----------
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-indices");
  const out = document.getElementById("output");
  if (!form || !out) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const peso    = parseNum(document.getElementById("peso"));
    const talla   = parseNum(document.getElementById("talla"));
    const cintura = parseNum(document.getElementById("cintura"));
    const cadera  = parseNum(document.getElementById("cadera"));
    const sexo    = document.querySelector('input[name="sexo"]:checked')?.value || null;

    const res = {
      imc:  calcIMC(peso, talla),
      icc:  calcICC(cintura, cadera, sexo),
      whtr: calcWHtR(cintura, talla),
    };

    if (!res.imc && !res.icc && !res.whtr) {
      out.innerHTML = `<div>${badge("Ingresá al menos los datos de un índice","high")}</div>`;
      return;
    }

    renderResultados(out, res);
  });
});
