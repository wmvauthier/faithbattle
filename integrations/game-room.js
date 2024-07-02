// Seleciona todas as caixas e imagens
const boxes = document.querySelectorAll(".box");
const boxesPlayer2 = player2Area.querySelectorAll(".box");
const graveyardZonePlayer2 = document.querySelector("#graveyardZonePlayer2");
const extraZonePlayer2 = document.querySelector("#extraZonePlayer2");

const boxesGraveyardZonePlayer2 = graveyardZonePlayer2.querySelectorAll(".box");
const boxesExtraZonePlayer2 = extraZonePlayer2.querySelectorAll(".box");

const boxesBattleArea = battleArea.querySelectorAll(".box");
const images = player2Area.querySelectorAll(".image");

// Atualiza a lista de caixas da zona conhecida
const knownZoneBoxes = [];
for (let i = 1; i <= 10; i++) {
  const element = document.getElementById(`knownZone${i}`);
  if (element) {
    knownZoneBoxes.push(element);
  }
}

// Preenche os ícones nas caixas
boxes.forEach((box) => {
  fillIconBox(box);
});

// Define as caixas que podem aceitar drag and drop
const droppableBoxes = [
  ...boxesPlayer2,
  ...boxesBattleArea,
  ...boxesGraveyardZonePlayer2,
  ...boxesExtraZonePlayer2,
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
    const draggedElementId = e.dataTransfer.getData("text");
    const draggedElement = document.getElementById(draggedElementId);

    if (
      box.children.length === 1 &&
      box.children[0].tagName.toLowerCase() === "i"
    ) {
      box.replaceChild(draggedElement, box.children[0]);
    } else {
      box.appendChild(draggedElement);
    }

    box.classList.remove("hovered");

    boxes.forEach((box) => {
      fillIconBox(box);
    });
  });
});

// Remove a funcionalidade de arrastar das caixas da zona conhecida
knownZoneBoxes.forEach((box) => {
  const imageDiv = box.querySelector('div.image[draggable="true"]');
  if (imageDiv) {
    imageDiv.removeAttribute("draggable");
  }

  // Adiciona o evento de clique para alternar a imagem
  box.addEventListener("click", () => toggleImage(box));
});

// Adiciona os eventos de mouseover para mostrar a prévia da imagem
document.querySelectorAll(".box .image").forEach((imageDiv) => {
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

// Define os eventos de dragstart para as imagens
images.forEach((image) => {
  image.id = `draggable-${Math.random().toString(36).substr(2, 9)}`;

  image.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text", e.target.id);
  });
});

// Função para adicionar uma nova carta à zona conhecida
function addKnown() {
  for (const knownZoneBox of knownZoneBoxes) {
    if (!knownZoneBox.querySelector('div.image')) {
      const newDiv = document.createElement("div");
      newDiv.classList.add("image");
      newDiv.style.backgroundImage = "url('./img/versos/sabedoria.png')";
      knownZoneBox.innerHTML = "";

      knownZoneBox.appendChild(newDiv);
      break;
    }
  }

  // Atualiza a funcionalidade de drag para as novas imagens
  knownZoneBoxes.forEach((box) => {
    const imageDiv = box.querySelector('div.image');
    if (imageDiv) {
      imageDiv.removeAttribute("draggable");
    }
  });

  boxes.forEach((box) => {
    fillIconBox(box);
  });
}

// Função para remover uma carta da zona conhecida
function removeKnown() {
  for (let i = knownZoneBoxes.length - 1; i >= 0; i--) {
    const knownZoneBox = knownZoneBoxes[i];
    const imageDiv = knownZoneBox.querySelector('div.image');
    if (imageDiv) {
      knownZoneBox.removeChild(imageDiv);
      break;
    }
  }
  boxes.forEach((box) => {
    fillIconBox(box);
  });
}

// Função para alternar a imagem de fundo ao clicar na caixa
function toggleImage(box) {
  const imageDiv = box.querySelector("div.image");
  if (imageDiv) {
    const currentImage = imageDiv.style.backgroundImage;

    if (currentImage.includes("sabedoria.png")) {
      imageDiv.style.backgroundImage = "url('./img/sabedorias/37.png')";
    } else {
      imageDiv.style.backgroundImage = "url('./img/versos/sabedoria.png')";
    }
  }
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
