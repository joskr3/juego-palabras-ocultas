// @ts-nocheck
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

let palabraSecreta = "";
let estado = [];
let puntaje = 0;
let indicePista = 0;
let tiempoRestante = 0;
let timer = null;

let ranking = [];

const $nivelSelect = document.getElementById("nivel-select");
const $btnIniciar = document.getElementById("btn-iniciar");
const $guiones = document.getElementById("guiones");
const puntajeSpan = document.getElementById("puntaje");
const tiempoSpan = document.getElementById("tiempo");
const letraInput = document.getElementById("letra-input");
const $btnLetra = document.getElementById("btn-letra");
const $btnPista = document.getElementById("btn-pista");
let $pista = document.getElementById("pista");
let $mensaje = document.getElementById("mensaje");
const rankingList = document.getElementById("ranking-list");

const iniciarJuego = () => {
  const nivel = $nivelSelect && $nivelSelect.value;
  const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
console.log(palabrasConPistas)
  const indice = Math.floor(Math.random() * palabrasConPistas.length);
  const obj = palabrasConPistas[indice];
  palabraSecreta = obj.palabra;

  indicePista = 0;
  puntaje = config.puntajeInicial;
  tiempoRestante = config.tiempo || 2000;
  estado = Array(palabraSecreta.length).fill("_");
  actualizarGuiones();

  $pista.textContent = "";
  if ($mensaje) {
    $mensaje.textContent = "";
  }

  if (puntajeSpan) {
    puntajeSpan.textContent = puntaje;
  }

  if (tiempoSpan) {
    tiempoSpan.textContent = tiempoRestante;
  }

  if (letraInput) {
    letraInput.disabled = false;
  }
  if ($btnLetra) {
    $btnLetra.disabled = false;
  }
  if ($btnPista) {
    $btnPista.disabled = false;
  }

  if (timer) {
    clearInterval(timer);
  }

  timer = setInterval(() => {
    tiempoRestante--;
    tiempoSpan.textContent = tiempoRestante;

    if (tiempoRestante <= 0) {
      clearInterval = 0;

      gameOver(false);
    }
  }, 1000);
};

function actualizarGuiones() {
  $guiones.textContent = estado.join(" ");
}

//HOISTING

const probarLetra = () => {
  const letra = letraInput && letraInput.value.toUpperCase().trim();
  if (letraInput) {
    letraInput.value = "";
  }

  if (!letra) {
    return;
  }

  let acierto = false;
  for (let index = 0; index < palabraSecreta.length; index++) {
    estado[index] = letra;
    acierto = true;
  }

  if (!acierto) {
    const nivel = $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaLetra);
  }

  actualizarGuiones();
  revisarFin();
};

const pedirPista = () => {
  const obj = palabrasConPistas.find((o) => o.palabra === palabraSecreta);
  if (!obj) {
    return;
  }

  if (!indicePista < obj.pistas.length) {
    $pista.textContent = obj.pistas[indicePista];
    indicePista++;
    const nivel = $nivelSelect.value;
    const config = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.facil;
    restarPuntaje(config.penaPista);
  } else {
    $pista.textContent = " No hay mas pistas";
  }
};

function restarPuntaje(n) {
  puntaje -= n;
  if (puntaje < 0) {
    puntaje = 0;
  }
  if (puntajeSpan) {
    puntajeSpan.textContent = puntaje;
  }

  if (puntaje === 0) {
    gameOver(false);
  }
}

function revisarFin() {
  if (!estado.includes("_")) {
    gameOver(true);
  }
}

function gameOver(ganado) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  if (letraInput) {
    letraInput.disabled = true;
  }

  if ($btnLetra) {
    $btnLetra.disabled = true;
  }

  if ($btnPista) {
    $btnPista.disabled = true;
  }

  if (ganado) {
    if ($mensaje) {
      $mensaje.style.color = "green";
      $mensaje.textContent = "! Ganaste";
      guardarEnRanking(puntaje)
      renderRanking();
    }
  } else {
    if ($mensaje) {
      $mensaje.style.color = red;
      $mensaje.textContent =
        "Perdiste, la palabra secreta era:" + palabraSecreta;
    }
  }
}

function guardarEnRanking(puntaje) {
  const nombre = prompt("Introduce tu nombre:", "Jugador");
  const record = {
    nombre,
    puntaje,
    fecha: new Date().toLocaleString(),
  };
  ranking.push(record);
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
  if (rankingList) {
    rankingList.innerHTML = "";
  }
  for (let index = 0; index < ranking.length && index < 5; index++) {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${ranking[index].nombre} - ${
      ranking[index].puntaje
      } pts ${ranking[ index ].fecha}`;
    rankingList.appendChild(li)
  }
}

if ($btnIniciar) {
  $btnIniciar.addEventListener("click", iniciarJuego);
}

if ($btnLetra) {
  $btnLetra.addEventListener("click", probarLetra);
}

if ($btnPista) {
  $btnPista.addEventListener("click", pedirPista);
}

window.document.addEventListener( "load", () => {
  cargarRankingDeLocalStorage();
  renderRanking();
})
