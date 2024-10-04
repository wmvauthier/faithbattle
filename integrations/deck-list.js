const CARDS_PER_PAGE = 36; // Número de cards por página
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
  let rowsToAdd = [];

  decksToShow.forEach((deck) => {
    const arrays = [deck.cards, deck.extra, deck.sideboard];

    const result = arrays.map((arr) => `[${arr.join(",")}]`).join("");

    const filteredObjects = allCards.filter((obj) =>
      deck.topcards.includes(obj.number)
    );

    let sumStars = 0;
    const mergedArray = [...deck.cards, ...deck.extra];
    let cardsFromDeck = getCardsFromDeck(mergedArray, allCards);

    console.log(cardsFromDeck);

    cardsFromDeck.forEach((card) => {
      card.ocurrences = getOccurrencesInDecks(card.number, decks);
      card.ocurrencesInSides = getOccurrencesInSides(card.number, decks);
      card.stars = scaleToFive(
        (card.ocurrencesInSides / decks.length) * 100,
        card.ocurrencesInSides
      );
      sumStars += parseFloat(card.stars) / mergedArray.length;
    });

    let badges = "";
    let symbolStyle = "";
    let colorStyle = "";
    let textStyle = "";

    let arrKeywords = deck.keywords.split(";");
    console.log(deck);

    if (deck.style == "Agressivo") {
      symbolStyle = '<i class="fa-solid fa-hand-back-fist"></i>';
      colorStyle = "#B22222";
      textStyle = "#fff";
    } else if (deck.style == "Equilibrado") {
      symbolStyle = '<i class="fa-solid fa-hand-scissors"></i>';
      colorStyle = "#FFD700";
      textStyle = "#000";
    } else if (deck.style == "Controlador") {
      symbolStyle = '<i class="fa-solid fa-hand"></i>';
      colorStyle = "#1E90FF";
      textStyle = "#fff";
    }

    let symbolArchetype = "";
    let colorArchetype = "";
    let textArchetype = "";
    let borderArchetype = "none"; // Valor padrão para borderArchetype

    if (deck.archetype == "Batalha") {
      symbolArchetype = '<i class="fa-solid fa-hand-fist"></i>'; // Espadas cruzadas (ícone colorido via FontAwesome)
      colorArchetype = "#FF8C00"; // Laranja
      textArchetype = "#000"; // Preto
    } else if (deck.archetype == "Santificação") {
      symbolArchetype = '<i class="fa-solid fa-droplet"></i>'; // Coroa (ícone colorido via FontAwesome)
      colorArchetype = "whitesmoke"; // Branco esfumaçado
      textArchetype = "#000"; // Preto
      borderArchetype = "0.5px solid black"; // Borda preta fina
    } else if (deck.archetype == "Combo") {
      symbolArchetype = '<i class="fa-solid fa-gears"></i>'; // Engrenagens (ícone colorido via FontAwesome)
      colorArchetype = "#800080"; // Roxo
      textArchetype = "#fff"; // Branco
    } else if (deck.archetype == "Maravilhas") {
      symbolArchetype = '<i class="fa-solid fa-hat-wizard"></i>'; // Estrela (ícone colorido via FontAwesome)
      colorArchetype = "#32CD32"; // Verde claro
      textArchetype = "#000"; // Branco
    } else if (deck.archetype == "Supressão") {
      symbolArchetype = '<i class="fa-solid fa-ban"></i>'; // Mão controlando (ícone colorido via FontAwesome)
      colorArchetype = "#000000"; // Preto
      textArchetype = "#fff"; // Branco
    }

    badges =
      badges +
      '<span _ngcontent-ng-c2622191440="" class="badge rounded-pill mx-1 text-bg-secondary" ' +
      'style="color: #fff; background-color: #6C757D !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 7px;"> ' +
      sumStars.toFixed(2) +
      ' <i style="color: #FFD700; font-size: 12px;" class="fa-solid fa-star"></i></span>';

    badges =
      badges +
      '<span _ngcontent-ng-c2622191440="" class="badge rounded-pill mx-1 text-bg-secondary" ' +
      'style="color: ' +
      textStyle +
      "; background-color: " +
      colorStyle +
      ' !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 7px;"> ' +
      symbolStyle +
      "&nbsp;" +
      deck.style +
      " </span>";

      badges =
      badges +
      '<span class="badge rounded-pill mx-1 text-bg-secondary" ' +
      'style="color: ' +
      textArchetype +
      "; background-color: " +
      colorArchetype +
      " !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 7px; border: " +
      borderArchetype +
      '"> ' +
      symbolArchetype +
      "&nbsp;" +
      deck.archetype +
      " </span>";

    // arrKeywords.forEach((keyword) => {
    //   badges =
    //     badges +
    //     '<span _ngcontent-ng-c2622191440="" class="badge rounded-pill mx-1 text-bg-secondary" ' +
    //     'style="color: #fff; background-color: #6C757D !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 7px;"> #' +
    //     keyword +
    //     " </span>";
    // });

    const row = document.createElement("div");
    row.innerHTML = `
      <div class="tile">
          <div class="wrapper">

              <div class="banner-img" style="width: 100%; height: 250px; overflow: hidden; position: relative;">
                <img src="${deck.img}" alt="."
                    style="width: 100%; height: 100%; transform: scale(1.9); object-fit: cover; position: absolute; top: 100px; left: 0;">
              </div>

              <div class="stats">
                <div style="width:100%; text-align: center;">

                  <b style="text-align:center">${deck.name.toUpperCase()}</b><br>

                  ${badges}

                  <div class="row" style="width: 100%; padding-left: 40px; padding-top: 5px;">
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[0]?.img}" alt="."
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[1]?.img}" alt="."
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[2]?.img}" alt="."
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[3]?.img}" alt="."
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[4]?.img}" alt="."
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                      <div class="banner-img col-2" style="width: 100%; height: 40px; overflow: hidden; position: relative;">
                        <img src="${filteredObjects[5]?.img}" alt="."
                            style="width: 100%; height: 100%; transform: scale(1.5); object-fit: cover; position: absolute; top: 20%; left: 0;">
                      </div>
                  </div>

                </div>  

              </div>

          </div>
      </div> 
    `;

    //   <div class="stats" style="padding-top:0px; margin:0;">
    //   <hr style="padding-top:0px; margin:0;">
    // </div>
    //     <div class="stats" style="padding-top:0px;">
    //     <div style="width:50%;">
    //         <strong>META</strong> ${deck.style.toUpperCase()}
    //     </div>
    //     <div style="width:50%;">
    //         <strong>ESTRELAS</strong> ${deck.archetype.toUpperCase()}
    //     </div>
    // </div>

    row.addEventListener("click", (event) => {
      if (!event.target.classList.contains("copy-button")) {
        getDeckDetails(deck.number);
      }
    });

    row.style.cursor = "pointer";
    row.classList.add(
      "col-xl-2",
      "col-lg-3",
      "col-md-6",
      "col-sm-6",
      "col-xs-6"
    );

    row.stars = sumStars;

    rowsToAdd.push(row);
  });

  rowsToAdd.sort((a, b) => b.stars - a.stars);
  rowsToAdd.forEach((row) => {
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
