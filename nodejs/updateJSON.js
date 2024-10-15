const fs = require("fs");
const {
  getOccurrencesInDecks,
  getOccurrencesInSides,
  getCards,
  getCardsFromDeck,
  calculateStarsFromDeck,
  scaleToFive,
} = require("../integrations/utils");

const decksObj = require("../data/decks.json");
const decks = "../data/decks.json";

const heroes = "../data/heroes.json";
const artifacts = "../data/artifacts.json";
const miracles = "../data/miracles.json";
const sins = "../data/sins.json";
const legendaries = "../data/legendary.json";

let cardsArray = [heroes, artifacts, miracles, sins, legendaries];

async function updateCards(cardsArray) {
  cardsArray.forEach((cards) => {
    fs.readFile(cards, "utf8", (err, data) => {
      if (err) {
        console.error("Erro ao ler o arquivo:", err);
        return;
      }

      let jsonData = JSON.parse(data);

      jsonData.forEach((card) => {
        card.ocurrences = getOccurrencesInDecks(card.number, decksObj);
        card.ocurrencesInSides = getOccurrencesInSides(card.number, decksObj);
        card.stars = scaleToFive(
          (card.ocurrencesInSides / decksObj.length) * 100,
          card.ocurrencesInSides
        );
      });

      const updatedJson = JSON.stringify(jsonData, null, 2);

      fs.writeFile(cards, updatedJson, "utf8", (err) => {
        if (err) {
          console.error("Erro ao salvar o arquivo:", err);
          return;
        }
        console.log("Arquivos JSON atualizados com sucesso!");
      });
      
    });
  });
}

async function updateDecks() {

  let allCards = [
    ...heroes,
    ...miracles,
    ...sins,
    ...artifacts,
    ...legendaries,
  ];

  fs.readFile(decks, "utf8", (err, data) => {

    if (err) {
      console.error("Erro ao ler o arquivo:", err);
      return;
    }

    let jsonData = JSON.parse(data);

    jsonData.forEach(async (deck) => {
      deck.level = await calculateStarsFromDeck(
        deck,
        allCards,
        decks,
        legendaries
      );
    });

    const updatedJson = JSON.stringify(jsonData, null, 2);

    fs.writeFile(decks, updatedJson, "utf8", (err) => {
      if (err) {
        console.error("Erro ao salvar o arquivo:", err);
        return;
      }
      console.log("Arquivos JSON atualizados com sucesso!");
    });

  });

}

async function main() {
  await updateCards(cardsArray);
  await updateDecks(decks);
}

main();
