let deck;
let decks;
let allCards;
let idSelectedDeck;
let cardsFromDeck;

let legendaries;
let artifacts;

let analysisAverages = [];

let suggestionsQtd = 18;
let suggestions = [];
let infoFromDeck = [];
let selectedCategory = null;
let selectedButtonCategory = null;

document.addEventListener("DOMContentLoaded", async function () {
  allCards = await getCards();
  decks = await getDecks();

  legendaries = await fetchOrGetFromLocalStorage(
    "legendaries",
    URL_LEGENDARIES_JSON
  );

  artifacts = await fetchOrGetFromLocalStorage("artifacts", URL_ARTIFACTS_JSON);

  deck = {
    cards: [],
    extra: [],
  };

  suggestions = [];

  await updateAnalysisFromDeck();
});

async function updateAnalysisFromDeck() {
  cardsFromDeck = await getCardsFromDeck(deck.cards, allCards);

  let similarCardsArray = [];

  if (deck.cards.length > 0) {
    let analysisAverages = await analyzeDecks(decks);
    let info = await analyzeCards(cardsFromDeck, analysisAverages);
    infoFromDeck = info;
    // console.log(info);

    await Promise.all(
      deck.cards.map(async (card) => {
        const similarCards = await getRelatedCardsInDecks(card, decks);
        similarCards.forEach((c) => {
          similarCardsArray.push(c);
        });
      })
    );

    similarCardsArray = mergeAndSumSimilarCards(similarCardsArray);
    similarCardsArray = await prepareSimilarCardsArray(similarCardsArray);
    const mergedAndSummed = mergeAndSumSimilarCards(similarCardsArray);

    suggestions = mergedAndSummed.sort((a, b) => b.qtd - a.qtd);

    similarCardsArray = mergedAndSummed
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, suggestionsQtd);

    const elementsToUpdate = {
      tag_deckName: deck.name,

      tag_deckStyle: deck.style,
      tag_deckFormat: deck.format,
      tag_deckCategory: getKeyWithMaxAbsoluteValue(info.categoriesCount),
      tag_deckEffect: getKeyWithMaxAbsoluteValue(info.effectsCount),

      tag_deckSize: info.comparison.totalCards,
      tag_deckMedCost: info.averageCost.toFixed(2),
      tag_deckStrength: info.averageStrength
        ? info.averageStrength?.toFixed(2)
        : "N/A",
      tag_deckResistence: info.averageResistance
        ? info.averageResistance?.toFixed(2)
        : "N/A",

      tag_deckQtdHero:
        info.heroCount > 0 ? info.heroCount : info.comparison.hero.count,
      tag_deckQtdMiracle:
        info.miracleCount > 0
          ? info.miracleCount
          : info.comparison.miracle.count,
      tag_deckQtdSin:
        info.sinCount > 0 ? info.sinCount : info.comparison.sin.count,
      tag_deckQtdArtifact:
        info.artifactCount > 0
          ? info.artifactCount
          : info.comparison.artifact.count,

      tag_deckCostHero:
        info.heroCount > 0
          ? info.averageCostHero.toFixed(2)
          : info.comparison.hero.cost,
      tag_deckCostMiracle:
        info.miracleCount > 0
          ? info.averageCostMiracle.toFixed(2)
          : info.comparison.miracle.cost,
      tag_deckCostSin:
        info.sinCount > 0
          ? info.averageCostSin.toFixed(2)
          : info.comparison.sin.cost,
      tag_deckCostArtifact:
        info.artifactCount > 0
          ? info.averageCostArtifact.toFixed(2)
          : info.comparison.artifact.cost,
    };

    const comparisonElements = {
      // Comparações Gerais
      tag_deckQtdComparison: info.comparison.general.qtd,
      tag_deckMedCostComparison: info.comparison.general.cost,
      tag_deckStrengthComparison: info.comparison.general.strength,
      tag_deckResistanceComparison: info.comparison.general.resistance,
      // Comparações de custo
      tag_deckCostHeroComparison: info.comparison.hero.cost,
      tag_deckCostMiracleComparison: info.comparison.miracle.cost,
      tag_deckCostSinComparison: info.comparison.sin.cost,
      tag_deckCostArtifactComparison: info.comparison.artifact.cost,
      // Comparações de quantidade
      tag_deckQtdHeroComparison: info.comparison.hero.count,
      tag_deckQtdMiracleComparison: info.comparison.miracle.count,
      tag_deckQtdSinComparison: info.comparison.sin.count,
      tag_deckQtdArtifactComparison: info.comparison.artifact.count,
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
        const color = getComparisonColor(key, value);
        element.style.color = color;

        if (value === "higher") {
          element.innerHTML = "&#9652;";
        } else if (value === "lower") {
          element.innerHTML = "&#9662;";
        } else if (value === "equal") {
          element.innerHTML = "&#8860;";
        } else {
          element.innerHTML = "";
        }

        if (
          info.comparison.totalCards > deckMinimumSize &&
          info.comparison.totalCards < analysisAverages.averageQtd
        ) {
          element.style.color = "green";
        } else if (info.comparison.totalCards < deckMinimumSize) {
          element.style.color = "red";
        }
      }
    }

    // console.log("Aggro -> Tempo -> Control -> Combo -> Midrange");

    generateCategoryItems(
      info.effectsCount,
      info.comparison.effects,
      "effectsContainer"
    );
    generateCategoryItems(
      info.categoriesCount,
      info.comparison.categories,
      "categoriesContainer"
    );
  } else {
    allCards.forEach((card) => {
      card.ocurrences = getOccurrencesInDecks(card.number, decks);
    });

    similarCardsArray = sortByStarsAndDate(allCards);
    similarCardsArray = transformToObjectArray(similarCardsArray);
    similarCardsArray = await prepareSimilarCardsArray(similarCardsArray);
    suggestions = similarCardsArray.sort((a, b) => b.qtd - a.qtd);
    similarCardsArray = similarCardsArray.slice(0, suggestionsQtd);
  }

  updateDeckListDOM(cardsFromDeck);
  updateMiniCards(allCards, similarCardsArray, "#suggestionsDeckList");
  let rerun = false;

  if (selectedCategory) {
    const suggestionNumbers = suggestions.map((obj) => obj.idcard);
    let cardList = await getCardsFromDeck(suggestionNumbers, allCards);
    filterCardsByCategory(cardList, selectedCategory);
  }

  generateCategorySuggestions(rerun);
}

async function autoGenerateDeck() {
  let bufferCard;
  let cardList = await getCardsFromDeck(deck.cards, allCards);

  let cardsLength = cardList.filter(
    (card) => card.type !== "Herói de Fé" || card.subtype !== "Lendário"
  ).length;

  for (let i = 0; cardsLength < deckMinimumSize; i++) {
    let oldSuggestions = suggestions.sort((a, b) => b.qtd - a.qtd);
    const cardFromSuggestion = bufferCard ? bufferCard : suggestions[0];
    addCardToDeckBuilder(cardFromSuggestion.idcard);
    while (suggestions == oldSuggestions) {
      await wait(1);
    }
    bufferCard = suggestions[0];
    cardList = await getCardsFromDeck(deck.cards, allCards);
    cardsLength = cardList.filter(
      (card) => card.type !== "Herói de Fé" || card.subtype !== "Lendário"
    ).length;
  }

  let suggestionNumbers = suggestions.map((obj) => obj.idcard);
  cardList = await getCardsFromDeck(suggestionNumbers, allCards);

  while (cardList && cardList[0] && cardList[0].subtype == "Lendário") {
    console.log(cardList[0]);
    let oldSuggestions = suggestions.sort((a, b) => b.qtd - a.qtd);
    addCardToDeckBuilder(cardList[0].number);
    while (suggestions == oldSuggestions) {
      await wait(1);
    }
    suggestionNumbers = suggestions.map((obj) => obj.idcard);
    cardList = await getCardsFromDeck(suggestionNumbers, allCards);
  }

  updateAnalysisFromDeck();
}

async function generateCategorySuggestions(rerun) {
  const suggestionNumbers = suggestions.map((obj) => obj.idcard);

  let cardList = await getCardsFromDeck(suggestionNumbers, allCards);
  let categorias = cardList.flatMap((obj) => obj.categories.split(";"));
  categorias = [...new Set(categorias)];

  const buttonContainer = document.getElementById("addByCategoriesList");
  if (!buttonContainer) {
    return;
  }

  buttonContainer.innerHTML = "";

  categorias.forEach((categoria) => {
    // Verifica se existe ao menos uma carta com a categoria
    const hasCardsWithCategory = cardList.some((card) =>
      card.categories.split("#").includes(categoria)
    );

    if (hasCardsWithCategory) {
      const button = document.createElement("button");
      button.innerText = categoria;
      if (selectedCategory == categoria) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () =>
        handleButtonClick(categoria, button, cardList, rerun)
      );
      buttonContainer.appendChild(button);
    }
  });
}

function handleButtonClick(categoria, button, cardList, rerun) {
  if (selectedCategory === categoria) {
    selectedCategory = null;
    if (!rerun) button.classList.remove("selected");
    updateAnalysisFromDeck();
  } else {
    if (selectedCategory !== null) {
      const previousButton = document.querySelector(".selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
    selectedCategory = categoria;
    button.classList.add("selected");
  }

  filterCardsByCategory(cardList, selectedCategory);
}

async function filterCardsByCategory(cardList, category) {
  let filteredCards = [];
  if (category) {
    filteredCards = cardList.filter((card) =>
      card.categories.split(";").includes(category)
    );
  }

  if (filteredCards.length > 0) {
    updateMiniCards(allCards, filteredCards, "#suggestionsDeckList");
  } else {
    selectedCategory = null;
    updateAnalysisFromDeck();
  }
}

function updateDeckListDOM(cardsFromDeck) {
  const extraDeckListContainer = document.querySelector("#extraDeckList");
  const deckListContainer = document.querySelector("#deckList");

  if (!deckListContainer) return;
  if (!extraDeckListContainer) return;

  deckListContainer.innerHTML = "";
  extraDeckListContainer.innerHTML = "";

  cardsFromDeck.forEach((card) => {
    if (card.type == "Herói de Fé" && card.subtype == "Lendário") {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-2 col-md-2 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        removeCardFromDeckBuilder(card.number)
      );

      extraDeckListContainer.appendChild(cardElement);
    } else {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-2 col-md-2 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        removeCardFromDeckBuilder(card.number)
      );

      deckListContainer.appendChild(cardElement);
    }
  });
}

function updateMiniCards(allCards, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;

  similarCardsContainer.innerHTML = "";

  cardsList.forEach((similarCard) => {
    const details = allCards.find(
      (card) =>
        card.number ==
        (similarCard.idcard ? similarCard.idcard : similarCard.number)
    );
    if (details) {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-4 col-md-4 col-sm-4 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        addCardToDeckBuilder(details.number)
      );

      similarCardsContainer.appendChild(cardElement);
    }
  });
}

function addCardToDeckBuilder(id) {
  deck.cards.push(id);
  updateAnalysisFromDeck();
}

function removeCardFromDeckBuilder(id) {
  const index = deck.cards.indexOf(id);
  if (index !== -1) {
    deck.cards.splice(index, 1);
  }
  updateAnalysisFromDeck();
}

function mergeAndSumSimilarCards(similarCardsArray) {
  const mergedCards = {};

  const filteredSimilarCards = similarCardsArray.filter((card) => {
    const occurrencesInDeck = deck.cards.filter(
      (item) => item == card.idcard
    ).length;
    return occurrencesInDeck < 2;
  });

  filteredSimilarCards.forEach((card) => {
    const { idcard, qtd } = card;
    if (mergedCards[idcard]) {
      mergedCards[idcard].qtd += qtd;
    } else {
      mergedCards[idcard] = { idcard, qtd };
    }
  });

  return Object.values(mergedCards).sort((a, b) => b.qtd - a.qtd);
}

async function prepareSimilarCardsArray(similarCardsArray) {
  const commonCardCounts = getCommonCardCounts(deck.cards);

  deck.cards.forEach((card) => {
    if (commonCardCounts[card] == 1) {
      const similarCard = similarCardsArray.find((sc) => sc.idcard == card);
      if (similarCard) {
        similarCard.qtd += 100;
      } else {
        similarCardsArray.push({ idcard: card, qtd: WEIGHT_SAME });
      }
    }
  });

  similarCardsArray = similarCardsArray
    .filter((card) => {
      if (deck.cards.includes(card.idcard)) {
        const count = commonCardCounts[card.idcard] || 0;
        return count < 2;
      }
      return true;
    })
    .sort((a, b) => b.qtd - a.qtd);

  artifacts.forEach((artifact) => {
    if (
      artifact.subtype == "Lendário" &&
      deck.cards.includes(artifact.number)
    ) {
      similarCardsArray = similarCardsArray.filter(
        (card) => card.idcard != artifact.number
      );
    }
  });

  for (const legendary of legendaries) {
    if (
      deck.cards.filter((card) => card == legendary.commonNumber).length !== 1
    ) {
      similarCardsArray = similarCardsArray.filter(
        (card) => card.idcard != legendary.number
      );
    }

    if (
      deck.cards.filter((card) => card == legendary.commonNumber).length == 0 &&
      deck.cards.filter((card) => card == legendary.number).length == 1
    ) {
      deck.cards = deck.cards.filter((card) => card != legendary.number);
      const cardsFromDeck = await getCardsFromDeck(deck.cards, allCards);
      updateDeckListDOM(cardsFromDeck);
    }

    const legendaryCount = deck.cards.filter(
      (card) => card === legendary.number
    ).length;

    if (legendaryCount >= 1) {
      similarCardsArray = similarCardsArray.filter(
        (card) =>
          card.idcard != legendary.number &&
          card.idcard != legendary.commonNumber
      );
    }
  }

  return similarCardsArray;

  // Função auxiliar para contar ocorrências de cartas
  function getCommonCardCounts(cards) {
    return cards.reduce((acc, card) => {
      acc[card] = (acc[card] || 0) + 1;
      return acc;
    }, {});
  }
}

function generateCategoryItems(categoriesCount, averages, id) {
  const container = document.getElementById(id);
  container.innerHTML = "";
  const categoryArray = Object.entries(categoriesCount);

  categoryArray.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  categoryArray.forEach(([category, count]) => {
    const comparison = averages[category];
    const color = getComparisonColor(category, comparison);
    const input = document.createElement("div");

    if (comparison == "higher") {
      input.classList.add("green");
    } else if (comparison == "lower") {
      input.classList.add("red");
    }

    input.setAttribute(
      "style",
      "font-size: 1rem !important; margin-right: 0px !important; margin-bottom: 0px !important;"
    );
    input.classList.add("custom-text-input", "category-item");

    input.innerHTML = `${category} : ${count} <span style="color:${color}"> ${
      comparison === "higher"
        ? "&#9650;"
        : comparison === "lower"
        ? "&#9660;"
        : comparison === "equal"
        ? "&#8860;"
        : ""
    }</span>`;

    container.appendChild(input);
  });
}

function transformToObjectArray(cards) {
  return cards.map((card) => ({ idcard: card.number, qtd: card.ocurrences }));
}

function getCategoryClass(categoria) {
  return categoryValues[categoria] ? "green" : "red";
}
