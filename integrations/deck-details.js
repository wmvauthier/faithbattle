let deck;
let decks;
let allCards;

document.addEventListener("DOMContentLoaded", async function () {
  let idSelectedDeck = localStorage.getItem("idSelectedDeck");

  if (idSelectedDeck && idSelectedDeck > 0) {
    allCards = await getCards();
    decks = await getDecks();

    const selectedDeck = decks.find(
      (element) => element.number == idSelectedDeck
    );

    if (selectedDeck) {
      deck = selectedDeck;

      const analysisAverages = await analyzeDecks(decks, null, null);
      let cardsFromDeck = getCardsFromDeck(selectedDeck.cards, allCards);
      let info = await analyzeCards(cardsFromDeck, analysisAverages);
      const cardsFromDeckWithExtra = selectedDeck.cards.concat(selectedDeck.extra); // Concatenando todas as listas de cards

      let sumStars = 0;

      cardsFromDeck.forEach(card =>{
        card.ocurrences = getOccurrencesInDecks(card.number, decks);
        card.ocurrencesInSides = getOccurrencesInSides(card.number, decks);
        card.stars = scaleToFive(
          (card.ocurrencesInSides / decks.length) * 100,
          card.ocurrencesInSides
        );
        sumStars += parseFloat(card.stars) / deck.cards.length;
      });

      // console.log(info);

      const elementsToUpdate = {
        tag_deckName: selectedDeck.name,

        tag_deckStyle: selectedDeck.style,
        tag_deckLevel: sumStars.toFixed(2),
        tag_deckCategory: getKeyWithMaxAbsoluteValue(info.categoriesCount),
        tag_deckEffect: selectedDeck.archetype,

        tag_deckSize: `${selectedDeck.cards.length} `,
        tag_deckSizeExtra: selectedDeck.extra.length,
        tag_deckMedCost: info.averageCost.toFixed(2),
        tag_deckStrength: info.averageStrength.toFixed(2),
        tag_deckResistence: info.averageResistance.toFixed(2),

        tag_deckQtdHero:
          info.heroCount > 0 ? info.heroCount : info.comparison.hero.count,
        tag_deckQtdMiracle:
          info.miracleCount > 0
            ? info.miracleCount
            : info.comparison.miracle.count,
        tag_deckQtdSin:
          info.sinCount > 0 ? info.sinCount : info.comparison.sin.count,
        tag_deckQtdArtifact:
          info.artifactCount > 0
            ? info.artifactCount
            : info.comparison.artifact.count,

        tag_deckCostHero:
          info.heroCount > 0
            ? info.averageCostHero.toFixed(2)
            : info.comparison.hero.cost,
        tag_deckCostMiracle:
          info.miracleCount > 0
            ? info.averageCostMiracle.toFixed(2)
            : info.comparison.miracle.cost,
        tag_deckCostSin:
          info.sinCount > 0
            ? info.averageCostSin.toFixed(2)
            : info.comparison.sin.cost,
        tag_deckCostArtifact:
          info.artifactCount > 0
            ? info.averageCostArtifact.toFixed(2)
            : info.comparison.artifact.cost,
      };

      const comparisonElements = {
        // Comparações Gerais
        tag_deckQtdComparison: info.comparison.general.qtd,
        tag_deckMedCostComparison: info.comparison.general.cost,
        tag_deckStrengthComparison: info.comparison.general.strength,
        tag_deckResistanceComparison: info.comparison.general.resistance,
        // Comparações de custo
        tag_deckCostHeroComparison: info.comparison.hero.cost,
        tag_deckCostMiracleComparison: info.comparison.miracle.cost,
        tag_deckCostSinComparison: info.comparison.sin.cost,
        tag_deckCostArtifactComparison: info.comparison.artifact.cost,
        // Comparações de quantidade
        tag_deckQtdHeroComparison: info.comparison.hero.count,
        tag_deckQtdMiracleComparison: info.comparison.miracle.count,
        tag_deckQtdSinComparison: info.comparison.sin.count,
        tag_deckQtdArtifactComparison: info.comparison.artifact.count,
      };

      for (const [key, value] of Object.entries(elementsToUpdate)) {
        const element = document.getElementById(key);
        if (element) {
          element.textContent = value;
        }
      }

      for (const [key, value] of Object.entries(comparisonElements)) {
        const element = document.getElementById(key);

        if (element) {
          const color = getComparisonColor(key, value);
          element.style.color = color;

          if (value === "higher") {
            element.innerHTML = "&#9652;";
          } else if (value === "lower") {
            element.innerHTML = "&#9662;";
          } else if (value === "equal") {
            element.innerHTML = "&#8860;";
          } else {
            element.innerHTML = "";
          }

          if (key == "tag_deckQtdComparison") {
            if (
              info.comparison.totalCards > deckMinimumSize &&
              info.comparison.totalCards < analysisAverages.averageQtd
            ) {
              element.style.color = "green";
            } else if (info.comparison.totalCards < deckMinimumSize) {
              element.style.color = "red";
            }
          }
        }
      }

      // console.log("Aggro -> Tempo -> Control -> Combo -> Midrange");

      // generateCategoryItems(
      //   info.effectsCount,
      //   info.comparison.effects,
      //   "effectsContainer"
      // );
      generateCategoryItems(
        info.categoriesCount,
        info.comparison.categories,
        "categoriesContainer"
      );

      updateCardListDOM(cardsFromDeck);
      updateDeckListDOM(cardsFromDeck);
      updateMiniCards(allCards, selectedDeck.extra, "#extraDeckList");
      updateMiniCards(allCards, selectedDeck.sideboard, "#sideboardList");

      // renderGraph(cardsFromDeck);
    } else {
      location.href = "./deck-list.html";
    }
  } else {
    location.href = "./deck-list.html";
  }
});

function generateCategoryItems(categoriesCount, averages, id) {
  const container = document.getElementById(id);

  const categoryArray = Object.entries(categoriesCount);

  categoryArray.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  categoryArray.forEach(([category, count]) => {
    const comparison = averages[category];
    const color = getComparisonColor(category, comparison);
    const input = document.createElement("div");

    if (comparison == "higher") {
      input.classList.add("green");
    } else if (comparison == "lower") {
      input.classList.add("red");
    }

    input.setAttribute(
      "style",
      "font-size: 1rem !important; margin-right: 0px !important; margin-bottom: 0px !important;"
    );
    input.classList.add("custom-text-input", "category-item");

    input.innerHTML = `${category} : ${count} <span style="color:${color}"> ${
      comparison === "higher"
        ? "&#9650;"
        : comparison === "lower"
        ? "&#9660;"
        : comparison === "equal"
        ? "&#8860;"
        : ""
    }</span>`;

    container.appendChild(input);
  });
}

function updateCardListDOM(cardsFromDeck) {
  const deckListContainer = document.querySelector("#deckCards");
  if (!deckListContainer) return;

  deckListContainer.innerHTML = "";

  cardsFromDeck.forEach((card) => {
    const cardElement = document.createElement("div");
    cardElement.className =
      "col-lg-1 col-md-2 col-sm-2 col-xs-2 col-2 card__related__sidebar__view__item set-bg";
    cardElement.style.cursor = "pointer";
    cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
        <div class="card__related__info">
        </div>
      `;

    cardElement.addEventListener("click", () => getCardDetails(card.number));

    cardElement.style = "padding-right:5px; padding-left: 5px;";

    deckListContainer.appendChild(cardElement);
  });
}

function updateDeckListDOM(cardsFromDeck) {
  const deckListContainer = document.querySelector("#deckList");
  if (!deckListContainer) return;

  const result = removeDuplicatesAndCount(cardsFromDeck);
  deckListContainer.innerHTML = "";

  // console.log(cardsFromDeck);
  // console.log(result);

  // Cria a tabela
  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.color = "white"; // Define o texto da tabela para branco

  // Cria o cabeçalho da tabela
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Cria o corpo da tabela
  const tbody = document.createElement("tbody");

  result.forEach((card) => {
    const row = document.createElement("tr");

    const countCell = document.createElement("td");
    countCell.textContent = card.count + "x";
    countCell.style.border = "1px solid black";
    countCell.style.padding = "8px";
    countCell.style.border = "none"; // Remove a borda
    countCell.style.padding = "0"; // Remove a borda

    const nameCell = document.createElement("td");
    nameCell.textContent = card.name;
    nameCell.style.border = "1px solid black";
    nameCell.style.padding = "8px";
    nameCell.style.border = "none"; // Remove a borda
    nameCell.style.padding = "0"; // Remove a borda

    const valueCell = document.createElement("td");
    valueCell.textContent = String.fromCharCode(10121 + card.cost);
    valueCell.style.border = "1px solid black";
    valueCell.style.padding = "8px";
    valueCell.style.border = "none"; // Remove a borda
    valueCell.style.padding = "0"; // Remove a borda

    row.appendChild(countCell);
    row.appendChild(nameCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  deckListContainer.appendChild(table);
}

function updateMiniCards(allCards, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;

  similarCardsContainer.innerHTML = "";

  cardsList.forEach((similarCard) => {
    const details = allCards.find((card) => card.number === similarCard);
    if (details) {
      const cardElement = document.createElement("div");
      cardElement.className =
        "col-lg-2 col-md-2 col-sm-2 col-2 card__related__sidebar__view__item set-bg";
      cardElement.style.cursor = "pointer";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info">
        </div>
      `;

      cardElement.addEventListener("click", () =>
        getCardDetails(details.number)
      );

      cardElement.style = "padding-right:5px; padding-left: 5px;";

      similarCardsContainer.appendChild(cardElement);
    }
  });
}

function removeDuplicatesAndCount(arr) {
  const map = new Map();

  arr.forEach((obj) => {
    if (map.has(obj.number)) {
      // Incrementa a contagem se o objeto já estiver no map
      map.get(obj.number).count++;
    } else {
      // Insere o objeto com count = 1 se for a primeira vez
      map.set(obj.number, { ...obj, count: 1 });
    }
  });

  // Converte o map de volta para um array
  return Array.from(map.values());
}

// function renderGraph(cardsFromDeck) {
//   // Dados do gráfico
//   const data = generateData(cardsFromDeck);

//   // Configurações do gráfico
//   const options = {
//     scales: {
//       xAxes: [
//         {
//           ticks: {
//             beginAtZero: true, // Começar o eixo X a partir do zero
//           },
//           scaleLabel: {
//             display: true,
//             labelString: "Custo", // Rótulo do eixo X
//           },
//         },
//       ],
//       yAxes: [
//         {
//           ticks: {
//             beginAtZero: true, // Começar o eixo Y a partir do zero
//             stepSize: 30, // Incremento do eixo Y
//           },
//           scaleLabel: {
//             display: true,
//             labelString: "Quantidade de Cartas", // Rótulo do eixo Y
//           },
//         },
//       ],
//     },
//   };

//   // Criação do gráfico
//   // const ctx = document.getElementById("myChart").getContext("2d");
//   // const myChart = new Chart(ctx, {
//   //   type: "bar", // Tipo de gráfico (barra)
//   //   data: data, // Dados do gráfico
//   //   options: options, // Configurações do gráfico
//   // });
// }
