document.addEventListener("DOMContentLoaded", function () {
  
  // Caminho para o arquivo JSON
  var jsonUrl = "data/cards.json";

  // Fetch para carregar o arquivo JSON
  fetch(jsonUrl)
    .then((response) => {
      // Verifique se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error("Erro ao carregar o arquivo JSON");
      }
      return response.json();
    })
    .then((data) => {
      // Selecione a div pelo id
      var div = document.getElementById("meuConteudo");

      // Verifique se a div foi encontrada e se o conteúdo está no JSON
      if (div && data.conteudo) {
        // Altere o conteúdo da div
        div.textContent = data.conteudo;
      }
    })
    .catch((error) => {
      console.error("Erro:", error);
    });

});
