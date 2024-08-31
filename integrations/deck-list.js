const CARDS_PER_PAGE = 4; // Número de cards por página
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

async function renderPage(page) {
  const tableBody = document.getElementById("decks-table-body");
  tableBody.innerHTML = "";

  const startIndex = (page - 1) * CARDS_PER_PAGE;
  const endIndex = page * CARDS_PER_PAGE;

  const decksToShow = decks.slice(startIndex, endIndex);

  let allCards = await getCards();

  decksToShow.forEach((deck) => {
    const arrays = [deck.cards, deck.extra, deck.sideboard];

    const result = arrays.map((arr) => `[${arr.join(",")}]`).join("");

    const filteredObjects = allCards.filter((obj) =>
      deck.topcards.includes(obj.number)
    );

    console.log(filteredObjects);

    const row = document.createElement("div");
    row.innerHTML = `
      <div class="tile">
          <div class="wrapper">

              <div class="banner-img" style="width: 100%; height: 250px; overflow: hidden; position: relative;">
                <img src="${deck.img}" alt="Image 1"
                    style="width: 100%; height: 100%; transform: scale(1.8); object-fit: cover; position: absolute; top: 100px; left: 0;">
              </div>

              <div class="stats">
                <div style="width:100%; text-align: center;">

                  <b style="text-align:center">${deck.name.toUpperCase()}</b><br>

                  <div class="row" style="width: 100%; padding-left: 40px;">
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[0]?.img}" alt="Image 1"
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[1]?.img}" alt="Image 1"
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[2]?.img}" alt="Image 1"
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[3]?.img}" alt="Image 1"
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[4]?.img}" alt="Image 1"
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[5]?.img}" alt="Image 1"
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                  </div>

                </div>  

              </div>

              <div class="stats" style="padding-top:0px; margin:0;">
                <hr style="padding-top:0px; margin:0;">
              </div>
              
              <div class="stats" style="padding-top:0px;">

                  <div style="width:50%;">
                      <strong>ARQUÉTIPO</strong> ${deck.archetype.toUpperCase()}
                  </div>

                  <div style="width:50%;">
                      <strong>ESTILO</strong> ${deck.style.toUpperCase()}
                  </div>

              </div>

          </div>
      </div> 
    `;

    row.addEventListener("click", (event) => {
      if (!event.target.classList.contains("copy-button")) {
        getDeckDetails(deck.number);
      }
    });

    row.style.cursor = "pointer";
    row.classList.add("col-lg-3", "col-md-4", "col-sm-6", "col-xs-12");

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
