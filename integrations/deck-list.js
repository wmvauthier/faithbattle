const CARDS_PER_PAGE = 5; // Número de cards por página
let currentPage = 1; // Página atual
let decks = []; // Lista de todos os decks
let cards = []; // Lista de todos os decks

document.addEventListener("DOMContentLoaded", async function () {
  decks = await getDecks();
  // cards = await getCards();

  // let analysis = await analyzeDecks(decks);
  // console.log(analysis);

  // decks.forEach((deck) => {
  //   let cardsFromDeck = getCardsFromDeck(deck.cards, cards);
  //   console.log(deck);
  //   console.log(cardsFromDeck);
  //   let cardAnalysis = analyzeCards(cardsFromDeck,analysis);
  //   console.log(cardAnalysis);
  //   deck.analysis = cardAnalysis;
  // });

  renderPage(currentPage);
});

function renderPage(page) {
  const tableBody = document.getElementById("decks-table-body");
  tableBody.innerHTML = "";

  const startIndex = (page - 1) * CARDS_PER_PAGE;
  const endIndex = page * CARDS_PER_PAGE;

  const decksToShow = decks.slice(startIndex, endIndex);

  decksToShow.forEach((deck) => {
    const arrays = [deck.cards, deck.extra, deck.sideboard];

    const result = arrays.map((arr) => `[${arr.join(",")}]`).join("");

    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="deck-image"><img src="${deck.img}" alt="Deck Image"></td>
      <td class="deck-name">${deck.name}</td>
      <td>${deck.style}</td>
      <td>${deck.format}</td>
      <td><button onclick="copyDeckHash('${result}', this)" class="copy-button">Copiar Deck</button></td>
    `;
    row.addEventListener("click", (event) => {
      if (!event.target.classList.contains("copy-button")) {
        getDeckDetails(deck.number);
      }
    });
    row.style.cursor = "pointer";
    tableBody.appendChild(row);
  });

  renderPagination(page);
}

function renderPagination(currentPage) {
  const totalPages = Math.ceil(decks.length / CARDS_PER_PAGE);
  const paginationContainer = document.getElementById("pagination");

  paginationContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", () => {
      currentPage = i;
      renderPage(currentPage);
    });
    paginationContainer.appendChild(pageButton);
  }
}

async function copyDeckHash(deckCards, button) {
  // Lógica para copiar o deck

  let hashedString = await cryptoDeck(deckCards);

  navigator.clipboard
    .writeText(hashedString)
    .then(() => {
      console.log("Deck copiado para a área de transferência:", hashedString);

      button.textContent = "Deck Copiado";
      button.classList.add("copied");
      button.disabled = true;

      setTimeout(() => {
        button.textContent = "Copiar Deck";
        button.classList.remove("copied");
        button.disabled = false;
      }, 5000); // Voltar ao estado normal após 3 segundos
    })
    .catch((err) => {
      console.error("Erro ao copiar o hash:", err);
      alert("Erro ao copiar o hash!");
    });
}
