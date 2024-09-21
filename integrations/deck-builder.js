let deck;
let decks;
let allCards;
let idSelectedDeck;
let cardsFromDeck;

let handTestCards = [];

let legendaries;
let artifacts;

let analysisAverages = [];

let suggestionsQtd = 24;
let suggestions = [];
let infoFromDeck = [];

let selectedType = null;
let selectedButtonType = null;

let selectedCost = null;
let selectedButtonCost = null;

let selectedCategory = null;
let selectedButtonCategory = null;

let selectedStyle = null;
let selectedArchetype = null;

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
  deck.cards = limitStringOccurrences(deck.cards, 2);

  cardsFromDeck = await getCardsFromDeck(deck.cards, allCards);

  let similarCardsArray = [];

  if (deck.cards.length > 0) {
    analysisAverages = await analyzeDecks(
      decks,
      selectedStyle,
      selectedArchetype
    );
    let info = await analyzeCards(cardsFromDeck, analysisAverages);
    infoFromDeck = info;

    await Promise.all(
      deck.cards.map(async (card) => {
        const similarCards = await getRelatedCardsInDecks(
          card,
          decks,
          true,
          selectedStyle,
          selectedArchetype
        );
        similarCards.forEach((c) => {
          similarCardsArray.push(c);
        });
      })
    );

    similarCardsArray = mergeAndSumSimilarCards(similarCardsArray);
    similarCardsArray = await prepareSimilarCardsArray(similarCardsArray);
    const mergedAndSummed = mergeAndSumSimilarCards(similarCardsArray);

    // console.log(info);
    // console.log(similarCardsArray);

    suggestions = mergedAndSummed.sort((a, b) => b.qtd - a.qtd);

    similarCardsArray = mergedAndSummed
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, suggestionsQtd);

    const elementsToUpdate = {
      tag_deckName: deck.name,

      tag_deckStyle: deck.style,
      tag_deckFormat: deck.format,
      tag_deckCategory: getKeyWithMaxAbsoluteValue(info.categoriesCount)
        ? getKeyWithMaxAbsoluteValue(info.categoriesCount)
        : "-",
      tag_deckEffect: getKeyWithMaxAbsoluteValue(info.effectsCount)
        ? getKeyWithMaxAbsoluteValue(info.effectsCount)
        : "-",

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

        if (key == "tag_deckQtdComparison") {
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
    }

    // console.log("Aggro -> Tempo -> Control -> Combo -> Midrange");

    // generateCategoryItems(
    //   info.effectsCount,
    //   info.comparison.effects,
    //   "effectsContainer"
    // );
    generateCategoryItems(
      info.categoriesCount,
      info.comparison.categories,
      "categoriesContainer"
    );
  } else {
    allCards.forEach((card) => {
      card.ocurrences = getOccurrencesInDecks(card.number, decks);
      card.stars = scaleToFive(
        (getOccurrencesInSides(card.number, decks) / decks.length) * 100
      );
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

  if (selectedCost) {
    const suggestionNumbers = suggestions.map((obj) => obj.idcard);
    let cardList = await getCardsFromDeck(suggestionNumbers, allCards);
    filterCardsByCost(cardList, selectedCost);
  }

  if (selectedType) {
    const suggestionNumbers = suggestions.map((obj) => obj.idcard);
    let cardList = await getCardsFromDeck(suggestionNumbers, allCards);
    filterCardsByType(cardList, selectedType);
  }

  generateTypeSuggestions(rerun);
  generateCostSuggestions(rerun);
  generateCategorySuggestions(rerun);

  generateArchetypeSelect();
  generateStyleSelect();
}

async function generateDeck() {
  if (deck.cards.length <= 0) {
    await completeDeck(true);
    await tuningDeck();
    updateAnalysisFromDeck();
  }
}

async function completeDeck(flagGenerate) {
  if (deck.cards.length > 0 || flagGenerate) {
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
}

async function tuningDeck() {

  console.log(analysisAverages);

  if (deck.cards.length > 0) {
    let markerHasChanged = true;
    let counterLoop = 0;

    let filteredDeck = deck.cards.filter((str) =>
      legendaries.some((json) => json.number === str)
    );

    deck.cards = deck.cards.filter(
      (str) => !legendaries.some((json) => json.number === str)
    );

    if (deck.cards.length > 0) {
      while (
        // deck.cards.length != analysisAverages.averageQtd &&
        markerHasChanged == true &&
        counterLoop < analysisAverages.averageQtd
      ) {
        // while (markerHasChanged == true && counterLoop < 5) {
        markerHasChanged = false;

        const filteredCategories = analysisAverages.averageCategories.filter(
          (category) => category.media !== 0
        );

        const innexistentCategories = filteredCategories
          .map((category) => category.name)
          .filter((cat) => !(cat in infoFromDeck.categoriesCount));

        const higherCategories = Object.keys(
          infoFromDeck.comparison.categories
        ).filter((key) => infoFromDeck.comparison.categories[key] === "higher");

        const lowerCategories = Object.keys(
          infoFromDeck.comparison.categories
        ).filter((key) => infoFromDeck.comparison.categories[key] === "lower");

        let menorValor = Infinity;
        let menorCategoria = null;

        let maiorValor = -Infinity;
        let maiorCategoria = null;

        lowerCategories.forEach((cat) => {
          let valor = infoFromDeck.categoriesCount[cat];
          if (valor < menorValor) {
            menorValor = valor;
            menorCategoria = cat;
          }
        });

        higherCategories.forEach((cat) => {
          let valor = infoFromDeck.categoriesCount[cat];
          if (valor > maiorValor) {
            maiorValor = valor;
            maiorCategoria = cat;
          }
        });

        console.log(`Inexistente: ${innexistentCategories}`);
        console.log(
          `Menor valor: ${menorValor}, Categoria menor: ${menorCategoria}`
        );
        console.log(
          `Maior valor: ${maiorValor}, Categoria maior: ${maiorCategoria}`
        );

        // Filtra os itens cujo "number" está em filteredDeck e retorna apenas "commonNumber"
        const filteredCommonNumbers = legendaries.reduce((acc, item) => {
          if (filteredDeck.includes(item.number)) acc.push(item.commonNumber);
          return acc;
        }, []);

        // Mapeia suggestions para obter os ids das cartas
        let suggestionNumbers = suggestions
          .map((obj) => obj.idcard)
          // Remove os que já estão em filteredDeck
          .filter((str) => !filteredDeck.includes(str))
          // Remove os que já estão em filteredCommonNumbers
          .filter((str) => !filteredCommonNumbers.includes(str));

        if (
          deck.cards.length < analysisAverages.averageQtd &&
          suggestionNumbers.length > 0
        ) {
          addCardToDeckBuilder(suggestionNumbers[0]);
          markerHasChanged = true;
        } else if (deck.cards.length > analysisAverages.averageQtd) {
          await removeCardFromSpecifiedCategory(maiorCategoria);
          await wait(1);

          maiorValor = -Infinity;
          maiorCategoria = null;

          higherCategories.forEach((cat) => {
            let valor = infoFromDeck.categoriesCount[cat];
            if (valor > maiorValor) {
              maiorValor = valor;
              maiorCategoria = cat;
            }
          });
          markerHasChanged = true;
        } else {
          if (menorCategoria != null && maiorCategoria != null) {
            if (innexistentCategories.length > 0) {
              await addCardFromSpecifiedCategory(
                innexistentCategories[0],
                suggestionNumbers
              );
              await removeCardFromSpecifiedCategory(maiorCategoria);
              markerHasChanged = true;
            } else if (
              higherCategories.length > 0 &&
              lowerCategories.length > 0
            ) {
              await addCardFromSpecifiedCategory(
                lowerCategories[0],
                suggestionNumbers
              );
              await removeCardFromSpecifiedCategory(maiorCategoria);
              markerHasChanged = true;
            }
          }
        }

        let filteredDeck2 = deck.cards.filter((str) =>
          legendaries.some((json) => json.number === str)
        );

        deck.cards = deck.cards.filter(
          (str) => !legendaries.some((json) => json.number === str)
        );

        filteredDeck.push(...filteredDeck2);

        if (deck.cards.length != analysisAverages.averageQtd) {
          markerHasChanged = true;
        }

        counterLoop++;
        await wait(1);
      }
    }

    deck.cards = deck.cards.filter(
      (str) => !legendaries.some((json) => json.number === str)
    );

    filteredDeck.forEach(async (card) => {
      addCardToDeckBuilder(card);
      await wait(1);
    });
  }
}

// ADICIONAR A MELHOR CARTA DE UMA CATEGORIA EM ESPECÍFICO
async function addCardFromSpecifiedCategory(category, suggestionNumbers) {
  let suggestionList = await getCardsFromDeck(suggestionNumbers, allCards);

  suggestionList = [...new Set(suggestionList)];

  suggestionList = suggestionList.filter((card) => {
    if (!card.categories) return false;
    const cardCategories = card.categories.split(";").map((cat) => cat.trim());
    return cardCategories.some((cat) => category == cat);
  });

  console.log("addCardFromSpecifiedCategory(" + category + ")");
  // console.log(suggestionList);

  addCardToDeckBuilder(suggestionList[0].number);
  await wait(500);
}

// REMOVA DE UM DECK A PIOR CARTA DE UMA CATEGORIA EM ESPECÍFICO
async function removeCardFromSpecifiedCategory(category) {
  let cardList = getCardsFromDeck(deck.cards, allCards);

  cardList = [...new Set(cardList)];

  cardList = cardList.filter((card) => {
    if (!card.categories) return false;
    const cardCategories = card.categories.split(";").map((cat) => cat.trim());
    return cardCategories.some((cat) => category == cat);
  });

  let menorOcorrencia = Infinity;
  let cardsMenorOcorrencia = [];

  cardList.forEach((card) => {
    let ocorrencias = getOccurrencesInSides(card.number, decks);

    if (ocorrencias < menorOcorrencia) {
      menorOcorrencia = ocorrencias;
      cardsMenorOcorrencia = [card];
    } else if (ocorrencias === menorOcorrencia) {
      cardsMenorOcorrencia.push(card);
    }
  });

  console.log("removeCardFromSpecifiedCategory(" + category + ")");
  // console.log(cardList);

  if (cardsMenorOcorrencia.length > 0) {
    removeCardFromDeckBuilder(cardsMenorOcorrencia[0].number);
    await wait(500);
  }
}

async function cleanDeck() {
  while (deck.cards.length > 0) {
    deck.cards.forEach((card) => {
      removeCardFromDeckBuilder(card);
    });
  }
  await updateAnalysisFromDeck();
}

async function autoGenerateHand(isMulligan) {
  function getRandomItemsFromArray(arr, numItems) {
    if (numItems > arr.length) {
      throw new Error(
        "numItems cannot be greater than the length of the array"
      );
    }

    // Criar uma cópia do array original para evitar modificar o array original
    const shuffledArray = arr.slice();

    // Embaralhar o array usando o algoritmo de Fisher-Yates
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ];
    }

    // Pegar os primeiros numItems itens do array embaralhado
    return shuffledArray.slice(0, numItems);
  }

  if (!isMulligan) {
    handTestCards = [];
  }

  let cardList = await getCardsFromDeck(deck.cards, allCards);

  cardList = cardList.filter(
    (card) => card.type !== "Herói de Fé" || card.subtype !== "Lendário"
  );

  console.log(cardList);

  handTestCards.forEach((id) => {
    const index = cardList.findIndex((obj) => obj.number === id);
    if (index !== -1) {
      cardList.splice(index, 1);
    }
  });

  if (
    deck.cards.length > 0 &&
    handTestCards.length < 6 &&
    isMulligan != "draw"
  ) {
    const cards = getRandomItemsFromArray(cardList, 5 - handTestCards.length);
    cards.forEach((card) => {
      addCardToHand(card.number);
    });
  } else if (isMulligan == "draw") {
    const cards = getRandomItemsFromArray(cardList, 1);
    cards.forEach((card) => {
      addCardToHand(card.number);
    });
  }

  updateTestHand(allCards, handTestCards, "#handTestList");
}

async function generateTypeSuggestions(rerun) {
  const suggestionNumbers = allCards.map((obj) => obj.number);

  let cardList = await getCardsFromDeck(suggestionNumbers, allCards);
  let tipos = cardList.flatMap((obj) => obj.type.split(";"));
  tipos = [...new Set(tipos)];

  const buttonContainer = document.getElementById("addByTypesList");
  if (!buttonContainer) {
    return;
  }

  buttonContainer.innerHTML = "";

  tipos.forEach((tipo) => {
    // Verifica se existe ao menos uma carta com o tipo
    const hasCardsWithType = cardList.some((card) =>
      card.type.split("#").includes(tipo)
    );

    if (hasCardsWithType) {
      const button = document.createElement("button");
      button.innerText = tipo;
      if (selectedCategory == tipo) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () =>
        handleButtonClickType(tipo, button, cardList, rerun)
      );
      buttonContainer.appendChild(button);
    }
  });
}

async function generateCostSuggestions(rerun) {
  const suggestionNumbers = allCards.map((obj) => obj.number);

  let cardList = await getCardsFromDeck(suggestionNumbers, allCards);
  let custos = cardList.flatMap((obj) => obj.cost).sort((a, b) => a - b);
  custos = [...new Set(custos)];

  const buttonContainer = document.getElementById("addByCostList");
  if (!buttonContainer) {
    return;
  }

  buttonContainer.innerHTML = "";

  custos.forEach((custo) => {
    // Verifica se existe ao menos uma carta com o tipo
    const hasCardsWithCost = cardList.some((card) => card.cost == custo);

    if (hasCardsWithCost) {
      const button = document.createElement("button");
      button.innerText = custo;
      if (selectedCost == custo) {
        button.classList.add("selected");
      }
      button.addEventListener("click", () =>
        handleButtonClickCost(custo, button, cardList, rerun)
      );
      buttonContainer.appendChild(button);
    }
  });
}

async function generateCategorySuggestions(rerun) {
  const suggestionNumbers = allCards.map((obj) => obj.number);

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
        handleButtonClickCategory(categoria, button, cardList, rerun)
      );
      buttonContainer.appendChild(button);
    }
  });
}

function handleButtonClickType(tipo, button, cardList, rerun) {
  if (selectedType === tipo) {
    selectedType = null;
    if (!rerun) button.classList.remove("selected");
    updateAnalysisFromDeck();
  } else {
    if (selectedType !== null) {
      const previousButton = document.querySelector(".type.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
    selectedType = tipo;
    selectedCost = null;
    selectedCategory = null;
    button.classList.add("type");
    button.classList.add("selected");

    if (selectedCategory == null) {
      const previousButton = document.querySelector(".category.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }

    if (selectedCost == null) {
      const previousButton = document.querySelector(".cost.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
  }

  filterCardsByType(cardList, selectedType);
}

function handleButtonClickCost(custo, button, cardList, rerun) {
  if (selectedCost === custo) {
    selectedCost = null;
    if (!rerun) button.classList.remove("selected");
    updateAnalysisFromDeck();
  } else {
    if (selectedCost !== null) {
      const previousButton = document.querySelector(".cost.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
    selectedCost = custo;
    selectedType = null;
    selectedCategory = null;
    button.classList.add("cost");
    button.classList.add("selected");

    if (selectedType == null) {
      const previousButton = document.querySelector(".type.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }

    if (selectedCategory == null) {
      const previousButton = document.querySelector(".category.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
  }

  filterCardsByCost(cardList, selectedCost);
}

function handleButtonClickCategory(categoria, button, cardList, rerun) {
  if (selectedCategory === categoria) {
    selectedCategory = null;
    if (!rerun) button.classList.remove("selected");
    updateAnalysisFromDeck();
  } else {
    if (selectedCategory !== null) {
      const previousButton = document.querySelector(".category.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
    selectedType = null;
    selectedCost = null;
    selectedCategory = categoria;
    button.classList.add("category");
    button.classList.add("selected");

    if (selectedType == null) {
      const previousButton = document.querySelector(".type.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }

    if (selectedCost == null) {
      const previousButton = document.querySelector(".cost.selected");
      if (previousButton) {
        previousButton.classList.remove("selected");
      }
    }
  }

  filterCardsByCategory(cardList, selectedCategory);
}

async function filterCardsByType(cardList, type) {
  let filteredCards = [];
  if (type) {
    filteredCards = cardList.filter((card) =>
      card.type.split(";").includes(type)
    );
  }

  if (filteredCards.length > 0) {
    updateMiniCards(allCards, filteredCards, "#suggestionsDeckList");
  } else {
    selectedType = null;
    updateAnalysisFromDeck();
  }
}

async function filterCardsByCost(cardList, cost) {
  let filteredCards = [];
  if (cost) {
    filteredCards = cardList.filter((card) => card.cost == cost);
  }

  if (filteredCards.length > 0) {
    updateMiniCards(allCards, filteredCards, "#suggestionsDeckList");
  } else {
    selectedCost = null;
    updateAnalysisFromDeck();
  }
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
        "col-lg-1 col-md-1 col-1 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        removeCardFromDeckBuilder(card.number)
      );
      cardElement.style = "padding-right:5px; padding-left: 5px;";

      extraDeckListContainer.appendChild(cardElement);
    } else {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-1 col-md-1 col-3 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        removeCardFromDeckBuilder(card.number)
      );
      cardElement.style = "padding-right:5px; padding-left: 5px;";

      deckListContainer.appendChild(cardElement);
    }
  });
}

function updateTestHand(allCards, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;

  similarCardsContainer.innerHTML = "";

  cardsList.forEach((similarCard) => {
    const details = allCards.find((card) => card.number == similarCard);
    if (details) {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-2 col-md-2 col-sm-2 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.style.padding = "2px";
      cardElement.style.margin = "2px";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        removeCardFromHand(details.number)
      );

      similarCardsContainer.appendChild(cardElement);
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
        "col-lg-2 col-md-2 col-sm-2 col-2 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        addCardToDeckBuilder(details.number)
      );
      cardElement.style = "padding-right:5px; padding-left: 5px;";

      similarCardsContainer.appendChild(cardElement);
    }
  });
}

function addCardToDeckBuilder(id) {
  deck.cards.push(id);
  console.log(deck.cards);
  updateAnalysisFromDeck();
}

function addCardToHand(id) {
  handTestCards.push(id);
}

function removeCardFromHand(id) {
  const index = handTestCards.indexOf(id);
  if (index !== -1) {
    handTestCards.splice(index, 1);
  }
  updateTestHand(allCards, handTestCards, "#handTestList");
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

function generateStyleSelect() {
  document.getElementById("addByStyleList").innerHTML = "";

  const addByStyleList = document.getElementById("addByStyleList");

  const select = document.createElement("select");
  select.setAttribute("name", "style");
  select.setAttribute("prettyName", "Estilo");
  select.setAttribute("id", `styleFilter`);
  select.classList.add("mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Estilo";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  const styles = [...new Set(decks.map((obj) => obj.style))];

  styles.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.innerHTML = value;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      chooseStyle(value);
      // select.disabled = true;
    }
  });

  addByStyleList.appendChild(select);
}

function generateArchetypeSelect() {
  document.getElementById("addByArchetypeList").innerHTML = "";

  const addByArchetypeList = document.getElementById("addByArchetypeList");

  const select = document.createElement("select");
  select.setAttribute("name", "archetype");
  select.setAttribute("prettyName", "Arquétipo");
  select.setAttribute("id", `archetypeFilter`);
  select.classList.add("mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Arquétipo";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  const styles = [...new Set(decks.map((obj) => obj.archetype))];

  styles.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.innerHTML = value;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      chooseArchetype(value);
      // select.disabled = true;
    }
  });

  addByArchetypeList.appendChild(select);
}

function chooseStyle(value) {
  selectedStyle = value;
  updateAnalysisFromDeck();
}

function chooseArchetype(value) {
  selectedArchetype = value;
  updateAnalysisFromDeck();
}

function transformToObjectArray(cards) {
  return cards.map((card) => ({ idcard: card.number, qtd: card.ocurrences }));
}

function getCategoryClass(categoria) {
  return categoryValues[categoria] ? "green" : "red";
}
