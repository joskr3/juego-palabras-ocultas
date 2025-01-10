// @ts-nocheck
/******************************************************
 * (A) Datos base: Palabras con pistas + Config Nivel
 ******************************************************/
const palabrasConPistas = [
  {
    palabra: "JAVASCRIPT",
    pistas: [
      "Lenguaje de programacion para la web",
      "Se ejecuta en el navegador, y no es Java",
    ],
  },
  {
    palabra: "JAVA",
    pistas: ["Lenguaje no interpretado", "Springboot"],
  },
  {
    palabra: "PYTHON",
    pistas: ["Lenguaje para hacer IA", "Es interpretado"],
  },
];

const NIVEL_CONFIG = {
  facil: { puntajeInicial: 150, penaLetra: 5, penaPista: 10, tiempo: 120 },
  normal: { puntajeInicial: 100, penaLetra: 10, penaPista: 15, tiempo: 90 },
  dificil: { puntajeInicial: 80, penaLetra: 15, penaPista: 20, tiempo: 60 },
};

/******************************************************
 * (B) Variables globales
 ******************************************************/
let palabraSecreta = "";
let estado = [];
let puntaje = 0;
let indicePista = 0;
let tiempoRestante = 0;
let timer = null;

let letrasCorrectas = [];
let letrasIncorrectas = [];

let ranking = [];

/******************************************************
 * (C) Referencias DOM
 ******************************************************/
const $nivelSelect = document.getElementById("nivel-select");
const $btnIniciar = document.getElementById("btn-iniciar");
const $guiones = document.getElementById("guiones");
const $puntajeSpan = document.getElementById("puntaje");
const $tiempoSpan = document.getElementById("tiempo");
const $letraInput = document.getElementById("letra-input");
const $btnProbar = document.getElementById("btn-probar");
const $btnPista = document.getElementById("btn-pista");
const $pista = document.getElementById("pista");
const $mensaje = document.getElementById("mensaje");

const $correctas = document.getElementById("correctas");
const $incorrectas = document.getElementById("incorrectas");
const $rankingList = document.getElementById("ranking-list");

/******************************************************
 * (D) Eventos
 ******************************************************/
// (D1) Botón "Iniciar"
if ($btnIniciar) {
  $btnIniciar.addEventListener("click", () => {
    // quitar la clase bounce
    $btnIniciar.classList.remove("bounce");
    iniciarJuego();
  });
}

// (D2) Botón "Probar Letra"
if ($btnProbar) {
  $btnProbar.addEventListener("click", probarLetra);
}

// (D3) Botón "Pedir Pista"
if ($btnPista) {
  $btnPista.addEventListener("click", pedirPista);
}

// (D4) Cargar ranking al abrir la ventana
window.addEventListener("load", () => {
  cargarRankingDeLocalStorage();
  renderRanking();

  // Activar bounce en el botón Iniciar
  if ($btnIniciar) {
    $btnIniciar.classList.add("bounce");
  }
});

/******************************************************
 * (E) iniciarJuego()
 ******************************************************/
function iniciarJuego() {
  // 1) Nivel
  const nivel = $nivelSelect && $nivelSelect.value;
  const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;

  // 2) Seleccionar palabra
  const indice = Math.floor(Math.random() * palabrasConPistas.length);
  const obj = palabrasConPistas[indice];
  palabraSecreta = obj.palabra;

  // 3) Reiniciar variables
  indicePista = 0;
  puntaje = config.puntajeInicial;
  tiempoRestante = config.tiempo || 60;

  // 4) Crear estado con "_"
  estado = Array(palabraSecreta.length).fill("_");
  actualizarGuiones();

  // 5) Limpiar pista y mensaje
  if ($pista) $pista.textContent = "";
  if ($mensaje) $mensaje.textContent = "";

  if ($puntajeSpan) $puntajeSpan.textContent = puntaje;
  if ($tiempoSpan) $tiempoSpan.textContent = tiempoRestante;

  // 6) Vaciar arrays de letras correctas/incorrectas
  letrasCorrectas = [];
  letrasIncorrectas = [];
  renderLetrasUsadas();

  // Habilitar input y botones
  if ($letraInput) $letraInput.disabled = false;
  if ($btnProbar) $btnProbar.disabled = false;
  if ($btnPista) $btnPista.disabled = false;

  // 7) Timer
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    tiempoRestante--;
    if ($tiempoSpan) $tiempoSpan.textContent = tiempoRestante;
    if (tiempoRestante <= 0) {
      tiempoRestante = 0;
      clearInterval(timer);
      timer = null;
      gameOver(false);
    }
  }, 1000);
}

/******************************************************
 * (F) actualizarGuiones()
 ******************************************************/
function actualizarGuiones() {
  if ($guiones) {
    $guiones.textContent = estado.join(" ");
  }
}

/******************************************************
 * (G) probarLetra()
 ******************************************************/
function probarLetra() {
  const letra = $letraInput && $letraInput.value.toUpperCase().trim();
  if ($letraInput) {
    $letraInput.value = "";
  }
  if (!letra) return;

  // Ver si ya se usó incorrecta
  if (letrasIncorrectas.includes(letra)) {
    // no penalizamos 2 veces, regresamos
    return;
  }
  // Ver si ya se usó correcta
  if (letrasCorrectas.includes(letra)) {
    // ya se añadió, no pasa nada
    return;
  }

  let acierto = false;
  for (let i = 0; i < palabraSecreta.length; i++) {
    if (palabraSecreta[i] === letra) {
      estado[i] = letra;
      acierto = true;
    }
  }

  if (acierto) {
    letrasCorrectas.push(letra);
  } else {
    letrasIncorrectas.push(letra);
    const nivel = $nivelSelect && $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaLetra);
  }

  actualizarGuiones();
  renderLetrasUsadas();
  revisarFin();
}

/******************************************************
 * (H) pedirPista()
 ******************************************************/
function pedirPista() {
  const obj = palabrasConPistas.find((o) => o.palabra === palabraSecreta);
  if (!obj) return;

  if (indicePista < obj.pistas.length) {
    if ($pista) {
      $pista.textContent = obj.pistas[indicePista];
    }
    indicePista++;
    const nivel = $nivelSelect && $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaPista);
  } else {
    if ($pista) {
      $pista.textContent = "No hay más pistas.";
    }
  }
}

/******************************************************
 * (I) restarPuntaje(n)
 ******************************************************/
function restarPuntaje(n) {
  puntaje -= n;
  if (puntaje < 0) {
    puntaje = 0;
  }
  if ($puntajeSpan) {
    $puntajeSpan.textContent = puntaje;
  }
  if (puntaje === 0) {
    gameOver(false);
  }
}

/******************************************************
 * (J) revisarFin()
 ******************************************************/
function revisarFin() {
  if (!estado.includes("_")) {
    // ganó
    gameOver(true);
  }
}

/******************************************************
 * (K) gameOver(ganado)
 ******************************************************/
function gameOver(ganado) {
  // detener timer
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // deshabilitar
  if ($letraInput) $letraInput.disabled = true;
  if ($btnProbar) $btnProbar.disabled = true;
  if ($btnPista) $btnPista.disabled = true;

  if ($mensaje) {
    if (ganado) {
      $mensaje.style.color = "green";
      $mensaje.textContent = `¡Ganaste! La palabra era "${palabraSecreta}". Puntaje: ${puntaje}`;
      guardarEnRanking(puntaje);
      renderRanking();
    } else {
      $mensaje.style.color = "red";
      $mensaje.textContent = `¡Perdiste! La palabra era "${palabraSecreta}".`;
    }
  }
}

/******************************************************
 * (L) renderLetrasUsadas() => Muestra correctas/incorrectas
 ******************************************************/
function renderLetrasUsadas() {
  if ($correctas) {
    $correctas.textContent = letrasCorrectas.join(" ");
  }
  if ($incorrectas) {
    $incorrectas.textContent = letrasIncorrectas.join(" ");
  }
}

/******************************************************
 * (M) Ranking en localStorage
 ******************************************************/
function guardarEnRanking(puntaje) {
  const nombre = prompt("Introduce tu nombre:", "Jugador") || "Anónimo";
  const record = {
    nombre,
    puntaje,
    fecha: new Date().toLocaleString(),
  };
  ranking.push(record);
  // Ordenar desc
  ranking.sort((a, b) => b.puntaje - a.puntaje);
  localStorage.setItem("rankingPalabraOculta", JSON.stringify(ranking));
}

function cargarRankingDeLocalStorage() {
  const data = localStorage.getItem("rankingPalabraOculta");
  if (data) {
    try {
      ranking = JSON.parse(data);
    } catch (error) {
      ranking = [];
    }
  } else {
    ranking = [];
  }
}
function renderRanking() {
  if (!$rankingList) return;
  $rankingList.innerHTML = "";
  for (let i = 0; i < ranking.length && i < 5; i++) {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${ranking[i].nombre} - ${
      ranking[i].puntaje
    } pts (${ranking[i].fecha})`;
    $rankingList.appendChild(li);
  }
}
