const URL_DECKS_JSON = "data/decks.json";
const URL_HEROES_JSON = "data/heroes.json";
const URL_MIRACLES_JSON = "data/miracles.json";
const URL_SINS_JSON = "data/sins.json";
const URL_ARTIFACTS_JSON = "data/artifacts.json";
const URL_LEGENDARIES_JSON = "data/legendary.json";

const WEIGHT_LEGENDARY = 100000;
// const WEIGHT_LEGENDARY = 0;
const WEIGHT_SAME = 100;
// const WEIGHT_SAME = 0;
// const WEIGHT_NAME = 1000;
const WEIGHT_NAME = 0;
// const WEIGHT_TEXT = 60;
const WEIGHT_TEXT = 0;
// const WEIGHT_TYPE = 10;
const WEIGHT_TYPE = 10;
// const WEIGHT_EFFECT = 10;
const WEIGHT_EFFECT = 0;
// const WEIGHT_CATEGORY = 100;
let WEIGHT_CATEGORY = 200;
const WEIGHT_OCURRENCY_DECK = 200;
const WEIGHT_OCURRENCY_EXTRA = 200;
const WEIGHT_OCURRENCY_SIDEBOARD = 200;

const WEIGHT_DECK_STYLE = 30;
const WEIGHT_DECK_ARCHETYPE = 70;

const WEIGHT_LEVEL_SINERGY_BEETWEEN_CARDS = 0.8;
const WEIGHT_LEVEL_STAPLE_USING_FOR_CARDS = 0.2;
const WEIGHT_LEVEL_ADICTION_FOR_REPETITION = 0.05;

const WEIGHT_LEVEL_ADICTION_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_REDUCTION_FOR_CATEGORY = 0.05;
const WEIGHT_LEVEL_ADICTION_FOR_EXCLUSIVE_CATEGORY = 0.005;
const WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_CATEGORY = 0.3;

const excludedWords = [
  "zona",
  "batalha",
  "oponente",
  "alvo",
  "heroi",
  "herois",
  "jogador",
  "sempre",
  "fizer",
  "carta",
  "cartas",
  "baralho",
  "jogo",
  "toda",
  "quando",
  "entra",
  "reorganize-as",
  "olhe",
  "primeiras",
  "como",
  "quiser",
  "ataca",
  "atacar",
  "atacando",
  "atacado",
  "atacantes",
  "ataque",
  "defenda",
  "inicio",
  "fim",
  "final",
  "turno",
  "entra",
  "sob",
  "seu",
  "sua",
  "essa",
  "esse",
  "uma",
  "voce",
  "mao",
  "for",
  "aleatoria",
  "tem",
  "anule",
  "qualquer",
  "efeito",
  "nesse",
  "instante",
  "disso",
  "proximo",
  "pontos",
  "afetam",
  "suas",
  "retorna",
  "escolhe",
  "qual",
  "voltara",
  "sofre",
  "efeitos",
  "que",
  "entra",
  "direto",
  "ate",
  "equipar",
  "armadura",
  "(efesios",
  "deus",
  "custo",
  "revela",
  "custo",
  "igual",
  "dessa",
  "defensor",
  "custam",
  "para",
  "serem",
  "jogadas",
  "(nao",
  "reduzido",
  "pode",
  "ele",
  "este",
  "torna",
  "sabedoria",
  "controle",
  "estiver",
  "ponto",
  "por",
  "cada",
  "ganhe",
  "ganha",
  "ganham",
  "perde",
  "campo",
  "ambos",
  "sao",
  "destruidos",
  "vez",
  "escolha",
  "pague",
  "ative",
  "apenas",
  "rodada",
  "acrescente",
  "usada",
  "esta",
  "esteja",
  "estejam",
  "estava",
  "equipado",
  "todos",
  "artefatos",
  "nao",
  "ser",
  "diretamente",
  "ceu",
  "entre",
  "nesta",
  "recebe",
  "afetado",
  "neste",
  "1s:",
  "+1/+0",
  "+1/+1",
  "+0/+2",
  "+2/+2",
  "+3/+3",
  "e/ou",
  "seus",
  "outros",
];

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
// const CACHE_DURATION = 1000; // 24 horas

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
    if (!response.ok)
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    return [];
  }
}

async function fetchOrGetFromLocalStorage(key, url) {
  const cachedData = localStorage.getItem(key);
  const cachedTimestamp = localStorage.getItem(`${key}_timestamp`);
  const now = Date.now();

  if (cachedData && cachedTimestamp && now - cachedTimestamp < CACHE_DURATION) {
    return JSON.parse(cachedData);
  }

  const data = await fetchJSON(url);
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(`${key}_timestamp`, now);
  return data;
}

async function getCards() {
  const heroes = await fetchOrGetFromLocalStorage("heroes", URL_HEROES_JSON);
  const miracles = await fetchOrGetFromLocalStorage(
    "miracles",
    URL_MIRACLES_JSON
  );
  const sins = await fetchOrGetFromLocalStorage("sins", URL_SINS_JSON);
  const artifacts = await fetchOrGetFromLocalStorage(
    "artifacts",
    URL_ARTIFACTS_JSON
  );
  const legendaries = await fetchOrGetFromLocalStorage(
    "legendaries",
    URL_LEGENDARIES_JSON
  );

  return [...heroes, ...miracles, ...sins, ...artifacts, ...legendaries];
}

async function getDecks() {
  let key = "decks";
  let url = URL_DECKS_JSON;
  let allCards = await getCards();

  let decks = await fetchOrGetFromLocalStorage(key, url);

  let legendaries = await fetchOrGetFromLocalStorage(
    "legendaries",
    URL_LEGENDARIES_JSON
  );

  if (decks.length > 0 && !decks[0].level) {
    for (let selectedDeck of decks) {
      selectedDeck = await calculateStarsFromDeck(
        selectedDeck,
        allCards,
        decks,
        legendaries
      );
    }
    const now = Date.now();
    localStorage.setItem(key, JSON.stringify(decks));
    localStorage.setItem(`${key}_timestamp`, now);
    return decks;
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
  const mergedArray = selectedDeck.cards.concat(selectedDeck.extra); // Evitar cópia desnecessária
  const cardsFromDeckWithExtra = getCardsFromDeck(mergedArray, allCards);

  // Calcular o nível do deck em paralelo
  const [level, analysisAverages] = await Promise.all([
    compareAllCardsToLevelADeck(cardsFromDeckWithExtra, decks, legendaries),
    analyzeDecks(decks, null, null),
  ]);

  // Inicializar variáveis
  let sumStars = 0;
  const deckLength = mergedArray.length; // Evitar recalcular o tamanho do array repetidamente
  const deckCount = decks.length;

  // Loop único para calcular estrelas e ocorrências
  cardsFromDeckWithExtra.forEach((card) => {
    const occurrences = getOccurrencesInDecks(card.number, decks);
    const occurrencesInSides = getOccurrencesInSides(card.number, decks);

    card.ocurrences = occurrences;
    card.ocurrencesInSides = occurrencesInSides;

    const scaledStars = scaleToFive(
      (occurrencesInSides / deckCount) * 100,
      occurrencesInSides
    );
    card.stars = scaledStars;
    sumStars += parseFloat(scaledStars) / deckLength;
  });

  // Preparar informações sobre categorias
  const filteredCategories = analysisAverages.averageCategories.filter(
    (category) => category.media !== 0
  );
  const cardsFromDeck = getCardsFromDeck(selectedDeck.cards, allCards);
  const info = await analyzeCards(cardsFromDeck, analysisAverages);

  // Criar uma lista de categorias inexistentes
  const categoryNamesSet = new Set(
    filteredCategories.map((category) => category.name)
  );
  const innexistentCategories = [...categoryNamesSet].filter(
    (cat) => !(cat in info.categoriesCount)
  );

  let sum = 0;

  // Iterar sobre as categorias e aplicar as diferenças
  for (const category in info.comparison.categories) {
    const categoryData = analysisAverages.averageCategories.find(
      (cat) => cat.name === category
    );
    const categoryAverage = categoryData?.media || 0;
    const categoryCount = info.categoriesCount[category] || 0;
    const difference = categoryCount - categoryAverage; // Calcular diferença

    if (categoryAverage <= 0 && categoryCount > 0) {
      sum += WEIGHT_LEVEL_ADICTION_FOR_EXCLUSIVE_CATEGORY * categoryCount;
    }

    if (info.comparison.categories[category] === "higher") {
      sum += WEIGHT_LEVEL_ADICTION_FOR_CATEGORY * difference;
    } else if (info.comparison.categories[category] === "lower") {
      sum -= WEIGHT_LEVEL_REDUCTION_FOR_CATEGORY * Math.abs(difference);
    }
  }

  // Ajustar somatório pelas categorias inexistentes
  sum -= innexistentCategories.length * WEIGHT_LEVEL_REDUCTION_FOR_INEXISTENT_CATEGORY;

  // Calcular o nível final do deck
  selectedDeck.level = calculateWeightedAverage(sumStars, level, sum).toFixed(
    2
  );

  return selectedDeck;
}

async function compareAllCardsToLevelADeck(cards, decks, legendaries) {
  let totalCompatibility = 0;
  let comparisonCount = 0;

  for (let i = 0; i < cards.length; i++) {
    const cardA = cards[i];

    // Comparando cardA com os outros cards no array
    for (let j = 0; j < cards.length; j++) {
      const cardB = cards[j];

      // Evitar comparar o card consigo mesmo
      if (i !== j) {
        const compatibility = await compareCardsToLevelADeck(
          cardA,
          cardB,
          decks,
          legendaries
        );
        totalCompatibility += compatibility;
        comparisonCount++;
      }
    }
  }

  // Calcula a média de compatibilidade
  let averageCompatibility = totalCompatibility / comparisonCount;

  // Limita a média de compatibilidade entre 1 e 5
  averageCompatibility = Math.max(1, Math.min(averageCompatibility, 5));

  // console.log(`Média de compatibilidade: ${averageCompatibility}`);
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

  // Verifica se cardB é a versão comum ou lendária de cardA
  const isCommonOrLegendary = legendaries.some(
    ({ number, commonNumber }) =>
      number === cardB.number || commonNumber === cardB.number
  );

  // Se cardB for uma versão comum ou lendária, define position como -1
  const position = isCommonOrLegendary
    ? -1
    : similarCards.findIndex(({ idcard }) => idcard === cardB.number);

  // Para evitar divisão por zero e calcular a compatibilidade
  const compatibility =
    position === -1
      ? 1 // Se não encontrado, assume a maior compatibilidade
      : 1 - position / (similarCards.length - 1);

  // Calcula a compatibilidade na escala [1, 5]
  return Math.min(Math.max(Math.round(compatibility * 4) + 1, 1), 5);
}

function calculateWeightedAverage(sumStars, leveling, sumCategories) {
  const weightedAverage =
    WEIGHT_LEVEL_SINERGY_BEETWEEN_CARDS * leveling +
    WEIGHT_LEVEL_STAPLE_USING_FOR_CARDS * sumStars;
  return weightedAverage + sumCategories;
}

async function getRelatedCardsInDecks(
  cardId,
  decks,
  isDeckBuilder,
  selectedStyle,
  selectedArchetype
) {
  const allCards = await getCards();
  const selectedCard = allCards.find((card) => card.number == cardId);

  const relatedCardsMap = new Map();

  const addCardWithWeight = (id, weight) => {
    if (id !== cardId) {
      relatedCardsMap.set(
        id,
        (relatedCardsMap.get(id) || 0) + Math.round(weight)
      );
    }
  };

  const addWeightForSelectedCardWords = (card, selectedCardWords) => {
    const nameWords = card.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[.,;]/)
      .join("")
      .toLowerCase()
      .split(" ")
      .filter((word) => word?.length > 2 && !excludedWords.includes(word));

    const textWords = card.text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[.,;]/)
      .join("")
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2 && !excludedWords.includes(word));

    // console.log(selectedCardWords.nameWords);
    // console.log(selectedCardWords.textWords);

    selectedCardWords.textWords.forEach((word) => {
      if (textWords.includes(word)) {
        addCardWithWeight(card.number, WEIGHT_TEXT);
      } else if (nameWords.includes(word)) {
        addCardWithWeight(card.number, WEIGHT_NAME);
      }
    });

    if (!isDeckBuilder || card.type != "Pecado") {
      selectedCardWords.nameWords.forEach((word) => {
        if (textWords.includes(word)) {
          addCardWithWeight(card.number, WEIGHT_NAME);
        } else if (nameWords.includes(word)) {
          addCardWithWeight(card.number, WEIGHT_NAME);
        }
      });
    }
  };

  allCards.forEach((card) => {
    if (card.number !== cardId) {
      //CHECAGEM DE TIPO E SUBTIPO

      if (card.type == selectedCard.type) {
        addCardWithWeight(card.number, WEIGHT_TYPE);
      }

      if (
        (card.subtype == "Lendário" && card.commonNumber == cardId) ||
        (selectedCard.subtype == "Lendário" &&
          selectedCard.commonNumber == card.number)
      ) {
        addCardWithWeight(card.number, WEIGHT_LEGENDARY);
      }

      //CHECAGEM DE PALAVRAS

      const selectedCardNameWords = selectedCard.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[.,;]/)
        .join("")
        .toLowerCase()
        .split(" ")
        .filter((word) => word.length > 2 && !excludedWords.includes(word));
      const selectedCardTextWords = selectedCard.text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/[.,;]/)
        .join("")
        .toLowerCase()
        .split(" ")
        .filter((word) => word.length > 2 && !excludedWords.includes(word));
      const selectedCardWords = {
        nameWords: selectedCardNameWords,
        textWords: selectedCardTextWords,
      };

      addWeightForSelectedCardWords(card, selectedCardWords);

      //CHECAGEM DE EFEITOS E CATEGORIAS
      let effects = card.effects.split(";");
      let categories = card.categories.split(";");
      let selectedCardEffects = selectedCard.effects.split(";");
      let selectedCardcategories = selectedCard.categories.split(";");

      selectedCardEffects.forEach((selectedEffect) => {
        if (effects.includes(selectedEffect)) {
          addCardWithWeight(card.number, WEIGHT_EFFECT);
        }
      });

      let weightCategory = WEIGHT_CATEGORY;
      if (!isDeckBuilder) {
        WEIGHT_CATEGORY = WEIGHT_CATEGORY * 1.0;
      }

      selectedCardcategories.forEach((selectedCategory) => {
        if (categories.includes(selectedCategory)) {
          addCardWithWeight(card.number, weightCategory);
        }
      });
    }
  });

  decks = decks.filter((item) => item.active !== false);

  decks.forEach((deck) => {
    const allCardIds = [...deck.cards, ...deck.extra, ...deck.sideboard];

    allCardIds.forEach((id) => {
      let weight = deck.cards.includes(id)
        ? WEIGHT_OCURRENCY_DECK / decks.length
        : deck.extra.includes(id)
        ? WEIGHT_OCURRENCY_EXTRA / decks.length
        : WEIGHT_OCURRENCY_SIDEBOARD / decks.length;

      // console.log(selectedStyle);
      // console.log(selectedArchetype);

      if (selectedStyle && deck.style == selectedStyle) {
        weight = weight * WEIGHT_DECK_STYLE;
      }

      if (selectedArchetype && deck.archetype == selectedArchetype) {
        weight = weight * WEIGHT_DECK_ARCHETYPE;
      }

      // console.log(selectedStyle);
      // console.log(selectedArchetype);

      addCardWithWeight(id, weight);
    });
  });

  const relatedCardsArray = Array.from(relatedCardsMap.entries())
    .map(([idcard, qtd]) => ({ idcard, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  return relatedCardsArray;
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

  cards = cards.sort((a, b) => {
    const typeA =
      a.type === "Herói de Fé" && a.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : a.type;
    const typeB =
      b.type === "Herói de Fé" && b.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : b.type;

    if (typeA === typeB) {
      if (a.cost === b.cost) {
        return a.name.localeCompare(b.name);
      }
      return a.cost - b.cost;
    }

    return typeOrder[typeA] - typeOrder[typeB];
  });

  return cards;
}

function getOccurrencesInDecks(cardId, decks) {
  return decks.reduce((count, deck) => {
    const cards = deck.cards.concat(deck.extra); // Concatenando todas as listas de cards
    return count + (cards.includes(cardId) ? 1 : 0);
  }, 0);
}

function getOccurrencesInSides(cardId, decks) {
  return decks.reduce((count, deck) => {
    let imgTitle = deck.img.replace(/\d+/g, "");
    const cards = deck.cards
      .concat(deck.extra)
      .concat(deck.sideboard)
      .concat(deck.topcards)
      .concat(deck.topcards)
      .concat([imgTitle, imgTitle, imgTitle]); // Adicionando imgTitle ao array usando concat

    return count + (cards.includes(cardId) ? 1 : 0);
  }, 0);
}

function getRelatedDecks(cardNumber, relatedCards, decks) {
  // Ordena os relatedCards pela quantidade (qtd) em ordem decrescente
  relatedCards.sort((a, b) => b.qtd - a.qtd);

  // Filtra apenas os decks que contêm o cardNumber em algum dos arrays: cards, sideboard, extra ou topcards
  const filteredDecks = decks.filter((deck) =>
    [deck.cards, deck.sideboard, deck.extra, deck.topcards].some((array) =>
      array.includes(cardNumber)
    )
  );

  // Calcula o score dos decks filtrados
  const deckScores = filteredDecks.map((deck) => {
    const score = deck.cards.reduce((acc, cardId) => {
      const relatedCard = relatedCards.find(
        (relatedCard) => relatedCard.idcard === cardId
      );
      return relatedCard ? acc + relatedCard.qtd : acc;
    }, 0);

    return { deck, score };
  });

  // Ordena pelo score, retorna apenas os 4 primeiros decks
  return deckScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
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
    const starsA = parseFloat(a.stars);
    const starsB = parseFloat(b.stars);
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    const monthDiffA =
      (currentDate.getFullYear() - dateA.getFullYear()) * 12 +
      currentDate.getMonth() -
      dateA.getMonth();

    const monthDiffB =
      (currentDate.getFullYear() - dateB.getFullYear()) * 12 +
      currentDate.getMonth() -
      dateB.getMonth();

    const weightA = calculateWeightedScore(starsA, monthDiffA, a.ocurrences);
    const weightB = calculateWeightedScore(starsB, monthDiffB, b.ocurrences);

    return weightB - weightA;
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

function scaleToFive(num, ocurrences) {
  if (num > 0) {
    num += 10;
  }
  if (ocurrences > 0) {
    num += 10;
  }
  const scaledValue = Math.min(5, Math.max(1, num / 20));
  return scaledValue.toFixed(1);
}

function limitStringOccurrences(arr, maxOccurrences) {
  const counts = {};

  return arr.filter((item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts[item] <= maxOccurrences;
  });
}
