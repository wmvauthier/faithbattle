let deck;
let decks;

document.addEventListener("DOMContentLoaded", async function () {
  let idSelectedDeck = localStorage.getItem("idSelectedDeck");

  if (idSelectedDeck && idSelectedDeck > 0) {
    const cards = await getCards();
    decks = await getDecks();

    const selectedDeck = decks.find(
      (element) => element.number == idSelectedDeck
    );
    // let cardStatus = `&#9876;${card.strength} / &#10070;${card.resistence}`;

    if (selectedDeck) {
      deck = selectedDeck;

      let cardsFromDeck = getCardsFromDeck(selectedDeck.cards, cards);
      let info = analyzeCards(cardsFromDeck);

      console.log(deck.extra)

      const elementsToUpdate = {
        tag_deckName: deck.name,

        tag_deckQtdHero: info.cardSummary["Herói de Fé"].total,
        tag_deckQtdMiracle: info.cardSummary.Milagre.total,
        tag_deckQtdSin: info.cardSummary.Pecado.total,
        tag_deckQtdArtifact: info.cardSummary.Artefato.total,

        tag_deckCostHero: info.cardSummary["Herói de Fé"].averageCost,
        tag_deckCostMiracle: info.cardSummary.Milagre.averageCost,
        tag_deckCostSin: info.cardSummary.Pecado.averageCost,
        tag_deckCostArtifact: info.cardSummary.Artefato.averageCost,

        tag_deckStyle: deck.style,
        tag_deckFormat: deck.format,
        tag_deckSize: deck.cards.length,
        tag_deckSizeExtra: deck.extra.length,
        tag_deckSizeSideboard: deck.sideboard.length,
        tag_deckSizeSabedorias: deck.sabedorias,
      };

      console.log(info);
      console.log(elementsToUpdate);
      console.log("Aggro -> Tempo -> Control -> Combo -> Midrange");

      for (const [id, value] of Object.entries(elementsToUpdate)) {
        const element = document.getElementById(id);
        if (element) {
          if (id === "tag_deckImg") {
            element.src = value;
          } else if (id === "tag_deckStars") {
            updateStars(element, value);
          } else {
            element.textContent = value;
          }
        }
      }

      updateDeckListDOM(cardsFromDeck);
    } else {
      console.log(`Card com ID ${idSelectedCard} não encontrado`);
    }
  } else {
    location.href = "./card-list.html";
  }
});

function analyzeCards(cards) {
  // Inicializando os contadores e somas
  const summary = {
    "Herói de Fé": {
      total: 0,
      totalCost: 0,
      totalStrength: 0,
      totalResistence: 0,
    },
    Milagre: { total: 0, totalCost: 0 },
    Pecado: { total: 0, totalCost: 0 },
    Artefato: { total: 0, totalCost: 0 },
  };

  const categoriesCount = {};
  const effectsCount = {};

  // Iterando sobre cada card
  cards.forEach((card) => {
    const type =
      card.type === "Herói de Fé" && card.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : card.type;
    if (summary[type]) {
      summary[type].total += 1;
      summary[type].totalCost += card.cost;
      if (type === "Herói de Fé") {
        summary[type].totalStrength += card.strength;
        summary[type].totalResistence += card.resistence;
      }
    }

    // Contando categorias
    const categories = card.categories ? card.categories.split(";") : [];
    categories.forEach((category) => {
      category = category.trim();
      if (category) {
        categoriesCount[category] = (categoriesCount[category] || 0) + 1;
      }
    });

    // Contando efeitos
    const effects = card.effects ? card.effects.split(";") : [];
    effects.forEach((effect) => {
      effect = effect.trim();
      if (effect) {
        effectsCount[effect] = (effectsCount[effect] || 0) + 1;
      }
    });
  });

  // Calculando a média de custo, força e resistência
  const result = {};
  for (const type in summary) {
    if (summary[type].total > 0) {
      result[type] = {
        total: summary[type].total,
        averageCost: (summary[type].totalCost / summary[type].total).toFixed(2),
      };
      if (type === "Herói de Fé") {
        result[type].averageStrength =
          summary[type].totalStrength / summary[type].total;
        result[type].averageResistence =
          summary[type].totalResistence / summary[type].total;
      }
    } else {
      result[type] = {
        total: 0,
        averageCost: 0,
        averageStrength: 0,
        averageResistence: 0,
      };
    }
  }

  generateCategoryItems(categoriesCount);

  return {
    cardSummary: result,
    categoriesCount: categoriesCount,
    effectsCount: effectsCount,
  };
}

function generateCategoryItems(categoriesCount) {
  const container = document.getElementById("categoriesContainer");

  for (const category in categoriesCount) {
    if (categoriesCount.hasOwnProperty(category)) {
      const input = document.createElement("div");
      input.setAttribute("font-size", "1rem !important");
      input.setAttribute("margin-right", "0px !important");
      input.setAttribute("margin-bottom", "0px !important");
      input.classList.add("custom-text-input", "category-item");
      input.innerHTML = `${category} : ${categoriesCount[category]}`;
      container.appendChild(input);
    }
  }
}

function updateDeckListDOM(cardsFromDeck) {
  const deckListContainer = document.querySelector("#deckList");
  if (!deckListContainer) return;

  deckListContainer.innerHTML = "";

  cardsFromDeck.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className =
      "col-lg-1 col-md-1 col-sm-4 col-xs-4 card__related__sidebar__view__item set-bg";
    cardElement.style.cursor = "pointer";
    cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
        <div class="card__related__info">
        </div>
      `;

    cardElement.addEventListener("click", () => getCardDetails(card.number));

    deckListContainer.appendChild(cardElement);
  });
}
