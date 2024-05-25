const URL_DECKS_JSON = "data/decks.json";
const URL_HEROES_JSON = "data/heroes.json";
const URL_MIRACLES_JSON = "data/miracles.json";
const URL_SINS_JSON = "data/sins.json";
const URL_ARTIFACTS_JSON = "data/artifacts.json";
const URL_LEGENDARIES_JSON = "data/legendary.json";

function getCardDetails(cardNumber) {
  localStorage.setItem("idSelectedCard", cardNumber);
  location.href = "./card-details.html";
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

async function getCards() {
  const heroes = await fetchJSON(URL_HEROES_JSON);
  const miracles = await fetchJSON(URL_MIRACLES_JSON);
  const sins = await fetchJSON(URL_SINS_JSON);
  const artifacts = await fetchJSON(URL_ARTIFACTS_JSON);
  const legendaries = await fetchJSON(URL_LEGENDARIES_JSON);

  return [...heroes, ...miracles, ...sins, ...artifacts, ...legendaries];
}

async function getDecks() {
  return await fetchJSON(URL_DECKS_JSON);
}

function getCardsFromDeck(ids, cards) {
  // Array para armazenar os cards correspondentes aos IDs fornecidos
  const allCards = [];

  // Iterar sobre os IDs e adicionar os cards correspondentes ao array
  ids.forEach((id) => {
    cards.forEach((card) => {
      if (card.number === id) {
        allCards.push(card);
      }
    });
  });

  // Função de comparação para ordenar os cards conforme os critérios
  const typeOrder = {
    "Herói de Fé - Lendário": 1,
    "Herói de Fé": 2,
    Artefato: 3,
    Milagre: 4,
    Pecado: 5,
  };

  allCards.sort((a, b) => {
    // Combinar tipo e subtipo se necessário
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
  return decks.reduce(
    (count, deck) => count + (deck.cards.includes(cardId) ? 1 : 0),
    0
  );
}

function getRelatedCardsInDecks(cardId, decks) {
  const relatedCardsMap = new Map();

  decks.forEach((deck) => {

    if (deck.extra.includes(cardId)) {
      deck.extra.forEach((id) => {
        if (id !== cardId) {
          relatedCardsMap.set(id, (relatedCardsMap.get(id) || 0) + 1);
        }
      });
    }

    if (deck.cards.includes(cardId)) {
      deck.cards.forEach((id) => {
        if (id !== cardId) {
          relatedCardsMap.set(id, (relatedCardsMap.get(id) || 0) + 1);
        }
      });
    }

    if (deck.sideboard.includes(cardId)) {
      deck.sideboard.forEach((id) => {
        if (id !== cardId) {
          relatedCardsMap.set(id, (relatedCardsMap.get(id) || 0) + 1);
        }
      });
    }

  });

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
