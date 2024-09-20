let deckMinimumSize = 30;

function analyzeCards(cards, averages) {
  const result = {
    heroCount: 0,
    miracleCount: 0,
    sinCount: 0,
    artifactCount: 0,
    totalCostHero: 0,
    totalCostMiracle: 0,
    totalCostSin: 0,
    totalCostArtifact: 0,
    totalStrength: 0,
    totalResistance: 0,
    categoriesCount: {},
    effectsCount: {},
    averageCost: 0,
  };

  cards = cards.filter(
    (card) => card.type !== "Herói de Fé" || card.subtype !== "Lendário"
  );

  cards.forEach((card) => {
    if (Number.isInteger(card.cost)) {
      result.averageCost += card.cost;
      switch (card.type) {
        case "Herói de Fé":
          if (card.subtype !== "Lendário") {
            result.heroCount++;
            result.totalCostHero += card.cost;
            result.totalStrength += card.strength;
            result.totalResistance += card.resistence;
          }
          break;
        case "Milagre":
          result.miracleCount++;
          result.totalCostMiracle += card.cost;
          break;
        case "Pecado":
          result.sinCount++;
          result.totalCostSin += card.cost;
          break;
        case "Artefato":
          result.artifactCount++;
          result.totalCostArtifact += card.cost;
          break;
      }

      card.categories.split(";").forEach((category) => {
        if (category) {
          result.categoriesCount[category] =
            (result.categoriesCount[category] || 0) + 1;
        }
      });

      card.effects.split(";").forEach((effect) => {
        if (effect) {
          result.effectsCount[effect] = (result.effectsCount[effect] || 0) + 1;
        }
      });
    }
  });

  const totalCards = cards.length;

  if (totalCards > 0) {
    result.averageCost /= totalCards;

    if (result.heroCount > 0) {
      result.averageCostHero = result.totalCostHero / result.heroCount;
      result.averageStrength = result.totalStrength / result.heroCount;
      result.averageResistance = result.totalResistance / result.heroCount;
    }
    if (result.miracleCount > 0) {
      result.averageCostMiracle = result.totalCostMiracle / result.miracleCount;
    }
    if (result.sinCount > 0) {
      result.averageCostSin = result.totalCostSin / result.sinCount;
    }
    if (result.artifactCount > 0) {
      result.averageCostArtifact =
        result.totalCostArtifact / result.artifactCount;
    }
  }

  if (averages) {
    const categoriesEffectsComparison = compareCategoriesAndEffects(
      result,
      averages
    );

    result.comparison = {
      totalCards: totalCards,
      general: {
        qtd:
          totalCards > 0
            ? totalCards > averages.averageQtd
              ? "higher"
              : totalCards < averages.averageQtd
              ? "lower"
              : "equal"
            : "N/A",
        cost:
          totalCards > 0
            ? result.averageCost > averages.averageCost
              ? "higher"
              : result.averageCost < averages.averageCost
              ? "lower"
              : "equal"
            : "N/A",
        strength:
          result.heroCount > 0
            ? result.averageStrength > averages.averageStrength
              ? "higher"
              : result.averageStrength < averages.averageStrength
              ? "lower"
              : "equal"
            : "N/A",
        resistance:
          result.heroCount > 0
            ? result.averageResistance > averages.averageResistance
              ? "higher"
              : result.averageResistance < averages.averageResistance
              ? "lower"
              : "equal"
            : "N/A",
      },
      hero: {
        cost:
          result.heroCount > 0
            ? result.averageCostHero > averages.averageCostHero
              ? "higher"
              : result.averageCostHero < averages.averageCostHero
              ? "lower"
              : "equal"
            : "N/A",
        count:
          result.heroCount > 0
            ? result.heroCount > averages.averageQtdHero
              ? "higher"
              : result.heroCount < averages.averageQtdHero
              ? "lower"
              : "equal"
            : "N/A",
      },
      miracle: {
        cost:
          result.miracleCount > 0
            ? result.averageCostMiracle > averages.averageCostMiracle
              ? "higher"
              : result.averageCostMiracle < averages.averageCostMiracle
              ? "lower"
              : "equal"
            : "N/A",
        count:
          result.miracleCount > 0
            ? result.miracleCount > averages.averageQtdMiracle
              ? "higher"
              : result.miracleCount < averages.averageQtdMiracle
              ? "lower"
              : "equal"
            : "N/A",
      },
      sin: {
        cost:
          result.sinCount > 0
            ? result.averageCostSin > averages.averageCostSin
              ? "higher"
              : result.averageCostSin < averages.averageCostSin
              ? "lower"
              : "equal"
            : "N/A",
        count:
          result.sinCount > 0
            ? result.sinCount > averages.averageQtdSin
              ? "higher"
              : result.sinCount < averages.averageQtdSin
              ? "lower"
              : "equal"
            : "N/A",
      },
      artifact: {
        cost:
          result.artifactCount > 0
            ? result.averageCostArtifact > averages.averageCostArtifact
              ? "higher"
              : result.averageCostArtifact < averages.averageCostArtifact
              ? "lower"
              : "equal"
            : "N/A",
        count:
          result.artifactCount > 0
            ? result.artifactCount > averages.averageQtdArtifact
              ? "higher"
              : result.artifactCount < averages.averageQtdArtifact
              ? "lower"
              : "equal"
            : "N/A",
      },
      categories: {},
      effects: {},
    };

    // Adiciona comparações de categories e effects ao objeto result.comparison
    for (const [category, comparisonResult] of Object.entries(
      categoriesEffectsComparison
    )) {
      if (result.categoriesCount.hasOwnProperty(category)) {
        result.comparison.categories[category] = comparisonResult;
      } else if (result.effectsCount.hasOwnProperty(category)) {
        result.comparison.effects[category] = comparisonResult;
      }
    }
  }

  delete result.totalCostHero;
  delete result.totalCostMiracle;
  delete result.totalCostSin;
  delete result.totalCostArtifact;
  delete result.totalStrength;
  delete result.totalResistance;

  return result;
}

async function analyzeDecks(decks, selectedStyle, selectedArchetype) {
  let allCards = await getCards();

  decks = decks.filter((deck) => {
    let match = true;
    if (selectedStyle) {
      match = match && deck.style === selectedStyle;
    }
    if (selectedArchetype) {
      match = match && deck.archetype === selectedArchetype;
    }
    return match;
  });

  const totalResult = {
    totalDecks: decks.length,

    averageStrength: 0,
    averageResistance: 0,

    averageCost: 0,
    averageCostHero: 0,
    averageCostMiracle: 0,
    averageCostSin: 0,
    averageCostArtifact: 0,

    averageQtd: 0,
    averageQtdHero: 0,
    averageQtdMiracle: 0,
    averageQtdSin: 0,
    averageQtdArtifact: 0,

    categoriesCount: {},
    effectsCount: {},

    averageCategories: [],
    averageEffects: [],
  };

  decks.forEach((deck) => {
    let cardsFromDeck = getCardsFromDeck(deck.cards, allCards);
    const deckAnalysis = analyzeCards(cardsFromDeck);

    const costByType = {};

    cardsFromDeck.forEach((objeto) => {
      const tipo = objeto.type;
      const custo = objeto.cost;

      if (!costByType[tipo]) {
        costByType[tipo] = {
          cards: [],
          custoMedio: 0,
        };
      }

      costByType[tipo].cards.push(objeto);
      if (Number.isInteger(custo)) {
        costByType[tipo].custoMedio += custo;
      }
    });

    for (const tipo in costByType) {
      const totalCards = costByType[tipo].cards.length;
      costByType[tipo].custoMedio /= totalCards;
    }

    if (Object.keys(costByType).length > 0) {
      const types = ["Herói de Fé", "Milagre", "Pecado", "Artefato"];

      const typePropertyMap = {
        "Herói de Fé": "averageCostHero",
        Milagre: "averageCostMiracle",
        Pecado: "averageCostSin",
        Artefato: "averageCostArtifact",
      };

      types.forEach((type) => {
        if (costByType[type]) {
          const averageCost = costByType[type].custoMedio;
          const propertyName = typePropertyMap[type];
          totalResult[propertyName] = averageCost;
        }
      });
    }

    totalResult.averageCost += deckAnalysis.averageCost;

    totalResult.averageQtd += deck.cards.length ? deck.cards.length : 0;
    totalResult.averageQtdHero += deckAnalysis.heroCount;
    totalResult.averageQtdMiracle += deckAnalysis.miracleCount;
    totalResult.averageQtdSin += deckAnalysis.sinCount;
    totalResult.averageQtdArtifact += deckAnalysis.artifactCount;

    totalResult.averageStrength += deckAnalysis.averageStrength
      ? deckAnalysis.averageStrength
      : 0;
    totalResult.averageResistance += deckAnalysis.averageResistance
      ? deckAnalysis.averageResistance
      : 0;

    for (const category in deckAnalysis.categoriesCount) {
      totalResult.categoriesCount[category] =
        (totalResult.categoriesCount[category] || 0) +
        deckAnalysis.categoriesCount[category];
    }

    for (const effect in deckAnalysis.effectsCount) {
      totalResult.effectsCount[effect] =
        (totalResult.effectsCount[effect] || 0) +
        deckAnalysis.effectsCount[effect];
    }
  });

  if (totalResult.totalDecks > 0) {
    totalResult.averageCost /= totalResult.totalDecks;
    totalResult.averageStrength /= totalResult.totalDecks;
    totalResult.averageResistance /= totalResult.totalDecks;

    totalResult.averageQtd /= totalResult.totalDecks;
    totalResult.averageQtdHero /= totalResult.totalDecks;
    totalResult.averageQtdMiracle /= totalResult.totalDecks;
    totalResult.averageQtdSin /= totalResult.totalDecks;
    totalResult.averageQtdArtifact /= totalResult.totalDecks;

    totalResult.averageQtd = Math.round(totalResult.averageQtd);
  }

  totalResult.averageCategories = Object.entries(
    totalResult.categoriesCount
  ).map(([name, count]) => ({
    name,
    media: Math.floor(count / totalResult.totalDecks),
  }));  

  totalResult.averageEffects = Object.entries(totalResult.effectsCount).map(
    ([name, count]) => ({
      name,
      media: Math.round(count / totalResult.totalDecks),
    })
  );

  delete totalResult.totalDecks;
  delete totalResult.heroCount;
  delete totalResult.miracleCount;
  delete totalResult.sinCount;
  delete totalResult.artifactCount;
  delete totalResult.categoriesCount;
  delete totalResult.effectsCount;

  return totalResult;
}

function generateData(cards) {
  // Inicializa arrays para armazenar os custos e as quantidades de cartas
  var labels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "X"];
  var data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // Loop através de todas as cartas
  cards.forEach(function (card) {
    // Obtém o custo da carta
    var cost = card.cost;

    // Verifica se o custo já existe no array de rótulos
    var index = labels.indexOf(cost);
    if (index === -1) {
      // Se o custo ainda não estiver no array, adiciona-o
      labels.push(cost);
      // Inicializa a contagem de cartas para esse custo
      data.push(1);
    } else {
      // Se o custo já estiver no array, incrementa a contagem de cartas para esse custo
      data[index]++;
    }
  });

  return {
    labels: labels.map((label) => `Custo ${label}`), // Converte os rótulos para strings
    datasets: [
      {
        label: "Número de Cartas",
        data: data, // Dados gerados para as barras
        backgroundColor: "#e53637", // Cor de fundo das barras
        borderColor: "#e53637", // Cor da borda das barras
        borderWidth: 1, // Largura da borda das barras
      },
    ],
  };
}

function compareCategoriesAndEffects(result, averages) {
  const comparison = {};

  for (const [category, count] of Object.entries(result.categoriesCount)) {
    const averageCategory = averages.averageCategories.find(
      (avg) => avg["name"] === category
    );
    if (averageCategory) {
      comparison[category] = compareValues(count, averageCategory["media"]);
    }
  }

  for (const [effect, count] of Object.entries(result.effectsCount)) {
    const averageEffect = averages.averageEffects.find(
      (avg) => avg["name"] === effect
    );
    if (averageEffect) {
      comparison[effect] = compareValues(count, averageEffect["media"]);
    }
  }

  return comparison;
}

function compareValues(actual, average) {
  if (actual > average) {
    return "higher";
  } else if (actual < average) {
    return "lower";
  } else {
    return "equal";
  }
}

function getComparisonColor(key, value) {
  const comparisonColors = {
    general: {
      qtd: { higher: "red", lower: "green", equal: "gray" },
      cost: { higher: "red", lower: "green", equal: "gray" },
      strength: { higher: "green", lower: "red", equal: "gray" },
      resistance: { higher: "green", lower: "red", equal: "gray" },
    },
    hero: {
      cost: { higher: "red", lower: "green", equal: "gray" },
      count: { higher: "green", lower: "red", equal: "gray" },
    },
    miracle: {
      cost: { higher: "red", lower: "green", equal: "gray" },
      count: { higher: "green", lower: "red", equal: "gray" },
    },
    sin: {
      cost: { higher: "red", lower: "green", equal: "gray" },
      count: { higher: "green", lower: "red", equal: "gray" },
    },
    artifact: {
      cost: { higher: "red", lower: "green", equal: "gray" },
      count: { higher: "green", lower: "red", equal: "gray" },
    },
  };

  const keyMap = {
    tag_deckQtdComparison: ["general", "qtd"],
    tag_deckMedCostComparison: ["general", "cost"],
    tag_deckStrengthComparison: ["general", "strength"],
    tag_deckResistanceComparison: ["general", "resistance"],
    tag_deckCostHeroComparison: ["hero", "cost"],
    tag_deckQtdHeroComparison: ["hero", "count"],
    tag_deckCostMiracleComparison: ["miracle", "cost"],
    tag_deckQtdMiracleComparison: ["miracle", "count"],
    tag_deckCostSinComparison: ["sin", "cost"],
    tag_deckQtdSinComparison: ["sin", "count"],
    tag_deckCostArtifactComparison: ["artifact", "cost"],
    tag_deckQtdArtifactComparison: ["artifact", "count"],
  };

  const [category, type] = keyMap[key] || [];

  if (
    category &&
    type &&
    comparisonColors[category] &&
    comparisonColors[category][type]
  ) {
    return comparisonColors[category][type][value];
  } else if (value == "higher" || value == "lower" || value == "equal") {
    if (value == "higher") {
      return "green";
    }
    if (value == "lower") {
      return "red";
    }
    if (value == "equal") {
      return "gray";
    }
  }

  return "black"; // Default color if no match found
}
