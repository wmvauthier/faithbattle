// Função principal de criptografia, que depende de CryptoJS
async function criptografarDados() {

    console.log("criptografarDados()");

    const nomeUsuario = localStorage.getItem('nomeUsuario');
    const documentoUsuario = localStorage.getItem('documentoUsuario');
    const dataHora = new Date().toLocaleString('pt-BR', { format: 'DD/MM/YYYY HH:mm' });
    const palavraSeguranca = await fetchPalavraSeguranca(); // Busca da API Java

    let dados = `${nomeUsuario}||${documentoUsuario}||${dataHora}||${palavraSeguranca}`;

    const chaveSecreta = "sua-chave-secreta"; // Defina uma chave secreta compartilhada
    let dadosCriptografados = CryptoJS.AES.encrypt(dados, chaveSecreta).toString();

    dadosCriptografados = dadosCriptografados.split('').reverse().join('');

    const posicoes = await fetchPosicoesInsercao();
    dadosCriptografados = inserirCaracteresAleatorios(dadosCriptografados, posicoes);

    return dadosCriptografados;
}

async function fetchPalavraSeguranca() {
    const response = await fetch('http://java.com/palavra-seguranca');
    const data = await response.json();
    return data.palavra;
}

async function fetchPosicoesInsercao() {
    const response = await fetch('http://java.com/posicoes');
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
