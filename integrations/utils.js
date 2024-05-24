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
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
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

function getOccurrencesInDecks(cardId, decks) {
  return decks.reduce((count, deck) => count + (deck.cards.includes(cardId) ? 1 : 0), 0);
}

function getRelatedCardsInDecks(cardId, decks) {
  const relatedCardsMap = new Map();

  decks.forEach(deck => {
    if (deck.cards.includes(cardId)) {
      deck.cards.forEach(id => {
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

  const deckScores = decks.map(deck => {
    const score = deck.cards.reduce((acc, cardId) => {
      const relatedCard = relatedCards.find(relatedCard => relatedCard.idcard === cardId);
      return relatedCard ? acc + relatedCard.qtd : acc;
    }, 0);

    return { deck, score };
  });

  return deckScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(deckScore => deckScore.deck);
}
