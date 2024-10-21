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

async function updateCards(cardsArray) {
  for (const cards of cardsArray) {
    try {
      const data = await fs.promises.readFile(cards, "utf8");
      const jsonData = JSON.parse(data);

      jsonData.forEach((card) => {
        card.ocurrences = getOccurrencesInDecks(card.number, decksObj);
        card.ocurrencesInSides = getOccurrencesInSides(card.number, decksObj);
        card.stars = scaleToFive(
          (card.ocurrencesInSides / decksObj.length) * 100,
          card.ocurrencesInSides
        );
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
