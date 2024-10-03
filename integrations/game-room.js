// Seleciona todas as caixas e imagens
const boxes = document.querySelectorAll(".box");
const boxesPlayer2 = document.querySelectorAll("#player2Area .box");
const preparationZonePlayer2 = document.querySelector(
  "#preparationZonePlayer2"
);
const graveyardZonePlayer2 = document.querySelector("#graveyardZonePlayer2");
const extraZonePlayer2 = document.querySelector("#extraZonePlayer2");
const deckZonePlayer2 = document.querySelector("#deckZonePlayer2");
const deckZonePlayer1 = document.querySelector("#deckZonePlayer1");

const boxesGraveyardZonePlayer2 = graveyardZonePlayer2.querySelectorAll(".box");
const boxesExtraZonePlayer2 = extraZonePlayer2.querySelectorAll(".box");
const boxesPreparationZonePlayer2 =
  preparationZonePlayer2.querySelectorAll(".box");
const boxesBattleArea = document.querySelectorAll("#battleAreaP2 .box");

const knownZoneBoxes = getZoneBoxes("knownZone", 10);
const handZoneBoxes = getZoneBoxes("handZone", 9);

let knownZoneBoxesPlayer2 = [
  document.querySelector("#knownZoneP2e1"),
  document.querySelector("#knownZoneP2e2"),
  document.querySelector("#knownZoneP2e3"),
  document.querySelector("#knownZoneP2e4"),
  document.querySelector("#knownZoneP2e5"),
  document.querySelector("#knownZoneP2e6"),
  document.querySelector("#knownZoneP2e7"),
  document.querySelector("#knownZoneP2e8"),
  document.querySelector("#knownZoneP2e9"),
  document.querySelector("#knownZoneP2e10"),
];

let handZoneBoxesPlayer2 = [
  document.querySelector("#handZoneP2e1"),
  document.querySelector("#handZoneP2e2"),
  document.querySelector("#handZoneP2e3"),
  document.querySelector("#handZoneP2e4"),
  document.querySelector("#handZoneP2e5"),
  document.querySelector("#handZoneP2e6"),
  document.querySelector("#handZoneP2e7"),
  document.querySelector("#handZoneP2e8"),
  document.querySelector("#handZoneP2e9"),
];

let images = document.querySelectorAll(".image");

// CONTADORES DO HUD

let player1GamerTag = document.querySelector("#player1GamerTag");
let player1DeckSize = document.querySelector("#player1DeckSize");
let player1HandSize = document.querySelector("#player1HandSize");
let player1GravSize = document.querySelector("#player1GravSize");
let player1FaithSize = document.querySelector("#player1FaithSize");

let player2GamerTag = document.querySelector("#player2GamerTag");
let player2DeckSize = document.querySelector("#player2DeckSize");
let player2HandSize = document.querySelector("#player2HandSize");
let player2GravSize = document.querySelector("#player2GravSize");
let player2FaithSize = document.querySelector("#player2FaithSize");

player1GamerTag.innerHTML = '<i class="fa-solid fa-circle-user"></i>&nbsp;';
player1DeckSize.innerHTML = `<i class="fa-solid fa-database"></i>&nbsp;00`;
player1HandSize.innerHTML = `<i class="fa-solid fa-hand"></i>&nbsp;00`;
player1GravSize.innerHTML = `<i class="fa-solid fa-skull"></i>&nbsp;00`;
player1FaithSize.innerHTML = `&nbsp;00`;

// VARIÁVEIS INICIAIS

let gamerId = localStorage.getItem("gamerId");
let roomId = localStorage.getItem("roomId");
let deckHash = localStorage.getItem("deckHash");

let deck = [
  1, 5, 5, 9, 9, 11, 12, 12, 47, 47, 23, 24, 26, 43, 44, 50, 17, 17, 18, 18, 19,
  19, 29, 29, 30, 30, 42, 42, 48, 48,
];
let cardsFromDeck = [];

//VARIÁVEIS SOCKET

const host = window.location.hostname;
// const socketUrl = "wss://faithbattle-api.adaptable.app";
const socketUrl =  "ws://localhost:8080";
const socket = new WebSocket(socketUrl);

socket.onopen = () => {
  // Envia a mensagem de entrada na sala
  socket.send(JSON.stringify({ type: "join", gamerId, roomId, deckHash }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.boardState) {
    updateBoard(data.boardState, data.type === "move");
  }
};

// Função para obter as caixas de uma zona específica
function getZoneBoxes(zonePrefix, count) {
  const boxes = [];
  for (let i = 1; i <= count; i++) {
    const element = document.getElementById(`${zonePrefix}${i}`);
    if (element) {
      boxes.push(element);
    }
  }
  return boxes;
}

// Define as caixas que podem aceitar drag and drop
const droppableBoxes = [
  ...boxesPlayer2,
  ...boxesBattleArea,
  ...boxesGraveyardZonePlayer2,
  ...boxesExtraZonePlayer2,
  ...handZoneBoxes,
  ...boxesPreparationZonePlayer2,
].filter((box) => !box.classList.contains("knownZoneBox"));

// Função para adicionar eventos de drag and drop
function addDragAndDropEvents(box) {
  box.addEventListener("dragover", (e) => {
    e.preventDefault();
    box.classList.add("hovered");
  });

  box.addEventListener("dragleave", () => {
    box.classList.remove("hovered");
  });

  box.addEventListener("drop", (e) => {
    e.preventDefault();
    const draggedElementId = e.dataTransfer.getData("text/plain");

    setTimeout(() => {
      const draggedElement = document.getElementById(draggedElementId);

      if (draggedElementId == "") {
        updateDraggableImages();
        addDragAndDropEvents(box);
      } else {
        if (draggedElement) {
          if (
            box.children.length === 1 &&
            box.children[0].tagName.toLowerCase() === "i"
          ) {
            box.replaceChild(draggedElement, box.children[0]);
          } else {
            box.appendChild(draggedElement);
          }

          box.classList.remove("hovered");
          renderBattlefield();
        }
      }
    }, 10);
  });
}

// Adiciona os eventos de drag and drop nas caixas droppable
droppableBoxes.forEach(addDragAndDropEvents);

// Remove a funcionalidade de arrastar das caixas da zona conhecida e adiciona evento de clique
function removeDraggableAndAddClickEvent(box) {
  const imageDiv = box.querySelector('div.image[draggable="true"]');
  if (imageDiv) {
    imageDiv.removeAttribute("draggable");
  }

  box.addEventListener("click", () => toggleKnownCard(box));
}

knownZoneBoxes.forEach(removeDraggableAndAddClickEvent);

// Aplica estilos iniciais às caixas
boxes.forEach((box) => {
  box.style.boxShadow = "1px 1px 1px rgba(249, 250, 251, 1)"; // Branco
});

// Função para embaralhar o deck
function shuffleDeck() {
  deck = deck
    .sort(() => Math.random() - 0.5)
    .sort(() => Math.random() - 0.5)
    .sort(() => Math.random() - 0.5);
}

// Função para comprar uma carta do deck
function drawCard() {
  const choosenCardID = deck.pop();
  const choosenCard = cardsFromDeck.find(
    (card) => card.number === choosenCardID
  );

  if (choosenCard) {
    for (const handZoneBox of handZoneBoxesPlayer2) {
      if (!handZoneBox.querySelector("div.image")) {
        const newDiv = createCardElement(choosenCard);
        handZoneBox.innerHTML = "";
        handZoneBox.appendChild(newDiv);
        break;
      }
    }
  }

  renderBattlefield();
}

// Função para criar um elemento de carta
function createCardElement(card) {
  const newDiv = document.createElement("div");
  newDiv.classList.add("image");
  newDiv.draggable = true;
  newDiv.style.backgroundImage = `url('${card.img}')`;
  newDiv.style.boxShadow = getCardBoxShadow(card.type);
  return newDiv;
}

// Função para obter o box shadow baseado no tipo de carta
function getCardBoxShadow(type) {
  const shadows = {
    Milagre: "1px 1px 1px rgba(34, 211, 153, 1)", // Verde
    "Herói de Fé": "1px 1px 1px rgba(59, 130, 246, 1)", // Azul
    Pecado: "1px 1px 1px rgba(217, 76, 76, 1)", //Vermelho
    Artefato: "1px 1px 1px rgba(251, 191, 36, 1)", // Amarelo
    default: "1px 1px 1px rgba(249, 250, 251, 1)", // Branco
  };
  return shadows[type] || shadows["default"];
}

// Função para adicionar uma carta à zona conhecida
function addKnown() {
  for (const knownZoneBox of knownZoneBoxesPlayer2) {
    if (!knownZoneBox.querySelector("div.image")) {
      const newDiv = createKnownCardElement();
      knownZoneBox.innerHTML = "";
      knownZoneBox.appendChild(newDiv);
      // knownZoneBox.classList.add("inactiveKnown");
      break;
    }
  }

  // Atualiza a funcionalidade de drag para as novas imagens
  knownZoneBoxesPlayer2.forEach(removeDraggableAndAddClickEvent);

  renderBattlefield();
}

// Função para criar um elemento de carta conhecida
function createKnownCardElement() {
  const newDiv = document.createElement("div");
  newDiv.classList.add("image");
  newDiv.style.backgroundImage = "url('./img/versos/sabedoria.png')";
  newDiv.style.backgroundSize = "cover";
  newDiv.style.backgroundPosition = "center 24%";
  return newDiv;
}

// Função para remover uma carta da zona conhecida
function removeKnown() {
  for (let i = knownZoneBoxesPlayer2.length - 1; i >= 0; i--) {
    const knownZoneBox = knownZoneBoxesPlayer2[i];
    const imageDiv = knownZoneBox.querySelector("div.image");
    if (imageDiv) {
      knownZoneBox.removeChild(imageDiv);
      break;
    }
  }
  renderBattlefield();
}

// Função para alternar a imagem de fundo ao clicar na caixa
function toggleKnownCard(box) {
  const imageDiv = box.querySelector("div.image");
  if (imageDiv) {
    const currentImage = imageDiv.style.backgroundImage;
    imageDiv.style.backgroundSize = "cover";
    imageDiv.style.backgroundPosition = "center 24%";

    if (currentImage.includes("sabedoria.png")) {
      imageDiv.style.backgroundImage = "url('./img/sabedorias/37.png')";
    } else {
      imageDiv.style.backgroundImage = "url('./img/versos/sabedoria.png')";
    }
  }
  renderBattlefield();
}

// Funções para gerenciar pontos de fé
function addFaith() {
  let a = isNaN(
    document.querySelector("#player2FaithSize").innerHTML.replace("&nbsp;", "")
  )
    ? "00"
    : document
        .querySelector("#player2FaithSize")
        .innerHTML.replace("&nbsp;", "");
  a++;
  document.querySelector("#player2FaithSize").innerHTML =
    "&nbsp;" + formatNumber00(a);
  renderBattlefield();
}

function removeFaith() {
  let a = isNaN(
    document.querySelector("#player2FaithSize").innerHTML.replace("&nbsp;", "")
  )
    ? "00"
    : document
        .querySelector("#player2FaithSize")
        .innerHTML.replace("&nbsp;", "");
  if (a > 0) a--;
  document.querySelector("#player2FaithSize").innerHTML =
    "&nbsp;" + formatNumber00(a);
  renderBattlefield();
}

// Função para renderizar o campo de batalha
async function renderBattlefield() {
  await loadDeck();

  updateHUD();
  updateDeckZone();
  updateBoxIcons();

  // Adiciona evento de hover para pré-visualização da imagem
  document.querySelectorAll(".image").forEach((imageDiv) => {
    imageDiv.addEventListener("mouseover", () => {
      const imageUrl = imageDiv.style.backgroundImage.slice(5, -2); // Extrai a URL da imagem de fundo
      document.querySelector(".previewImgHover").src = imageUrl;
    });
  });

  sendBoard();
  updateHUD();
  updateDeckZone();
  updateDraggableImages();
}

// Função para carregar o deck
async function loadDeck() {
  const allCards = await getCards();
  cardsFromDeck = getCardsFromDeck(deck, allCards);
}

// Função para atualizar a zona do deck
function updateDeckZone() {
  if (deck.length > 0) {
    deckZonePlayer2.style.backgroundImage = "url('./img/versos/normal.png')";
  } else {
    deckZonePlayer2.style.backgroundImage = "";
  }
  deckZonePlayer2.style.backgroundSize = "cover";
  deckZonePlayer2.style.backgroundPosition = "center 24%";
  deckZonePlayer2.style.cursor = "pointer";

  deckZonePlayer1.style.backgroundImage = "url('./img/versos/normal.png')";
  deckZonePlayer1.style.backgroundSize = "cover";
  deckZonePlayer1.style.backgroundPosition = "center 24%";
  deckZonePlayer1.style.cursor = "pointer";
}

// Função para atualizar o HUD
function updateHUD() {
  const player2HandSizeCnt = countImages(handZoneBoxes);
  const player2GravSizeCnt = countImages(boxesGraveyardZonePlayer2);

  player2GamerTag.innerHTML = "&nbsp;" + localStorage.getItem("gamerId") + "";
  player2DeckSize.innerHTML = `&nbsp;${formatNumber00(deck.length)}`;
  player2HandSize.innerHTML = `&nbsp;${formatNumber00(player2HandSizeCnt)}`;
  player2GravSize.innerHTML = `&nbsp;${formatNumber00(player2GravSizeCnt)}`;
}

// Função para contar as imagens nas caixas
function countImages(zoneBoxes) {
  return Array.from(zoneBoxes).filter((box) => box.querySelector("div.image"))
    .length;
}

// Função para atualizar as imagens arrastáveis
function updateDraggableImages() {
  document.querySelectorAll(".image").forEach((image) => {
    image.id = `draggable-${Math.random().toString(36).substr(2, 9)}`;

    image.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text", e.target.id);
    });
  });
}

// Função para preencher a caixa com um ícone se estiver vazia
function updateBoxIcons() {
  boxes.forEach((box) => {
    if (box.children.length === 0) {
      const iconClass = getBoxIconClass(box);
      if (iconClass) {
        const iconElement = document.createElement("i");
        iconElement.classList.add("fas", "fa", "fa-solid", iconClass);
        box.appendChild(iconElement);
      }
    }
  });
}

// Função para obter a classe do ícone baseado na classe da caixa
function getBoxIconClass(box) {
  const iconClasses = {
    extraBox: "fa-circle-plus",
    graveyardBox: "fa-skull",
    handBox: "fa-hand",
    knownZoneBox: "fa-rotate",
    preparationZoneBox: "fa-hourglass-half",
    battleZoneBox: "fa-shield",
    battleAreaBoxUp: "fa-circle-chevron-up",
    battleAreaBoxDown: "fa-circle-chevron-down",
  };

  for (const className in iconClasses) {
    if (box.classList.contains(className)) {
      return iconClasses[className];
    }
  }

  return null;
}

// Função para formatar números com dois dígitos
function formatNumber00(num) {
  return num.toString().padStart(2, "0");
}

// Eventos do deck
deckZonePlayer2.addEventListener("drop", (e) => {
  const draggedElementId = e.dataTransfer.getData("text/plain");
  const draggedElement = document.getElementById(draggedElementId);

  if (draggedElement) {
    const cardDroppedId = draggedElement.style["background-image"]
      .split("/")[2]
      .split(".")[0];
    deck.push(parseInt(cardDroppedId));
    draggedElement.remove();
  }

  deckZonePlayer2.style.backgroundImage = "url('./img/versos/normal.png')";
  renderBattlefield();
});

function setRoomIDAndPlayerID() {
  if (!gamerId) {
    gamerId = prompt("Digite seu ID de usuário:");
    localStorage.setItem("gamerId", gamerId);
  }
  if (!roomId) {
    roomId = prompt("Digite o ID da sala:");
    localStorage.setItem("roomId", roomId);
  }
  if (!deckHash) {
    deckHash = prompt("Digite o Hash do Deck:");
    localStorage.setItem("deckHash", deckHash);
  }
}

function sendBoard() {
  const selectors = [
    //HUD
    { selector: "#player2GamerTag", mirrorSelector: "#player1GamerTag" },
    { selector: "#player2FaithSize", mirrorSelector: "#player1FaithSize" },
    { selector: "#player2HandSize", mirrorSelector: "#player1HandSize" },
    { selector: "#player2DeckSize", mirrorSelector: "#player1DeckSize" },
    { selector: "#player2GravSize", mirrorSelector: "#player1GravSize" },

    //HAND
    { selector: "#deckZonePlayer2", mirrorSelector: "#deckZonePlayer1" },
    { selector: "#handZoneP2e1", mirrorSelector: "#handZoneP1e9" },
    { selector: "#handZoneP2e2", mirrorSelector: "#handZoneP1e8" },
    { selector: "#handZoneP2e3", mirrorSelector: "#handZoneP1e7" },
    { selector: "#handZoneP2e4", mirrorSelector: "#handZoneP1e6" },
    { selector: "#handZoneP2e5", mirrorSelector: "#handZoneP1e5" },
    { selector: "#handZoneP2e6", mirrorSelector: "#handZoneP1e4" },
    { selector: "#handZoneP2e7", mirrorSelector: "#handZoneP1e3" },
    { selector: "#handZoneP2e8", mirrorSelector: "#handZoneP1e2" },
    { selector: "#handZoneP2e9", mirrorSelector: "#handZoneP1e1" },

    // KNOWN

    { selector: "#knownZoneP2e1", mirrorSelector: "#knownZoneP1e10" },
    { selector: "#knownZoneP2e2", mirrorSelector: "#knownZoneP1e9" },
    { selector: "#knownZoneP2e3", mirrorSelector: "#knownZoneP1e8" },
    { selector: "#knownZoneP2e4", mirrorSelector: "#knownZoneP1e7" },
    { selector: "#knownZoneP2e5", mirrorSelector: "#knownZoneP1e6" },
    { selector: "#knownZoneP2e6", mirrorSelector: "#knownZoneP1e5" },
    { selector: "#knownZoneP2e7", mirrorSelector: "#knownZoneP1e4" },
    { selector: "#knownZoneP2e8", mirrorSelector: "#knownZoneP1e3" },
    { selector: "#knownZoneP2e9", mirrorSelector: "#knownZoneP1e2" },
    { selector: "#knownZoneP2e10", mirrorSelector: "#knownZoneP1e1" },

    // PREPARATION

    {
      selector: "#preparationZoneP2e1",
      mirrorSelector: "#preparationZoneP1e10",
    },
    {
      selector: "#preparationZoneP2e2",
      mirrorSelector: "#preparationZoneP1e9",
    },
    {
      selector: "#preparationZoneP2e3",
      mirrorSelector: "#preparationZoneP1e8",
    },
    {
      selector: "#preparationZoneP2e4",
      mirrorSelector: "#preparationZoneP1e7",
    },
    {
      selector: "#preparationZoneP2e5",
      mirrorSelector: "#preparationZoneP1e6",
    },
    {
      selector: "#preparationZoneP2e6",
      mirrorSelector: "#preparationZoneP1e5",
    },
    {
      selector: "#preparationZoneP2e7",
      mirrorSelector: "#preparationZoneP1e4",
    },
    {
      selector: "#preparationZoneP2e8",
      mirrorSelector: "#preparationZoneP1e3",
    },
    {
      selector: "#preparationZoneP2e9",
      mirrorSelector: "#preparationZoneP1e2",
    },
    {
      selector: "#preparationZoneP2e10",
      mirrorSelector: "#preparationZoneP1e1",
    },

    // BATTLE

    {
      selector: "#battleZoneP2e1",
      mirrorSelector: "#battleZoneP1e10",
    },
    {
      selector: "#battleZoneP2e2",
      mirrorSelector: "#battleZoneP1e9",
    },
    {
      selector: "#battleZoneP2e3",
      mirrorSelector: "#battleZoneP1e8",
    },
    {
      selector: "#battleZoneP2e4",
      mirrorSelector: "#battleZoneP1e7",
    },
    {
      selector: "#battleZoneP2e5",
      mirrorSelector: "#battleZoneP1e6",
    },
    {
      selector: "#battleZoneP2e6",
      mirrorSelector: "#battleZoneP1e5",
    },
    {
      selector: "#battleZoneP2e7",
      mirrorSelector: "#battleZoneP1e4",
    },
    {
      selector: "#battleZoneP2e8",
      mirrorSelector: "#battleZoneP1e3",
    },
    {
      selector: "#battleZoneP2e9",
      mirrorSelector: "#battleZoneP1e2",
    },
    {
      selector: "#battleZoneP2e10",
      mirrorSelector: "#battleZoneP1e1",
    },

    // COMBAT

    {
      selector: "#combatZoneP2e1",
      mirrorSelector: "#combatZoneP1e10",
    },
    {
      selector: "#combatZoneP2e2",
      mirrorSelector: "#combatZoneP1e9",
    },
    {
      selector: "#combatZoneP2e3",
      mirrorSelector: "#combatZoneP1e8",
    },
    {
      selector: "#combatZoneP2e4",
      mirrorSelector: "#combatZoneP1e7",
    },
    {
      selector: "#combatZoneP2e5",
      mirrorSelector: "#combatZoneP1e6",
    },
    {
      selector: "#combatZoneP2e6",
      mirrorSelector: "#combatZoneP1e5",
    },
    {
      selector: "#combatZoneP2e7",
      mirrorSelector: "#combatZoneP1e4",
    },
    {
      selector: "#combatZoneP2e8",
      mirrorSelector: "#combatZoneP1e3",
    },
    {
      selector: "#combatZoneP2e9",
      mirrorSelector: "#combatZoneP1e2",
    },
    {
      selector: "#combatZoneP2e10",
      mirrorSelector: "#combatZoneP1e1",
    },

    // EXTRA

    {
      selector: "#extraZoneP2e1",
      mirrorSelector: "#extraZoneP1e1",
    },
    {
      selector: "#extraZoneP2e2",
      mirrorSelector: "#extraZoneP1e2",
    },
    {
      selector: "#extraZoneP2e3",
      mirrorSelector: "#extraZoneP1e3",
    },
    {
      selector: "#extraZoneP2e4",
      mirrorSelector: "#extraZoneP1e4",
    },
    {
      selector: "#extraZoneP2e5",
      mirrorSelector: "#extraZoneP1e5",
    },
    {
      selector: "#extraZoneP2e6",
      mirrorSelector: "#extraZoneP1e6",
    },
    {
      selector: "#extraZoneP2e7",
      mirrorSelector: "#extraZoneP1e7",
    },
    {
      selector: "#extraZoneP2e8",
      mirrorSelector: "#extraZoneP1e8",
    },
    {
      selector: "#extraZoneP2e9",
      mirrorSelector: "#extraZoneP1e9",
    },
    {
      selector: "#extraZoneP2e10",
      mirrorSelector: "#extraZoneP1e10",
    },

    // GRAVEYARD

    {
      selector: "#graveyardZoneP2e1",
      mirrorSelector: "#graveyardZoneP1e1",
    },
    {
      selector: "#graveyardZoneP2e2",
      mirrorSelector: "#graveyardZoneP1e2",
    },
    {
      selector: "#graveyardZoneP2e3",
      mirrorSelector: "#graveyardZoneP1e3",
    },
    {
      selector: "#graveyardZoneP2e4",
      mirrorSelector: "#graveyardZoneP1e4",
    },
    {
      selector: "#graveyardZoneP2e5",
      mirrorSelector: "#graveyardZoneP1e5",
    },
    {
      selector: "#graveyardZoneP2e6",
      mirrorSelector: "#graveyardZoneP1e6",
    },
    {
      selector: "#graveyardZoneP2e7",
      mirrorSelector: "#graveyardZoneP1e7",
    },
    {
      selector: "#graveyardZoneP2e8",
      mirrorSelector: "#graveyardZoneP1e8",
    },
    {
      selector: "#graveyardZoneP2e9",
      mirrorSelector: "#graveyardZoneP1e9",
    },
    {
      selector: "#graveyardZoneP2e10",
      mirrorSelector: "#graveyardZoneP1e10",
    },
    {
      selector: "#graveyardZoneP2e11",
      mirrorSelector: "#graveyardZoneP1e11",
    },
    {
      selector: "#graveyardZoneP2e12",
      mirrorSelector: "#graveyardZoneP1e12",
    },
    {
      selector: "#graveyardZoneP2e13",
      mirrorSelector: "#graveyardZoneP1e13",
    },
    {
      selector: "#graveyardZoneP2e14",
      mirrorSelector: "#graveyardZoneP1e14",
    },
    {
      selector: "#graveyardZoneP2e15",
      mirrorSelector: "#graveyardZoneP1e15",
    },
    {
      selector: "#graveyardZoneP2e16",
      mirrorSelector: "#graveyardZoneP1e16",
    },
    {
      selector: "#graveyardZoneP2e17",
      mirrorSelector: "#graveyardZoneP1e17",
    },
    {
      selector: "#graveyardZoneP2e18",
      mirrorSelector: "#graveyardZoneP1e18",
    },
    {
      selector: "#graveyardZoneP2e19",
      mirrorSelector: "#graveyardZoneP1e19",
    },
    {
      selector: "#graveyardZoneP2e20",
      mirrorSelector: "#graveyardZoneP1e20",
    },
    {
      selector: "#graveyardZoneP2e21",
      mirrorSelector: "#graveyardZoneP1e21",
    },
    {
      selector: "#graveyardZoneP2e22",
      mirrorSelector: "#graveyardZoneP1e22",
    },
    {
      selector: "#graveyardZoneP2e23",
      mirrorSelector: "#graveyardZoneP1e23",
    },
    {
      selector: "#graveyardZoneP2e24",
      mirrorSelector: "#graveyardZoneP1e24",
    },
    {
      selector: "#graveyardZoneP2e25",
      mirrorSelector: "#graveyardZoneP1e25",
    },
    {
      selector: "#graveyardZoneP2e26",
      mirrorSelector: "#graveyardZoneP1e26",
    },
    {
      selector: "#graveyardZoneP2e27",
      mirrorSelector: "#graveyardZoneP1e27",
    },
    {
      selector: "#graveyardZoneP2e28",
      mirrorSelector: "#graveyardZoneP1e28",
    },
    {
      selector: "#graveyardZoneP2e29",
      mirrorSelector: "#graveyardZoneP1e29",
    },
    {
      selector: "#graveyardZoneP2e30",
      mirrorSelector: "#graveyardZoneP1e30",
    },
  ];

  const boardState = selectors.map(({ selector, mirrorSelector }) => {
    const element = document.querySelector(selector);
    return {
      gamerId: gamerId,
      querySelector: selector,
      querySelectorMirror: mirrorSelector,
      content: element ? element.textContent : "",
      innerHTML: element ? element.innerHTML : "",
    };
  });

  const jsonBoardState = JSON.stringify({
    type: "move",
    roomId,
    gamerId,
    boardState,
  });

  socket.send(jsonBoardState);
}

function updateBoard(data, isAMoveRequisition) {

  let enemyState = {};

  if (isAMoveRequisition) {
    for (let key in data) {
      if (data.hasOwnProperty(key) && key != gamerId) {
        enemyState = data[key];
      }
    }
  } else {
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        enemyState[key] = data[key];
      }
    }
  }

  if (data && enemyState != {}) {
    for (let key in enemyState) {
      let objects = enemyState[key];

      // Verifica se 'objects' é um array
      if (Array.isArray(objects)) {
        objects.forEach((object) => {
          if (object?.querySelector && object?.querySelectorMirror) {
            let content =
              object.content != ""
                ? object.content
                : object.innerHTML
                ? object.innerHTML
                : "";

            if (object.gamerId == gamerId) {
              document.querySelector(object.querySelector).innerHTML = content;
            } else {
              document.querySelector(object.querySelectorMirror).innerHTML =
                content;
            }
          }
        });
      } else {
        // Trata 'objects' como um único objeto
        let content =
          objects.content != ""
            ? objects.content
            : objects.innerHTML
            ? objects.innerHTML
            : "";

        if (objects?.querySelector && objects?.querySelectorMirror) {
          if (objects.gamerId == gamerId) {
            document.querySelector(objects.querySelector).innerHTML = content;
          } else {
            document.querySelector(objects.querySelectorMirror).innerHTML =
              content;
          }
        }
      }
    }
  }

  updateBoxIcons();
}

setRoomIDAndPlayerID();
shuffleDeck();
renderBattlefield();

window.onload = () => {
  setTimeout(renderBattlefield, 150); // 5000 milissegundos = 5 segundos
  setTimeout(renderBattlefield, 250); // 5000 milissegundos = 5 segundos
  setTimeout(renderBattlefield, 500); // 5000 milissegundos = 5 segundos
  setTimeout(renderBattlefield, 1000); // 5000 milissegundos = 5 segundos
  setTimeout(renderBattlefield, 2000); // 5000 milissegundos = 5 segundos
  setTimeout(renderBattlefield, 3000); // 5000 milissegundos = 5 segundos
  setTimeout(addKnown, 3000); // 5000 milissegundos = 5 segundos
  setTimeout(removeKnown, 3001); // 5000 milissegundos = 5 segundos
};
