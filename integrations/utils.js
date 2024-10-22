const URL_DECKS_JSON = "data/decks.json";
const URL_HEROES_JSON = "data/heroes.json";
const URL_MIRACLES_JSON = "data/miracles.json";
const URL_SINS_JSON = "data/sins.json";
const URL_ARTIFACTS_JSON = "data/artifacts.json";
const URL_LEGENDARIES_JSON = "data/legendary.json";

const WEIGHT_LEGENDARY = 100000;
const WEIGHT_SAME = 100;
let WEIGHT_CATEGORY = 200;
const WEIGHT_OCURRENCY_DECK = 200;
const WEIGHT_OCURRENCY_EXTRA = 200;
const WEIGHT_OCURRENCY_SIDEBOARD = 200;

const WEIGHT_DECK_STYLE = 20;
const WEIGHT_DECK_ARCHETYPE = 80;

const WEIGHT_LEVEL_SINERGY_BEETWEEN_CARDS = 0.85;
const WEIGHT_LEVEL_STAPLE_USING_FOR_CARDS = 0.15;
const WEIGHT_LEVEL_ADICTION_FOR_REPETITION = 0.05;

const WEIGHT_LEVEL_ADICTION_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_REDUCTION_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_ADICTION_FOR_EXCLUSIVE_CATEGORY = 0.005;
const WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_CATEGORY = 0.3;

const CACHE_DURATION = 1000; // 24 horas

let allCards;
let allDecks;

const isBrowser = (typeof window !== "undefined" && typeof document !== "undefined");

if (isBrowser) {

  document.addEventListener("DOMContentLoaded", async function () {
    window.allJSONsLoaded = false;

    try {
      allCards = await getCards(); // Carrega as cartas
      allDecks = await getDecks(); // Carrega os decks
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
    scaleToFive
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
    const scaledStars = scaleToFive(
      (card.ocurrencesInSides / deckCount) * 100,
      card.ocurrencesInSides
    );
    card.stars = scaledStars;
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
      sum += WEIGHT_LEVEL_ADICTION_FOR_CATEGORY * difference;
    } else if (info.comparison.categories[category] === "lower") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_CATEGORY * Math.abs(difference);
    }
  }

  sum -=
    innexistentCategories.length *
    WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_CATEGORY;

  selectedDeck.level = calculateWeightedAverage(sumStars, level, sum).toFixed(
    2
  );

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
  return (
    WEIGHT_LEVEL_SINERGY_BEETWEEN_CARDS * leveling +
    WEIGHT_LEVEL_STAPLE_USING_FOR_CARDS * sumStars +
    sumCategories
  );
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
