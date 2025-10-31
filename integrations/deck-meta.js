const CARDS_PER_PAGE = 48; // Número de cards por página
let currentPage = 1; // Página atual

document.addEventListener("DOMContentLoaded", async function () {
  await waitForAllJSONs();
  renderPage(currentPage);
});

async function renderPage(page) {
  const tableBody = document.getElementById("decks-table-body");
  tableBody.innerHTML = "";

  const startIndex = (page - 1) * CARDS_PER_PAGE;
  const endIndex = page * CARDS_PER_PAGE;

  const decksToShow = allDecks.slice(startIndex, endIndex);

  let rowsToAdd = [];

  decksToShow.forEach((deck) => {
    const filteredObjects = allCards.filter((obj) =>
      deck.topcards.includes(obj.number)
    );

    let badges = "";
    let symbolStyle = "";
    let colorStyle = "";
    let textStyle = "";

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
      borderArchetype = "0.1px solid grey"; // Borda preta fina
    } else if (deck.archetype == "Combo") {
      symbolArchetype = '<i class="fa-solid fa-gears"></i>'; // Engrenagens (ícone colorido via FontAwesome)
      colorArchetype = "#800080"; // Roxo
      textArchetype = "#fff"; // Branco
    } else if (deck.archetype == "Tempestade") {
      symbolArchetype = '<i class="fa-solid fa-poo-storm"></i>'; // Estrela (ícone colorido via FontAwesome)
      colorArchetype = "#32CD32"; // Verde claro
      textArchetype = "#000"; // Branco
    } else if (deck.archetype == "Arsenal") {
      symbolArchetype = '<i class="fa-solid fa-toolbox"></i>'; // Estrela (ícone colorido via FontAwesome)
      colorArchetype = "#A8B3B4"; // Prata claro
      textArchetype = "#000"; // Branco
    } else if (deck.archetype == "Supressão") {
      symbolArchetype = '<i class="fa-solid fa-ban"></i>'; // Mão controlando (ícone colorido via FontAwesome)
      colorArchetype = "#000000"; // Preto
      textArchetype = "#fff"; // Branco
    } else if (deck.archetype == "Aceleração") {
      symbolArchetype = '<i class="fa-solid fa-stopwatch"></i>'; // Mão controlando (ícone colorido via FontAwesome)
      colorArchetype = "#8B4513"; // Preto
      textArchetype = "#fff"; // Branco
    }

    let symbolArchetype2 = "";
    let colorArchetype2 = "";
    let textArchetype2 = "";
    let borderArchetype2 = "none"; // Valor padrão para borderArchetype

    if (deck.archetype2 == "Batalha") {
      symbolArchetype2 = '<i class="fa-solid fa-hand-fist"></i>'; // Espadas cruzadas (ícone colorido via FontAwesome)
      colorArchetype2 = "#FF8C00"; // Laranja
      textArchetype2 = "#000"; // Preto
    } else if (deck.archetype2 == "Santificação") {
      symbolArchetype2 = '<i class="fa-solid fa-droplet"></i>'; // Coroa (ícone colorido via FontAwesome)
      colorArchetype2 = "whitesmoke"; // Branco esfumaçado
      textArchetype2 = "#000"; // Preto
      borderArchetype2 = "0.1px solid grey"; // Borda preta fina
    } else if (deck.archetype2 == "Combo") {
      symbolArchetype2 = '<i class="fa-solid fa-gears"></i>'; // Engrenagens (ícone colorido via FontAwesome)
      colorArchetype2 = "#800080"; // Roxo
      textArchetype2 = "#fff"; // Branco
    } else if (deck.archetype2 == "Tempestade") {
      symbolArchetype2 = '<i class="fa-solid fa-poo-storm"></i>'; // Estrela (ícone colorido via FontAwesome)
      colorArchetype2 = "#32CD32"; // Verde claro
      textArchetype2 = "#000"; // Branco
    } else if (deck.archetype2 == "Arsenal") {
      symbolArchetype2 = '<i class="fa-solid fa-toolbox"></i>'; // Estrela (ícone colorido via FontAwesome)
      colorArchetype2 = "#A8B3B4"; // Prata claro
      textArchetype2 = "#000"; // Branco
    } else if (deck.archetype2 == "Supressão") {
      symbolArchetype2 = '<i class="fa-solid fa-ban"></i>'; // Mão controlando (ícone colorido via FontAwesome)
      colorArchetype2 = "#000000"; // Preto
      textArchetype2 = "#fff"; // Branco
    } else if (deck.archetype2 == "Aceleração") {
      symbolArchetype2 = '<i class="fa-solid fa-stopwatch"></i>'; // Mão controlando (ícone colorido via FontAwesome)
      colorArchetype2 = "#8B4513"; // Preto
      textArchetype2 = "#fff"; // Branco
    }

    badges =
      badges +
      '<span _ngcontent-ng-c2622191440="" class="badge rounded-pill mx-1 text-bg-secondary" ' +
      'style="color: #fff; background-color: #6C757D !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 7px;"> ' +
      '<i style="color: #FFD700; font-size: 12px;" class="fa-solid fa-star"></i> ' +
      deck.level +
      "</span>";

    badges =
      badges +
      '<span _ngcontent-ng-c2622191440="" class="badge rounded-pill mx-1 text-bg-secondary" ' +
      'style="color: ' +
      textStyle +
      "; background-color: " +
      colorStyle +
      ' !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 10.2833px;"> ' +
      symbolStyle +
      "&nbsp;" +
      " </span>";

    badges =
      badges +
      '<span class="badge rounded-pill mx-1 text-bg-secondary" ' +
      'style="color: ' +
      textArchetype +
      "; background-color: " +
      colorArchetype +
      " !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 10.2833px; border: " +
      borderArchetype +
      '"> ' +
      symbolArchetype +
      "&nbsp;" +
      " </span>";

    if (symbolArchetype2 != "") {
      badges =
        badges +
        '<span class="badge rounded-pill mx-1 text-bg-secondary" ' +
        'style="color: ' +
        textArchetype2 +
        "; background-color: " +
        colorArchetype2 +
        " !important;padding-top: 4px;padding-bottom: 4px;padding-right: 7px;padding-left: 10.2833px; border: " +
        borderArchetype2 +
        '"> ' +
        symbolArchetype2 +
        "&nbsp;" +
        " </span>";
    }

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

    row.addEventListener("click", (event) => {
      if (!event.target.classList.contains("copy-button")) {
        getDeckDetails(deck.number);
      }
    });

    row.style.cursor = "pointer";
    row.style.paddingLeft = "5px";
    row.style.paddingRight = "5px";

    row.classList.add(
      "col-xl-2",
      "col-lg-3",
      "col-md-6",
      "col-sm-6",
      "col-xs-6"
    );

    row.level = deck.level;

    rowsToAdd.push(row);
  });

  rowsToAdd.sort((a, b) => b.level - a.level);
  rowsToAdd.forEach((row) => {
    tableBody.appendChild(row);
  });

  renderPagination(page);
}

function renderPagination(currentPage) {
  const totalPages = Math.ceil(allDecks.length / CARDS_PER_PAGE);
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
