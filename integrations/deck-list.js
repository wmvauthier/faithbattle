const CARDS_PER_PAGE = 30; // Número de cards por página
let currentPage = 1; // Página atual
let cards = []; // Lista de todos os cards

document.addEventListener("DOMContentLoaded", async function () {
  let data = await getCards();
  let decks = await getDecks();

  console.log(decks);

  renderCards(cards);
});
