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
let estado = []; // "_" o letras
let puntaje = 0;
let indicePista = 0;
let tiempoRestante = 0;
let timer = null;

// Arrays para letras usadas
let letrasCorrectas = [];
let letrasIncorrectas = [];

// Ranking
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
const $btnPista = document.getElementById("btn-pista");
const $pista = document.getElementById("pista");
const $mensaje = document.getElementById("mensaje");

// Secciones de letras usadas
const $correctas = document.getElementById("correctas");
const $incorrectas = document.getElementById("incorrectas");

// Ranking
const $rankingList = document.getElementById("ranking-list");

/******************************************************
 * (D) Eventos
 ******************************************************/
// (D1) Botón "Iniciar" con animación bounce -> Quitar la animación en el click
if ($btnIniciar) {
  $btnIniciar.addEventListener("click", () => {
    // quitar la clase bounce
    $btnIniciar.classList.remove("bounce");
    iniciarJuego();
  });
}

// (D2) Input => al presionar Enter, probarLetra
if ($letraInput) {
  $letraInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      probarLetra();
    }
  });
}

// (D3) Botón pedir pista
if ($btnPista) {
  $btnPista.addEventListener("click", pedirPista);
}

// (D4) Al cargar => cargar ranking
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
  // (E1) Obtener nivel
  const nivel = $nivelSelect && $nivelSelect.value;
  const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;

  // (E2) Seleccionar palabra
  const indice = Math.floor(Math.random() * palabrasConPistas.length);
  const obj = palabrasConPistas[indice];
  palabraSecreta = obj.palabra;

  // (E3) Reiniciar variables
  indicePista = 0;
  puntaje = config.puntajeInicial;
  tiempoRestante = config.tiempo || 60;

  // (E4) Crear estado con "_"
  estado = Array(palabraSecreta.length).fill("_");
  actualizarGuiones();

  // (E5) Limpiar y mostrar
  if ($pista) $pista.textContent = "";
  if ($mensaje) $mensaje.textContent = "";
  if ($puntajeSpan) $puntajeSpan.textContent = puntaje;
  if ($tiempoSpan) $tiempoSpan.textContent = tiempoRestante;

  // (E6) Vaciar arrays de letras usadas y mostrarlos
  letrasCorrectas = [];
  letrasIncorrectas = [];
  renderLetrasUsadas();

  // Habilitar input y botón
  if ($letraInput) $letraInput.disabled = false;
  if ($btnPista) $btnPista.disabled = false;

  // (E7) Timer
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

  // (G1) Ver si ya se usó incorrecta
  if (letrasIncorrectas.includes(letra)) {
    // no penalizamos ni nada, simplemente ignoramos
    return;
  }
  // (G2) Ver si ya se usó correcta
  if (letrasCorrectas.includes(letra)) {
    // ya se añadió, no pasa nada
    return;
  }

  // (G3) Buscar en la palabra
  let acierto = false;
  for (let i = 0; i < palabraSecreta.length; i++) {
    if (palabraSecreta[i] === letra) {
      estado[i] = letra;
      acierto = true;
    }
  }

  if (acierto) {
    // añadir a letrasCorrectas
    letrasCorrectas.push(letra);
  } else {
    // penalizar y añadir a letrasIncorrectas
    letrasIncorrectas.push(letra);
    const nivel = $nivelSelect && $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaLetra);
  }

  // (G4) Actualizar guiones y render
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
    gameOver(true);
  }
}

/******************************************************
 * (K) gameOver(ganado)
 ******************************************************/
function gameOver(ganado) {
  // Detener timer
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  // Deshabilitar input
  if ($letraInput) $letraInput.disabled = true;
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
 * (L) Sección de letras usadas (correctas/incorrectas)
 ******************************************************/
function renderLetrasUsadas() {
  const $c = document.getElementById("correctas");
  const $i = document.getElementById("incorrectas");
  if ($c) $c.textContent = letrasCorrectas.join(" ");
  if ($i) $i.textContent = letrasIncorrectas.join(" ");
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
  // Orden desc
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
      console.error(error);
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
