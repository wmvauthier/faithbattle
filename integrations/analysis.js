let deckMinimumSize = 30;

function analyzeCards(cards, averages) {
  // Inicializa o objeto de resultados
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

  // Filtra cartas que não são "Herói de Fé" ou são lendários
  cards = cards.filter(card => card.type !== "Herói de Fé" || card.subtype !== "Lendário");

  // Itera sobre cada carta para calcular estatísticas
  cards.forEach(card => {
    if (Number.isInteger(card.cost)) {
      // Acumula custo médio
      result.averageCost += card.cost;

      // Atualiza contadores e custos totais de cada tipo de carta
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

      // Contagem de categorias
      card.categories.split(";").forEach(category => {
        if (category) {
          result.categoriesCount[category] = (result.categoriesCount[category] || 0) + 1;
        }
      });

      // Contagem de efeitos
      card.effects.split(";").forEach(effect => {
        if (effect) {
          result.effectsCount[effect] = (result.effectsCount[effect] || 0) + 1;
        }
      });
    }
  });

  // Calcula as médias se houver cartas
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
      result.averageCostArtifact = result.totalCostArtifact / result.artifactCount;
    }
  }

  // Realiza comparações com as médias, se fornecidas
  if (averages) {
    const categoriesEffectsComparison = compareCategoriesAndEffects(result, averages);

    result.comparison = {
      totalCards: totalCards,
      general: {
        qtd: totalCards > 0 ? compareValues(totalCards, averages.averageQtd) : "N/A",
        cost: totalCards > 0 ? compareValues(result.averageCost, averages.averageCost) : "N/A",
        strength: result.heroCount > 0 ? compareValues(result.averageStrength, averages.averageStrength) : "N/A",
        resistance: result.heroCount > 0 ? compareValues(result.averageResistance, averages.averageResistance) : "N/A",
      },
      hero: {
        cost: result.heroCount > 0 ? compareValues(result.averageCostHero, averages.averageCostHero) : "N/A",
        count: result.heroCount > 0 ? compareValues(result.heroCount, averages.averageQtdHero) : "N/A",
      },
      miracle: {
        cost: result.miracleCount > 0 ? compareValues(result.averageCostMiracle, averages.averageCostMiracle) : "N/A",
        count: result.miracleCount > 0 ? compareValues(result.miracleCount, averages.averageQtdMiracle) : "N/A",
      },
      sin: {
        cost: result.sinCount > 0 ? compareValues(result.averageCostSin, averages.averageCostSin) : "N/A",
        count: result.sinCount > 0 ? compareValues(result.sinCount, averages.averageQtdSin) : "N/A",
      },
      artifact: {
        cost: result.artifactCount > 0 ? compareValues(result.averageCostArtifact, averages.averageCostArtifact) : "N/A",
        count: result.artifactCount > 0 ? compareValues(result.artifactCount, averages.averageQtdArtifact) : "N/A",
      },
      categories: {},
      effects: {},
    };

    // Adiciona comparações de categories e effects ao objeto result.comparison
    for (const [category, comparisonResult] of Object.entries(categoriesEffectsComparison)) {
      if (result.categoriesCount.hasOwnProperty(category)) {
        result.comparison.categories[category] = comparisonResult;
      } else if (result.effectsCount.hasOwnProperty(category)) {
        result.comparison.effects[category] = comparisonResult;
      }
    }
  }

  // Remove os totais para deixar o resultado mais limpo
  delete result.totalCostHero;
  delete result.totalCostMiracle;
  delete result.totalCostSin;
  delete result.totalCostArtifact;
  delete result.totalStrength;
  delete result.totalResistance;

  return result;
}

// Função auxiliar para comparar valores
function compareValues(a, b) {
  if (a > b) return "higher";
  if (a < b) return "lower";
  return "equal";
}

async function analyzeDecks(decks, selectedStyle, selectedArchetype) {
  // Mapeamento dos tipos de cartas para tradução
  const typeTranslation = {
    "Herói de Fé": "Hero",
    "Milagre": "Miracle",
    "Pecado": "Sin",
    "Artefato": "Artifact"
  };

  // Filtrar decks com base no estilo e arquétipo selecionados
  const filteredDecks = decks.filter((deck) => {
    return (!selectedStyle || deck.style === selectedStyle) &&
           (!selectedArchetype || deck.archetype === selectedArchetype);
  });

  const totalResult = {
    totalDecks: filteredDecks.length,
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

  filteredDecks.forEach((deck) => {
    const cardsFromDeck = getCardsFromDeck(deck.cards, allCards);
    const deckAnalysis = analyzeCards(cardsFromDeck);
    
    // Contadores para custo e quantidade
    const costByType = {
      "Herói de Fé": { totalCost: 0, count: 0 },
      "Milagre": { totalCost: 0, count: 0 },
      "Pecado": { totalCost: 0, count: 0 },
      "Artefato": { totalCost: 0, count: 0 }
    };

    cardsFromDeck.forEach((card) => {
      const tipo = card.type;
      const custo = card.cost;

      if (costByType[tipo]) {
        costByType[tipo].totalCost += Number.isInteger(custo) ? custo : 0;
        costByType[tipo].count += 1;
      }
    });

    // Atualizando os custos médios com tradução
    for (const tipo in costByType) {
      if (costByType[tipo].count > 0) {
        const translatedType = typeTranslation[tipo];
        totalResult[`averageCost${translatedType}`] = costByType[tipo].totalCost / costByType[tipo].count;
      }
    }

    // Acumulando totais
    totalResult.averageCost += deckAnalysis.averageCost;
    totalResult.averageQtd += deck.cards.length;
    totalResult.averageQtdHero += deckAnalysis.heroCount;
    totalResult.averageQtdMiracle += deckAnalysis.miracleCount;
    totalResult.averageQtdSin += deckAnalysis.sinCount;
    totalResult.averageQtdArtifact += deckAnalysis.artifactCount;
    totalResult.averageStrength += deckAnalysis.averageStrength || 0;
    totalResult.averageResistance += deckAnalysis.averageResistance || 0;

    // Contando categorias e efeitos
    for (const category in deckAnalysis.categoriesCount) {
      totalResult.categoriesCount[category] = (totalResult.categoriesCount[category] || 0) + deckAnalysis.categoriesCount[category];
    }

    for (const effect in deckAnalysis.effectsCount) {
      totalResult.effectsCount[effect] = (totalResult.effectsCount[effect] || 0) + deckAnalysis.effectsCount[effect];
    }
  });

  if (totalResult.totalDecks > 0) {
    // Calculando médias
    totalResult.averageCost /= totalResult.totalDecks;
    totalResult.averageStrength /= totalResult.totalDecks;
    totalResult.averageResistance /= totalResult.totalDecks;
    totalResult.averageQtd /= totalResult.totalDecks;
    totalResult.averageQtdHero /= totalResult.totalDecks;
    totalResult.averageQtdMiracle /= totalResult.totalDecks;
    totalResult.averageQtdSin /= totalResult.totalDecks;
    totalResult.averageQtdArtifact /= totalResult.totalDecks;

    // Arredondando valores
    const floorProps = ['averageQtd', 'averageQtdHero', 'averageQtdMiracle', 'averageQtdSin', 'averageQtdArtifact'];
    floorProps.forEach(prop => {
      totalResult[prop] = Math.floor(totalResult[prop]);
    });

    // Calculando médias de categorias e efeitos
    totalResult.averageCategories = Object.entries(totalResult.categoriesCount).map(([name, count]) => ({
      name,
      media: Math.floor(count / totalResult.totalDecks),
    }));

    totalResult.averageEffects = Object.entries(totalResult.effectsCount).map(([name, count]) => ({
      name,
      media: Math.floor(count / totalResult.totalDecks),
    }));
  }

  // Remover chaves desnecessárias
  delete totalResult.totalDecks;
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

  // Criar mapas para médias de categorias e efeitos
  const averageCategoryMap = Object.fromEntries(
    averages.averageCategories.map(avg => [avg.name, avg.media])
  );

  const averageEffectMap = Object.fromEntries(
    averages.averageEffects.map(avg => [avg.name, avg.media])
  );

  // Comparar categorias
  Object.entries(result.categoriesCount).forEach(([category, count]) => {
    const averageCategory = averageCategoryMap[category];
    if (averageCategory !== undefined) {
      comparison[category] = compareValues(count, averageCategory);
    }
  });

  // Comparar efeitos
  Object.entries(result.effectsCount).forEach(([effect, count]) => {
    const averageEffect = averageEffectMap[effect];
    if (averageEffect !== undefined) {
      comparison[effect] = compareValues(count, averageEffect);
    }
  });

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
