// Função principal de criptografia, que depende de CryptoJS
async function criptografarDados() {

    console.log("criptografarDados()");

    // Coleta as informações necessárias
    const nomeUsuario = localStorage.getItem('nomeUsuario');
    const documentoUsuario = localStorage.getItem('documentoUsuario');
    const dataHora = new Date().toLocaleString('pt-BR', { format: 'DD/MM/YYYY HH:mm' });
    const palavraSeguranca = await fetchPalavraSeguranca(); // Busca da API Java

    // Concatena as informações com "||"
    let dados = `${nomeUsuario}||${documentoUsuario}||${dataHora}||${palavraSeguranca}`;

    // Criptografa a string concatenada (AES - chave secreta compartilhada)
    const chaveSecreta = "sua-chave-secreta"; // Defina uma chave secreta compartilhada
    let dadosCriptografados = CryptoJS.AES.encrypt(dados, chaveSecreta).toString();

    // Inverte os caracteres da string criptografada
    dadosCriptografados = dadosCriptografados.split('').reverse().join('');

    // Insere caracteres aleatórios nas posições especificadas pela API
    const posicoes = await fetchPosicoesInsercao(); // Array de posições
    dadosCriptografados = inserirCaracteresAleatorios(dadosCriptografados, posicoes);

    return dadosCriptografados;
}

// Funções auxiliares (fetchPalavraSeguranca, fetchPosicoesInsercao, inserirCaracteresAleatorios)...
// Defina as funções fetchPalavraSeguranca, fetchPosicoesInsercao e inserirCaracteresAleatorios conforme o exemplo anterior.

async function fetchPalavraSeguranca() {
    const response = await fetch('http://suaapi.com/palavra-seguranca');
    const data = await response.json();
    return data.palavra;
}

async function fetchPosicoesInsercao() {
    const response = await fetch('http://suaapi.com/posicoes');
    const data = await response.json();
    return data.posicoes;
}

function inserirCaracteresAleatorios(str, posicoes) {
    const caracteresAleatorios = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let novaStr = str;
    posicoes.forEach(pos => {
        const charAleatorio = caracteresAleatorios.charAt(Math.floor(Math.random() * caracteresAleatorios.length));
        novaStr = novaStr.slice(0, pos) + charAleatorio + novaStr.slice(pos);
    });
    return novaStr;
}

criptografarDados();
