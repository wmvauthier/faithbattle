let deck;
let idSelectedDeck;
let cardsFromDeck;

let handTestCards = [];

let legendaries;
let artifacts;

let analysisAverages = [];

let suggestionsQtd = 20;
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
let selectedArchetype2 = null;
let selectedTier = null;

// ---------- Inicialização ----------
document.addEventListener("DOMContentLoaded", async function () {
  await waitForAllJSONs();

  const [legendariesData, artifactsData] = await Promise.all([
    fetchOrGetFromLocalStorage("legendaries", URL_LEGENDARIES_JSON),
    fetchOrGetFromLocalStorage("artifacts", URL_ARTIFACTS_JSON),
  ]);

  legendaries = legendariesData;
  artifacts = artifactsData;

  deck = { cards: [], extra: [] };
  suggestions = [];

  await updateAnalysisFromDeck();
});

// ---------- Análise do deck ----------
async function updateAnalysisFromDeck() {
  try {
    deck.cards = limitStringOccurrences(deck.cards, 2);

    const mergedArray = [...deck.cards, ...deck.extra];
    const cardsFromDeckLocal = getCardsFromDeck(mergedArray, allCards);

    let similarCardsArray = [];

    if (deck.cards.length > 0) {
      analysisAverages = await analyzeDecks(
        allDecks,
        selectedStyle,
        selectedArchetype,
        selectedArchetype2
      );

      const info = await analyzeCards(
        await cardsFromDeckLocal,
        analysisAverages
      );
      infoFromDeck = info;

      const maps = await Promise.all(
        deck.cards.map((card) =>
          getRelatedCardsInDecks(
            card,
            allDecks,
            true,
            selectedStyle,
            selectedArchetype,
            selectedArchetype2
          )
        )
      );

      maps.forEach((arr) => {
        if (Array.isArray(arr)) similarCardsArray.push(...arr);
      });

      similarCardsArray = mergeAndSumSimilarCards(similarCardsArray);
      similarCardsArray = await prepareSimilarCardsArray(similarCardsArray);
      const mergedAndSummed = mergeAndSumSimilarCards(similarCardsArray);
      suggestions = mergedAndSummed.sort((a, b) => b.qtd - a.qtd);

      similarCardsArray = mergedAndSummed
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, suggestionsQtd);

      deck = await calculateStarsFromDeck(
        deck,
        allCards,
        allDecks,
        legendaries
      );
      if (deck.cards.length < suggestionsQtd) deck.level = "";

      // elementos valores
      const elementsToUpdate = {
        tag_deckName: deck.name,
        tag_deckStyle: deck.style,
        tag_deckLevel: deck.level,
        tag_deckCategory:
          getKeyWithMaxAbsoluteValue(info.categoriesCount) || "-",
        tag_deckEffect: getKeyWithMaxAbsoluteValue(info.effectsCount) || "-",
        tag_deckSize: info.comparison.totalCards,
        tag_deckMedCost: info.averageCost.toFixed(2),
        tag_deckStrength: info.averageStrength
          ? info.averageStrength.toFixed(2)
          : "N/A",
        tag_deckResistence: info.averageResistance
          ? info.averageResistance.toFixed(2)
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
        tag_deckQtdComparison: info.comparison.general.qtd,
        tag_deckMedCostComparison: info.comparison.general.cost,
        tag_deckStrengthComparison: info.comparison.general.strength,
        tag_deckResistanceComparison: info.comparison.general.resistance,
        tag_deckCostHeroComparison: info.comparison.hero.cost,
        tag_deckCostMiracleComparison: info.comparison.miracle.cost,
        tag_deckCostSinComparison: info.comparison.sin.cost,
        tag_deckCostArtifactComparison: info.comparison.artifact.cost,
        tag_deckQtdHeroComparison: info.comparison.hero.count,
        tag_deckQtdMiracleComparison: info.comparison.miracle.count,
        tag_deckQtdSinComparison: info.comparison.sin.count,
        tag_deckQtdArtifactComparison: info.comparison.artifact.count,
      };

      // Atualiza textos simples
      Object.entries(elementsToUpdate).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (el) el.textContent = value;
      });

      // Atualiza médias (campos tag_avg_*)
      function setAvgIfExists(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = value === undefined || value === null ? "—" : value;
      }

      // tenta extrair médias bem conhecidas de analysisAverages (se existirem)
      setAvgIfExists(
        "tag_avg_totalCards",
        analysisAverages && analysisAverages.averageQtd
          ? analysisAverages.averageQtd
          : "—"
      );
      setAvgIfExists(
        "tag_avg_cost",
        analysisAverages &&
          (analysisAverages.averageCost || analysisAverages.avgCost)
          ? analysisAverages.averageCost || analysisAverages.avgCost
          : "—"
      );
      setAvgIfExists(
        "tag_avg_strength",
        analysisAverages && analysisAverages.averageStrength
          ? analysisAverages.averageStrength.toFixed
            ? analysisAverages.averageStrength.toFixed(2)
            : analysisAverages.averageStrength
          : "—"
      );
      setAvgIfExists(
        "tag_avg_resistance",
        analysisAverages && analysisAverages.averageResistance
          ? analysisAverages.averageResistance.toFixed
            ? analysisAverages.averageResistance.toFixed(2)
            : analysisAverages.averageResistance
          : "—"
      );

      // por tipo (se disponível em analysisAverages)
      setAvgIfExists(
        "tag_avg_heroCount",
        analysisAverages && analysisAverages.averageHeroCount
          ? analysisAverages.averageHeroCount
          : "—"
      );
      setAvgIfExists(
        "tag_avg_heroCost",
        analysisAverages && analysisAverages.averageHeroCost
          ? analysisAverages.averageHeroCost.toFixed
            ? analysisAverages.averageHeroCost.toFixed(2)
            : analysisAverages.averageHeroCost
          : "—"
      );
      setAvgIfExists(
        "tag_avg_miracleCount",
        analysisAverages && analysisAverages.averageMiracleCount
          ? analysisAverages.averageMiracleCount
          : "—"
      );
      setAvgIfExists(
        "tag_avg_miracleCost",
        analysisAverages && analysisAverages.averageMiracleCost
          ? analysisAverages.averageMiracleCost.toFixed
            ? analysisAverages.averageMiracleCost.toFixed(2)
            : analysisAverages.averageMiracleCost
          : "—"
      );
      setAvgIfExists(
        "tag_avg_sinCount",
        analysisAverages && analysisAverages.averageSinCount
          ? analysisAverages.averageSinCount
          : "—"
      );
      setAvgIfExists(
        "tag_avg_sinCost",
        analysisAverages && analysisAverages.averageSinCost
          ? analysisAverages.averageSinCost.toFixed
            ? analysisAverages.averageSinCost.toFixed(2)
            : analysisAverages.averageSinCost
          : "—"
      );
      setAvgIfExists(
        "tag_avg_artifactCount",
        analysisAverages && analysisAverages.averageArtifactCount
          ? analysisAverages.averageArtifactCount
          : "—"
      );
      setAvgIfExists(
        "tag_avg_artifactCost",
        analysisAverages && analysisAverages.averageArtifactCost
          ? analysisAverages.averageArtifactCost.toFixed
            ? analysisAverages.averageArtifactCost.toFixed(2)
            : analysisAverages.averageArtifactCost
          : "—"
      );

      // Atualiza comparações (setas + cor). comparisonElements contém as flags ("higher"/"lower"/"equal") em info.comparison...
      Object.entries(comparisonElements).forEach(([key, value]) => {
        const el = document.getElementById(key);
        if (!el) return;
        const color = getComparisonColor(key, value) || "";
        el.style.color = color;

        if (value === "higher") el.innerHTML = "&#9652;"; // ▲
        else if (value === "lower") el.innerHTML = "&#9662;"; // ▼
        else if (value === "equal") el.innerHTML = "&#8860;"; // ≄
        else el.innerHTML = "";

        // regra especial para qtd total (manter a checagem antiga)
        if (key === "tag_deckQtdComparison") {
          if (
            info.comparison.totalCards > deckMinimumSize &&
            info.comparison.totalCards <
              (analysisAverages && analysisAverages.averageQtd
                ? analysisAverages.averageQtd
                : Infinity)
          ) {
            el.style.color = "green";
          } else if (info.comparison.totalCards < deckMinimumSize) {
            el.style.color = "red";
          }
        }
      });

      // categorias
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

    // Atualiza DOMs
    updateDeckListDOM(await cardsFromDeckLocal);
    updateMiniCards(allCards, similarCardsArray, "#suggestionsDeckList");

    // Gera filtros
    const filtersEl = document.getElementById("filters");
    if (filtersEl) filtersEl.innerHTML = "";

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
    generateSelectFilterByProperty(
      allCards,
      "collection",
      "Coleção",
      "Coleção"
    );

    generateArchetypeSelect();
    generateArchetype2Select();
    generateStyleSelect();
    generateTierSelect();

    filterResults();
  } catch (err) {
    console.error("Erro em updateAnalysisFromDeck:", err);
  }
}

// ---------- categorias (UI) ----------
function generateCategoryItems(categoriesCount, averages, id) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = "";

  const categoryArray = Object.entries(categoriesCount || {});

  categoryArray.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  categoryArray.forEach(([category, count]) => {
    // comparison pode vir como averages[category] (string "higher"/"lower"/"equal")
    const comparison =
      averages && averages[category] ? averages[category] : null;

    // tenta também recuperar média numérica por categoria (se analysisAverages tiver averageCategories)
    let numericAvg = "—";
    if (analysisAverages && Array.isArray(analysisAverages.averageCategories)) {
      const found = analysisAverages.averageCategories.find(
        (c) => c.name === category || c.nome === category
      );
      if (found)
        numericAvg =
          found.media !== undefined
            ? found.media
            : found.average !== undefined
            ? found.average
            : "—";
    }

    const color = getComparisonColor(category, comparison) || "";
    const item = document.createElement("div");
    item.classList.add("custom-text-input", "category-item");
    item.style.fontSize = "0.95rem";
    // item.style.margin = "4px 6px 4px 0";
    item.style.padding = "5px";
    item.style.display = "inline-flex";
    item.style.alignItems = "center";
    item.style.gap = "8px";
    item.style.borderRadius = "6px";

    // cor de fundo suave de acordo com comparison (opcional)
    if (comparison === "higher") item.style.background = "rgba(0,128,0,0.06)";
    else if (comparison === "lower")
      item.style.background = "rgba(255,0,0,0.04)";
    else item.style.background = "rgba(255,255,255,0.02)";

    const arrow =
      comparison === "higher"
        ? "&#9650;"
        : comparison === "lower"
        ? "&#9660;"
        : comparison === "equal"
        ? "&#8860;"
        : "";

    item.innerHTML = `
      <strong style="display:inline-block">${category}</strong>
      <span>${count}</span>
      <span style="color:${color}">${arrow}</span>
    `;

    container.appendChild(item);
  });
}

// ---------- Gerar / completar / tuning ----------
async function generateDeck() {
  await updateAnalysisFromDeck();
  if (deck.cards.length <= 0) {
    if (selectedTier === "Competitivo") {
      // sem ação específica no código original
    } else {
      const mostUsedCards = await getMostUsedCardsFromType(
        allDecks,
        selectedStyle,
        selectedArchetype,
        deckMinimumSize
      );
      if (mostUsedCards) {
        mostUsedCards.forEach((card) => addCardToDeckBuilder(card.card));
      }
    }

    await completeDeck(true);
    await tuningDeck();
    await tuningDeck();
    await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);
    await updateAnalysisFromDeck();
  }
}

async function completeDeck(flagGenerate) {
  if (!(deck.cards.length > 0 || flagGenerate)) return;

  let bufferCard;
  let cardList = await getCardsFromDeck(deck.cards, allCards);

  let cardsLength = cardList.filter(
    (card) => card.type !== "Herói de Fé" || card.subtype !== "Lendário"
  ).length;

  for (let i = 0; cardsLength < deckMinimumSize; i++) {
    const oldSuggestions = suggestions.sort((a, b) => b.qtd - a.qtd);
    const cardFromSuggestion = bufferCard ? bufferCard : suggestions[0];
    addCardToDeckBuilder(cardFromSuggestion.idcard);
    // aguarda mudança nas suggestions
    while (suggestions === oldSuggestions) {
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

  while (cardList && cardList[0] && cardList[0].subtype === "Lendário") {
    const oldSuggestions = suggestions.sort((a, b) => b.qtd - a.qtd);
    addCardToDeckBuilder(cardList[0].number);
    while (suggestions === oldSuggestions) {
      await wait(1);
    }
    suggestionNumbers = suggestions.map((obj) => obj.idcard);
    cardList = await getCardsFromDeck(suggestionNumbers, allCards);
  }

  await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);
  await updateAnalysisFromDeck();
}

async function tuningDeck() {
  if (!(deck.cards && deck.cards.length > 0)) return;

  let markerHasChanged = true;
  let counterLoop = 0;

  let lastAddedCard = null;
  let consecutiveAdditions = 0;
  const ignoredAdditions = new Set();

  let lastRemovedCard = null;
  let consecutiveRemovals = 0;
  const ignoredRemovals = new Set();

  const operationHistory = [];
  const MAX_HISTORY = 12;

  function getAddedCard(before, after) {
    const beforeCount = {};
    before.forEach((c) => (beforeCount[c] = (beforeCount[c] || 0) + 1));
    for (const c of after) {
      if (!beforeCount[c]) return c;
      beforeCount[c]--;
    }
    return null;
  }

  function recordOperation(type, card) {
    if (!card) return;
    if (
      type === "add" &&
      card === operationHistory[operationHistory.length - 1]?.card
    )
      return;
    operationHistory.push({ type, card });
    if (operationHistory.length > MAX_HISTORY) operationHistory.shift();
  }

  function detectCycle() {
    if (operationHistory.length < 4) return false;
    const pairs = [];
    for (let i = 0; i < operationHistory.length - 1; i++) {
      if (
        operationHistory[i].type === "add" &&
        operationHistory[i + 1].type === "remove"
      ) {
        pairs.push([operationHistory[i].card, operationHistory[i + 1].card]);
      }
    }
    const graph = {};
    pairs.forEach(([from, to]) => {
      if (!graph[from]) graph[from] = [];
      graph[from].push(to);
    });

    function dfs(start, node, visited) {
      if (!graph[node]) return false;
      for (const next of graph[node]) {
        if (next === start) return true;
        if (!visited.has(next)) {
          visited.add(next);
          if (dfs(start, next, visited)) return true;
        }
      }
      return false;
    }

    for (const from in graph) {
      if (dfs(from, from, new Set([from]))) return true;
    }
    return false;
  }

  function updateLastAdded(newCard) {
    if (!newCard) return;
    if (newCard === lastAddedCard) consecutiveAdditions++;
    else {
      lastAddedCard = newCard;
      consecutiveAdditions = 1;
    }
    if (consecutiveAdditions >= 3) {
      ignoredAdditions.add(newCard);
      lastAddedCard = null;
      consecutiveAdditions = 0;
    }
  }

  function updateLastRemoved(card) {
    if (!card) return;
    if (card === lastRemovedCard) consecutiveRemovals++;
    else {
      lastRemovedCard = card;
      consecutiveRemovals = 1;
    }
    if (consecutiveRemovals >= 3) {
      ignoredRemovals.add(card);
      lastRemovedCard = null;
      consecutiveRemovals = 0;
    }
  }

  // remove lendários temporariamente
  let filteredDeck = deck.cards.filter((str) =>
    legendaries.some((j) => j.number === str)
  );
  deck.cards = deck.cards.filter(
    (str) => !legendaries.some((j) => j.number === str)
  );

  while (markerHasChanged && counterLoop < analysisAverages.averageQtd) {
    markerHasChanged = false;

    const filteredCategories = analysisAverages.averageCategories.filter(
      (category) => category.media !== 0
    );
    const innexistentCategories = filteredCategories
      .map((c) => c.name)
      .filter((cat) => !(cat in infoFromDeck.categoriesCount));

    const higherCategories = Object.keys(
      infoFromDeck.comparison.categories
    ).filter((k) => infoFromDeck.comparison.categories[k] === "higher");
    const lowerCategories = Object.keys(
      infoFromDeck.comparison.categories
    ).filter((k) => infoFromDeck.comparison.categories[k] === "lower");

    let menorValor = Infinity,
      menorCategoria = null;
    let maiorValor = -Infinity,
      maiorCategoria = null;

    lowerCategories.forEach((cat) => {
      const valor = infoFromDeck.categoriesCount[cat];
      if (valor < menorValor) {
        menorValor = valor;
        menorCategoria = cat;
      }
    });

    higherCategories.forEach((cat) => {
      const valor = infoFromDeck.categoriesCount[cat];
      if (valor > maiorValor) {
        maiorValor = valor;
        maiorCategoria = cat;
      }
    });

    const filteredCommonNumbers = legendaries.reduce((acc, item) => {
      if (filteredDeck.includes(item.number)) acc.push(item.commonNumber);
      return acc;
    }, []);

    let suggestionNumbers = suggestions
      .map((obj) => obj.idcard)
      .filter(
        (str) =>
          !filteredDeck.includes(str) &&
          !filteredCommonNumbers.includes(str) &&
          !ignoredAdditions.has(str)
      );

    if (
      deck.cards.length < analysisAverages.averageQtd &&
      suggestionNumbers.length > 0
    ) {
      const newCard = suggestionNumbers[0];
      addCardToDeckBuilder(newCard);
      recordOperation("add", newCard);
      updateLastAdded(newCard);
      markerHasChanged = true;
    } else if (deck.cards.length > analysisAverages.averageQtd) {
      const removedCard = await removeCardFromSpecifiedCategory(maiorCategoria);
      recordOperation("remove", removedCard);
      updateLastRemoved(removedCard);
      await wait(1);
      markerHasChanged = true;
    } else {
      if (menorCategoria != null && maiorCategoria != null) {
        if (innexistentCategories.length > 0) {
          const beforeAdd = [...deck.cards];
          await addCardFromSpecifiedCategory(
            innexistentCategories[0],
            suggestionNumbers
          );
          const newCard = getAddedCard(beforeAdd, deck.cards);
          recordOperation("add", newCard);
          updateLastAdded(newCard);

          const removedCard = await removeCardFromSpecifiedCategory(
            maiorCategoria
          );
          recordOperation("remove", removedCard);
          updateLastRemoved(removedCard);
          markerHasChanged = true;
        } else if (higherCategories.length > 0 && lowerCategories.length > 0) {
          const beforeAdd = [...deck.cards];
          await addCardFromSpecifiedCategory(
            lowerCategories[0],
            suggestionNumbers
          );
          const newCard = getAddedCard(beforeAdd, deck.cards);
          recordOperation("add", newCard);
          updateLastAdded(newCard);

          const removedCard = await removeCardFromSpecifiedCategory(
            maiorCategoria
          );
          recordOperation("remove", removedCard);
          updateLastRemoved(removedCard);
          markerHasChanged = true;
        }
      }
    }

    if (detectCycle()) {
      console.warn("⚠️ Ciclo detectado! Operações recentes ignoradas.");
      operationHistory.slice(-6).forEach((op) => {
        if (op.type === "add") ignoredAdditions.add(op.card);
        if (op.type === "remove") ignoredRemovals.add(op.card);
      });
      markerHasChanged = false;
      break;
    }

    // reintroduz lendários temporários ao final do loop
    const filteredDeck2 = deck.cards.filter((str) =>
      legendaries.some((j) => j.number === str)
    );
    deck.cards = deck.cards.filter(
      (str) => !legendaries.some((j) => j.number === str)
    );
    filteredDeck.push(...filteredDeck2);

    if (deck.cards.length !== analysisAverages.averageQtd) {
      markerHasChanged = true;
    }

    counterLoop++;
    await wait(1);
  }

  deck.cards = deck.cards.filter(
    (str) => !legendaries.some((j) => j.number === str)
  );
  const suggestionNumbers = suggestions.map((obj) => obj.idcard);
  filteredDeck = [
    ...new Set([
      ...filteredDeck,
      ...suggestionNumbers.filter((str) =>
        legendaries.some((j) => j.number === str)
      ),
    ]),
  ];

  for (const card of filteredDeck) {
    addCardToDeckBuilder(card);
    await wait(1);
  }

  await calculateStarsFromDeck(deck, allCards, allDecks, legendaries);
  await updateAnalysisFromDeck();
}

// ---------- Helpers para adicionar/remover por categoria ----------
async function addCardFromSpecifiedCategory(category, suggestionNumbers) {
  try {
    let suggestionList = await getCardsFromDeck(suggestionNumbers, allCards);
    suggestionList = Array.from(new Set(suggestionList));
    suggestionList = suggestionList.filter((card) => {
      if (!card.categories) return false;
      return card.categories
        .split(";")
        .map((c) => c.trim())
        .some((c) => c === category);
    });

    if (suggestionList.length === 0) {
      console.warn(`Nenhuma carta encontrada para a categoria: ${category}`);
      return;
    }

    addCardToDeckBuilder(suggestionList[0].number);
    await wait(500);
  } catch (error) {
    console.error("Erro ao adicionar carta da categoria especificada:", error);
  }
}

async function removeCardFromSpecifiedCategory(category) {
  try {
    let cardList = await getCardsFromDeck(deck.cards, allCards);
    cardList = Array.from(new Set(cardList));
    cardList = cardList.filter((card) => {
      if (!card.categories) return false;
      return card.categories
        .split(";")
        .map((c) => c.trim())
        .some((c) => c === category);
    });

    if (cardList.length === 0) {
      console.warn(`Nenhuma carta encontrada para a categoria: ${category}`);
      return null;
    }

    let menorOcorrencia = Infinity;
    let cardsMenorOcorrencia = [];

    cardList.forEach((card) => {
      const ocorrencias = getOccurrencesInSides(card.number, allDecks);
      if (ocorrencias < menorOcorrencia) {
        menorOcorrencia = ocorrencias;
        cardsMenorOcorrencia = [card];
      } else if (ocorrencias === menorOcorrencia) {
        cardsMenorOcorrencia.push(card);
      }
    });

    if (cardsMenorOcorrencia.length > 0) {
      removeCardFromDeckBuilder(cardsMenorOcorrencia[0].number);
      await wait(500);
      return cardsMenorOcorrencia[0].number;
    }
    return null;
  } catch (error) {
    console.error("Erro ao remover carta da categoria especificada:", error);
    return null;
  }
}

// ---------- Utilitários / limpeza ----------
async function cleanDeck() {
  deck.cards = [0];
  while (deck.cards.length > 0) {
    const card = deck.cards[0];
    removeCardFromDeckBuilder(card);
    await updateAnalysisFromDeck();
  }
  await updateAnalysisFromDeck();
  updateDeckListDOM([]);
}

async function autoGenerateHand(isMulligan) {
  function getRandomItemsFromArray(arr, numItems) {
    if (numItems > arr.length)
      throw new Error(
        "numItems cannot be greater than the length of the array"
      );
    const shuffled = arr.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, numItems);
  }

  if (!isMulligan) handTestCards = [];

  let cardList = await getCardsFromDeck(deck.cards, allCards);
  cardList = cardList.filter(
    (card) => card.type !== "Herói de Fé" || card.subtype !== "Lendário"
  );

  handTestCards.forEach((id) => {
    const index = cardList.findIndex((obj) => obj.number === id);
    if (index !== -1) cardList.splice(index, 1);
  });

  if (
    deck.cards.length > 0 &&
    handTestCards.length < 6 &&
    isMulligan !== "draw"
  ) {
    const cards = getRandomItemsFromArray(cardList, 5 - handTestCards.length);
    cards.forEach((card) => addCardToHand(card.number));
  } else if (isMulligan === "draw") {
    const cards = getRandomItemsFromArray(cardList, 1);
    cards.forEach((card) => addCardToHand(card.number));
  }

  updateTestHand(allCards, handTestCards, "#handTestList");
}

// ---------- Geradores de filtros (helpers para reduzir duplicação) ----------
function generateSelectFilterByProperty(
  jsonData,
  property,
  prettyName,
  text = "",
  order
) {
  const filtersContainer = document.getElementById("filters");
  if (!filtersContainer) return;

  const currentSelectedFilters = getCurrentSelectedFilters();

  const setValues = new Set();
  jsonData.forEach((item) => {
    if (property === "stars")
      setValues.add(Math.floor(parseFloat(item[property] || 0)));
    else if (property === "date")
      setValues.add(new Date(item[property]).getFullYear());
    else if (item[property] != null && item[property] !== "")
      setValues.add(item[property]);
  });

  const uniqueValues = Array.from(setValues).filter(
    (v) => !Object.values(currentSelectedFilters).includes(String(v))
  );
  uniqueValues.sort((a, b) => (order === "ASC" ? a - b : b - a));

  const select = document.createElement("select");
  select.name = property;
  select.setAttribute("prettyName", prettyName);
  select.id = `${property}Filter`;
  select.classList.add("form-select", "mr-3", "custom-select-input");

  const defaultOption = document.createElement("option");
  defaultOption.text = text || prettyName;
  defaultOption.value = "";
  select.appendChild(defaultOption);

  uniqueValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.text =
      property === "stars" ? "★".repeat(value) + "☆".repeat(5 - value) : value;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter(property, value, prettyName);
      select.disabled = true;
    }
    filterResults();
  });

  filtersContainer.appendChild(select);
}

function generateTextFilterByProperty(property, prettyName, placeholder) {
  const filtersContainer = document.getElementById("filters");
  if (!filtersContainer) return;

  const input = document.createElement("input");
  input.type = "text";
  input.name = property;
  input.setAttribute("prettyName", prettyName);
  input.id = `${property}Filter`;
  input.placeholder = placeholder;
  input.classList.add("mr-3", "custom-text-input");

  const applyFilter = () => {
    const value = input.value.trim();
    if (value) {
      addSelectedFilter(property, value, prettyName);
      input.disabled = true;
      filterResults();
    }
  };

  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") applyFilter();
  });
  input.addEventListener("blur", applyFilter);

  filtersContainer.appendChild(input);
}

function generateCategoryFilter(jsonData) {
  const filtersContainer = document.getElementById("filters");
  if (!filtersContainer) return;
  const currentSelectedFilters = getCurrentSelectedFilters();
  const categoriesSet = new Set();

  jsonData.forEach((item) => {
    if (!item.categories) return;
    item.categories.split(";").forEach((c) => categoriesSet.add(c.trim()));
  });

  const uniqueCategories = Array.from(categoriesSet).filter(
    (category) => !Object.values(currentSelectedFilters).includes(category)
  );

  const select = document.createElement("select");
  select.name = "categories";
  select.setAttribute("prettyName", "Categoria");
  select.id = `categoriesFilter`;
  select.classList.add("form-select", "mr-3", "custom-select-input");

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

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("categories", value, "Categoria");
      select.disabled = true;
    }
    filterResults(jsonData);
  });

  filtersContainer.appendChild(select);
}

function generateEffectFilter(jsonData) {
  const filtersContainer = document.getElementById("filters");
  if (!filtersContainer) return;
  const effectsSet = new Set();

  jsonData.forEach((item) => {
    if (!item.effects) return;
    item.effects.split(";").forEach((effect) => {
      const trimmed = effect.trim();
      if (trimmed) effectsSet.add(trimmed);
    });
  });

  const uniqueEffects = Array.from(effectsSet);
  const select = document.createElement("select");
  select.name = "effects";
  select.setAttribute("prettyName", "Efeito");
  select.id = "effectsFilter";
  select.classList.add("form-select", "mr-3", "custom-select-input");

  const defaultOption = document.createElement("option");
  defaultOption.text = "Efeito";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  uniqueEffects.forEach((effect) => {
    const option = document.createElement("option");
    option.text = effect;
    option.value = effect;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("effects", value, "Efeito");
      select.disabled = true;
      filterResults(jsonData);
    }
  });

  filtersContainer.appendChild(select);
}

// ---------- Selected filters ----------
function getCurrentSelectedFilters() {
  const selectedFilters = {};
  const container = document.getElementById("selected-filters");
  if (!container) return selectedFilters;

  const filters = container.querySelectorAll(".selected-filter");
  filters.forEach((filterTag) => {
    const property = filterTag.getAttribute("data-property");
    const value = filterTag.getAttribute("data-value");
    if (selectedFilters[property]) {
      if (Array.isArray(selectedFilters[property]))
        selectedFilters[property].push(value);
      else selectedFilters[property] = [selectedFilters[property], value];
    } else selectedFilters[property] = value;
  });

  return selectedFilters;
}

function addSelectedFilter(property, value, prettyName) {
  const container = document.getElementById("selected-filters");
  if (!container) return;
  const filterTag = document.createElement("div");
  filterTag.className = "selected-filter";
  filterTag.setAttribute("data-property", property);
  filterTag.setAttribute("data-value", value);
  filterTag.innerText = `${prettyName}: ${value}`;
  filterTag.addEventListener("click", function () {
    removeSelectedFilter(property, value);
    filterResults();
  });
  container.appendChild(filterTag);
}

function removeSelectedFilter(property, value) {
  const container = document.getElementById("selected-filters");
  if (!container) return;
  const filterTag = container.querySelector(
    `.selected-filter[data-property="${property}"][data-value="${value}"]`
  );
  if (filterTag) filterTag.remove();
  const select = document.getElementById(`${property}Filter`);
  if (select) {
    select.value = "";
    select.disabled = false;
  }
}

// ---------- Filtragem e atualização das mini-cards ----------
async function filterResults() {
  const selectedFiltersContainer = document.getElementById("selected-filters");
  if (!selectedFiltersContainer) return;

  const filters = selectedFiltersContainer.querySelectorAll(".selected-filter");
  const suggestionNumbers = suggestions.map((obj) => obj.idcard);
  let filteredData = await getCardsFromDeck(suggestionNumbers, allCards);

  filters.forEach((filterTag) => {
    const property = filterTag.getAttribute("data-property");
    const value = filterTag.getAttribute("data-value");
    if (property === "effects") {
      filteredData = filteredData.filter((item) =>
        (item.effects || "")
          .split(";")
          .map((s) => s.trim())
          .includes(value)
      );
    } else if (property === "categories") {
      filteredData = filteredData.filter((item) =>
        (item.categories || "")
          .split(";")
          .map((s) => s.trim())
          .includes(value)
      );
    } else {
      filteredData = filteredData.filter((item) => {
        if (!item) return false;
        if (["name", "flavor", "text"].includes(property)) {
          return (item[property] || "")
            .toLowerCase()
            .includes(value.toLowerCase());
        } else if (property === "stars") {
          return (
            Math.floor(parseFloat(item[property] || 0)) === parseInt(value)
          );
        } else if (property === "date") {
          return new Date(item[property]).getFullYear() === parseInt(value);
        } else {
          return item[property] == value;
        }
      });
    }
  });

  const filtersEl = document.getElementById("filters");
  if (filtersEl) filtersEl.innerHTML = "";

  filteredData = sortByStarsAndDate(filteredData).slice(0, suggestionsQtd);

  generateTextFilterByProperty("name", "Nome", "Digite o Nome");
  generateTextFilterByProperty("text", "Text", "Digite o Texto da Carta");
  generateSelectFilterByProperty(allCards, "type", "Tipo", "Tipo");
  generateSelectFilterByProperty(allCards, "subtype", "SubTipo", "SubTipo");
  generateSelectFilterByProperty(allCards, "cost", "Custo", "Custo");
  generateCategoryFilter(allCards);
  generateEffectFilter(allCards);
  generateSelectFilterByProperty(allCards, "strength", "Força", "Força");
  generateSelectFilterByProperty(
    allCards,
    "resistence",
    "Resistência",
    "Resistência"
  );
  generateSelectFilterByProperty(allCards, "collection", "Coleção", "Coleção");

  updateMiniCards(allCards, filteredData, "#suggestionsDeckList");
}

// ---------- DOM update: deck/extradeck/mini cards ----------
function updateDeckListDOM(cardsFromDeck) {
  const extraDeckListContainer = document.querySelector("#extraDeckList");
  const deckListContainer = document.querySelector("#deckList");
  if (!deckListContainer || !extraDeckListContainer) return;

  deckListContainer.classList.add("deck-grid");
  extraDeckListContainer.classList.add("deck-grid");

  deckListContainer.innerHTML = "";
  extraDeckListContainer.innerHTML = "";

  (cardsFromDeck || []).forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className = "card-item";
    cardElement.style.cursor = "pointer";

    const img = document.createElement("img");
    img.className = "card__details set-card-bg";
    img.src = card.img;
    img.alt = card.name;

    const related = document.createElement("div");
    related.className = "card__related__info";

    cardElement.appendChild(img);
    cardElement.appendChild(related);

    cardElement.addEventListener("click", () =>
      removeCardFromDeckBuilder(card.number)
    );

    if (card.type === "Herói de Fé" && card.subtype === "Lendário")
      extraDeckListContainer.appendChild(cardElement);
    else deckListContainer.appendChild(cardElement);
  });
}

function updateTestHand(allCardsParam, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;
  similarCardsContainer.innerHTML = "";

  (cardsList || []).forEach((similarCard) => {
    const details = allCardsParam.find((card) => card.number == similarCard);
    if (!details) return;

    const cardElement = document.createElement("div");
    cardElement.className =
      "col-lg-2 col-md-2 col-sm-2 card__related__sidebar__view__item set-bg";
    cardElement.style.cursor = "pointer";
    cardElement.style.padding = "2px";
    cardElement.style.margin = "2px";

    const img = document.createElement("img");
    img.className = "card__details set-card-bg";
    img.src = details.img;
    img.alt = details.name;

    const related = document.createElement("div");
    related.className = "card__related__info";

    cardElement.appendChild(img);
    cardElement.appendChild(related);

    cardElement.addEventListener("click", () =>
      removeCardFromHand(details.number)
    );
    similarCardsContainer.appendChild(cardElement);
  });
}

function updateMiniCards(allCardsParam, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;
  similarCardsContainer.innerHTML = "";

  (cardsList || []).forEach((similarCard) => {
    const cardNumber = similarCard.idcard
      ? similarCard.idcard
      : similarCard.number;
    const details = allCardsParam.find((card) => card.number == cardNumber);
    if (!details) return;

    const cardElement = document.createElement("div");
    cardElement.className = "card__related__sidebar__view__item set-bg";
    cardElement.style.cursor = "pointer";
    cardElement.style.paddingRight = "5px";
    cardElement.style.paddingLeft = "5px";

    const img = document.createElement("img");
    img.className = "card__details set-card-bg";
    img.src = details.img;
    img.alt = details.name;

    const related = document.createElement("div");
    related.className = "card__related__info";

    cardElement.appendChild(img);
    cardElement.appendChild(related);

    cardElement.addEventListener("click", () =>
      addCardToDeckBuilder(details.number)
    );
    similarCardsContainer.appendChild(cardElement);
  });
}

// ---------- operações básicas ----------
function addCardToDeckBuilder(id) {
  deck.cards.push(id);
  updateAnalysisFromDeck();
}

function addCardToHand(id) {
  handTestCards.push(id);
}

function removeCardFromHand(id) {
  const index = handTestCards.findIndex((card) => card === id);
  if (index !== -1) {
    handTestCards.splice(index, 1);
    updateTestHand(allCards, handTestCards, "#handTestList");
  } else {
    console.warn(`Carta com ID ${id} não encontrada na mão.`);
  }
}

function removeCardFromDeckBuilder(id) {
  const index = deck.cards.indexOf(id);
  if (index !== -1) deck.cards.splice(index, 1);
  updateAnalysisFromDeck();
}

// ---------- misc helpers ----------
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
    if (mergedCards[idcard]) mergedCards[idcard].qtd += qtd;
    else mergedCards[idcard] = { idcard, qtd };
  });

  return Object.values(mergedCards).sort((a, b) => b.qtd - a.qtd);
}

async function prepareSimilarCardsArray(similarCardsArray) {
  const commonCardCounts = ((cards) =>
    cards.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {}))(deck.cards);

  deck.cards.forEach((card) => {
    if (commonCardCounts[card] == 1) {
      const similarCard = similarCardsArray.find((sc) => sc.idcard == card);
      if (similarCard) similarCard.qtd += 100;
      else similarCardsArray.push({ idcard: card, qtd: WEIGHT_SAME });
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
      const cardsFromDeckLocal = await getCardsFromDeck(deck.cards, allCards);
      updateDeckListDOM(cardsFromDeckLocal);
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
}

function transformToObjectArray(cards) {
  return cards.map((card) => ({ idcard: card.number, qtd: card.ocurrences }));
}

function generateImportFieldBuilder(property, prettyName, placeholder) {
  const container = document.getElementById("importFieldBuilder");
  if (!container) return;
  container.innerHTML = "";

  const input = document.createElement("input");
  input.type = "text";
  input.name = property;
  input.setAttribute("prettyName", prettyName);
  input.id = `${property}Filter`;
  input.placeholder = placeholder;
  input.classList.add("mb-3", "mr-3", "custom-text-input");
  input.style.width = "170%";

  input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      const value = input.value;
      if (value) {
        addSelectedFilter(property, value, prettyName);
        input.value = "";
        importDeck(value);
      }
    }
  });

  container.appendChild(input);
}

// ---------- selects Estilo / Arquétipo / Tier (DRY) ----------
function createSelectContainer(
  idListEl,
  iconEl,
  name,
  prettyName,
  defaultText,
  options = []
) {
  const root = document.getElementById(idListEl);
  if (!root) return;
  root.innerHTML = "";
  const iconRoot = document.getElementById(iconEl);
  if (iconRoot) iconRoot.innerHTML = "";

  const container = document.createElement("div");
  container.classList.add("select-container");

  const select = document.createElement("select");
  select.name = name;
  select.setAttribute("prettyName", prettyName);
  select.id = `${name}Filter`;
  select.classList.add("mr-3", "custom-select-input");

  const defaultOption = document.createElement("option");
  defaultOption.text = defaultText;
  defaultOption.value = "";
  select.appendChild(defaultOption);

  options.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.innerHTML = value;
    select.appendChild(option);
  });

  container.appendChild(select);
  root.appendChild(container);

  return select;
}

function generateStyleSelect() {
  const styles = Array.from(new Set(allDecks.map((d) => d.style)));
  const select = createSelectContainer(
    "addByStyleList",
    "addByStyleIcon",
    "style",
    "Estilo",
    "Estilo",
    styles
  );
  if (!select) return;
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) chooseStyle(value);
  });
}

function generateArchetypeSelect() {
  const archetypes = Array.from(new Set(allDecks.map((d) => d.archetype)));
  const select = createSelectContainer(
    "addByArchetypeList",
    "addByArchetypeIcon",
    "archetype",
    "Arquétipo",
    "Arquétipo",
    archetypes
  );
  if (!select) return;
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) chooseArchetype(value);
  });
}

function generateArchetype2Select() {
  const archetypes = Array.from(new Set(allDecks.map((d) => d.archetype2)));
  const select = createSelectContainer(
    "addByArchetype2List",
    "addByArchetype2Icon",
    "archetype2",
    "Apoio",
    "Apoio",
    archetypes
  );
  if (!select) return;
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) chooseArchetype2(value);
  });
}

function generateTierSelect() {
  const tiers = ["Casual", "Competitivo"];
  const select = createSelectContainer(
    "addByTierList",
    "addByTierIcon",
    "tier",
    "Tier",
    "Tier",
    tiers
  );
  if (!select) return;
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) chooseTier(value);
  });
}

// ---------- escolha de estilos/archetypes/tier: atualiza ícone (sem quebrar FontAwesome usage) ----------
function chooseStyle(value) {
  selectedStyle = value;
  updateAnalysisFromDeck();

  const icon = document.querySelector("#addByStyleIcon");
  if (!icon) return;
  try {
    icon.className = "";
    icon.style = "";
    icon.textContent = "";
    if (!value) return;
    icon.classList.add("fa", "fa-solid");
    icon.style.padding = "5px";
    icon.style.borderRadius = "5px";
    icon.style.marginLeft = "5px";
    icon.style.marginBottom = "5px";

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
  } catch (e) {
    console.warn("Erro ao atualizar ícone de style:", e);
  }
}

function chooseArchetype(value) {
  selectedArchetype = value;
  updateAnalysisFromDeck();

  const icon = document.querySelector("#addByArchetypeIcon");
  if (!icon) return;
  try {
    icon.className = "";
    icon.style = "";
    icon.textContent = "";
    if (!value) return;
    icon.classList.add("fa", "fa-solid");
    icon.style.padding = "5px";
    icon.style.borderRadius = "5px";
    icon.style.marginLeft = "5px";
    icon.style.marginBottom = "5px";

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
      case "Tempestade":
        icon.classList.add("fa-poo-storm");
        icon.style.backgroundColor = "#32CD32";
        icon.style.color = "#000";
        break;
      case "Arsenal":
        icon.classList.add("fa-toolbox");
        icon.style.backgroundColor = "#A8B3B4";
        icon.style.color = "#000";
        break;
      case "Supressão":
        icon.classList.add("fa-ban");
        icon.style.backgroundColor = "#000000";
        icon.style.color = "#fff";
        break;
      case "Aceleração":
        icon.classList.add("fa-stopwatch");
        icon.style.backgroundColor = "#8B4513";
        icon.style.color = "#000";
        break;
      default:
        icon.classList.add("fa-question");
        icon.style.backgroundColor = "#6c757d";
        icon.style.color = "#fff";
    }
    icon.textContent = value;
  } catch (e) {
    console.warn("Erro ao atualizar ícone de archetype:", e);
  }
}

function chooseArchetype2(value) {
  selectedArchetype2 = value;
  updateAnalysisFromDeck();

  const icon = document.querySelector("#addByArchetype2Icon");
  if (!icon) return;
  try {
    icon.className = "";
    icon.style = "";
    icon.textContent = "";
    if (!value) return;
    icon.classList.add("fa", "fa-solid");
    icon.style.padding = "5px";
    icon.style.borderRadius = "5px";
    icon.style.marginLeft = "5px";
    icon.style.marginBottom = "5px";

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
      case "Tempestade":
        icon.classList.add("fa-poo-storm");
        icon.style.backgroundColor = "#32CD32";
        icon.style.color = "#000";
        break;
      case "Arsenal":
        icon.classList.add("fa-toolbox");
        icon.style.backgroundColor = "#A8B3B4";
        icon.style.color = "#000";
        break;
      case "Supressão":
        icon.classList.add("fa-ban");
        icon.style.backgroundColor = "#000000";
        icon.style.color = "#fff";
        break;
      case "Aceleração":
        icon.classList.add("fa-stopwatch");
        icon.style.backgroundColor = "#8B4513";
        icon.style.color = "#000";
        break;
      default:
        icon.classList.add("fa-question");
        icon.style.backgroundColor = "#6c757d";
        icon.style.color = "#fff";
    }
    icon.textContent = value;
  } catch (e) {
    console.warn("Erro ao atualizar ícone de archetype2:", e);
  }
}

function chooseTier(value) {
  selectedTier = value;
  updateAnalysisFromDeck();

  const icon = document.querySelector("#addByTierIcon");
  if (!icon) return;
  try {
    icon.className = "";
    icon.style = "";
    icon.innerHTML = "";
    if (!value) return;
    icon.classList.add("fa", "fa-solid");
    icon.style.padding = "5px";
    icon.style.borderRadius = "5px";
    icon.style.marginLeft = "5px";
    icon.style.marginBottom = "5px";
    icon.innerHTML = value;

    switch (value) {
      case "Competitivo":
        icon.classList.add("fa-medal");
        icon.style.backgroundColor = "#FFD700";
        icon.style.color = "#000";
        break;
      case "Casual":
        icon.classList.add("fa-user-group");
        icon.style.backgroundColor = "#1E90FF";
        icon.style.color = "#fff";
        break;
      default:
        icon.classList.add("fa-question");
        icon.style.backgroundColor = "#6c757d";
        icon.style.color = "#fff";
    }
  } catch (e) {
    console.warn("Erro ao atualizar ícone de tier:", e);
  }
}

// ---------- utilidades finais ----------
/* transformToObjectArray já declarada acima para compatibilidade */
