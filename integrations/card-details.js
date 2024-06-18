let cards;

document.addEventListener("DOMContentLoaded", async function () {
  let idSelectedCard = localStorage.getItem("idSelectedCard");

  if (idSelectedCard && idSelectedCard > 0) {
    const data = await getCards();

    const card = data.find((element) => element.number == idSelectedCard);
    let cardStatus = `&#9876;${card.strength} / &#10070;${card.resistence}`;

    if (card) {
      cards = data;
      let decks = await getDecks();
      let similarCards = await getRelatedCardsInDecks(card.number, decks, false);
      similarCards = similarCards.slice(0, 12);
      let relatedDecks = getRelatedDecks(similarCards, decks);

      const similarCardDetails = await fetchRelatedCardsDetails(
        similarCards.map((card) => card.idcard)
      );

      const elementsToUpdate = {
        tag_cardName: card.name,
        tag_cardFlavor: card.flavor,
        tag_cardText: card.text,
        tag_cardType: card.type,
        tag_cardCategories: card.categories.split(";").join("; "),
        tag_cardCost: String.fromCharCode(10121 + card.cost),
        tag_cardStatus: cardStatus,
        tag_cardEffect: card.effects,
        tag_cardNumber: card.number,
        tag_cardCollection: card.collection,
        tag_cardDate: formatDate(card.date),
        tag_cardArtist: card.artist,
        tag_cardImg: card.img,
        tag_cardStars: card.stars, // Assumindo que a propriedade é 'stars'
      };

      for (const [id, value] of Object.entries(elementsToUpdate)) {
        const element = document.getElementById(id);
        if (element) {
          if (id === "tag_cardImg") {
            element.src = value;
          } else if (id === "tag_cardStars") {
            updateStars(element, value); // Atualizar as estrelas
          } else {
            element.textContent = value;
          }
        }
      }

      const el = document.getElementById("tag_cardStatus");
      el.innerHTML = `&#9876;${card.strength} / &#10070;${card.resistence}`;

      if (card.strength == 0 && card.resistence == 0) {
        el.innerHTML = "";
      }

      updateSimilarCardsDOM(similarCardDetails, similarCards);
      updateRelatedDecks(relatedDecks);
    } else {
      location.href = "./card-list.html";
    }
  } else {
    location.href = "./card-list.html";
  }
});

function updateSimilarCardsDOM(similarCardDetails, similarCards) {
  const similarCardsContainer = document.querySelector("#relatedCardsList");
  if (!similarCardsContainer) return;

  similarCardsContainer.innerHTML = "";

  similarCards.forEach((similarCard) => {
    const details = similarCardDetails.find(
      (card) => card.number === similarCard.idcard
    );
    if (details) {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-1 col-md-3 col-sm-4 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        getCardDetails(details.number)
      );

      similarCardsContainer.appendChild(cardElement);
    }
  });
}

function updateRelatedDecks(relatedDecks) {
  const relatedDecksContainer = document.getElementById(
    "related-decks-container"
  );
  relatedDecksContainer.innerHTML = ""; // Limpa o conteúdo existente

  relatedDecks.forEach((deck) => {
    const keywordsArray = deck.keywords.split(";");

    const deckElement = document.createElement("div");
    deckElement.innerHTML = `
<div class="product__sidebar__comment__item">
<div class="product__sidebar__comment__item__pic">
  <img src="${
    deck.img
  }" alt="Deck Image" style="max-width: 90px; height: auto; max-height: 130px;">
</div>
<div class="product__sidebar__comment__item__text">
  <ul>
    ${keywordsArray.map((keyword) => `<li>${keyword}</li>`).join("")}
  </ul>
  <h5><a href="#">${deck.name}</a></h5>
</div>
</div>`;

    deckElement.style.cursor = "pointer";
    deckElement.addEventListener("click", () => getDeckDetails(deck.number));
    relatedDecksContainer.appendChild(deckElement);

  });
}

async function fetchRelatedCardsDetails(cardIds) {
  return cards.filter((card) => cardIds.includes(card.number));
}

// Função para atualizar as estrelas
function updateStars(element, stars) {
  const fullStars = Math.floor(stars);
  const halfStar = stars % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  element.innerHTML = "";

  // Adiciona estrelas cheias
  for (let i = 0; i < fullStars; i++) {
    element.innerHTML += '<a href="#"><i class="fa fa-star"></i></a>';
  }

  // Adiciona meia estrela, se necessário
  if (halfStar) {
    element.innerHTML += '<a href="#"><i class="fa fa-star-half-o"></i></a>';
  }

  // Adiciona estrelas vazias
  for (let i = 0; i < emptyStars; i++) {
    element.innerHTML += '<a href="#"><i class="fa fa-star-o"></i></a>';
  }
}

function formatDate(dateString) {
  const months = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  const date = new Date(dateString);
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  return `(${monthName}/${year})`;
}
