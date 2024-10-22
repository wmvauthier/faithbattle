const fs = require("fs");
const {
  getOccurrencesInDecks,
  getOccurrencesInSides,
  scaleToFive,
} = require("../integrations/utils");
const decksObj = require("../data/decks.json");

const cardsArray = [
  "../data/heroes.json",
  "../data/artifacts.json",
  "../data/miracles.json",
  "../data/sins.json",
  "../data/legendary.json",
];

function calculateStylePercentages(decks) {
  const gaugeStyles = [
    {
      style: "Agressivo",
      backgroundColor: "#B22222",
      color: "#fff",
      icon: "fa-hand-back-fist",
    },
    {
      style: "Equilibrado",
      backgroundColor: "#FFD700",
      color: "#000",
      icon: "fa-hand-scissors",
    },
    {
      style: "Controlador",
      backgroundColor: "#1E90FF",
      color: "#fff",
      icon: "fa-hand",
    },
  ];

  // Contagem de cada estilo
  const styleCount = decks.reduce((acc, deck) => {
    acc[deck.style] = (acc[deck.style] || 0) + 1;
    return acc;
  }, {});

  const totalDecks = decks.length;

  // Calcular as porcentagens brutas e arredondadas
  const rawPercentages = gaugeStyles.map((gaugeStyle) => {
    const count = styleCount[gaugeStyle.style] || 0;
    const rawWidth = (count / totalDecks) * 100;
    return {
      ...gaugeStyle,
      rawWidth,
      roundedWidth: Math.round(rawWidth),
    };
  });

  // Calcular a soma das porcentagens arredondadas
  const totalRoundedWidth = rawPercentages.reduce(
    (sum, item) => sum + item.roundedWidth,
    0
  );

  // Diferença entre o total arredondado e 100
  let difference = 100 - totalRoundedWidth;

  // Ajuste final, distribuindo a diferença entre as seções
  return rawPercentages.map((section) => {
    const adjustment = difference > 0 ? 1 : -1; // Decide se deve adicionar ou subtrair
    const adjustedWidth =
      difference !== 0 ? section.roundedWidth + adjustment : section.roundedWidth;

    difference += -adjustment; // Diminui a diferença ajustada

    return {
      ...section,
      width: adjustedWidth,
    };
  });
}

function calculateArchetypePercentages(decks) {
  let gaugeArchetypes = [
    {
      archetype: "Batalha",
      backgroundColor: "#FF8C00",
      color: "#fff",
      icon: "fa-hand-fist",
    },
    {
      archetype: "Santificação",
      backgroundColor: "whitesmoke",
      color: "#000",
      icon: "fa-droplet",
    },
    {
      archetype: "Combo",
      backgroundColor: "#800080",
      color: "#fff",
      icon: "fa-gears",
    },
    {
      archetype: "Maravilhas",
      backgroundColor: "#32CD32",
      color: "#fff",
      icon: "fa-hat-wizard",
    },
    {
      archetype: "Supressão",
      backgroundColor: "#000000",
      color: "#fff",
      icon: "fa-ban",
    },
    // Você pode adicionar mais archetypes aqui
  ];

  // Contagem de cada archetype
  const archetypeCount = decks.reduce((acc, deck) => {
    if (gaugeArchetypes.some((ga) => ga.archetype === deck.archetype)) {
      // Verifica se o archetype existe no array gaugeSectionsArchetypes
      acc[deck.archetype] = (acc[deck.archetype] || 0) + 1;
    }
    return acc;
  }, {});

  const totalDecks = decks.length;

  // Calcular as porcentagens brutas
  const rawPercentages = gaugeArchetypes.map((gaugeArchetype) => {
    const count = archetypeCount[gaugeArchetype.archetype] || 0;
    const percentage = (count / totalDecks) * 100;
    return {
      ...gaugeArchetype,
      rawWidth: percentage,
      roundedWidth: Math.round(percentage), // Arredondar para números inteiros
    };
  });

  // Calcular a soma das porcentagens arredondadas
  const totalRoundedWidth = rawPercentages.reduce(
    (sum, item) => sum + item.roundedWidth,
    0
  );

  // Ajuste final se a soma das porcentagens não for 100
  const difference = 100 - totalRoundedWidth;

  // Distribuir a diferença entre as seções (se houver diferença)
  return rawPercentages.map((section, index) => {
    if (index < Math.abs(difference)) {
      // Se precisar adicionar/subtrair a diferença, ajuste
      return {
        ...section,
        width: section.roundedWidth + (difference > 0 ? 1 : -1), // Adiciona ou subtrai 1
      };
    }
    return { ...section, width: section.roundedWidth }; // Sem ajuste
  });
}

async function updateCards(cardsArray) {
  for (const cards of cardsArray) {
    try {
      const data = await fs.promises.readFile(cards, "utf8");
      const jsonData = JSON.parse(data);

      jsonData.forEach((card) => {
        let relatedDecks = [];

        decksObj.forEach((deck) => {
          // Verifica se o deck contém o número da carta
          if (
            deck.cards.includes(card.number) ||
            deck.extra.includes(card.number) ||
            deck.sideboard.includes(card.number)
          ) {
            // Se sim, adiciona o deck ao relatedDecks
            relatedDecks.push(deck);
          }
        });

        card.ocurrences = getOccurrencesInDecks(card.number, relatedDecks);
        card.ocurrencesInSides = getOccurrencesInSides(card.number, relatedDecks);
        card.stars = scaleToFive(
          (card.ocurrencesInSides / decksObj.length) * 100,
          card.ocurrencesInSides
        );

        card.stylePercentage = calculateStylePercentages(relatedDecks);
        card.archetypePercentage = calculateArchetypePercentages(relatedDecks);

      });

      const updatedJson = JSON.stringify(jsonData, null, 2);
      await fs.promises.writeFile(cards, updatedJson, "utf8");
      console.log("Arquivo JSON atualizado com sucesso:", cards);
    } catch (err) {
      console.error("Erro:", err);
    }
  }
}

async function main() {
  await updateCards(cardsArray);
}

main().catch(console.error);
