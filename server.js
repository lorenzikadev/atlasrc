// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000; 

// --- VARIÁVEIS DE DADOS (Simulação de Banco de Dados) ---
const produtosCadastrados = []; 
const propostasCadastradas = []; 

// NOVO: Objeto para armazenar dados da empresa
let dadosDaEmpresa = {
    cnpj: "00.000.000/0001-00",
    logoUrl: "", // Vamos salvar a URL da imagem do logo
    nomeEmpresa: "SRC Centrífugas",
    enderecoRua: "Rua Exemplo",
    enderecoNumero: "123",
    enderecoBairro: "Bairro Teste",
    enderecoComplemento: "Sala 10",
    nomeFantasia: "SRC Centrífugas",
    razaoSocial: "SRC Centrífugas LTDA ME",
    inscricaoEstadual: "123.456.789.112",
    atividadePrincipal: "Manutenção e Reparação",
    email: "contato@src.com",
    site: "www.src.com.br",
    telefone: "(19) 99999-9999"
};
// --- FIM VARIÁVEIS ---


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// --- LÓGICA DE PRODUTOS ---
app.post('/cadastrar-produto', (req, res) => {
    let produtoData = req.body;
    if (produtoData.id !== undefined && produtoData.id !== null && produtoData.id !== "") {
        const id = parseInt(produtoData.id);
        const index = produtosCadastrados.findIndex(p => p.id === id);
        if (index !== -1) {
            const dataCadastroOriginal = produtosCadastrados[index].dataCadastro;
            produtosCadastrados[index] = {
                ...produtosCadastrados[index],
                ...produtoData, 
                dataCadastro: dataCadastroOriginal,
                id: id 
            };
            console.log(`Produto ID ${id} atualizado.`);
            return res.status(200).json({ message: 'Produto atualizado com sucesso!'}); 
        } else {
            return res.status(404).json({ message: 'Erro: Produto não encontrado.' });
        }
    } else {
        produtoData.dataCadastro = new Date().toLocaleString('pt-BR'); 
        produtoData.dataUltimaAlteracao = produtoData.dataCadastro;
        produtoData.id = produtosCadastrados.length; 
        produtosCadastrados.push(produtoData); 
        console.log('Novo produto cadastrado.');
        return res.status(201).json({ message: 'Produto cadastrado com sucesso!'}); 
    }
});
app.get('/api/produtos', (req, res) => {
    res.json(produtosCadastrados); 
});
app.get('/api/produtos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const produto = produtosCadastrados.find(p => p.id === id); 
    if (produto) {
        res.json(produto);
    } else {
        res.status(404).json({ message: 'Produto não encontrado.' });
    }
});
// --- FIM: LÓGICA DE PRODUTOS ---

// --- LÓGICA DE PROPOSTAS ---
app.post('/cadastrar-proposta', (req, res) => {
    let propostaData = req.body;
    if (propostaData.id !== undefined && propostaData.id !== null && propostaData.id !== "") {
        const id = parseInt(propostaData.id);
        const index = propostasCadastradas.findIndex(p => p.id === id);
        if (index !== -1) {
            const dataCadastroOriginal = propostasCadastradas[index].dataCadastro;
            propostasCadastradas[index] = {
                ...propostasCadastradas[index], 
                ...propostaData, 
                dataCadastro: dataCadastroOriginal,
                id: id
            };
            console.log(`Proposta ID ${id} atualizada.`);
            return res.status(200).json({ message: 'Proposta atualizada com sucesso!'});
        } else {
            return res.status(404).json({ message: 'Erro: Proposta não encontrada.' });
        }
    } else {
        propostaData.dataCadastro = new Date().toLocaleString('pt-BR');
        propostaData.dataUltimaAlteracao = propostaData.dataCadastro;
        propostaData.id = propostasCadastradas.length; 
        propostaData.status = 'ativa'; 
        propostasCadastradas.push(propostaData);
        console.log('Nova proposta cadastrada.');
        return res.status(201).json({ message: 'Proposta cadastrada com sucesso!'});
    }
});
app.get('/api/propostas', (req, res) => {
    res.json(propostasCadastradas);
});
app.get('/api/propostas/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const proposta = propostasCadastradas.find(p => p.id === id);
    if (proposta) {
        res.json(proposta);
    } else {
        res.status(404).json({ message: 'Proposta não encontrada.' });
    }
});
app.post('/api/propostas/concluir/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = propostasCadastradas.findIndex(p => p.id === id);
    if (index !== -1) {
        propostasCadastradas[index].status = 'concluida';
        propostasCadastradas[index].dataConclusao = new Date(); 
        console.log(`Proposta ID ${id} marcada como concluída.`);
        res.status(200).json({ message: 'Proposta concluída!' });
    } else {
        res.status(404).json({ message: 'Proposta não encontrada.' });
    }
});
app.get('/api/dashboard/vendas-stats', (req, res) => {
    let vendasMesAtualUSD = 0;
    let vendasMesAnteriorUSD = 0;
    let concluidosMesCount = 0;
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoDoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    for (const proposta of propostasCadastradas) {
        if (proposta.status === 'concluida' && proposta.dataConclusao) {
            const dataConclusao = new Date(proposta.dataConclusao);
            const valor = parseFloat(proposta.valor_total_usd) || 0;
            if (dataConclusao.getMonth() === mesAtual && dataConclusao.getFullYear() === anoAtual) {
                vendasMesAtualUSD += valor;
                concluidosMesCount++;
            }
            else if (dataConclusao.getMonth() === mesAnterior && dataConclusao.getFullYear() === anoDoMesAnterior) {
                vendasMesAnteriorUSD += valor;
            }
        }
    }
    res.json({
        vendasMesAtualUSD,
        vendasMesAnteriorUSD,
        concluidosMesCount
    });
});
// --- FIM: LÓGICA DE PROPOSTAS ---

// --- NOVO: LÓGICA DE CONFIGURAÇÕES DA EMPRESA ---
app.get('/api/empresa', (req, res) => {
    // Retorna os dados da empresa (que estão na variável global)
    res.json(dadosDaEmpresa);
});

app.post('/api/empresa', (req, res) => {
    const novosDados = req.body;

    // Mescla os dados antigos com os novos dados recebidos
    dadosDaEmpresa = { ...dadosDaEmpresa, ...novosDados };
    
    console.log("Dados da empresa atualizados:", dadosDaEmpresa);
    res.status(200).json({ message: 'Dados da empresa salvos com sucesso!' });
});
// --- FIM: LÓGICA DE CONFIGURAÇÕES ---


// --- ROTAS PRINCIPAIS ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'DEV001' && password === 'DEV002') {
        res.json({ success: true });
    } else {
        // Erro "M" removido aqui
        res.json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});