const URL_DECKS_JSON = "data/decks.json";
const URL_HEROES_JSON = "data/heroes.json";
const URL_MIRACLES_JSON = "data/miracles.json";
const URL_SINS_JSON = "data/sins.json";
const URL_ARTIFACTS_JSON = "data/artifacts.json";
const URL_LEGENDARIES_JSON = "data/legendary.json";

// const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const CACHE_DURATION = 1000; // 24 horas

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
    console.error("Error:", error);
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
  return await fetchOrGetFromLocalStorage("decks", URL_DECKS_JSON);
}

function getCardsFromDeck(ids, cards) {
  const allCards = [];

  ids.forEach((id) => {
    cards.forEach((card) => {
      if (card.number === id) {
        allCards.push(card);
      }
    });
  });

  const typeOrder = {
    "Herói de Fé - Lendário": 1,
    "Herói de Fé": 2,
    Artefato: 3,
    Milagre: 4,
    Pecado: 5,
  };

  allCards.sort((a, b) => {
    const typeA =
      a.type === "Herói de Fé" && a.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : a.type;
    const typeB =
      b.type === "Herói de Fé" && b.subtype === "Lendário"
        ? "Herói de Fé - Lendário"
        : b.type;

    if (typeA === typeB) {
      return a.cost - b.cost;
    }

    return typeOrder[typeA] - typeOrder[typeB];
  });

  return allCards;
}

function getOccurrencesInDecks(cardId, decks) {
  return decks.reduce((count, deck) => {
    const cards = deck.cards.concat(deck.extra, deck.sideboard); // Concatenando todas as listas de cards

    return count + (cards.includes(cardId) ? 1 : 0);
  }, 0);
}

async function getRelatedCardsInDecks(cardId, decks) {
  const relatedCardsMap = new Map();

  const addCardWithWeight = (id, weight) => {
    if (id !== cardId) {
      relatedCardsMap.set(id, (relatedCardsMap.get(id) || 0) + weight);
    }
  };

  let allCards = await getCards();

  decks.forEach((deck) => {

    let cardsFromDeck = getCardsFromDeck(deck.cards, allCards);
    let selectedCard = cardsFromDeck.find((objeto) => objeto.number == cardId);
    console.log(cardsFromDeck);
    console.log(cardId);

    if (selectedCard) {
      cardsFromDeck.forEach((card) => {
        if (card.text.includes(selectedCard.name)) {
          deck.cards.forEach((id) => addCardWithWeight(id, 3));
          deck.extra.forEach((id) => addCardWithWeight(id, 3));
          deck.sideboard.forEach((id) => addCardWithWeight(id, 3));
          console.log(card);
        }
        //VERIFICAR NOME E EXISTENCIA DE LENDARIA CORRELATA
      });
    }

    if (
      deck.extra.includes(cardId) ||
      deck.cards.includes(cardId) ||
      deck.sideboard.includes(cardId)
    ) {
      deck.cards.forEach((id) => addCardWithWeight(id, 3));
      deck.extra.forEach((id) => addCardWithWeight(id, 3));
      deck.sideboard.forEach((id) => addCardWithWeight(id, 1));
    }

  });

  let r = Array.from(relatedCardsMap.entries())
    .map(([idcard, qtd]) => ({ idcard, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  console.log(r);

  return Array.from(relatedCardsMap.entries())
    .map(([idcard, qtd]) => ({ idcard, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 12);
}

function getRelatedDecks(relatedCards, decks) {
  relatedCards.sort((a, b) => b.qtd - a.qtd);

  const deckScores = decks.map((deck) => {
    const score = deck.cards.reduce((acc, cardId) => {
      const relatedCard = relatedCards.find(
        (relatedCard) => relatedCard.idcard === cardId
      );
      return relatedCard ? acc + relatedCard.qtd : acc;
    }, 0);

    return { deck, score };
  });

  return deckScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((deckScore) => deckScore.deck);
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
