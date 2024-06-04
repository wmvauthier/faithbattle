const CARDS_PER_PAGE = 30; // Número de cards por página
let currentPage = 1; // Página atual
let cards = []; // Lista de todos os cards

document.addEventListener("DOMContentLoaded", async function () {
  let data = await getCards();
  let decks = await getDecks();

  data.forEach((card) => {
    card.ocurrences = getOccurrencesInDecks(card.number, decks);
  });

  cards = sortByStarsAndDate(data);

  generateTextFilterByProperty("name", "Nome", "Digite o Nome");
  generateTextFilterByProperty("text", "Text", "Digite o Texto da Carta");
  generateTextFilterByProperty("flavor", "Flavor", "Digite o Versículo");
  generateSelectFilterByProperty(cards, "type", "Tipo", "Tipo");
  generateSelectFilterByProperty(cards, "subtype", "SubTipo", "SubTipo");
  generateCategoryFilter(cards);
  generateSelectFilterByProperty(cards, "cost", "Custo", "Custo");
  generateEffectFilter(cards);
  generateSelectFilterByProperty(cards, "strength", "Força", "Força");
  generateSelectFilterByProperty(
    cards,
    "resistence",
    "Resistência",
    "Resistência"
  );
  generateSelectFilterByProperty(cards, "collection", "Coleção", "Coleção");

  const uniqueStars = Array.from(
    new Set(cards.map((item) => Math.floor(item.stars)))
  );
  const uniqueYears = Array.from(
    new Set(cards.map((item) => new Date(item.date).getFullYear()))
  );

  generateStarsFilter(uniqueStars, "ASC");
  generateYearFilter(uniqueYears, "DESC");
  generateSelectFilterByProperty(cards, "artist", "Artista", "Artista");

  renderCards(cards);
});

function generateSelectFilterByProperty(
  jsonData,
  property,
  prettyName,
  text,
  order
) {
  const filtersContainer = document.getElementById("filters");
  const currentSelectedFilters = getCurrentSelectedFilters();

  const uniqueValues = Array.from(
    new Set(
      jsonData.map((item) => {
        if (property === "stars") {
          return Math.floor(parseFloat(item[property]));
        } else if (property === "date") {
          return new Date(item[property]).getFullYear();
        } else if (item[property] != "") {
          return item[property];
        }
      })
    )
  ).filter(
    (value) => !Object.values(currentSelectedFilters).includes(String(value))
  ); // Exclude currently selected values

  uniqueValues.sort((a, b) => {
    if (order === "ASC") {
      return a - b;
    } else {
      return b - a;
    }
  });

  const select = document.createElement("select");

  select.setAttribute("name", property);
  select.setAttribute("prettyName", prettyName);
  select.setAttribute("id", `${property}Filter`);
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = text;
  defaultOption.value = "";
  select.appendChild(defaultOption);

  uniqueValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;

    if (property === "stars") {
      let starsHTML = "";
      for (let i = 0; i < value; i++) {
        starsHTML += "&#9733;"; // Estrela preenchida
      }
      for (let i = value; i < 5; i++) {
        starsHTML += "&#9734;"; // Estrela vazia
      }
      option.innerHTML = starsHTML;
    } else {
      option.text = value;
    }

    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter(property, value, prettyName);
      select.disabled = true;
    }
    filterResults(cards);
  });

  filtersContainer.appendChild(select);
}

function generateTextFilterByProperty(property, prettyName, placeholder) {
  const filtersContainer = document.getElementById("filters");

  const input = document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("name", property);
  input.setAttribute("prettyName", prettyName);
  input.setAttribute("id", `${property}Filter`);
  input.setAttribute("placeholder", placeholder);
  input.classList.add("mb-3", "mr-3", "custom-text-input");
  input.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      const value = input.value;
      if (value) {
        addSelectedFilter(property, value, prettyName);
        input.disabled = true;
        filterResults(cards);
      }
    }
  });

  filtersContainer.appendChild(input);
}
function generateCategoryFilter(jsonData) {
  const filtersContainer = document.getElementById("filters");
  const currentSelectedFilters = getCurrentSelectedFilters();
  const categoriesSet = new Set();

  // Itera sobre os dados para extrair todas as categorias únicas
  jsonData.forEach((item) => {
    const categories = item.categories.split(";");
    categories.forEach((category) => {
      categoriesSet.add(category.trim()); // Adiciona a categoria ao conjunto
    });
  });

  // Converte o conjunto de categorias de volta para um array
  const uniqueCategories = Array.from(categoriesSet).filter(
    (category) => !Object.values(currentSelectedFilters).includes(category)
  );

  // Cria o select e adiciona as opções com as categorias únicas
  const select = document.createElement("select");
  select.setAttribute("name", "categories");
  select.setAttribute("prettyName", "Categoria");
  select.setAttribute("id", `categoriesFilter`);
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Categoria";
  defaultOption.value = "";
  select.appendChild(defaultOption);
  uniqueCategories.forEach((category) => {
    const option = document.createElement("option");
    option.text = category;
    option.value = category;
    select.appendChild(option);
  });

  // Adiciona o evento de mudança ao select
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("categories", value, "Categoria");
      select.disabled = true;
    }
    filterResults(jsonData);
  });

  // Adiciona o select ao contêiner de filtros
  filtersContainer.appendChild(select);
}

function generateEffectFilter(jsonData) {
  const filtersContainer = document.getElementById("filters");
  const effectsSet = new Set();

  // Itera sobre os dados para extrair todas as categorias únicas
  jsonData.forEach((item) => {
    const effects = item.effects.split(";");
    effects.forEach((effect) => {
      effectsSet.add(effect.trim()); // Adiciona a categoria ao conjunto
    });
  });

  // Converte o conjunto de categorias de volta para um array
  const uniqueEffects = Array.from(effectsSet);

  // Cria o select e adiciona as opções com as categorias únicas
  const select = document.createElement("select");
  select.setAttribute("name", "effects");
  select.setAttribute("prettyName", "Efeito");
  select.setAttribute("id", `effectsFilter`);
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Efeitos";
  defaultOption.value = "";
  select.appendChild(defaultOption);
  uniqueEffects.forEach((effect) => {
    const option = document.createElement("option");
    option.text = effect;
    option.value = effect;
    select.appendChild(option);
  });

  // Adiciona o evento de mudança ao select
  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("effects", value, "Efeito");
      select.disabled = true;
    }
    filterResults(jsonData);
  });

  // Adiciona o select ao contêiner de filtros
  filtersContainer.appendChild(select);
}

function generateStarsFilter(uniqueStars, order = "DESC") {
  const filtersContainer = document.getElementById("filters");

  if (order === "ASC") {
    uniqueStars.sort();
  } else if (order === "DESC") {
    uniqueStars.sort((a, b) => b - a);
  }

  const select = document.createElement("select");
  select.setAttribute("name", "stars");
  select.setAttribute("prettyName", "Classificação");
  select.setAttribute("id", `starsFilter`);
  select.classList.add("mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Classificação";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  uniqueStars.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;

    let starsHTML = "";
    for (let i = 0; i < value; i++) {
      starsHTML += "&#9733;"; // Estrela preenchida
    }
    for (let i = value; i < 5; i++) {
      starsHTML += "&#9734;"; // Estrela vazia
    }
    option.innerHTML = starsHTML;

    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("stars", value, "Classificação");
      select.disabled = true;
    }
    filterResults(cards);
  });

  filtersContainer.appendChild(select);
}

function generateYearFilter(uniqueYears, order = "DESC") {
  const filtersContainer = document.getElementById("filters");

  if (order === "ASC") {
    uniqueYears.sort();
  } else if (order === "DESC") {
    uniqueYears.sort((a, b) => b - a);
  }

  const select = document.createElement("select");
  select.setAttribute("name", "date");
  select.setAttribute("prettyName", "Ano de Lançamento");
  select.setAttribute("id", `dateFilter`);
  select.classList.add("form-select", "mb-3", "mr-3", "custom-select-input");
  const defaultOption = document.createElement("option");
  defaultOption.text = "Ano de Lançamento";
  defaultOption.value = "";
  select.appendChild(defaultOption);

  uniqueYears.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.text = value;
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const value = select.value;
    if (value) {
      addSelectedFilter("date", value, "Ano de Lançamento");
      select.disabled = true;
    }
    filterResults(cards);
  });

  filtersContainer.appendChild(select);
}

function addSelectedFilter(property, value, prettyName) {
  const selectedFiltersContainer = document.getElementById("selected-filters");

  const filterTag = document.createElement("div");
  filterTag.className = "selected-filter";
  filterTag.setAttribute("data-property", property);
  filterTag.setAttribute("data-value", value);
  filterTag.innerText = `${prettyName}: ${value}`;

  filterTag.addEventListener("click", function () {
    removeSelectedFilter(property, value);
    filterResults(cards);
  });

  selectedFiltersContainer.appendChild(filterTag);
}

function removeSelectedFilter(property, value) {
  const selectedFiltersContainer = document.getElementById("selected-filters");
  const filterTag = selectedFiltersContainer.querySelector(
    `.selected-filter[data-property="${property}"][data-value="${value}"]`
  );

  if (filterTag) {
    filterTag.remove();
  }

  const select = document.getElementById(`${property}Filter`);
  if (select) {
    select.value = "";
    select.disabled = false;
  }
}

function filterResults(data) {
  const selectedFiltersContainer = document.getElementById("selected-filters");
  const filters = selectedFiltersContainer.querySelectorAll(".selected-filter");

  let filteredData = data;

  filters.forEach((filterTag) => {
    const property = filterTag.getAttribute("data-property");
    const value = filterTag.getAttribute("data-value");

    if (property === "effects") {
      filteredData = filteredData.filter((item) => {
        const effects = item.effects.split(";");
        return effects.includes(value);
      });
    } else if (property === "categories") {
      filteredData = filteredData.filter((item) => {
        const categories = item.categories.split(";");
        return categories.includes(value);
      });
    } else {
      filteredData = filteredData.filter((item) => {
        if (
          property === "name" ||
          property === "flavor" ||
          property === "text"
        ) {
          return item[property].toLowerCase().includes(value.toLowerCase());
        } else if (property === "stars") {
          return Math.floor(parseFloat(item[property])) === parseInt(value);
        } else if (property === "date") {
          return new Date(item[property]).getFullYear() === parseInt(value);
        } else {
          return item[property] == value;
        }
      });
    }
  });

  document.getElementById("filters").innerHTML = "";

  filteredData = sortByStarsAndDate(filteredData);

  generateTextFilterByProperty("name", "Nome", "Digite o Nome");
  generateTextFilterByProperty("text", "Text", "Digite o Texto da Carta");
  generateTextFilterByProperty("flavor", "Flavor", "Digite o Versículo");
  generateSelectFilterByProperty(filteredData, "type", "Tipo", "Tipo");
  generateSelectFilterByProperty(filteredData, "subtype", "SubTipo", "SubTipo");
  generateSelectFilterByProperty(filteredData, "cost", "Custo", "Custo");
  generateCategoryFilter(filteredData);
  generateEffectFilter(filteredData);
  generateSelectFilterByProperty(filteredData, "strength", "Força", "Força");
  generateSelectFilterByProperty(
    filteredData,
    "resistence",
    "Resistência",
    "Resistência"
  );
  generateSelectFilterByProperty(
    filteredData,
    "collection",
    "Coleção",
    "Coleção"
  );

  const uniqueStars = Array.from(
    new Set(filteredData.map((item) => Math.floor(item.stars)))
  ).filter(
    (star) => !Object.values(getCurrentSelectedFilters()).includes(String(star))
  );

  const uniqueYears = Array.from(
    new Set(filteredData.map((item) => new Date(item.date).getFullYear()))
  ).filter(
    (year) => !Object.values(getCurrentSelectedFilters()).includes(String(year))
  );

  generateStarsFilter(uniqueStars, "ASC");
  generateYearFilter(uniqueYears, "DESC");
  generateSelectFilterByProperty(filteredData, "artist", "Artista", "Artista");

  renderCards(filteredData);
}

function renderCards(cards) {
  const cardContainer = document.getElementById("products-container");
  cardContainer.innerHTML = "";

  const start = (currentPage - 1) * CARDS_PER_PAGE;
  const end = start + CARDS_PER_PAGE;
  const paginatedCards = cards.slice(start, end);

  paginatedCards.forEach((card) => {
    if (card.categories) {
      const categoriesArray = card.categories.split(";");

      const productItem = document.createElement("div");
      productItem.className = "col-lg-2 col-md-3 col-sm-3";
      productItem.setAttribute("onclick", `getCardDetails(${card.number})`);
      productItem.style.cursor = "pointer";

      const costCircledNumber = String.fromCharCode(10121 + card.cost); // Gerando o código do caractere circulado com base no custo do card

      productItem.innerHTML = `
      <div class="product__item">
        <div class="product__item__pic set-bg" style="background-image: url(${card.img});">
          <div class="ep">&#9733; ${card.stars}</div>
          <div class="comment">&#9923; ${card.ocurrences}</div>
          <div class="view">${card.collection}</div>
        </div>
        <div class="product__item__text">
          <ul>
            ${categoriesArray.map((category) => `<li>${category}</li>`).join(" ")}
          </ul>
          <h5>
            <a href="#">${costCircledNumber} ${card.name}</a>
            ${card.strength !== 0 && card.resistence !== 0 ? 
              `<a href="#" style="float:right;">&#9876;${card.strength} / &#10070;${card.resistence}</a>` : 
              ''
            }
          </h5>
        </div>
      </div>
    `;

      cardContainer.appendChild(productItem);
    }
  });

  createPagination(cards);
}

function getCurrentSelectedFilters() {
  const selectedFilters = {};
  const selectedFiltersContainer = document.getElementById("selected-filters");
  const filters = selectedFiltersContainer.querySelectorAll(".selected-filter");

  filters.forEach((filterTag) => {
    const property = filterTag.getAttribute("data-property");
    const value = filterTag.getAttribute("data-value");
    selectedFilters[property] = value;
  });

  return selectedFilters;
}

function createPagination(cards) {
  const paginationContainer = document.getElementById("pagination-container");
  paginationContainer.innerHTML = ""; // Limpa o contêiner de paginação

  const totalPages = Math.ceil(cards.length / CARDS_PER_PAGE);

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    pageButton.classList.add("pagination-button");
    if (i === currentPage) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", () => goToPage(i, cards));
    paginationContainer.appendChild(pageButton);
  }
}

function goToPage(pageNumber, cards) {
  currentPage = pageNumber;
  renderCards(cards); // Re-renderiza os cards da nova página
}
