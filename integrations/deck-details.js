let deck;

document.addEventListener("DOMContentLoaded", async function () {
  await waitForAllJSONs();

  let idSelectedDeck = localStorage.getItem("idSelectedDeck");
  let selectedDeckCommunity = localStorage.getItem("selectedDeckCommunity");

  if ((idSelectedDeck && idSelectedDeck > 0) || selectedDeckCommunity) {

    const selectedDeck =
      JSON.parse(selectedDeckCommunity) ||
      allDecks.find((element) => element.number == idSelectedDeck);

    if (selectedDeck) {
      const analysisAverages = await analyzeDecks(allDecks, null, null);
      const mergedArray = [...selectedDeck.cards];
      let cardsFromDeck = getCardsFromDeck(mergedArray, allCards);
      let info = await analyzeCards(cardsFromDeck, analysisAverages);

      const elementsToUpdate = {
        tag_deckName: selectedDeck.name,
        tag_deckStyle: selectedDeck.style,
        tag_deckLevel: selectedDeck.level,
        tag_deckCategory: getKeyWithMaxAbsoluteValue(info.categoriesCount),
        tag_deckArchetype: selectedDeck.archetype,
        tag_deckArchetype2: selectedDeck.archetype2,
        tag_deckSize: `${selectedDeck.cards.length}`,
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
        tag_deckQtdComparison: info.comparison.general.qtd,
        tag_deckMedCostComparison: info.comparison.general.cost,
        tag_deckStrengthComparison: info.comparison.general.strength,
        tag_deckResistanceComparison: info.comparison.general.resistance,
        tag_deckCostHeroComparison: info.comparison.hero.cost,
        tag_deckCostMiracleComparison: info.comparison.miracle.cost,
        tag_deckCostSinComparison: info.comparison.sin.cost,
        tag_deckCostArtifactComparison: info.comparison.artifact.cost,
        tag_deckQtdHeroComparison: info.comparison.hero.count,
        tag_deckQtdMiracleComparison: info.comparison.miracle.count,
        tag_deckQtdSinComparison: info.comparison.sin.count,
        tag_deckQtdArtifactComparison: info.comparison.artifact.count,
      };

      // Update elements in DOM
      Object.entries(elementsToUpdate).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
          element.textContent = value;
        }
      });

      Object.entries(comparisonElements).forEach(([key, value]) => {
        const element = document.getElementById(key);
        if (element) {
          const color = getComparisonColor(key, value);
          element.style.color = color;

          element.innerHTML =
            value === "higher"
              ? "&#9652;"
              : value === "lower"
              ? "&#9662;"
              : value === "equal"
              ? "&#8860;"
              : "";

          // Specific logic for comparison of deck size
          if (key === "tag_deckQtdComparison") {
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
      });

      generateCategoryItems(
        info.categoriesCount,
        info.comparison.categories,
        "categoriesContainer"
      );
      updateCardListDOM(cardsFromDeck);
      updateDeckListDOM(cardsFromDeck);
      updateMiniCards(allCards, selectedDeck.extra, "#extraDeckList");
      updateMiniCards(allCards, selectedDeck.sideboard, "#sideboardList");

      // renderGraph(cardsFromDeck); // Uncomment if needed
    } else {
      location.href = "./deck-meta.html";
    }
  } else {
    location.href = "./deck-meta.html";
  }
});

function generateCategoryItems(categoriesCount, averages, id) {
  const container = document.getElementById(id);
  const fragment = document.createDocumentFragment();

  const categoryArray = Object.entries(categoriesCount).sort(
    (a, b) => Math.abs(b[1]) - Math.abs(a[1])
  );

  categoryArray.forEach(([category, count]) => {
    const comparison = averages[category];
    const color = getComparisonColor(category, comparison);

    const input = createDivWithClass("custom-text-input category-item");
    input.style.fontSize = "1rem";
    input.innerHTML = `${category} : ${count} <span style="color:${color}"> ${
      comparison === "higher"
        ? "&#9650;"
        : comparison === "lower"
        ? "&#9660;"
        : "&#8860;"
    }</span>`;

    if (comparison === "higher") input.classList.add("green");
    else if (comparison === "lower") input.classList.add("red");

    fragment.appendChild(input);
  });

  container.appendChild(fragment);
}

function updateCardListDOM(cardsFromDeck) {
  const deckListContainer = document.querySelector("#deckCards");
  if (!deckListContainer) return;

  const fragment = document.createDocumentFragment();
  deckListContainer.innerHTML = "";

  // Adiciona a classe CSS para aplicar Grid
  deckListContainer.classList.add("deck-grid");

  cardsFromDeck.forEach((card) => {
    const cardElement = createDivWithClass("card-item");
    cardElement.style.cursor = "pointer";
    cardElement.innerHTML = `
      <img class="card__details set-card-bg" src="${card.img}" alt="${card.name}" />
      <div class="card__related__info"></div>
    `;

    cardElement.addEventListener("click", () => getCardDetails(card.number));
    fragment.appendChild(cardElement);
  });

  deckListContainer.appendChild(fragment);
}

function updateDeckListDOM(cardsFromDeck) {
  const deckListContainer = document.querySelector("#deckList");
  if (!deckListContainer) return;

  const result = removeDuplicatesAndCount(cardsFromDeck);
  const fragment = document.createDocumentFragment();
  deckListContainer.innerHTML = "";

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.color = "white"; // Definir o texto para branco

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  result.forEach((card) => {
    const row = document.createElement("tr");

    const countCell = createTableCell(`${card.count}x`);
    const nameCell = createTableCell(card.name);
    const valueCell = createTableCell(String.fromCharCode(10121 + card.cost));

    row.appendChild(countCell);
    row.appendChild(nameCell);
    row.appendChild(valueCell);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  fragment.appendChild(table);
  deckListContainer.appendChild(fragment);
}

function updateMiniCards(allCards, cardsList, id) {
  const similarCardsContainer = document.querySelector(id);
  if (!similarCardsContainer) return;

  const fragment = document.createDocumentFragment();
  similarCardsContainer.innerHTML = "";

  cardsList?.forEach((similarCard) => {
    const details = allCards.find((card) => card.number === similarCard);
    if (details) {
      const cardElement = createDivWithClass(
        "col-lg-2 col-md-2 col-sm-2 col-2 card__related__sidebar__view__item set-bg"
      );
      cardElement.style.cursor = "pointer";
      cardElement.style.padding = "0 5px";
      cardElement.innerHTML = `
        <img class="card__details set-card-bg" src="${details.img}" alt="${details.name}" />
        <div class="card__related__info"></div>
      `;

      cardElement.addEventListener("click", () =>
        getCardDetails(details.number)
      );
      fragment.appendChild(cardElement);
    }
  });

  similarCardsContainer.appendChild(fragment);
}

function removeDuplicatesAndCount(arr) {
  const map = new Map();

  arr.forEach((obj) => {
    if (map.has(obj.number)) {
      map.get(obj.number).count++;
    } else {
      map.set(obj.number, { ...obj, count: 1 });
    }
  });

  return Array.from(map.values());
}

// Função auxiliar para criar divs com classes
function createDivWithClass(className) {
  const div = document.createElement("div");
  div.className = className;
  return div;
}

// Função auxiliar para criar células da tabela
function createTableCell(content) {
  const cell = document.createElement("td");
  cell.textContent = content;
  cell.style.border = "none"; // Remove bordas
  cell.style.padding = "0"; // Remove preenchimento
  return cell;
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
