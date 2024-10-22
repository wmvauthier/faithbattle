document.addEventListener("DOMContentLoaded", async function () {
  await waitForAllJSONs();

  let idSelectedCard = localStorage.getItem("idSelectedCard");

  if (idSelectedCard && idSelectedCard > 0) {
    const card = allCards.find((element) => element.number == idSelectedCard);
    let cardStatus = `&#9876;${card.strength} / &#10070;${card.resistence}`;

    if (card) {
      let similarCards = await getRelatedCardsInDecks(
        card.number,
        allDecks,
        false,
        null,
        null
      );

      similarCards = similarCards.slice(0, 18);

      let relatedDecks = getRelatedDecks(card.number, similarCards, allDecks);

      const similarCardDetails = await fetchRelatedCardsDetails(
        similarCards.map((card) => card.idcard)
      );

      const elementsToUpdate = {
        tag_cardName: card.name,
        tag_cardFlavor: card.flavor,
        tag_cardText: card.text,
        tag_cardType: card.type,
        tag_cardCategories: card.categories.split(";").join("; "),
        tag_cardCost: String.fromCharCode(10121 + card.cost),
        tag_cardStatus: cardStatus,
        tag_cardEffect: card.effects,
        tag_cardNumber: card.number,
        tag_cardCollection: card.collection,
        tag_cardDate: formatDate(card.date),
        tag_cardArtist: card.artist,
        tag_cardImg: card.img,
        tag_cardStars: card.stars, // Assumindo que a propriedade é 'stars'
      };

      for (const [id, value] of Object.entries(elementsToUpdate)) {
        const element = document.getElementById(id);
        if (element) {
          if (id === "tag_cardImg") {
            element.src = value;
          } else if (id === "tag_cardStars") {
            element.innerHTML = updateStars(card.stars); // Atualizar as estrelas
          } else {
            element.textContent = value;
          }
        }
      }

      const el = document.getElementById("tag_cardStatus");
      el.innerHTML = `&#9876;${card.strength} / &#10070;${card.resistence}`;

      if (card.strength == 0 && card.resistence == 0) {
        el.innerHTML = "";
      }

      updateSimilarCardsDOM(similarCardDetails, similarCards);
      updateRelatedDecks(relatedDecks);  
      // Exemplo de atualização do gauge com valor 75%

      const gaugeSections = [
        { width: 40, color: '#ff4d4d', icon: 'fa-star' },  // 10% vermelho com ícone de estrela
        { width: 25, color: '#ffcc00', icon: 'fa-sun' },   // 25% amarelo com ícone de sol
        { width: 10, color: '#4caf50', icon: 'fa-list' },  // 10% verde com ícone de lista
        // Você pode adicionar mais seções aqui
      ];

      fillGauge('gaugeContainerStyle', gaugeSections);
      fillGauge('gaugeContainerArchetype', gaugeSections);

    } else {
      location.href = "./card-list.html";
    }
  } else {
    location.href = "./card-list.html";
  }
});

function updateSimilarCardsDOM(similarCardDetails, similarCards) {
  const similarCardsContainer = document.querySelector("#relatedCardsList");
  if (!similarCardsContainer) return;

  similarCardsContainer.innerHTML = "";

  similarCards.forEach((similarCard) => {
    const details = similarCardDetails.find(
      (card) => card.number === similarCard.idcard
    );
    if (details) {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-2 col-md-3 col-sm-4 col-3 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.style.padding = "5px";
      cardElement.style["margin-bottom"] = "5px";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        getCardDetails(details.number)
      );

      similarCardsContainer.appendChild(cardElement);
    }
  });
}

function updateRelatedDecks(relatedDecks) {
  const relatedDecksContainer = document.getElementById(
    "related-decks-container"
  );
  relatedDecksContainer.innerHTML = ""; // Limpa o conteúdo existente

  const fragment = document.createDocumentFragment(); // Fragmento para melhorar a performance

  relatedDecks.forEach((deck) => {
    let style, archetype, stars;

    stars = createListItem(
      "#ffffff",
      `<i style="color: #FFD700;" class="fa-solid fa-star"></i> ${deck.level}`
    );

    // Definição do estilo
    switch (deck.style) {
      case "Agressivo":
        style = createListItem(
          "#B22222",
          '<i style="color: #fff;" class="fa-solid fa-hand-back-fist"></i>'
        );
        break;
      case "Equilibrado":
        style = createListItem(
          "#FFD700",
          '<i style="color: #000;" class="fa-solid fa-hand-scissors"></i>'
        );
        break;
      case "Controlador":
        style = createListItem(
          "#1E90FF",
          '<i style="color: #fff;" class="fa-solid fa-hand"></i>'
        );
        break;
      default:
        style = "";
    }

    // Definição do arquétipo
    switch (deck.archetype) {
      case "Batalha":
        archetype = createListItem(
          "#FF8C00",
          '<i style="color: #000;" class="fa-solid fa-hand-fist"></i>'
        );
        break;
      case "Santificação":
        archetype = createListItem(
          "whitesmoke",
          '<i style="color: #000;" class="fa-solid fa-droplet"></i>'
        );
        break;
      case "Combo":
        archetype = createListItem(
          "#800080",
          '<i style="color: #fff;" class="fa-solid fa-gears"></i>'
        );
        break;
      case "Maravilhas":
        archetype = createListItem(
          "#32CD32",
          '<i style="color: #000;" class="fa-solid fa-hat-wizard"></i>'
        );
        break;
      case "Supressão":
        archetype = createListItem(
          "#000000",
          '<i style="color: #fff;" class="fa-solid fa-ban"></i>'
        );
        break;
      default:
        archetype = "";
    }

    // Criação do contêiner de cada deck
    const deckElement = document.createElement("div");
    deckElement.className = "col-4";
    deckElement.style.cursor = "pointer";
    deckElement.style.display = "flex";
    deckElement.style.flexDirection = "column";
    deckElement.style.alignItems = "center";
    deckElement.style.textAlign = "center";
    deckElement.style["margin-bottom"] = "15px";

    // Imagem do deck
    const imgElement = document.createElement("img");
    imgElement.src = deck.img;
    imgElement.alt = "Deck Image";
    // imgElement.style.maxWidth = "150px";
    imgElement.style.height = "auto";
    // imgElement.style.maxHeight = "150px";

    // Nome do deck
    const nameElement = document.createElement("h5");
    const nameLink = document.createElement("a");
    nameLink.href = "#";
    nameLink.textContent = deck.name;
    nameElement.style["font-family"] = '"Mulish", sans-serif';
    nameElement.style.fontSize = "12px"; // Tamanho da fonte reduzido
    nameElement.style["color"] = '#ffffff';
    nameLink.style.color = "#fff"; // Definir a cor do texto do link como branco
    nameElement.appendChild(nameLink);

    // Lista de informações (estilo, arquétipo, estrelas)
    const ulElement = document.createElement("ul");
    ulElement.style.display = "flex";
    ulElement.style.justifyContent = "space-between";
    ulElement.style.padding = "0";
    ulElement.style.listStyle = "none";
    ulElement.style.width = "100%";
    ulElement.appendChild(stars);
    ulElement.appendChild(style);
    ulElement.appendChild(archetype);

    // Adiciona os elementos ao contêiner do deck
    deckElement.appendChild(imgElement);
    deckElement.appendChild(nameElement);
    deckElement.appendChild(ulElement);

    // Adiciona o evento de clique
    deckElement.addEventListener("click", () => getDeckDetails(deck.number));

    // Adiciona ao fragmento
    fragment.appendChild(deckElement);
  });

  // Adiciona todo o fragmento ao DOM de uma vez
  relatedDecksContainer.appendChild(fragment);
}

function fillGauge(containerId, sections) {
  const container = document.getElementById(containerId);

  sections.forEach(section => {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('gauge-section');
    sectionDiv.style.width = section.width + '%';
    sectionDiv.style.backgroundColor = section.color;

    const icon = document.createElement('i');
    icon.classList.add('fas', section.icon);

    sectionDiv.appendChild(icon);
    container.appendChild(sectionDiv);
  });
}

// Função auxiliar para criar um item de lista com estilo
function createListItem(backgroundColor, innerHTMLContent) {
  const li = document.createElement("li");
  li.style.backgroundColor = backgroundColor;
  li.style.borderRadius = "10px"; // Bordas arredondadas
  li.style.padding = "5px 10px"; // Espaçamento interno ajustado
  li.style.margin = "5px"; // Espaçamento externo
  li.style.fontSize = "12px"; // Tamanho da fonte reduzido
  li.style.display = "flex";
  li.style.alignItems = "center";
  li.style.justifyContent = "center";
  li.style.fontWeight = "bold"; // Correção: sem o ponto antes
  li.innerHTML = innerHTMLContent;
  return li;
}

async function fetchRelatedCardsDetails(cardIds) {
  return allCards.filter((card) => cardIds.includes(card.number));
}

// Função para atualizar as estrelas
function updateStars(stars) {
  const resStars = parseFloat(stars); // Use parseFloat para manter a parte decimal

  const fullStars = Math.floor(resStars); // Parte inteira
  const halfStar = resStars % 1 >= 0.5; // Verifica se há uma meia estrela
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Ajusta a contagem das estrelas vazias

  let innerHTML = "";

  // Adiciona estrelas cheias
  for (let i = 0; i < fullStars; i++) {
    innerHTML += '<a href="#"><i class="fa-solid fa-star"></i></a>';
  }

  // Adiciona meia estrela, se necessário
  if (halfStar) {
    innerHTML += '<a href="#"><i class="fa-solid fa-star-half-stroke"></i></a>';
  }

  // Adiciona estrelas vazias
  for (let i = 0; i < emptyStars; i++) {
    innerHTML += '<a href="#"><i class="fa-regular fa-star"></i></a>';
  }

  return innerHTML;

}

function formatDate(dateString) {
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const date = new Date(dateString);
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  return `(${monthName}/${year})`;
}
