// Seleciona todas as caixas e imagens
const boxes = document.querySelectorAll(".box");
const boxesPlayer2 = player2Area.querySelectorAll(".box");

const preparationZonePlayer2 = document.querySelector(
  "#preparationZonePlayer2"
);
const graveyardZonePlayer2 = document.querySelector("#graveyardZonePlayer2");
const extraZonePlayer2 = document.querySelector("#extraZonePlayer2");
const deckZonePlayer2 = document.querySelector("#deckZonePlayer2");

const boxesGraveyardZonePlayer2 = graveyardZonePlayer2.querySelectorAll(".box");
const boxesExtraZonePlayer2 = extraZonePlayer2.querySelectorAll(".box");
const boxesPreparationZonePlayer2 =
  preparationZonePlayer2.querySelectorAll(".box");

const boxesBattleArea = battleArea.querySelectorAll(".box");
let images = document.querySelectorAll(".image");

//CONTADORES DO HUD  -------------------------------------------------------------------------

let player2GamerTag = document.querySelector("#player2GamerTag");
let player2DeckSize = document.querySelector("#player2DeckSize");
let player2HandSize = document.querySelector("#player2HandSize");
let player2GravSize = document.querySelector("#player2GravSize");
let player2FaithSize = document.querySelector("#player2FaithSize");

let player1FaithCounter = 0;
let player2FaithCounter = 0;

//VARIÁVEIS INICIAIS -------------------------------------------------------------------------

let deck = [
  1, 5, 5, 9, 9, 11, 12, 12, 47, 47, 23, 24, 26, 43, 44, 50, 17, 17, 18, 18, 19,
  19, 29, 29, 30, 30, 42, 42, 48, 48,
];
let cardsFromDeck = [];

// Atualiza a lista de caixas da zona conhecida
const knownZoneBoxes = [];
for (let i = 1; i <= 10; i++) {
  const element = document.getElementById(`knownZone${i}`);
  if (element) {
    knownZoneBoxes.push(element);
  }
}

const handZoneBoxes = [];
for (let i = 1; i <= 9; i++) {
  const element = document.getElementById(`handZone${i}`);
  if (element) {
    handZoneBoxes.push(element);
  }
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

// Adiciona os eventos de drag and drop nas caixas droppable
droppableBoxes.forEach((box) => {
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
    }, 50);
  });
});

// Remove a funcionalidade de arrastar das caixas da zona conhecida
knownZoneBoxes.forEach((box) => {
  const imageDiv = box.querySelector('div.image[draggable="true"]');
  if (imageDiv) {
    imageDiv.removeAttribute("draggable");
  }

  // Adiciona o evento de clique para alternar a imagem
  box.addEventListener("click", () => toggleKnownCard(box));
});

boxes.forEach((box) => {
  box.style.boxShadow = "1px 1px 1px rgba(249, 250, 251, 1)"; // Branco
});

renderBattlefield();

//DECK ---------------------------------------------------------------------------------

deckZonePlayer2.addEventListener("drop", (e) => {
  const draggedElementId = e.dataTransfer.getData("text/plain");
  const draggedElement = document.getElementById(draggedElementId);

  if (draggedElement) {
    let cardDroppedId = draggedElement.style["background-image"]
      .split("/")[2]
      .split(".")[0];
    deck.push(parseInt(cardDroppedId));
  }

  deckZonePlayer2.style.backgroundImage = "url('./img/versos/normal.png')";

  if (draggedElement) {
    draggedElement.remove();
  }

  renderBattlefield();
});

//DECK -------------------------------------------------------------------------------

function shuffleDeck() {
  // Cria uma cópia do array original para não modificá-lo diretamente
  let shuffledArray = deck.slice();

  // Função de comparação para o método sort()
  function compareRandom() {
    return Math.random() - 0.5; // Retorna um número aleatório entre -0.5 e 0.5
  }

  // Embaralha o array usando o método sort() com a função de comparação
  shuffledArray.sort(compareRandom);
  shuffledArray.sort(compareRandom);

  deck = shuffledArray;
}

function drawCard() {
  let choosenCardID = deck.pop();
  let choosenCard = cardsFromDeck.filter((a) => a.number == choosenCardID);

  for (const handZoneBox of handZoneBoxes) {
    if (
      !handZoneBox.querySelector("div.image") &&
      choosenCardID &&
      choosenCard &&
      choosenCard[0]
    ) {
      const newDiv = document.createElement("div");
      newDiv.classList.add("image");
      newDiv.draggable = true;
      newDiv.style.backgroundImage = "url('" + choosenCard[0].img + "')";
      handZoneBox.innerHTML = "";

      if (choosenCard[0].type == "Milagre") {
        newDiv.style.boxShadow = "1px 1px 1px rgba(34, 211, 153, 1)"; // Verde
      } else if (choosenCard[0].type == "Herói de Fé") {
        newDiv.style.boxShadow = "1px 1px 1px rgba(59, 130, 246, 1)"; // Azul
      } else if (choosenCard[0].type == "Pecado") {
        newDiv.style.boxShadow = "1px 1px 1px rgba(255, 255, 0, 1)";
      } else if (choosenCard[0].type == "Artefato") {
        newDiv.style.boxShadow = "1px 1px 1px rgba(251, 191, 36, 1)"; // Amarelo
      } else {
        newDiv.style.boxShadow = "1px 1px 1px rgba(249, 250, 251, 1)"; // Branco
      }

      handZoneBox.appendChild(newDiv);
      break;
    }
  }

  renderBattlefield();
}

//SABEDORIAS -------------------------------------------------------------------------

function addKnown() {
  for (const knownZoneBox of knownZoneBoxes) {
    if (!knownZoneBox.querySelector("div.image")) {
      const newDiv = document.createElement("div");
      newDiv.classList.add("image");
      newDiv.style.backgroundImage = "url('./img/versos/sabedoria.png')";
      newDiv.style["background-size"] = "cover";
      newDiv.style["background-position"] = "center 24%";
      knownZoneBox.innerHTML = "";

      knownZoneBox.appendChild(newDiv);
      break;
    }
  }

  // Atualiza a funcionalidade de drag para as novas imagens
  knownZoneBoxes.forEach((box) => {
    const imageDiv = box.querySelector("div.image");
    if (imageDiv) {
      imageDiv.removeAttribute("draggable");
    }
  });

  renderBattlefield();
}

// Função para remover uma carta da zona conhecida
function removeKnown() {
  for (let i = knownZoneBoxes.length - 1; i >= 0; i--) {
    const knownZoneBox = knownZoneBoxes[i];
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
    imageDiv.style["background-size"] = "cover";
    imageDiv.style["background-position"] = "center 24%";

    if (currentImage.includes("sabedoria.png")) {
      imageDiv.style.backgroundImage = "url('./img/sabedorias/37.png')";
    } else {
      imageDiv.style.backgroundImage = "url('./img/versos/sabedoria.png')";
    }
  }
  renderBattlefield();
}

//PONTOS DE FÉ ----------------------------------------------------------------------

function addFaith() {
  player2FaithCounter++;
  renderBattlefield();
}

function removeFaith() {
  if (player2FaithCounter > 0) player2FaithCounter--;
  renderBattlefield();
}

//ATUALIZAR TELA --------------------------------------------------------------------

async function renderBattlefield() {
  async function loadDeck() {
    let allCards = await getCards();
    cardsFromDeck = getCardsFromDeck(deck, allCards);
  }

  await loadDeck();

  if (deck.length > 0) {
    deckZonePlayer2.style.backgroundImage = "url('./img/versos/normal.png')";
  } else {
    deckZonePlayer2.style.backgroundImage = "";
  }
  deckZonePlayer2.style["background-size"] = "cover";
  deckZonePlayer2.style["background-position"] = "center 24%";
  deckZonePlayer2.style["cursor"] = "pointer";

  let player2HandSizeCnt = 0;
  let player2GravSizeCnt = 0;

  for (const handZoneBox of handZoneBoxes) {
    if (handZoneBox.querySelector("div.image")) {
      player2HandSizeCnt++;
    }
  }
  for (const handZoneBox of boxesGraveyardZonePlayer2) {
    if (handZoneBox.querySelector("div.image")) {
      player2GravSizeCnt++;
    }
  }

  player2GamerTag.innerHTML =
    '<i class="fa-solid fa-circle-user"></i>&nbsp;#TENMA007';
  player2DeckSize.innerHTML =
    '<i class="fa-solid fa-database"></i>&nbsp;' +
    formatNumber00(deck.length) +
    "";
  player2HandSize.innerHTML =
    '<i class="fa-solid fa-hand"></i>&nbsp;' +
    formatNumber00(player2HandSizeCnt);
  player2GravSize.innerHTML =
    '<i class="fa-solid fa-skull"></i>&nbsp;' +
    formatNumber00(player2GravSizeCnt);
  player2FaithSize.innerHTML =
    '<i class="fa-solid fa-heart-pulse"></i>&nbsp;' +
    formatNumber00(player2FaithCounter);

  let images = document.querySelectorAll(".image");

  images.forEach((image) => {
    image.id = `draggable-${Math.random().toString(36).substr(2, 9)}`;

    image.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text", e.target.id);
    });
  });

  document.querySelectorAll(".image").forEach((imageDiv) => {
    imageDiv.addEventListener("mouseover", () => {
      const classes = imageDiv.classList;
      let imageUrl = "";

      classes.forEach((className) => {
        if (className.startsWith("image")) {
          const bgImage = imageDiv.style.backgroundImage;
          imageUrl = bgImage.slice(5, -2); // Extrai a URL da imagem de fundo
        }
      });

      document.querySelector(".previewImgHover").src = imageUrl;
    });
  });

  boxes.forEach((box) => {
    fillIconBox(box);
  });
}

// Função para preencher a caixa com um ícone se estiver vazia
function fillIconBox(box) {
  if (box.children.length === 0) {
    let iconClass;
    // Verifica a classe do box e define a classe do ícone
    if (box.classList.contains("extraBox")) {
      iconClass = "fa-circle-plus";
    } else if (box.classList.contains("graveyardBox")) {
      iconClass = "fa-skull";
    } else if (box.classList.contains("handBox")) {
      iconClass = "fa-hand";
    } else if (box.classList.contains("knownZoneBox")) {
      iconClass = "fa-rotate";
    } else if (box.classList.contains("preparationZoneBox")) {
      iconClass = "fa-hourglass-half";
    } else if (box.classList.contains("battleZoneBox")) {
      iconClass = "fa-shield";
    } else if (box.classList.contains("battleAreaBoxUp")) {
      iconClass = "fa-circle-chevron-up";
    } else if (box.classList.contains("battleAreaBoxDown")) {
      iconClass = "fa-circle-chevron-down";
    }

    if (iconClass) {
      const iconElement = document.createElement("i");
      iconElement.classList.add("fas", "fa", "fa-solid", iconClass);
      box.appendChild(iconElement);
    }
  }
}

function formatNumber00(num) {
  return num.toString().padStart(2, "0");
}
