// calculator.js — Evaluación Obesidad (v5)
// ---------------------------------------
// - Cálculos independientes (IMC, ICC, WHtR)
// - Clasificación de IMC con estadio y color
// - Diseño compatible con el HTML actual
// - API STCA (evento anthro:calculated + callback)

//////////////////// utilidades UI ////////////////////
function badge(text, kind = "ok") {
  return `<span class="badge ${kind}">${text}</span>`;
}
function riskClassIMC(cat) {
  switch (cat) {
    case "Normal": return "ok";
    case "Sobrepeso": return "warn";
    case "Obesidad clase I":
    case "Obesidad clase II":
    case "Obesidad clase III":
      return "high";
    default: return "warn"; // bajo peso
  }
}
function riskClass(flag) {
  return flag && flag.includes("↑") ? "high" : "ok";
}
function parseNum(el) {
  const v = parseFloat(el?.value);
  return Number.isFinite(v) && v > 0 ? v : null;
}

//////////////////// cálculos ////////////////////
function calcIMC(peso, tallaM) {
  if (peso == null || tallaM == null) return null;
  const imc = peso / (tallaM ** 2);

  let categoriaIMC = "";
  if (imc < 18.5) categoriaIMC = "Bajo peso";
  else if (imc < 25) categoriaIMC = "Normal";
  else if (imc < 30) categoriaIMC = "Sobrepeso";
  else if (imc < 35) categoriaIMC = "Obesidad clase I";
  else if (imc < 40) categoriaIMC = "Obesidad clase II";
  else categoriaIMC = "Obesidad clase III";

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
  const whtr = cinturaCm / (tallaM * 100);
  let riesgoWHtR = "riesgo normal";
  if (whtr >= 0.6) riesgoWHtR = "↑↑ riesgo muy alto";
  else if (whtr >= 0.5) riesgoWHtR = "↑ riesgo";
  return { WHtR: Number(whtr.toFixed(2)), RiesgoWHtR: riesgoWHtR };
}

//////////////////// render ////////////////////
function renderResultados(out, res) {
  const blocks = [];

  // --- IMC ---
  if (res.imc) {
    const cat = res.imc.CategoriaIMC;
    blocks.push(
      `<div><strong>IMC:</strong> ${res.imc.IMC} kg/m² 
        ${badge(cat, riskClassIMC(cat))}
      </div>`
    );
  } else {
    blocks.push(`<div><strong>IMC:</strong> — ${badge("falta peso y/o talla","warn")}</div>`);
  }

  // --- ICC ---
  if (res.icc) {
    const chip = res.icc.RiesgoICC === "—"
      ? badge("sin riesgo (sexo no indicado)", "warn")
      : badge(res.icc.RiesgoICC, riskClass(res.icc.RiesgoICC));
    blocks.push(`<div><strong>ICC (cintura/cadera):</strong> ${res.icc.ICC} ${chip}</div>`);
  } else {
    blocks.push(`<div><strong>ICC:</strong> — ${badge("falta cintura y/o cadera","warn")}</div>`);
  }

  // --- WHtR ---
  if (res.whtr) {
    const chip = badge(res.whtr.RiesgoWHtR, riskClass(res.whtr.RiesgoWHtR));
    blocks.push(`<div><strong>WHtR (cintura/talla):</strong> ${res.whtr.WHtR} ${chip}</div>`);
  } else {
    blocks.push(`<div><strong>WHtR:</strong> — ${badge("falta cintura y/o talla","warn")}</div>`);
  }

  out.innerHTML = blocks.join("\n");
}

//////////////////// integración STCA ////////////////////
const ObesityCalc = (() => {
  let last = null;
  let listener = null;

  function compute(payload) {
    const { peso, talla, cintura, cadera, sexo } = payload;
    const imc  = calcIMC(peso, talla);
    const icc  = calcICC(cintura, cadera, sexo);
    const whtr = calcWHtR(cintura, talla);

    last = { peso, talla, cintura, cadera, sexo, ...(imc||{}), ...(icc||{}), ...(whtr||{}) };

    const ev = new CustomEvent("anthro:calculated", { detail: last });
    window.dispatchEvent(ev);
    if (typeof listener === "function") listener(last);
    return last;
  }

  return {
    compute,
    onResults(cb){ listener = cb },
    getLast(){ return last }
  };
})();
window.ObesityCalc = ObesityCalc;

//////////////////// wiring DOM ////////////////////
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

    const result = ObesityCalc.compute({ peso, talla, cintura, cadera, sexo });

    const res = {
      imc:  result.IMC ? { IMC: result.IMC, CategoriaIMC: result.CategoriaIMC } : null,
      icc:  result.ICC ? { ICC: result.ICC, RiesgoICC: result.RiesgoICC } : null,
      whtr: result.WHtR ? { WHtR: result.WHtR, RiesgoWHtR: result.RiesgoWHtR } : null
    };

    if (!res.imc && !res.icc && !res.whtr) {
      out.innerHTML = `<div>${badge("Ingresá al menos los datos de un índice","high")}</div>`;
      return;
    }
    renderResultados(out, res);
  });
});
