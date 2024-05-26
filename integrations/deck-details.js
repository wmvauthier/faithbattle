let deck;
let decks;
let allCards;

document.addEventListener("DOMContentLoaded", async function () {
  let idSelectedDeck = localStorage.getItem("idSelectedDeck");

  if (idSelectedDeck && idSelectedDeck > 0) {
    allCards = await getCards();
    decks = await getDecks();

    const selectedDeck = decks.find(
      (element) => element.number == idSelectedDeck
    );
    // let cardStatus = `&#9876;${card.strength} / &#10070;${card.resistence}`;

    if (selectedDeck) {
      const analysisResult = analyzeDecks(decks);

      deck = selectedDeck;

      let cardsFromDeck = getCardsFromDeck(selectedDeck.cards, allCards);
      let info = analyzeCards(cardsFromDeck);

      console.log(analysisResult);
      console.log(info);

      const elementsToUpdate = {
        tag_deckName: selectedDeck.name,

        tag_deckStrength: info.averageStrength,
        tag_deckResistence: info.averageResistance,

        tag_deckQtdHero: info.heroCount,
        tag_deckQtdMiracle: info.miracleCount,
        tag_deckQtdSin: info.sinCount,
        tag_deckQtdArtifact: info.artifactCount,

        tag_deckCostHero:
          info.heroCount > 0 ? info.averageCostHero.toFixed(2) : "0.00",
        tag_deckCostMiracle:
          info.miracleCount > 0 ? info.averageCostMiracle.toFixed(2) : "0.00",
        tag_deckCostSin:
          info.sinCount > 0 ? info.averageCostSin.toFixed(2) : "0.00",
        tag_deckCostArtifact:
          info.artifactCount > 0 ? info.averageCostArtifact.toFixed(2) : "0.00",

        tag_deckStyle: selectedDeck.style,
        tag_deckFormat: selectedDeck.format,
        tag_deckSize: selectedDeck.cards.length,
        tag_deckSizeExtra: selectedDeck.extra.length,
        tag_deckSizeSideboard: selectedDeck.sideboard.length,
        tag_deckSizeSabedorias: selectedDeck.sabedorias,
      };

      const comparisonElements = {
        // Comparações Gerais
        // tag_deckStrengthComparison: info.comparison.hero.strength,
        // tag_deckResistanceComparison: info.comparison.hero.resistance,
        // Comparações de custo
        // tag_deckCostHeroComparison: info.comparison.hero.cost,
        // tag_deckCostMiracleComparison: info.comparison.miracle.cost,
        // tag_deckCostSinComparison: info.comparison.sin.cost,
        // tag_deckCostArtifactComparison: info.comparison.artifact.cost,
        // Comparações de quantidade
        // tag_deckQtdHeroComparison: info.comparison.hero.count,
        // tag_deckQtdMiracleComparison: info.comparison.miracle.count,
        // tag_deckQtdSinComparison: info.comparison.sin.count,
        // tag_deckQtdArtifactComparison: info.comparison.artifact.count,
      };

      for (const [key, value] of Object.entries(elementsToUpdate)) {
        const element = document.getElementById(key);
        if (element) {
          element.textContent = value;
        }
      }

      for (const [key, value] of Object.entries(comparisonElements)) {
        const element = document.getElementById(key);
        if (element) {
          if (value === "higher") {
            element.innerHTML = "&#8593;";
            element.style.color = "green";
          } else if (value === "lower") {
            element.innerHTML = "&#8595;";
            element.style.color = "red";
          } else {
            element.innerHTML = "";
          }
        }
      }

      console.log("Aggro -> Tempo -> Control -> Combo -> Midrange");

      updateDeckListDOM(cardsFromDeck);
      updateMiniCards(allCards, selectedDeck.extra, "#extraDeckList");
      updateMiniCards(allCards, selectedDeck.sideboard, "#sideboardList");
    } else {
      console.log(`Card com ID ${idSelectedCard} não encontrado`);
    }
  } else {
    location.href = "./card-list.html";
  }
});
function analyzeCards(cards) {
  const result = {
    heroCount: 0,
    miracleCount: 0,
    sinCount: 0,
    artifactCount: 0,
    totalCostHero: 0,
    totalCostMiracle: 0,
    totalCostSin: 0,
    totalCostArtifact: 0,
    totalStrength: 0,
    totalResistance: 0,
    categoriesCount: {},
    effectsCount: {},
    averageCost: 0,
  };

  cards.forEach((card) => {
    result.averageCost += card.cost;
    switch (card.type) {
      case "Herói de Fé":
        result.heroCount++;
        result.totalCostHero += card.cost;
        result.totalStrength += card.strength;
        result.totalResistance += card.resistence;
        break;
      case "Milagre":
        result.miracleCount++;
        result.totalCostMiracle += card.cost;
        break;
      case "Pecado":
        result.sinCount++;
        result.totalCostSin += card.cost;
        break;
      case "Artefato":
        result.artifactCount++;
        result.totalCostArtifact += card.cost;
        break;
    }

    card.categories.split(";").forEach((category) => {
      if (category) {
        result.categoriesCount[category] =
          (result.categoriesCount[category] || 0) + 1;
      }
    });

    card.effects.split(";").forEach((effect) => {
      if (effect) {
        result.effectsCount[effect] = (result.effectsCount[effect] || 0) + 1;
      }
    });
  });

  const totalCards = cards.length;
  if (totalCards > 0) {
    result.averageCost /= totalCards;
    if (result.heroCount > 0) {
      result.averageCostHero = result.totalCostHero / result.heroCount;
      result.averageStrength = result.totalStrength / result.heroCount;
      result.averageResistance = result.totalResistance / result.heroCount;
    }
    if (result.miracleCount > 0) {
      result.averageCostMiracle = result.totalCostMiracle / result.miracleCount;
    }
    if (result.sinCount > 0) {
      result.averageCostSin = result.totalCostSin / result.sinCount;
    }
    if (result.artifactCount > 0) {
      result.averageCostArtifact =
        result.totalCostArtifact / result.artifactCount;
    }
  }

  result.comparison = {
    hero: {
      cost:
        result.heroCount > 0
          ? result.averageCostHero > result.averageCost
            ? "higher"
            : "lower"
          : "N/A",
      strength:
        result.heroCount > 0
          ? result.averageStrength > result.totalStrength / totalCards
            ? "higher"
            : "lower"
          : "N/A",
      resistance:
        result.heroCount > 0
          ? result.averageResistance > result.totalResistance / totalCards
            ? "higher"
            : "lower"
          : "N/A",
      count: result.heroCount > totalCards / 4 ? "higher" : "lower",
    },
    miracle: {
      cost:
        result.miracleCount > 0
          ? result.averageCostMiracle > result.averageCost
            ? "higher"
            : "lower"
          : "N/A",
      count: result.miracleCount > totalCards / 4 ? "higher" : "lower",
    },
    sin: {
      cost:
        result.sinCount > 0
          ? result.averageCostSin > result.averageCost
            ? "higher"
            : "lower"
          : "N/A",
      count: result.sinCount > totalCards / 4 ? "higher" : "lower",
    },
    artifact: {
      cost:
        result.artifactCount > 0
          ? result.averageCostArtifact > result.averageCost
            ? "higher"
            : "lower"
          : "N/A",
      count: result.artifactCount > totalCards / 4 ? "higher" : "lower",
    },
  };

  return result;
}

function analyzeDecks(decks) {
  const totalResult = {
    totalDecks: decks.length,
    heroCount: 0,
    miracleCount: 0,
    sinCount: 0,
    artifactCount: 0,
    averageCost: 0,
    averageStrength: 0,
    averageResistance: 0,
    categoriesCount: {},
    effectsCount: {},
  };

  decks.forEach((deck) => {
    let cardsFromDeck = getCardsFromDeck(deck.cards, allCards);
    const deckAnalysis = analyzeCards(cardsFromDeck);

    console.log(cardsFromDeck);

    totalResult.heroCount += deckAnalysis.heroCount;
    totalResult.miracleCount += deckAnalysis.miracleCount;
    totalResult.sinCount += deckAnalysis.sinCount;
    totalResult.artifactCount += deckAnalysis.artifactCount;
    totalResult.averageCost += deckAnalysis.averageCost;
    totalResult.averageStrength += deckAnalysis.averageStrength
      ? deckAnalysis.averageStrength
      : 0;
    totalResult.averageResistance += deckAnalysis.averageResistance
      ? deckAnalysis.averageResistance
      : 0;

    for (const category in deckAnalysis.categoriesCount) {
      totalResult.categoriesCount[category] =
        (totalResult.categoriesCount[category] || 0) +
        deckAnalysis.categoriesCount[category];
    }

    for (const effect in deckAnalysis.effectsCount) {
      totalResult.effectsCount[effect] =
        (totalResult.effectsCount[effect] || 0) +
        deckAnalysis.effectsCount[effect];
    }
  });

  if (totalResult.totalDecks > 0) {
    totalResult.averageCost /= totalResult.totalDecks;
    totalResult.averageStrength /= totalResult.totalDecks;
    totalResult.averageResistance /= totalResult.totalDecks;
  }

  delete totalResult.totalDecks;
  delete totalResult.heroCount;
  delete totalResult.miracleCount;
  delete totalResult.sinCount;
  delete totalResult.artifactCount;
  console.log(totalResult);

  return totalResult;
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

function updateMiniCards(allCards, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;

  similarCardsContainer.innerHTML = "";

  cardsList.forEach((similarCard) => {
    const details = allCards.find((card) => card.number === similarCard);
    if (details) {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-1 col-md-1 col-sm-4 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
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
