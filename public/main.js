const preencherCampos = (prefixo, dados) => {
    // Encontra os campos no HTML usando o prefixo
    document.getElementById(`${prefixo}_rua`).value = dados.logradouro;
    document.getElementById(`${prefixo}_bairro`).value = dados.bairro;
    document.getElementById(`${prefixo}_cidade`).value = dados.localidade;
    document.getElementById(`${prefixo}_uf`).value = dados.uf;

    // Mostra o bloco de campos de endereço que estava escondido
    document.getElementById(`${prefixo}_address_fields`).classList.remove('hidden');
};

const limparCampos = (prefixo) => {
    document.getElementById(`${prefixo}_rua`).value = '';
    document.getElementById(`${prefixo}_bairro`).value = '';
    document.getElementById(`${prefixo}_cidade`).value = '';
    document.getElementById(`${prefixo}_uf`).value = '';

    // Esconde o bloco de campos de endereço novamente
    document.getElementById(`${prefixo}_address_fields`).classList.add('hidden');
};

const buscarCep = async (event, prefixo) => {
    // Pega o valor do CEP digitado e remove caracteres não numéricos
    const cep = event.target.value.replace(/\D/g, '');
    
    // Verifica se o CEP tem 8 dígitos
    if (cep.length !== 8) {
        return; // Se não tiver, não faz nada
    }

    // Monta a URL da API ViaCEP
    const url = `https://viacep.com.br/ws/${cep}/json/`;

    try {
        // Faz a requisição para a API (o "pedido ao garçom")
        const response = await fetch(url);
        // Pega a resposta e a transforma em um objeto JavaScript
        const data = await response.json();

        // Verifica se a API retornou um erro (CEP não encontrado)
        if (data.erro) {
            alert('CEP não encontrado. Verifique e tente novamente.');
            limparCampos(prefixo);
        } else {
            // Se deu tudo certo, chama a função para preencher os campos
            preencherCampos(prefixo, data);
            // Foca no campo de número para o usuário digitar em seguida
            document.getElementById(`${prefixo}_numero`).focus();
        }
    } catch (error) {
        // Se a API estiver fora do ar ou houver outro erro
        alert('Não foi possível buscar o CEP. Tente novamente mais tarde.');
        console.error(error);
    }
};

// --- Adicionando os "Ouvintes de Eventos" ---
// Aqui dizemos ao JavaScript para executar a função buscarCep quando o usuário
// terminar de digitar o CEP e clicar fora do campo (evento 'blur').

// Para o Destinatário
document.getElementById('dest_cep').addEventListener('blur', (event) => {
    buscarCep(event, 'dest');
});

// Para o Remetente
document.getElementById('remet_cep').addEventListener('blur', (event) => {
    buscarCep(event, 'remet');
});