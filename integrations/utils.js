const URL_DECKS_JSON = "data/decks.json";
const URL_HEROES_JSON = "data/heroes.json";
const URL_MIRACLES_JSON = "data/miracles.json";
const URL_SINS_JSON = "data/sins.json";
const URL_ARTIFACTS_JSON = "data/artifacts.json";
const URL_LEGENDARIES_JSON = "data/legendary.json";
const URL_RULINGS_JSON = "data/rulings.json";
const URL_DECKS_HISTORIC_JSON = "data/decks_historic.json";

const WEIGHT_LEGENDARY = 100000;
const WEIGHT_SAME = 200;
let WEIGHT_CATEGORY = 200;

const WEIGHT_DIRECT_SINERGY = 200;
const WEIGHT_OCURRENCY_DECK = 200;
const WEIGHT_OCURRENCY_EXTRA = 200;
const WEIGHT_OCURRENCY_SIDEBOARD = 200;

const WEIGHT_DECK_STYLE = 30;
const WEIGHT_DECK_ARCHETYPE = 70;

const WEIGHT_LEVEL_SINERGY_BEETWEEN_CARDS = 0.85;
const WEIGHT_LEVEL_STAPLE_USING_FOR_CARDS = 0.15;
const WEIGHT_LEVEL_ADICTION_FOR_LEGENDARY_AND_EXTRA = 0.01;
const WEIGHT_LEVEL_ADICTION_FOR_REPETITION = 0.03;
const WEIGHT_LEVEL_REDUCTION_FOR_REPETITION = 0.06;

const WEIGHT_LEVEL_ADICTION_FOR_PRIZES = 0.01;
const WEIGHT_LEVEL_ADICTION_FOR_HISTORIC = 0.01;

const WEIGHT_LEVEL_ADICTION_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_EQUAL_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_REDUCTION_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_ADICTION_FOR_EXCLUSIVE_CATEGORY = 0.005;
const WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_CATEGORY = 0.3;

const WEIGHT_LEVEL_ADICTION_FOR_COUNT = 0.05;
const WEIGHT_LEVEL_EQUAL_FOR_COUNT = 0.0;
const WEIGHT_LEVEL_REDUCTION_FOR_COUNT = 0.1;
const WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_COUNT = 0.05;

const WEIGHT_LEVEL_ADICTION_FOR_COST = 0.05;
const WEIGHT_LEVEL_EQUAL_FOR_COST = 0.0;
const WEIGHT_LEVEL_REDUCTION_FOR_COST = 0.1;

const WEIGHT_LEVEL_ADICTION_FOR_QTD = 0.05;
const WEIGHT_LEVEL_EQUAL_FOR_QTD = 0.0;
const WEIGHT_LEVEL_REDUCTION_FOR_QTD = 0.25;

const WEIGHT_LEVEL_ADICTION_FOR_STRENGHT_AND_RESISTANCE = 0.25;
const WEIGHT_LEVEL_EQUAL_FOR_STRENGHT_AND_RESISTANCE = 0.1;
const WEIGHT_LEVEL_REDUCTION_FOR_STRENGHT_AND_RESISTANCE = 0.25;

// const CACHE_DURATION = 1000; // 24 horas

let allCards;
let allDecks;
let allDecksHistoric;
let allRulings;
let rulingsChosenOption;

const isBrowser =
  typeof window !== "undefined" && typeof document !== "undefined";

if (isBrowser) {
  document.addEventListener("DOMContentLoaded", async function () {
    window.allJSONsLoaded = false;

    try {
      allCards = await getCards(); // Carrega as cartas
      allDecks = await getDecks(); // Carrega os decks
      allDecksHistoric = await getDecksHistoric(); // Carrega os decks
      allRulings = await getRulings(); // Carrega os rulings
      rulingsChosenOption = localStorage.getItem(rulingsChosenOption) || true;
      window.allJSONsLoaded = true;
    } catch (error) {
      console.error("Erro ao carregar os dados:", error);
    }
  });
} else {
  // Código específico para Node.js
  module.exports = {
    getOccurrencesInDecks,
    getOccurrencesInSides,
    scaleToFive,
  };
}

const waitForAllJSONs = async () => {
  while (!window.allJSONsLoaded) {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Aguarda até que as cartas estejam carregadas
  }
};

function getCardDetails(cardNumber) {
  localStorage.setItem("idSelectedCard", cardNumber);
  location.href = "./card-details.html";
}

function getDeckDetails(cardNumber) {
  localStorage.setItem("idSelectedDeck", cardNumber);
  location.href = "./deck-details.html";
}

async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error fetching ${url}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return [];
  }
}

async function fetchOrGetFromLocalStorage(key, url) {
  const isDevelopment = window.location.href.includes("127.0.0.1");
  const CACHE_DURATION = isDevelopment ? 1000 : 24 * 60 * 60 * 1000; // 1s for dev, 24h for prod

  try {
    if (typeof localStorage !== "undefined") {
      const cachedData = localStorage.getItem(key);
      const cachedTimestamp = Number(localStorage.getItem(`${key}_timestamp`));
      const now = Date.now();

      if (
        cachedData &&
        cachedTimestamp &&
        now - cachedTimestamp < CACHE_DURATION
      ) {
        return JSON.parse(cachedData);
      }
    }

    const data = await fetchJSON(url);

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(`${key}_timestamp`, Date.now());
    }

    return data;
  } catch (error) {
    console.error("Error accessing localStorage or fetching data:", error);
    return [];
  }
}

async function getCards() {
  try {
    const [heroes, miracles, sins, artifacts, legendaries] = await Promise.all([
      fetchOrGetFromLocalStorage("heroes", URL_HEROES_JSON),
      fetchOrGetFromLocalStorage("miracles", URL_MIRACLES_JSON),
      fetchOrGetFromLocalStorage("sins", URL_SINS_JSON),
      fetchOrGetFromLocalStorage("artifacts", URL_ARTIFACTS_JSON),
      fetchOrGetFromLocalStorage("legendaries", URL_LEGENDARIES_JSON),
    ]);

    return [...heroes, ...miracles, ...sins, ...artifacts, ...legendaries];
  } catch (error) {
    console.error("Error fetching cards:", error);
    return []; // Retorna um array vazio em caso de erro.
  }
}

async function getDecks() {
  const key = "decks";
  const url = URL_DECKS_JSON;

  // Paraleliza as requisições para decks e legendaries
  const [decks, legendaries] = await Promise.all([
    fetchOrGetFromLocalStorage(key, url),
    fetchOrGetFromLocalStorage("legendaries", URL_LEGENDARIES_JSON),
  ]);

  // Verifica se os decks precisam ser atualizados
  if (decks.length > 0 && !decks[0].level) {
    const updatedDecks = await Promise.all(
      decks.map((selectedDeck) =>
        calculateStarsFromDeck(selectedDeck, allCards, decks, legendaries)
      )
    );

    // Atualiza o localStorage apenas se necessário
    if (JSON.stringify(updatedDecks) !== JSON.stringify(decks)) {
      const now = Date.now();
      localStorage.setItem(key, JSON.stringify(updatedDecks));
      localStorage.setItem(`${key}_timestamp`, now);
    }

    return updatedDecks;
  } else {
    return decks;
  }
}

async function getDecksHistoric() {
  const key = "decks_historic";
  const url = URL_DECKS_HISTORIC_JSON;

  // Paraleliza as requisições para decks e legendaries
  const [decks, legendaries] = await Promise.all([
    fetchOrGetFromLocalStorage(key, url),
    fetchOrGetFromLocalStorage("legendaries", URL_LEGENDARIES_JSON),
  ]);

  // Verifica se os decks precisam ser atualizados
  if (decks.length > 0 && !decks[0].level) {
    const updatedDecks = await Promise.all(
      decks.map((selectedDeck) =>
        calculateStarsFromDeck(selectedDeck, allCards, decks, legendaries)
      )
    );

    // Atualiza o localStorage apenas se necessário
    if (JSON.stringify(updatedDecks) !== JSON.stringify(decks)) {
      const now = Date.now();
      localStorage.setItem(key, JSON.stringify(updatedDecks));
      localStorage.setItem(`${key}_timestamp`, now);
    }

    return updatedDecks;
  } else {
    return decks;
  }
}

async function getRulings() {
  try {
    const [rulings] = await Promise.all([
      fetchOrGetFromLocalStorage("rulings", URL_RULINGS_JSON),
    ]);

    return [...rulings];
  } catch (error) {
    console.error("Error fetching cards:", error);
    return []; // Retorna um array vazio em caso de erro.
  }
}

function getRulingsFromCard(type, subtype, category, effect, keyword) {

  return allRulings
    .filter(ruling => {
      // Dividir strings de ruling em arrays para comparação
      const types = ruling.type?.split(";").map(s => s.trim()) || [];
      const subtypes = ruling.subtype?.split(";").map(s => s.trim()) || [];
      const categories = ruling.categories?.split(";").map(s => s.trim()) || [];
      const effects = ruling.effects?.split(";").map(s => s.trim()) || [];
      const keywords = ruling.keywords?.split(";").map(s => s.trim()) || [];
      const notTypes = ruling.notType?.split(";").map(s => s.trim()) || [];
      const notSubtypes = ruling.notSubtype?.split(";").map(s => s.trim()) || [];
      const notCategories = ruling.notCategories?.split(";").map(s => s.trim()) || [];
      const notEffects = ruling.notEffects?.split(";").map(s => s.trim()) || [];
      const notKeywords = ruling.notKeywords?.split(";").map(s => s.trim()) || [];

      // Dividir as entradas em arrays
      const inputCategories = category.split(";").map(s => s.trim());
      const inputEffects = effect.split(";").map(s => s.trim());
      const inputKeywords = keyword.split(";").map(s => s.trim());

      // Verificar as condições de inclusão e exclusão
      const typeMatch = (!types.length || types.includes(type)) && !notTypes.includes(type);
      const subtypeMatch = (!subtypes.length || subtypes.includes(subtype)) && !notSubtypes.includes(subtype);
      const categoryMatch =
        (!categories.length || categories.some(cat => inputCategories.includes(cat))) &&
        !notCategories.some(cat => inputCategories.includes(cat));
      const effectMatch =
        (!effects.length || effects.some(eff => inputEffects.includes(eff))) &&
        !notEffects.some(eff => inputEffects.includes(eff));
      const keywordMatch =
        (!keywords.length || keywords.some(kw => inputKeywords.includes(kw))) &&
        !notKeywords.some(kw => inputKeywords.includes(kw));

      // Retornar true apenas se TODAS as condições forem atendidas
      return typeMatch && subtypeMatch && categoryMatch && effectMatch && keywordMatch;
    })
    .map(ruling => {
      // Construir um cabeçalho com as propriedades do ruling
      const details = [
        ruling.type || "",
        ruling.subtype || "",
        ruling.categories || "",
        ruling.effects || "",
        ruling.keywords || ""
      ]
        .filter(detail => detail) // Remover valores vazios
        .join(" "); // Combinar em uma string única

      return `<b>${details.toUpperCase()}</b>;${ruling.ruling}`; // Adicionar o ruling ao cabeçalho
    });
      
}

async function getMostUsedCardsFromType(
  decks,
  selectedStyle,
  selectedArchetype,
  deckMinimumSize
) {
  // Criar um Map para rastrear a frequência de cada card
  const cardFrequency = new Map();

  // Filtrar decks de forma eficiente e processar os cards em lote
  decks
    .filter(
      (deck) =>
        (!selectedStyle || deck.style === selectedStyle) &&
        (!selectedArchetype || deck.archetype === selectedArchetype)
    )
    .forEach((deck) => {
      // Agrupar todas as listas de cards
      const allCards = deck.cards.concat(deck.sideboard, deck.topcards);

      // Contabilizar as frequências usando um único loop
      for (const card of allCards) {
        cardFrequency.set(card, (cardFrequency.get(card) || 0) + 1);
      }
    });

  // Ordenar os cards pelo número de aparições e pegar os mais frequentes
  return Array.from(cardFrequency.entries())
    .sort((a, b) => b[1] - a[1]) // Ordenar por frequência decrescente
    .slice(0, deckMinimumSize) // Selecionar o topX mais frequentes
    .map(([card, frequency]) => ({ card: Number(card), frequency })); // Retornar no formato desejado
}

function getRepeatedAndUniqueCards(deck) {
  const allCardsInDeck = [...deck.cards];

  // Criar um Map para contar a frequência de cada card
  const cardFrequency = new Map();
  allCardsInDeck.forEach((card) => {
    cardFrequency.set(card, (cardFrequency.get(card) || 0) + 1);
  });

  // Contar os cards repetidos e únicos
  let repeated = 0;
  let unique = 0;
  cardFrequency.forEach((count, card) => {
    if (count > 1) {
      repeated++;
    } else {
      // Verificar se o card é lendário
      const cardDetails = allCards.find(
        (legendary) => legendary.number === card
      );
      if (cardDetails && cardDetails.subtype === "Lendário") {
        // Se for lendário, desconsiderar como único
        unique--;
      } else {
        unique++;
      }
    }
  });

  return {
    deckName: deck.name || "Unknown", // Nome do deck para identificação
    repeated,
    unique,
  };
}

async function calculateStarsFromDeck(
  selectedDeck,
  allCards,
  decks,
  legendaries
) {
  const mergedArray = [...selectedDeck.cards, ...selectedDeck.extra]; // Evitar cópia desnecessária
  const cardsFromDeckWithExtra = getCardsFromDeck(mergedArray, allCards);

  const [level, analysisAverages] = await Promise.all([
    compareAllCardsToLevelADeck(cardsFromDeckWithExtra, decks, legendaries),
    analyzeDecks(decks, null, null),
  ]);

  let sumStars = 0;
  const deckLength = mergedArray.length;
  const deckCount = decks.length;

  // Paralelizar cálculo de estrelas
  const cardStarsPromises = cardsFromDeckWithExtra.map((card) => {
    let scaledStars = card.stars;
    if (!card.stars) {
      scaledStars = scaleToFive(
        (card.ocurrencesInSides / deckCount) * 100,
        card.ocurrencesInSides
      );
      card.stars = scaledStars;
    }
    sumStars += parseFloat(scaledStars) / deckLength;
  });

  await Promise.all(cardStarsPromises);

  const filteredCategories = analysisAverages.averageCategories.filter(
    (category) => category.media !== 0
  );
  const cardsFromDeck = getCardsFromDeck(selectedDeck.cards, allCards);
  const info = await analyzeCards(cardsFromDeck, analysisAverages);

  const categoryNamesSet = new Set(
    filteredCategories.map((category) => category.name)
  );
  const innexistentCategories = [...categoryNamesSet].filter(
    (cat) => !(cat in info.categoriesCount)
  );

  let sum = 0;

  for (const category in info.comparison.categories) {
    const categoryData = analysisAverages.averageCategories.find(
      (cat) => cat.name === category
    );
    const categoryAverage = categoryData?.media || 0;
    const categoryCount = info.categoriesCount[category] || 0;
    const difference = categoryCount - categoryAverage;

    if (categoryAverage <= 0 && categoryCount > 0) {
      sum += WEIGHT_LEVEL_ADICTION_FOR_EXCLUSIVE_CATEGORY * categoryCount;
    }

    if (info.comparison.categories[category] === "higher") {
      sum += WEIGHT_LEVEL_ADICTION_FOR_CATEGORY * Math.abs(difference);
    } else if (info.comparison.categories[category] === "equal") {
      sum += WEIGHT_LEVEL_EQUAL_FOR_CATEGORY;
    } else if (info.comparison.categories[category] === "lower") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_CATEGORY * Math.abs(difference);
    }
  }

  sum -=
    innexistentCategories.length *
    WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_CATEGORY;

  // console.log(selectedDeck.name);
  // console.log(info);
  // console.log(analysisAverages);

  const comparisons = ["hero", "miracle", "sin", "artifact"];

  // Comparar AverageCosts
  const costs = [
    "averageCostHero",
    "averageCostMiracle",
    "averageCostSin",
    "averageCostArtifact",
  ];

  for (let i = 0; i < costs.length; i++) {
    const cost = costs[i];
    const deckValue = info[cost] || 0;
    const averageValue = analysisAverages[cost] || 0;
    const difference = deckValue - averageValue;

    // console.log(cost + " -> " + difference);

    // Usar o index i para acessar a comparação correta
    if (info.comparison[comparisons[i]].cost === "higher") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_COST * Math.abs(difference); // Adiciona diferença se for igual ou maior
    } else if (info.comparison[comparisons[i]].cost === "equal") {
      sum += WEIGHT_LEVEL_EQUAL_FOR_COST; // Subtrai a diferença se for menor
    } else if (info.comparison[comparisons[i]].cost === "lower") {
      sum += WEIGHT_LEVEL_ADICTION_FOR_COST * Math.abs(difference); // Subtrai a diferença se for menor
    } else {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_COST * Math.abs(difference); // Adiciona diferença se for igual ou maior
    }
  }

  // Comparar AverageQtds
  const counts = ["heroCount", "miracleCount", "sinCount", "artifactCount"];
  const averageQtds = [
    "averageQtdHero",
    "averageQtdMiracle",
    "averageQtdSin",
    "averageQtdArtifact",
  ];

  for (let i = 0; i < counts.length; i++) {
    const count = counts[i];
    const averageQtd = averageQtds[i];

    const deckCount = info[count] || 0;
    const averageCount = analysisAverages[averageQtd] || 0;
    const difference = deckCount - averageCount;

    // console.log(count + " -> " + difference);

    // Usar o index i para acessar a comparação correta
    if (info.comparison[comparisons[i]].count === "higher") {
      sum += WEIGHT_LEVEL_ADICTION_FOR_COUNT * Math.abs(difference); // Adiciona diferença se for igual ou maior
    } else if (info.comparison[comparisons[i]].count === "equal") {
      sum += WEIGHT_LEVEL_EQUAL_FOR_COUNT; // Subtrai a diferença se for menor
    } else if (info.comparison[comparisons[i]].count === "lower") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_COUNT * Math.abs(difference); // Subtrai a diferença se for menor
    } else {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_COUNT * Math.abs(difference); // Subtrai a diferença se for menor
    }

    if (deckCount <= 0) {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_COUNT;
    }
  }

  info.averageQtd = info.comparison.totalCards;

  const lastComparisonsUpper = ["strength", "resistance"];
  const lastComparisonsLower = ["qtd"];
  const lastComparisonsCost = ["cost"];

  const statsUpper = [
    { stat: "averageStrength", average: "averageStrength" },
    { stat: "averageResistance", average: "averageResistance" },
  ];

  const statsLower = [
    { stat: "averageQtd", average: "averageQtd" }, // Total de cartas
  ];

  const statsCost = [
    { stat: "averageCost", average: "averageCost" }, // Total de cartas
  ];

  for (let i = 0; i < statsUpper.length; i++) {
    const { stat, average } = statsUpper[i];
    const deckStat = info[stat] || 0;
    const averageStat = analysisAverages[average] || 0;
    const difference = deckStat - averageStat;
    const comparisonType = info.comparison.general[lastComparisonsUpper[i]];

    // console.log(stat + " -> " + comparisonType + " -> " + difference);

    if (comparisonType === "higher") {
      sum +=
        WEIGHT_LEVEL_ADICTION_FOR_STRENGHT_AND_RESISTANCE *
        Math.abs(difference); // Adiciona diferença se for maior
    } else if (comparisonType === "equal") {
      sum += WEIGHT_LEVEL_EQUAL_FOR_STRENGHT_AND_RESISTANCE; // Não muda o sum se for igual
    } else if (comparisonType === "lower") {
      sum -=
        WEIGHT_LEVEL_REDUCTION_FOR_STRENGHT_AND_RESISTANCE *
        Math.abs(difference); // Subtrai a diferença se for menor
    }
  }

  for (let i = 0; i < statsLower.length; i++) {
    const { stat, average } = statsLower[i];
    const deckStat = info[stat] || 0;
    const averageStat = analysisAverages[average] || 0;
    const difference = deckStat - averageStat;
    const comparisonType = info.comparison.general[lastComparisonsLower[i]];

    // console.log(stat + " -> " + comparisonType + " -> " + difference);

    if (comparisonType === "higher") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_QTD * Math.abs(difference); // Adiciona diferença se for maior
    } else if (comparisonType === "equal") {
      sum += WEIGHT_LEVEL_EQUAL_FOR_QTD; // Não muda o sum se for igual
    } else if (comparisonType === "lower") {
      sum += WEIGHT_LEVEL_ADICTION_FOR_QTD * Math.abs(difference); // Subtrai a diferença se for menor
    }
  }

  for (let i = 0; i < statsCost.length; i++) {
    const { stat, average } = statsCost[i];
    const deckStat = info[stat] || 0;
    const averageStat = analysisAverages[average] || 0;
    const difference = deckStat - averageStat;
    const comparisonType = info.comparison.general[lastComparisonsCost[i]];

    // console.log(stat + " -> " + comparisonType + " -> " + difference);

    if (comparisonType === "higher") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_COST * Math.abs(difference); // Adiciona diferença se for maior
    } else if (comparisonType === "equal") {
      sum += WEIGHT_LEVEL_EQUAL_FOR_COST; // Não muda o sum se for igual
    } else if (comparisonType === "lower") {
      sum += WEIGHT_LEVEL_ADICTION_FOR_COST * Math.abs(difference); // Subtrai a diferença se for menor
    }
  }

  // console.log("sum -> " + sum);

  let repeatsAndUniques = getRepeatedAndUniqueCards(selectedDeck, legendaries);

  sum +=
    WEIGHT_LEVEL_ADICTION_FOR_LEGENDARY_AND_EXTRA *
    Math.abs(selectedDeck.extra.length);
  sum +=
    WEIGHT_LEVEL_ADICTION_FOR_REPETITION * Math.abs(repeatsAndUniques.repeated);
  sum -=
    WEIGHT_LEVEL_REDUCTION_FOR_REPETITION * Math.abs(repeatsAndUniques.unique);

  selectedDeck.level = parseFloat(
    calculateWeightedAverage(sumStars, level, sum).toFixed(2)
  );

  selectedDeck.level = isNaN(selectedDeck.level)
    ? "0.00"
    : selectedDeck.level.toFixed(2);

  // console.log(level);

  return selectedDeck;
}

async function compareAllCardsToLevelADeck(cards, decks, legendaries) {
  let totalCompatibility = 0;
  let comparisonCount = 0;

  // Usar Set para evitar comparações duplicadas
  const pairs = new Set();

  // Função para gerar uma chave de par única e ordenada
  const generatePairKey = (cardA, cardB) => {
    const [smaller, larger] = [cardA.number, cardB.number].sort();
    return `${smaller}_${larger}`;
  };

  // Cria uma lista de promessas para calcular a compatibilidade em paralelo
  const compatibilityPromises = [];

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const cardA = cards[i];
      const cardB = cards[j];

      const pairKey = generatePairKey(cardA, cardB);
      if (!pairs.has(pairKey)) {
        pairs.add(pairKey);
        // Armazena a promessa da comparação
        compatibilityPromises.push(
          compareCardsToLevelADeck(cardA, cardB, decks, legendaries)
        );
        comparisonCount++;
      }
    }
  }

  // Executa todas as comparações em paralelo
  const compatibilities = await Promise.all(compatibilityPromises);

  // Soma todas as compatibilidades
  compatibilities.forEach((compatibility) => {
    totalCompatibility += compatibility;
  });

  // Calcula a média da compatibilidade, limitada entre 1 e 5
  const averageCompatibility = Math.max(
    1,
    Math.min(totalCompatibility / comparisonCount, 5)
  );

  return averageCompatibility.toFixed(2);
}

async function compareCardsToLevelADeck(cardA, cardB, decks, legendaries) {
  const similarCards = await getRelatedCardsInDecks(
    cardA.number,
    decks,
    false,
    null,
    null
  );

  const isCommonOrLegendary = legendaries.some(
    ({ number, commonNumber }) =>
      number === cardB.number || commonNumber === cardB.number
  );

  const position = isCommonOrLegendary
    ? -1
    : similarCards.findIndex(({ idcard }) => idcard === cardB.number);

  const compatibility =
    position === -1 ? 1 : 1 - position / (similarCards.length - 1);

  return Math.min(Math.max(Math.round(compatibility * 4) + 1, 1), 5);
}

function calculateWeightedAverage(sumStars, leveling, sumCategories) {
  const weightedAverage =
    WEIGHT_LEVEL_SINERGY_BEETWEEN_CARDS * leveling +
    WEIGHT_LEVEL_STAPLE_USING_FOR_CARDS * sumStars +
    sumCategories;

  return Math.max(0, weightedAverage);
}

async function getRelatedCardsInDecks(
  cardId,
  decks,
  isDeckBuilder,
  selectedStyle,
  selectedArchetype
) {
  const selectedCard = allCards.find((card) => card.number == cardId);
  if (!selectedCard) return [];

  const relatedCardsMap = new Map();

  const addCardWithWeight = (id, weight) => {
    if (id !== cardId) {
      relatedCardsMap.set(id, (relatedCardsMap.get(id) || 0) + weight);
    }
  };

  for (const card of allCards) {
    if (card.number === cardId) continue; // Ignorar a carta atual

    // Comparar subtipo "Lendário" e somar o peso se aplicável
    if (
      (card.subtype === "Lendário" && card.commonNumber === cardId) ||
      (selectedCard.subtype === "Lendário" &&
        selectedCard.commonNumber === card.number)
    ) {
      addCardWithWeight(card.number, WEIGHT_LEGENDARY);
    }

    let sinergies = selectedCard.sinergies?.split(",");

    if (sinergies) {
      sinergies.forEach((sinergy) => {
        if (card.number == sinergy) {
          addCardWithWeight(card.number, WEIGHT_DIRECT_SINERGY);
        }
      });
    }

    // Comparar categorias
    const cardCategories = new Set(card.categories.split(";"));
    const selectedCardCategories = selectedCard.categories.split(";");

    const weightCategory = isDeckBuilder
      ? WEIGHT_CATEGORY
      : WEIGHT_CATEGORY * 1.0;
    for (const category of selectedCardCategories) {
      if (cardCategories.has(category)) {
        addCardWithWeight(card.number, weightCategory);
      }
    }
  }

  const activeDecks = decks.filter((deck) => deck.active !== false);

  // Processar todos os decks ativos
  const totalDecks = activeDecks.length;

  for (const deck of activeDecks) {
    const allCardIds = [...deck.cards, ...deck.extra, ...deck.sideboard];

    for (const id of allCardIds) {
      let weight = deck.cards.includes(id)
        ? WEIGHT_OCURRENCY_DECK / totalDecks
        : deck.extra.includes(id)
        ? WEIGHT_OCURRENCY_EXTRA / totalDecks
        : WEIGHT_OCURRENCY_SIDEBOARD / totalDecks;

      if (selectedStyle && deck.style == selectedStyle) {
        weight *= WEIGHT_DECK_STYLE;
      }

      if (selectedArchetype && deck.archetype == selectedArchetype) {
        weight *= WEIGHT_DECK_ARCHETYPE;
      }

      addCardWithWeight(id, weight);
    }
  }

  return Array.from(relatedCardsMap.entries())
    .map(([idcard, qtd]) => ({ idcard, qtd }))
    .sort((a, b) => b.qtd - a.qtd);
}

function getCardsFromDeck(ids, cards) {
  const cardsMap = new Map(cards.map((card) => [card.number, card]));
  const allCards = ids.map((id) => cardsMap.get(id)).filter(Boolean);
  return orderCardsFromDeck(allCards);
}

function orderCardsFromDeck(cards) {
  const typeOrder = {
    "Herói de Fé - Lendário": 1,
    "Herói de Fé": 2,
    Artefato: 3,
    Milagre: 4,
    Pecado: 5,
  };

  return cards.sort((a, b) => {
    // Determina o tipo da carta
    const typeA =
      a.type === "Herói de Fé" && a.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : a.type || "";
    const typeB =
      b.type === "Herói de Fé" && b.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : b.type || "";

    // Ordena primeiro por tipo de carta
    if (typeA !== typeB) {
      return (typeOrder[typeA] || 999) - (typeOrder[typeB] || 999);
    }

    // Se os tipos forem iguais, ordena pelo custo
    if (a.cost !== b.cost) {
      return a.cost - b.cost;
    }

    // Se os custos forem iguais, ordena pelo nome da carta
    return a.name.localeCompare(b.name);
  });
}

function getOccurrencesInDecks(cardId, decks) {
  return decks.reduce((count, deck) => {
    // Combina 'cards' e 'extra' e remove duplicatas usando um Set
    const uniqueCards = new Set([...deck.cards, ...deck.extra]);

    // Itera pelos elementos únicos e conta as ocorrências
    if (uniqueCards.has(cardId)) {
      count++;
    }

    return count;
  }, 0);
}

function getOccurrencesInSides(cardId, decks) {
  return decks.reduce((count, deck) => {
    const imgTitle = deck.img.replace(/\d+/g, ""); // Remover dígitos do título da imagem
    const allCards = [
      ...deck.cards,
      ...deck.extra,
      ...deck.sideboard,
      ...deck.topcards,
      imgTitle,
      imgTitle,
      imgTitle, // Adicionar imgTitle 3 vezes diretamente
    ];

    // Criar um Set para remover duplicatas
    const uniqueCards = new Set(allCards);

    // Itera pelos elementos únicos e conta as ocorrências
    if (uniqueCards.has(cardId)) {
      count++;
    }

    return count;
  }, 0);
}

function getRelatedDecks(cardNumber, relatedCards, decks) {
  // Ordena os relatedCards pela quantidade (qtd) em ordem decrescente
  relatedCards.sort((a, b) => b.qtd - a.qtd);

  // Cria um Set para melhor performance na busca de cardNumber
  const relatedCardIds = new Set(relatedCards.map((card) => card.idcard));

  // Transforma relatedCards em um mapa para acesso rápido
  const relatedCardMap = Object.fromEntries(
    relatedCards.map((card) => [card.idcard, card.qtd])
  );

  // Função para calcular o score com pesos baseados nas áreas do deck
  function calculateDeckScore(deck, cardNumber) {
    let score = 0;
    let priority = 0;

    // Aumenta a prioridade se a cardNumber está em topcards, cards ou extra
    if (deck.img.includes(cardNumber)) {
      priority += 5; // Maior prioridade para topcards
      score += 5; // Peso para topcards
    }
    // Aumenta a prioridade se a cardNumber está em topcards, cards ou extra
    if (deck.topcards.includes(cardNumber)) {
      priority += 4; // Maior prioridade para topcards
      score += 5; // Peso para topcards
    }
    if (deck.cards.includes(cardNumber)) {
      priority += 3; // Prioridade intermediária para cards principais
      score += 5; // Peso para cards
    }
    if (deck.extra.includes(cardNumber)) {
      priority += 3; // Prioridade para cartas no extra
      score += 5; // Peso para extra
    }
    if (deck.sideboard.includes(cardNumber)) {
      score += 1; // Peso para sideboard, sem aumentar prioridade
    }

    // Aumenta o score com base na quantidade de cartas relacionadas
    score += deck.cards.reduce((acc, cardId) => {
      return acc + (relatedCardMap[cardId] || 0);
    }, 0);

    return { score, priority };
  }

  // Filtra os decks e calcula o score e a prioridade
  const deckScores = decks
    .filter((deck) =>
      [deck.cards, deck.sideboard, deck.extra, deck.topcards].some((array) =>
        array.includes(cardNumber)
      )
    )
    .map((deck) => {
      const { score, priority } = calculateDeckScore(deck, cardNumber);
      return { deck, score, priority };
    });

  // Ordena os decks por prioridade e depois por score
  return deckScores
    .sort((a, b) => {
      // Primeiro, ordena pela prioridade (decrescente)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Se as prioridades forem iguais, ordena pelo score (decrescente)
      return b.score - a.score;
    })
    .map((deckScore) => deckScore.deck);
}

function calculateWeightedScore(stars, monthDiff, usage) {
  const weightStars = 0.75;
  const weightDate = 0.01;
  const weightUsage = 0.24;

  const score =
    stars * weightStars + (12 - monthDiff) * weightDate + usage * weightUsage;

  return score;
}

function sortByStarsAndDate(data) {
  const currentDate = new Date();

  data.sort((a, b) => {
    const { stars: starsA, date: dateA, ocurrences: occurrencesA } = a;
    const { stars: starsB, date: dateB, ocurrences: occurrencesB } = b;

    const parsedStarsA = parseFloat(starsA);
    const parsedStarsB = parseFloat(starsB);

    // Verifica se a data está correta e cria uma nova data
    const parsedDateA = new Date(dateA);
    const parsedDateB = new Date(dateB);

    const monthDiffA =
      (currentDate.getFullYear() - parsedDateA.getFullYear()) * 12 +
      currentDate.getMonth() -
      parsedDateA.getMonth();

    const monthDiffB =
      (currentDate.getFullYear() - parsedDateB.getFullYear()) * 12 +
      currentDate.getMonth() -
      parsedDateB.getMonth();

    const weightA = calculateWeightedScore(
      parsedStarsA,
      monthDiffA,
      occurrencesA
    );
    const weightB = calculateWeightedScore(
      parsedStarsB,
      monthDiffB,
      occurrencesB
    );

    return weightB - weightA; // Ordena em ordem decrescente
  });

  return data;
}

function getKeyWithMaxAbsoluteValue(obj) {
  let maxKey = 0;
  let maxValue = -Infinity;

  for (const [key, value] of Object.entries(obj)) {
    if (Math.abs(value) > maxValue) {
      maxValue = value;
      maxKey = key;
    }
  }

  return maxKey;
}

function wait(segundos) {
  return new Promise((resolve) => {
    setTimeout(resolve, segundos);
  });
}

function scaleToFive(num, occurrences) {
  if (num > 0) {
    num += 10; // Adiciona 10 se o número for positivo
  }
  if (occurrences > 0) {
    num += 10; // Adiciona 10 se as ocorrências forem maiores que zero
  }

  // Escala o valor para o intervalo de 1 a 5
  const scaledValue = Math.min(5, Math.max(1, num / 20));

  return scaledValue.toFixed(1); // Retorna o valor escalado com uma casa decimal
}

function limitStringOccurrences(arr, maxOccurrences) {
  const counts = {}; // Armazena a contagem das ocorrências

  return arr.filter((item) => {
    counts[item] = (counts[item] || 0) + 1; // Incrementa a contagem para o item
    return counts[item] <= maxOccurrences; // Retorna true se a contagem não exceder o limite
  });
}

function removeAccents(input) {
  const map = {
      'ç': 'c', 'Ç': 'C',
      'ã': 'a', 'Ã': 'A',
      'á': 'a', 'Á': 'A',
      'à': 'a', 'À': 'A',
      'â': 'a', 'Â': 'A',
      'ä': 'a', 'Ä': 'A',
      'é': 'e', 'É': 'E',
      'è': 'e', 'È': 'E',
      'ê': 'e', 'Ê': 'E',
      'ë': 'e', 'Ë': 'E',
      'í': 'i', 'Í': 'I',
      'ì': 'i', 'Ì': 'I',
      'î': 'i', 'Î': 'I',
      'ï': 'i', 'Ï': 'I',
      'ó': 'o', 'Ó': 'O',
      'ò': 'o', 'Ò': 'O',
      'ô': 'o', 'Ô': 'O',
      'ö': 'o', 'Ö': 'O',
      'õ': 'o', 'Õ': 'O',
      'ú': 'u', 'Ú': 'U',
      'ù': 'u', 'Ù': 'U',
      'û': 'u', 'Û': 'U',
      'ü': 'u', 'Ü': 'U',
      'ñ': 'n', 'Ñ': 'N'
  };

  return input.replace(/[^\w\s]/g, char => map[char] || char);
}
