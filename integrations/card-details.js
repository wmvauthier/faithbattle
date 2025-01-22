document.addEventListener("DOMContentLoaded", async function () {
  await waitForAllJSONs();

  const idSelectedCard = localStorage.getItem("idSelectedCard");

  if (!idSelectedCard || idSelectedCard <= 0) {
    location.href = "./card-list.html";
    return;
  }

  const card = allCards.find((element) => element.number == idSelectedCard);

  if (!card) {
    location.href = "./card-list.html";
    return;
  }

  const cardStatus =
    card.strength > 0 || card.resistence > 0
      ? `&#9876;${card.strength} / &#10070;${card.resistence}`
      : "";

  const [similarCards, similarCardDetails] = await Promise.all([
    getRelatedCardsInDecks(card.number, allDecks, false, null, null).then(
      (cards) => cards.slice(0, 24)
    ),
    fetchRelatedCardsDetails(
      (await getRelatedCardsInDecks(card.number, allDecks, false, null, null))
        .slice(0, 24)
        .map((card) => card.idcard)
    ),
  ]);

  const relatedDecks = getRelatedDecks(
    card.number,
    similarCards,
    allDecks
  ).slice(0, 10);

  card.rulings = getRulingsFromCard(card.type, card.subtype, card.categories);

  updateDOMElements(card, cardStatus);
  updateSimilarCardsDOM(similarCardDetails, similarCards);
  updateRelatedDecks(relatedDecks);

  fillGauge("gaugeContainerStyle", card.stylePercentage);
  fillGauge("gaugeContainerArchetype", card.archetypePercentage);
});

// Função auxiliar para atualizar os elementos do DOM
function updateDOMElements(card, cardStatus) {
  const elementsToUpdate = {
    tag_cardName: card.name.toUpperCase(),
    tag_cardFlavor: card.flavor,
    tag_cardText: card.text, // Quebra de linha com <br>
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
    tag_cardStars: card.stars,
    tag_cardOcurrences:
      " " + Math.floor((card.ocurrences / allDecks.length) * 100, 2) + " %",
    tag_cardOcurrencesInSides:
      " " +
      Math.floor(
        ((card.ocurrencesInSides - card.ocurrences) / allDecks.length) * 100,
        2
      ) +
      " %",
  };

  for (const [id, value] of Object.entries(elementsToUpdate)) {
    const element = document.getElementById(id);
    if (element) {
      if (id === "tag_cardImg") {
        element.src = value;
      } else if (id === "tag_cardStars") {
        element.innerHTML = updateStars(card.stars); // Atualizar as estrelas
      } else if (id === "tag_cardText") {
        if (rulingsChosenOption) {
          const rulingsHtml = card.rulings
            .map(
              (ruling) =>
                ruling
                  .split(";") // Dividir a string em partes usando ";"
                  .map((part) => `-> ${part.trim()}<br>`) // Adicionar quebra de linha após cada parte
                  .join("") // Combinar as partes novamente
            )
            .join("<br>"); // Separar cada ruling com <br><br>

          element.innerHTML = `<br>${rulingsHtml}<br><b>${card.text}</b>`;
        } else {
          element.innerHTML = `<br><b>${card.text}</b>`;
        }
      } else {
        element.textContent = value;
      }
    }
  }

  const el = document.getElementById("tag_cardStatus");
  el.innerHTML = cardStatus;
}

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
    deckElement.className = "col-lg-1 col-md-3 col-sm-6 col-6";
    deckElement.style.cursor = "pointer";
    deckElement.style.display = "flex";
    deckElement.style.flexDirection = "column";
    deckElement.style.alignItems = "center";
    deckElement.style.textAlign = "center";
    // deckElement.style["margin-right"] = "10px";
    deckElement.style["margin-left"] = "10px";
    deckElement.style["padding-right"] = "0px";
    deckElement.style["padding-left"] = "0px";

    // Imagem do deck
    const imgElement = document.createElement("img");
    imgElement.src = deck.img;
    imgElement.alt = "Deck Image";
    imgElement.style.maxWidth = "100%";
    imgElement.style.height = "auto";
    // imgElement.style.maxHeight = "150px";

    // Nome do deck
    const nameElement = document.createElement("h5");
    const nameLink = document.createElement("a");
    nameLink.href = "#";
    nameLink.textContent = deck.name;
    nameElement.style["font-family"] = '"Mulish", sans-serif';
    nameElement.style.fontSize = "12px"; // Tamanho da fonte reduzido
    nameElement.style["color"] = "#ffffff";
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
  const fragment = document.createDocumentFragment(); // Cria um fragmento para minimizar alterações diretas no DOM

  sections.forEach((section) => {
    if (section.rawWidth > 0) {
      const sectionDiv = document.createElement("div");
      sectionDiv.classList.add("gauge-section");
      sectionDiv.style.width = section.width + "%";
      sectionDiv.style.backgroundColor = section.backgroundColor;
      sectionDiv.style.color = section.color;

      const icon = document.createElement("i");
      icon.classList.add("fas", section.icon);

      sectionDiv.appendChild(icon);
      fragment.appendChild(sectionDiv); // Adiciona ao fragmento ao invés do DOM diretamente
    }
  });

  container.appendChild(fragment); // Insere o fragmento no DOM apenas uma vez
}

function calculateStylePercentages(decks) {
  const gaugeStyles = [
    {
      style: "Agressivo",
      backgroundColor: "#B22222",
      color: "#fff",
      icon: "fa-hand-back-fist",
    },
    {
      style: "Equilibrado",
      backgroundColor: "#FFD700",
      color: "#000",
      icon: "fa-hand-scissors",
    },
    {
      style: "Controlador",
      backgroundColor: "#1E90FF",
      color: "#fff",
      icon: "fa-hand",
    },
  ];

  // Contagem de cada estilo
  const styleCount = decks.reduce((acc, deck) => {
    acc[deck.style] = (acc[deck.style] || 0) + 1;
    return acc;
  }, {});

  const totalDecks = decks.length;

  // Calcular as porcentagens brutas e arredondadas
  const rawPercentages = gaugeStyles.map((gaugeStyle) => {
    const count = styleCount[gaugeStyle.style] || 0;
    const rawWidth = (count / totalDecks) * 100;
    return {
      ...gaugeStyle,
      rawWidth,
      roundedWidth: Math.round(rawWidth),
    };
  });

  // Calcular a soma das porcentagens arredondadas
  const totalRoundedWidth = rawPercentages.reduce(
    (sum, item) => sum + item.roundedWidth,
    0
  );

  // Diferença entre o total arredondado e 100
  let difference = 100 - totalRoundedWidth;

  // Ajuste final, distribuindo a diferença entre as seções
  return rawPercentages.map((section) => {
    const adjustment = difference > 0 ? 1 : -1; // Decide se deve adicionar ou subtrair
    const adjustedWidth =
      difference !== 0
        ? section.roundedWidth + adjustment
        : section.roundedWidth;

    difference += -adjustment; // Diminui a diferença ajustada

    return {
      ...section,
      width: adjustedWidth,
    };
  });
}

function calculateArchetypePercentages(decks) {
  let gaugeArchetypes = [
    {
      archetype: "Batalha",
      backgroundColor: "#FF8C00",
      color: "#fff",
      icon: "fa-hand-fist",
    },
    {
      archetype: "Santificação",
      backgroundColor: "whitesmoke",
      color: "#000",
      icon: "fa-droplet",
    },
    {
      archetype: "Combo",
      backgroundColor: "#800080",
      color: "#fff",
      icon: "fa-gears",
    },
    {
      archetype: "Maravilhas",
      backgroundColor: "#32CD32",
      color: "#fff",
      icon: "fa-hat-wizard",
    },
    {
      archetype: "Supressão",
      backgroundColor: "#000000",
      color: "#fff",
      icon: "fa-ban",
    },
    // Você pode adicionar mais archetypes aqui
  ];

  // Contagem de cada archetype
  const archetypeCount = decks.reduce((acc, deck) => {
    if (gaugeArchetypes.some((ga) => ga.archetype === deck.archetype)) {
      // Verifica se o archetype existe no array gaugeSectionsArchetypes
      acc[deck.archetype] = (acc[deck.archetype] || 0) + 1;
    }
    return acc;
  }, {});

  const totalDecks = decks.length;

  // Calcular as porcentagens brutas
  const rawPercentages = gaugeArchetypes.map((gaugeArchetype) => {
    const count = archetypeCount[gaugeArchetype.archetype] || 0;
    const percentage = (count / totalDecks) * 100;
    return {
      ...gaugeArchetype,
      rawWidth: percentage,
      roundedWidth: Math.round(percentage), // Arredondar para números inteiros
    };
  });

  // Calcular a soma das porcentagens arredondadas
  const totalRoundedWidth = rawPercentages.reduce(
    (sum, item) => sum + item.roundedWidth,
    0
  );

  // Ajuste final se a soma das porcentagens não for 100
  const difference = 100 - totalRoundedWidth;

  // Distribuir a diferença entre as seções (se houver diferença)
  return rawPercentages.map((section, index) => {
    if (index < Math.abs(difference)) {
      // Se precisar adicionar/subtrair a diferença, ajuste
      return {
        ...section,
        width: section.roundedWidth + (difference > 0 ? 1 : -1), // Adiciona ou subtrai 1
      };
    }
    return { ...section, width: section.roundedWidth }; // Sem ajuste
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
