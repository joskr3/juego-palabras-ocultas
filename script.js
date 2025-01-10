// @ts-nocheck
// @ts-nocheck
/****************************************
 * 1) Lista de palabras con pistas
 ****************************************/
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

/****************************************
 * 2) Configuración de niveles
 ****************************************/
const NIVEL_CONFIG = {
  facil: {
    puntajeInicial: 150,
    penaLetra: 5,
    penaPista: 10,
  },
  normal: {
    puntajeInicial: 100,
    penaLetra: 10,
    penaPista: 15,
  },
  dificil: {
    puntajeInicial: 80,
    penaLetra: 15,
    penaPista: 20,
  },
};

/****************************************
 * 3) Variables globales
 ****************************************/
let palabraSecreta = "";
let estado = [];           // array de '_' o letras adivinadas
let puntaje = 0;
let indicePista = 0;
let tiempoRestante = 0;
let timer = null;

// Ranking en localStorage
let ranking = [];

/****************************************
 * 4) Referencias del DOM
 ****************************************/
const $nivelSelect = document.getElementById("nivel-select");
const $btnIniciar  = document.getElementById("btn-iniciar");
const $guiones     = document.getElementById("guiones");
const puntajeSpan  = document.getElementById("puntaje");
const tiempoSpan   = document.getElementById("tiempo");
const letraInput   = document.getElementById("letra-input");
const $btnLetra    = document.getElementById("btn-letra");
const $btnPista    = document.getElementById("btn-pista");
const $pista       = document.getElementById("pista");
const $mensaje     = document.getElementById("mensaje");
const rankingList  = document.getElementById("ranking-list");

/****************************************
 * 5) Función iniciarJuego
 ****************************************/
const iniciarJuego = () => {
  // 5a) Obtener el nivel
  const nivel = $nivelSelect && $nivelSelect.value;
  const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;

  // 5b) Seleccionar palabra aleatoria
  const indice = Math.floor(Math.random() * palabrasConPistas.length);
  const obj = palabrasConPistas[indice];
  palabraSecreta = obj.palabra;

  // 5c) Reiniciar variables
  indicePista = 0;
  puntaje = config.puntajeInicial;
  // Si en la config no hay 'tiempo', por defecto usar 60 seg
  tiempoRestante = config.tiempo || 60;

  // 5d) Crear estado con '_' 
  estado = Array(palabraSecreta.length).fill("_");
  actualizarGuiones();

  // 5e) Limpiar pista y mensaje
  if ($pista)   $pista.textContent = "";
  if ($mensaje) $mensaje.textContent = "";

  // 5f) Mostrar puntaje y tiempo
  if (puntajeSpan) puntajeSpan.textContent = puntaje;
  if (tiempoSpan)  tiempoSpan.textContent  = tiempoRestante;

  // 5g) Habilitar input y botones
  if (letraInput) letraInput.disabled = false;
  if ($btnLetra)  $btnLetra.disabled = false;
  if ($btnPista)  $btnPista.disabled = false;

  // 5h) Detener timer anterior (si existía) y crear nuevo
  if (timer) {
    clearInterval(timer);
  }
  timer = setInterval(() => {
    tiempoRestante--;
    if (tiempoSpan) tiempoSpan.textContent = tiempoRestante;

    if (tiempoRestante <= 0) {
      clearInterval(timer);
      timer = null;
      // Se acaba por tiempo
      gameOver(false);
    }
  }, 1000);
};

/****************************************
 * 6) actualizarGuiones
 ****************************************/
function actualizarGuiones() {
  if ($guiones) {
    $guiones.textContent = estado.join(" ");
  }
}

/****************************************
 * 7) Probar Letra
 ****************************************/
const probarLetra = () => { 
  const letra = letraInput && letraInput.value.toUpperCase().trim();

  if (letraInput) {
    letraInput.value = "";
  }

  // 7a) Si no hay letra, salir
  if (!letra) {
    return;
  }

  // 7b) Revisar si la letra está en la palabraSecreta
  let acierto = false;
  for (let i = 0; i < palabraSecreta.length; i++) {
    // SOLO si coincide
    if (palabraSecreta[i] === letra) {
      estado[i] = letra;
      acierto = true;
    }
  }

  // 7c) Si no hubo aciertos, penalizar
  if (!acierto) {
    const nivel = $nivelSelect && $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaLetra);
  }

  // 7d) Actualizar y revisar
  actualizarGuiones();
  revisarFin();
};

/****************************************
 * 8) pedirPista
 ****************************************/
const pedirPista = () => {
  // 8a) Buscamos el objeto de la palabra actual
  const obj = palabrasConPistas.find((o) => o.palabra === palabraSecreta);
  if (!obj) return;

  // 8b) Corregir la condición:
  // if (!indicePista < obj.pistas.length) => esto era un error
  // Debería ser: if (indicePista < obj.pistas.length)
  if (indicePista < obj.pistas.length) {
    if ($pista) $pista.textContent = obj.pistas[indicePista];
    indicePista++;

    // penalizar
    const nivel = $nivelSelect && $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaPista);
  } else {
    if ($pista) $pista.textContent = "No hay más pistas";
  }
};

/****************************************
 * 9) restarPuntaje(n)
 ****************************************/
function restarPuntaje(n) {
  puntaje -= n;
  if (puntaje < 0) {
    puntaje = 0;
  }
  if (puntajeSpan) {
    puntajeSpan.textContent = puntaje;
  }
  if (puntaje === 0) {
    // se acabó
    gameOver(false);
  }
}

/****************************************
 * 10) revisarFin
 ****************************************/
function revisarFin() {
  // si no hay '_' => adivinó todo
  if (!estado.includes("_")) {
    gameOver(true);
  }
}

/****************************************
 * 11) gameOver(ganado)
 ****************************************/
function gameOver(ganado) {
  // 11a) Detener timer
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  // 11b) Deshabilitar inputs
  if (letraInput) letraInput.disabled = true;
  if ($btnLetra)  $btnLetra.disabled  = true;
  if ($btnPista)  $btnPista.disabled  = true;

  // 11c) Mostrar mensaje
  if ($mensaje) {
    if (ganado) {
      $mensaje.style.color = "green";
      $mensaje.textContent = `¡Ganaste! La palabra era "${palabraSecreta}". Puntaje: ${puntaje}`;
      // Guardar ranking
      guardarEnRanking(puntaje);
      renderRanking();
    } else {
      // Ojo: poner "red" con comillas
      $mensaje.style.color = "red";
      $mensaje.textContent = `Perdiste, la palabra secreta era: ${palabraSecreta}`;
    }
  }
}

/****************************************
 * 12) Manejo Ranking (localStorage)
 ****************************************/
function guardarEnRanking(puntaje) {
  const nombre = prompt("Introduce tu nombre:", "Jugador") || "Anónimo";
  const record = {
    nombre,
    puntaje,
    fecha: new Date().toLocaleString(),
  };
  ranking.push(record);
  // Orden descendente por puntaje
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
  if (!rankingList) return;
  rankingList.innerHTML = "";
  for (let i = 0; i < ranking.length && i < 5; i++) {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${ranking[i].nombre} - ${ranking[i].puntaje} pts (${ranking[i].fecha})`;
    rankingList.appendChild(li);
  }
}

/****************************************
 * 13) Listeners finales para iniciar y letras/pistas
 ****************************************/
if ($btnIniciar) {
  $btnIniciar.addEventListener("click", iniciarJuego);
}

if ($btnLetra) {
  $btnLetra.addEventListener("click", probarLetra);
}

if ($btnPista) {
  $btnPista.addEventListener("click", pedirPista);
}

/****************************************
 * 14) Cargar ranking al abrir la página
 ****************************************/
window.addEventListener("load", () => {
  cargarRankingDeLocalStorage();
  renderRanking();
});
