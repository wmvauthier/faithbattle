const URL_DECKS_JSON = "data/decks.json";
const URL_CARDS_JSON = "data/cards.json";

function getCardDetails(cardNumber) {
  localStorage.setItem("idSelectedCard", cardNumber);
  location.href = "./card-details.html";
}

async function getCards() {
  const decksUrl = URL_CARDS_JSON;

  try {
    const response = await fetch(decksUrl);
    if (!response.ok) {
      throw new Error("Erro ao carregar o arquivo JSON de cards");
    }
    const decks = await response.json();
    return decks;
  } catch (error) {
    console.error("Erro:", error);
    return [];
  }
}

async function getDecks() {
  const decksUrl = URL_DECKS_JSON;

  try {
    const response = await fetch(decksUrl);
    if (!response.ok) {
      throw new Error("Erro ao carregar o arquivo JSON de decks");
    }
    const decks = await response.json();
    return decks;
  } catch (error) {
    console.error("Erro:", error);
    return [];
  }
}

function getOccurrencesInDecks(cardId, decks) {
  let count = 0;
  decks.forEach((deck) => {
    if (deck.cards.includes(cardId)) {
      count++;
    }
  });
  return count;
}

function getRelatedCardsInDecks(cardId, decks) {
  const relatedCardsMap = new Map();

  decks.forEach((deck) => {
    if (deck.cards.includes(cardId)) {
      deck.cards.forEach((id) => {
        if (id !== cardId) {
          // Exclui a carta passada como parâmetro
          if (relatedCardsMap.has(id)) {
            relatedCardsMap.set(id, relatedCardsMap.get(id) + 1);
          } else {
            relatedCardsMap.set(id, 1);
          }
        }
      });
    }
  });

  const relatedCardsArray = Array.from(relatedCardsMap.entries())
    .map(([idcard, qtd]) => ({ idcard, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 6);

  return relatedCardsArray;
}

// Função para obter os decks relacionados
function getRelatedDecks(relatedCards, decks) {
  // Ordena os relatedCards por qtd em ordem decrescente
  relatedCards.sort((a, b) => b.qtd - a.qtd);

  const deckScores = decks.map((deck) => {
    // Conta o número de cópias dos relatedCards presentes no deck
    const score = deck.cards.reduce((acc, cardId) => {
      const relatedCard = relatedCards.find(
        (relatedCard) => relatedCard.idcard === cardId
      );
      return relatedCard ? acc + relatedCard.qtd : acc;
    }, 0);

    return { deck, score };
  });

  // Ordena os decks descendentemente pelo score e limita a 4 decks
  const sortedDecks = deckScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((deckScore) => deckScore.deck);

  return sortedDecks;
}

// Função para obter os cards relacionados em decks
function getRelatedCardsInDecks(cardId, decks) {
  const relatedCardsMap = new Map();

  decks.forEach((deck) => {
    if (deck.cards.includes(cardId)) {
      deck.cards.forEach((id) => {
        if (id !== cardId) {
          // Exclui a carta passada como parâmetro
          if (relatedCardsMap.has(id)) {
            relatedCardsMap.set(id, relatedCardsMap.get(id) + 1);
          } else {
            relatedCardsMap.set(id, 1);
          }
        }
      });
    }
  });

  const relatedCardsArray = Array.from(relatedCardsMap.entries())
    .map(([idcard, qtd]) => ({ idcard, qtd }))
    .sort((a, b) => b.qtd - a.qtd); // Ordena de maneira decrescente pela propriedade qtd

  return relatedCardsArray.slice(0, 6); // Limita a 6 cards
}
