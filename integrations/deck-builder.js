let deck;
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
  // Carregar os JSONs em paralelo para aumentar a eficiência
  await waitForAllJSONs();

  // Carregamento paralelo das informações
  const [legendariesData, artifactsData] = await Promise.all([
    fetchOrGetFromLocalStorage("legendaries", URL_LEGENDARIES_JSON),
    fetchOrGetFromLocalStorage("artifacts", URL_ARTIFACTS_JSON),
  ]);

  // Atualizar as variáveis após o carregamento
  legendaries = legendariesData;
  artifacts = artifactsData;

  // Inicializar o deck e sugestões
  deck = {
    cards: [],
    extra: [],
  };

  suggestions = [];

  // Atualizar a análise do deck
  await updateAnalysisFromDeck();
});

async function updateAnalysisFromDeck() {
  deck.cards = limitStringOccurrences(deck.cards, 2);

  const mergedArray = [...deck.cards, ...deck.extra];
  let cardsFromDeck = getCardsFromDeck(mergedArray, allCards);

  let similarCardsArray = [];

  if (deck.cards.length > 0) {
    analysisAverages = await analyzeDecks(
      allDecks,
      selectedStyle,
      selectedArchetype
    );
    let info = await analyzeCards(cardsFromDeck, analysisAverages);
    infoFromDeck = info;

    await Promise.all(
      deck.cards.map(async (card) => {
        const similarCards = await getRelatedCardsInDecks(
          card,
          allDecks,
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

    suggestions = mergedAndSummed.sort((a, b) => b.qtd - a.qtd);

    similarCardsArray = mergedAndSummed
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, suggestionsQtd);

    let sumStars = 0;

    cardsFromDeck.forEach((card) => {
      sumStars += parseFloat(card.stars) / deck.cards.length;
    });

    const elementsToUpdate = {
      tag_deckName: deck.name,

      tag_deckStyle: deck.style,
      tag_deckLevel: deck.level,
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

    generateCategoryItems(
      info.categoriesCount,
      info.comparison.categories,
      "categoriesContainer"
    );
  } else {
    similarCardsArray = sortByStarsAndDate(allCards);
    similarCardsArray = transformToObjectArray(similarCardsArray);
    similarCardsArray = await prepareSimilarCardsArray(similarCardsArray);
    suggestions = similarCardsArray.sort((a, b) => b.qtd - a.qtd);
    similarCardsArray = similarCardsArray.slice(0, suggestionsQtd);
  }

  updateDeckListDOM(cardsFromDeck);
  updateMiniCards(allCards, similarCardsArray, "#suggestionsDeckList");

  document.getElementById("filters").innerHTML = "";

  generateTextFilterByProperty("name", "Nome", "Digite o Nome");
  generateTextFilterByProperty("text", "Text", "Digite o Texto da Carta");
  generateSelectFilterByProperty(allCards, "type", "Tipo", "Tipo");
  generateSelectFilterByProperty(allCards, "subtype", "SubTipo", "SubTipo");
  generateCategoryFilter(allCards);
  generateSelectFilterByProperty(allCards, "cost", "Custo", "Custo");
  generateEffectFilter(allCards);
  generateSelectFilterByProperty(allCards, "strength", "Força", "Força");
  generateSelectFilterByProperty(
    allCards,
    "resistence",
    "Resistência",
    "Resistência"
  );
  generateSelectFilterByProperty(allCards, "collection", "Coleção", "Coleção");

  generateArchetypeSelect();
  generateStyleSelect();

  filterResults();

  deck = await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);

}

async function generateDeck() {
  await updateAnalysisFromDeck();
  if (deck.cards.length <= 0) {
    await completeDeck(true);
    await tuningDeck();
    await tuningDeck();
    await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);
    await updateAnalysisFromDeck();
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

    await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);
    await updateAnalysisFromDeck();
  }
}

async function tuningDeck() {

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

        // console.log(`Inexistente: ${innexistentCategories}`);
        // console.log(
        //   `Menor valor: ${menorValor}, Categoria menor: ${menorCategoria}`
        // );
        // console.log(
        //   `Maior valor: ${maiorValor}, Categoria maior: ${maiorCategoria}`
        // );

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

    // console.log(suggestions);
    let suggestionNumbers = suggestions.map((obj) => obj.idcard);

    filteredDeck = [
      ...new Set([
        ...filteredDeck,
        ...suggestionNumbers.filter((str) =>
          legendaries.some((json) => json.number === str)
        ),
      ]),
    ];

    filteredDeck.forEach(async (card) => {
      addCardToDeckBuilder(card);
      await wait(1);
    });

    await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);
    await updateAnalysisFromDeck();
  }
}

// ADICIONAR A MELHOR CARTA DE UMA CATEGORIA EM ESPECÍFICO
async function addCardFromSpecifiedCategory(category, suggestionNumbers) {
  try {
    // Obter a lista de sugestões a partir do deck
    let suggestionList = await getCardsFromDeck(suggestionNumbers, allCards);

    // Remover duplicatas
    suggestionList = [...new Set(suggestionList)];

    // Filtrar cartas com a categoria especificada
    suggestionList = suggestionList.filter((card) => {
      if (!card.categories) return false;
      const cardCategories = card.categories
        .split(";")
        .map((cat) => cat.trim());
      return cardCategories.some((cat) => category === cat);
    });

    // Verificar se a lista de sugestões não está vazia
    if (suggestionList.length === 0) {
      console.warn(`Nenhuma carta encontrada para a categoria: ${category}`);
      return; // Saia da função se não houver cartas
    }

    // Adicionar a primeira carta da lista filtrada ao deck
    addCardToDeckBuilder(suggestionList[0].number);
    await wait(500);
  } catch (error) {
    console.error("Erro ao adicionar carta da categoria especificada:", error);
  }
}

// REMOVA DE UM DECK A PIOR CARTA DE UMA CATEGORIA EM ESPECÍFICO
async function removeCardFromSpecifiedCategory(category) {
  try {
    // Obter a lista de cartas do deck
    let cardList = getCardsFromDeck(deck.cards, allCards);

    // Remover duplicatas
    cardList = [...new Set(cardList)];

    // Filtrar cartas que pertencem à categoria especificada
    cardList = cardList.filter((card) => {
      if (!card.categories) return false;
      const cardCategories = card.categories
        .split(";")
        .map((cat) => cat.trim());
      return cardCategories.some((cat) => category === cat);
    });

    // Verificar se a lista de cartas não está vazia
    if (cardList.length === 0) {
      console.warn(`Nenhuma carta encontrada para a categoria: ${category}`);
      return; // Saia da função se não houver cartas
    }

    let menorOcorrencia = Infinity;
    let cardsMenorOcorrencia = [];

    // Encontrar a(s) carta(s) com a menor ocorrência
    cardList.forEach((card) => {
      const ocorrencias = getOccurrencesInSides(card.number, allDecks);

      if (ocorrencias < menorOcorrencia) {
        menorOcorrencia = ocorrencias;
        cardsMenorOcorrencia = [card];
      } else if (ocorrencias === menorOcorrencia) {
        cardsMenorOcorrencia.push(card);
      }
    });

    // Remover a carta com menor ocorrência se houver
    if (cardsMenorOcorrencia.length > 0) {
      removeCardFromDeckBuilder(cardsMenorOcorrencia[0].number);
      await wait(500);
    }
  } catch (error) {
    console.error("Erro ao remover carta da categoria especificada:", error);
  }
}

async function cleanDeck() {
  while (deck.cards.length > 0) {
    const card = deck.cards[0]; // Pega a primeira carta do deck
    removeCardFromDeckBuilder(card); // Remove a carta do construtor de deck
  }
  await updateAnalysisFromDeck(); // Atualiza a análise do deck após a limpeza
  await updateAnalysisFromDeck(); // Atualiza a análise do deck após a limpeza
  updateDeckListDOM([]);
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

  // console.log(cardList);

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

function generateSelectFilterByProperty(
  jsonData,
  property,
  prettyName,
  text,
  order
) {
  const filtersContainer = document.getElementById("filters");
  const currentSelectedFilters = getCurrentSelectedFilters();

  // Obtenha os valores únicos com base na propriedade
  const uniqueValues = [
    ...new Set(
      jsonData.map((item) => {
        if (property === "stars") {
          return Math.floor(parseFloat(item[property]));
        } else if (property === "date") {
          return new Date(item[property]).getFullYear();
        } else if (item[property] != null && item[property] !== "") {
          return item[property];
        }
      })
    ).values(),
  ].filter(
    (value) => !Object.values(currentSelectedFilters).includes(String(value))
  );

  // Ordenar valores
  uniqueValues.sort((a, b) => (order === "ASC" ? a - b : b - a));

  // Criar o elemento <select>
  const select = document.createElement("select");
  select.name = property;
  select.setAttribute("prettyName", prettyName);
  select.id = `${property}Filter`;
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");

  const defaultOption = document.createElement("option");
  defaultOption.text = text;
  defaultOption.value = "";
  select.appendChild(defaultOption);

  // Adicionar opções ao select
  uniqueValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;

    if (property === "stars") {
      option.innerHTML = "★".repeat(value) + "☆".repeat(5 - value); // Estrelas preenchidas e vazias
    } else {
      option.text = value;
    }

    select.appendChild(option);
  });

  // Adicionar evento de mudança
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter(property, value, prettyName);
      select.disabled = true; // Desabilitar o select após a seleção
    }
    filterResults(); // Filtrar resultados com base nos filtros aplicados
  });

  filtersContainer.appendChild(select);
}

function generateTextFilterByProperty(property, prettyName, placeholder) {
  const filtersContainer = document.getElementById("filters");

  const input = document.createElement("input");
  input.type = "text";
  input.name = property;
  input.setAttribute("prettyName", prettyName);
  input.id = `${property}Filter`;
  input.placeholder = placeholder;
  input.classList.add("mb-3", "mr-3", "custom-text-input");

  // Função para aplicar filtro
  const applyFilter = () => {
    const value = input.value.trim(); // Remove espaços em branco
    if (value) {
      addSelectedFilter(property, value, prettyName);
      input.disabled = true; // Desabilita o campo após a seleção
      filterResults();
    }
  };

  // Evento de tecla pressionada (Enter)
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      applyFilter();
    }
  });

  // Evento de perda de foco
  input.addEventListener("blur", () => {
    applyFilter();
  });

  filtersContainer.appendChild(input);
}

function generateCategoryFilter(jsonData) {
  const filtersContainer = document.getElementById("filters");
  const currentSelectedFilters = getCurrentSelectedFilters();
  const categoriesSet = new Set();

  // Itera sobre os dados para extrair todas as categorias únicas
  jsonData.forEach((item) => {
    const categories = item.categories.split(";");
    categories.forEach((category) => {
      categoriesSet.add(category.trim()); // Adiciona a categoria ao conjunto
    });
  });

  // Converte o conjunto de categorias de volta para um array
  const uniqueCategories = Array.from(categoriesSet).filter(
    (category) => !Object.values(currentSelectedFilters).includes(category)
  );

  // Cria o select e adiciona as opções com as categorias únicas
  const select = document.createElement("select");
  select.setAttribute("name", "categories");
  select.setAttribute("prettyName", "Categoria");
  select.setAttribute("id", `categoriesFilter`);
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Categoria";
  defaultOption.value = "";
  select.appendChild(defaultOption);
  uniqueCategories.forEach((category) => {
    const option = document.createElement("option");
    option.text = category;
    option.value = category;
    select.appendChild(option);
  });

  // Adiciona o evento de mudança ao select
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("categories", value, "Categoria");
      select.disabled = true;
    }
    filterResults(jsonData);
  });

  // Adiciona o select ao contêiner de filtros
  filtersContainer.appendChild(select);
}

function generateEffectFilter(jsonData) {
  const filtersContainer = document.getElementById("filters");
  const effectsSet = new Set();

  // Itera sobre os dados para extrair todos os efeitos únicos
  jsonData.forEach((item) => {
    if (item.effects) {
      // Verifica se a propriedade effects existe
      const effects = item.effects.split(";");
      effects.forEach((effect) => {
        const trimmedEffect = effect.trim();
        if (trimmedEffect) {
          // Adiciona somente efeitos não vazios
          effectsSet.add(trimmedEffect);
        }
      });
    }
  });

  // Converte o conjunto de efeitos de volta para um array
  const uniqueEffects = Array.from(effectsSet);

  // Cria o select e adiciona as opções com os efeitos únicos
  const select = document.createElement("select");
  select.setAttribute("name", "effects");
  select.setAttribute("prettyName", "Efeito");
  select.setAttribute("id", "effectsFilter");
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");

  // Adiciona opção padrão
  const defaultOption = document.createElement("option");
  defaultOption.text = "Selecione um Efeito"; // Mensagem padrão
  defaultOption.value = "";
  select.appendChild(defaultOption);

  // Adiciona as opções de efeitos
  uniqueEffects.forEach((effect) => {
    const option = document.createElement("option");
    option.text = effect;
    option.value = effect;
    select.appendChild(option);
  });

  // Adiciona o evento de mudança ao select
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("effects", value, "Efeito");
      select.disabled = true; // Desabilita após a seleção
      filterResults(jsonData); // Aplica o filtro
    }
  });

  // Adiciona o select ao contêiner de filtros
  filtersContainer.appendChild(select);
}

function getCurrentSelectedFilters() {
  const selectedFilters = {};
  const selectedFiltersContainer = document.getElementById("selected-filters");

  // Verifica se o contêiner de filtros selecionados existe
  if (!selectedFiltersContainer) {
    console.warn("O contêiner de filtros selecionados não foi encontrado.");
    return selectedFilters; // Retorna um objeto vazio se não existir
  }

  // Seleciona todos os filtros atualmente aplicados
  const filters = selectedFiltersContainer.querySelectorAll(".selected-filter");

  // Itera sobre cada filtro selecionado para coletar suas propriedades e valores
  filters.forEach((filterTag) => {
    const property = filterTag.getAttribute("data-property");
    const value = filterTag.getAttribute("data-value");

    // Se a propriedade já existe, converte o valor para um array se não for um
    if (selectedFilters[property]) {
      // Se o valor já for um array, adiciona o novo valor; caso contrário, transforma em um array
      if (Array.isArray(selectedFilters[property])) {
        selectedFilters[property].push(value);
      } else {
        selectedFilters[property] = [selectedFilters[property], value];
      }
    } else {
      // Caso contrário, simplesmente define o valor
      selectedFilters[property] = value;
    }
  });

  return selectedFilters;
}

function addSelectedFilter(property, value, prettyName) {
  const selectedFiltersContainer = document.getElementById("selected-filters");

  const filterTag = document.createElement("div");
  filterTag.className = "selected-filter";
  filterTag.setAttribute("data-property", property);
  filterTag.setAttribute("data-value", value);
  filterTag.innerText = `${prettyName}: ${value}`;

  filterTag.addEventListener("click", function () {
    removeSelectedFilter(property, value);
    filterResults();
  });

  selectedFiltersContainer.appendChild(filterTag);
}

function removeSelectedFilter(property, value) {
  const selectedFiltersContainer = document.getElementById("selected-filters");
  const filterTag = selectedFiltersContainer.querySelector(
    `.selected-filter[data-property="${property}"][data-value="${value}"]`
  );

  if (filterTag) {
    filterTag.remove();
  }

  const select = document.getElementById(`${property}Filter`);
  if (select) {
    select.value = "";
    select.disabled = false;
  }
}

async function filterResults() {
  const selectedFiltersContainer = document.getElementById("selected-filters");
  const filters = selectedFiltersContainer.querySelectorAll(".selected-filter");

  const suggestionNumbers = suggestions.map((obj) => obj.idcard);

  let filteredData = await getCardsFromDeck(suggestionNumbers, allCards);

  filters.forEach((filterTag) => {
    const property = filterTag.getAttribute("data-property");
    const value = filterTag.getAttribute("data-value");

    if (property === "effects") {
      filteredData = filteredData.filter((item) => {
        const effects = item.effects.split(";");
        return effects.includes(value);
      });
    } else if (property === "categories") {
      filteredData = filteredData.filter((item) => {
        const categories = item.categories.split(";");
        return categories.includes(value);
      });
    } else {
      filteredData = filteredData.filter((item) => {
        if (
          property === "name" ||
          property === "flavor" ||
          property === "text"
        ) {
          return item[property].toLowerCase().includes(value.toLowerCase());
        } else if (property === "stars") {
          return Math.floor(parseFloat(item[property])) === parseInt(value);
        } else if (property === "date") {
          return new Date(item[property]).getFullYear() === parseInt(value);
        } else {
          return item[property] == value;
        }
      });
    }
  });

  document.getElementById("filters").innerHTML = "";

  filteredData = sortByStarsAndDate(filteredData).slice(0, suggestionsQtd);

  generateTextFilterByProperty("name", "Nome", "Digite o Nome");
  generateTextFilterByProperty("text", "Text", "Digite o Texto da Carta");
  generateSelectFilterByProperty(filteredData, "type", "Tipo", "Tipo");
  generateSelectFilterByProperty(filteredData, "subtype", "SubTipo", "SubTipo");
  generateSelectFilterByProperty(filteredData, "cost", "Custo", "Custo");
  generateCategoryFilter(filteredData);
  generateEffectFilter(filteredData);
  generateSelectFilterByProperty(filteredData, "strength", "Força", "Força");
  generateSelectFilterByProperty(
    filteredData,
    "resistence",
    "Resistência",
    "Resistência"
  );
  generateSelectFilterByProperty(
    filteredData,
    "collection",
    "Coleção",
    "Coleção"
  );

  updateMiniCards(allCards, filteredData, "#suggestionsDeckList");
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
        "col-lg-1 col-md-2 col-2 card__related__sidebar__view__item set-bg";
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
        "col-lg-1 col-md-2 col-2 card__related__sidebar__view__item set-bg";
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
  // console.log(deck.cards);
  updateAnalysisFromDeck();
}

function addCardToHand(id) {
  handTestCards.push(id);
}

function removeCardFromHand(id) {
  const index = handTestCards.findIndex((card) => card.id === id); // Ajuste se for um objeto
  if (index !== -1) {
    handTestCards.splice(index, 1);
    updateTestHand(allCards, handTestCards, "#handTestList");
  } else {
    console.warn(`Carta com ID ${id} não encontrada na mão.`);
  }
}

function removeCardFromDeckBuilder(id) {
  const index = deck.cards.indexOf(id); // Encontra o índice do ID no array
  if (index !== -1) {
    deck.cards.splice(index, 1); // Remove a carta se o índice for válido
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

function generateStyleSelect() {
  document.getElementById("addByStyleList").innerHTML = "";
  document.getElementById("addByStyleIcon").innerHTML = "";

  const addByStyleList = document.getElementById("addByStyleList");

  // Criar um contêiner para o select e o ícone
  const container = document.createElement("div");
  container.classList.add("select-container");

  const select = document.createElement("select");
  select.setAttribute("name", "style");
  select.setAttribute("prettyName", "Estilo");
  select.setAttribute("id", `styleFilter`);
  select.classList.add("mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Estilo";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  const styles = [...new Set(allDecks.map((obj) => obj.style))];

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

  container.appendChild(select);
  addByStyleList.appendChild(container);
}

function generateArchetypeSelect() {
  document.getElementById("addByArchetypeList").innerHTML = "";
  document.getElementById("addByArchetypeIcon").innerHTML = "";

  const addByArchetypeList = document.getElementById("addByArchetypeList");

  // Criar um contêiner para o select e o ícone
  const container = document.createElement("div");
  container.classList.add("select-container");

  const select = document.createElement("select");
  select.setAttribute("name", "archetype");
  select.setAttribute("prettyName", "Arquétipo");
  select.setAttribute("id", `archetypeFilter`);
  select.classList.add("mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Arquétipo";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  const archetypes = [...new Set(allDecks.map((obj) => obj.archetype))];

  archetypes.forEach((value) => {
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

  // Adicionar o select e o ícone ao contêiner
  container.appendChild(select);
  addByArchetypeList.appendChild(container);
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

function chooseStyle(value) {
  selectedStyle = value;
  updateAnalysisFromDeck();

  const icon = document.querySelector("#addByStyleIcon"); // Seleciona o ícone ao lado do select
  if (icon) {
    if (value) {
      icon.className = ""; // Limpa as classes do ícone
      icon.classList.add("fa"); // Adiciona a classe base do FontAwesome
      icon.classList.add("fa-solid"); // Adiciona a classe base do FontAwesome
      icon.style.padding = "5px"; // Ajuste o padding como necessário
      icon.style.borderRadius = "5px"; // Adicione bordas arredondadas se desejado
      icon.style.marginLeft = "5px"; // Espaçamento entre o select e o ícone
      icon.style.marginBottom = "5px"; // Espaçamento entre o select e o ícone

      switch (value) {
        case "Agressivo":
          icon.classList.add("fa-hand-back-fist");
          icon.style.backgroundColor = "#B22222";
          icon.style.color = "#fff";
          break;
        case "Equilibrado":
          icon.classList.add("fa-hand-scissors");
          icon.style.backgroundColor = "#FFD700";
          icon.style.color = "#000";
          break;
        case "Controlador":
          icon.classList.add("fa-hand");
          icon.style.backgroundColor = "#1E90FF";
          icon.style.color = "#fff";
          break;
        default:
          icon.classList.add("fa-question");
          icon.style.backgroundColor = "#6c757d";
          icon.style.color = "#fff";
      }
    }
  }
}

function chooseArchetype(value) {
  selectedArchetype = value;
  updateAnalysisFromDeck();

  const icon = document.querySelector("#addByArchetypeIcon"); // Seleciona o ícone ao lado do select
  if (icon) {
    if (value) {
      icon.className = ""; // Limpa as classes do ícone
      icon.classList.add("fa"); // Adiciona a classe base do FontAwesome
      icon.classList.add("fa-solid"); // Adiciona a classe base do FontAwesome
      icon.style.padding = "5px"; // Ajuste o padding como necessário
      icon.style.borderRadius = "5px"; // Adicione bordas arredondadas se desejado
      icon.style.marginLeft = "5px"; // Espaçamento entre o select e o ícone
      icon.style.marginBottom = "5px"; // Espaçamento entre o select e o ícone

      switch (value) {
        case "Batalha":
          icon.classList.add("fa-hand-fist");
          icon.style.backgroundColor = "#FF8C00";
          icon.style.color = "#000";
          break;
        case "Santificação":
          icon.classList.add("fa-droplet");
          icon.style.backgroundColor = "whitesmoke";
          icon.style.color = "#000";
          break;
        case "Combo":
          icon.classList.add("fa-gears");
          icon.style.backgroundColor = "#800080";
          icon.style.color = "#fff";
          break;
        case "Maravilhas":
          icon.classList.add("fa-hat-wizard");
          icon.style.backgroundColor = "#32CD32";
          icon.style.color = "#000";
          break;
        case "Supressão":
          icon.classList.add("fa-ban");
          icon.style.backgroundColor = "#000000";
          icon.style.color = "#fff";
          break;
        default:
          icon.classList.add("fa-question");
          icon.style.backgroundColor = "#6c757d";
          icon.style.color = "#fff";
      }
    }

    icon.textContent = value;
  }
}

function transformToObjectArray(cards) {
  return cards.map((card) => ({ idcard: card.number, qtd: card.ocurrences }));
}
