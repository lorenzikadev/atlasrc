const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000; 

// --- BANCO DE DADOS EM MEMÓRIA (Produção vs Teste) ---
const db = {
    producao: {
        produtos: [],
        propostas: [],
        clientes: []
    },
    teste: {
        produtos: [], // Dados daqui somem se reiniciar o server, mas ficam separados da produção
        propostas: [],
        clientes: []    
    }
};

// Dados da Empresa (Aba Geral)
let dadosDaEmpresa = {
    cnpj: "00.000.000/0001-00",
    logoUrl: "", 
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

// Configurações de Cadastro (Aba Cadastro)
let configuracoesCadastro = {
    avisoEmailAtivo: false,
    emailNotificacao: "",
    permissaoPadrao: "funcionario", 
    ambienteTesteAtivo: false
};

// Configurações Operacionais (Aba Operacional)
let configuracoesOperacional = {
    validadePadrao: 15,
    numeracaoAuto: false
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 

// --- HELPER: Selecionar Contexto (Produção ou Teste) ---
// Verifica se o frontend enviou o header 'x-test-env'
const getContext = (req) => {
    const isTest = req.headers['x-test-env'] === 'true';
    return isTest ? db.teste : db.producao;
};

// --- LÓGICA DE PRODUTOS ---
app.post('/cadastrar-produto', (req, res) => {
    const context = getContext(req); // Seleciona o array correto
    let produtoData = req.body;

    // Log de Notificação por E-mail (Feature Solicitada)
    // Só envia se estiver ativado E se for ambiente de produção (opcional, aqui envia em ambos)
    if (configuracoesCadastro.avisoEmailAtivo && configuracoesCadastro.emailNotificacao) {
        console.log(`[EMAIL] 📧 Enviando notificação de cadastro para: ${configuracoesCadastro.emailNotificacao} | Produto: ${produtoData.nome}`);
    }

    if (produtoData.id !== undefined && produtoData.id !== null && produtoData.id !== "") {
        // Edição
        const id = parseInt(produtoData.id);
        const index = context.produtos.findIndex(p => p.id === id);
        if (index !== -1) {
            const dataCadastroOriginal = context.produtos[index].dataCadastro;
            context.produtos[index] = {
                ...context.produtos[index],
                ...produtoData, 
                dataCadastro: dataCadastroOriginal,
                id: id 
            };
            return res.status(200).json({ message: 'Produto atualizado com sucesso!'}); 
        } else {
            return res.status(404).json({ message: 'Erro: Produto não encontrado.' });
        }
    } else {
        // Novo Cadastro
        produtoData.dataCadastro = new Date().toLocaleString('pt-BR'); 
        produtoData.dataUltimaAlteracao = produtoData.dataCadastro;
        produtoData.id = context.produtos.length + 1; // ID sequencial simples
        context.produtos.push(produtoData); 
        
        console.log(`Novo produto cadastrado no ambiente: ${req.headers['x-test-env'] === 'true' ? 'TESTE' : 'PRODUÇÃO'}`);
        return res.status(201).json({ message: 'Produto cadastrado com sucesso!'}); 
    }
});

app.get('/api/produtos', (req, res) => { 
    const context = getContext(req);
    res.json(context.produtos); 
});

app.get('/api/produtos/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const produto = context.produtos.find(p => p.id === id); 
    if (produto) { res.json(produto); } else { res.status(404).json({ message: 'Produto não encontrado.' }); }
});

// --- LÓGICA DE PROPOSTAS ---
app.post('/cadastrar-proposta', (req, res) => {
    const context = getContext(req);
    let propostaData = req.body;

    if (propostaData.id !== undefined && propostaData.id !== null && propostaData.id !== "") {
        const id = parseInt(propostaData.id);
        const index = context.propostas.findIndex(p => p.id === id);
        if (index !== -1) {
            const dataCadastroOriginal = context.propostas[index].dataCadastro;
            context.propostas[index] = {
                ...context.propostas[index], 
                ...propostaData, 
                dataCadastro: dataCadastroOriginal,
                id: id
            };
            return res.status(200).json({ message: 'Proposta atualizada com sucesso!'});
        } else {
            return res.status(404).json({ message: 'Erro: Proposta não encontrada.' });
        }
    } else {
        propostaData.dataCadastro = new Date().toLocaleString('pt-BR');
        propostaData.dataUltimaAlteracao = propostaData.dataCadastro;
        propostaData.id = context.propostas.length + 1; 
        propostaData.status = 'ativa'; 
        context.propostas.push(propostaData);
        return res.status(201).json({ message: 'Proposta cadastrada com sucesso!'});
    }
});

app.get('/api/propostas', (req, res) => { 
    const context = getContext(req);
    res.json(context.propostas); 
});

app.get('/api/propostas/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const proposta = context.propostas.find(p => p.id === id);
    if (proposta) { res.json(proposta); } else { res.status(404).json({ message: 'Proposta não encontrada.' }); }
});

app.post('/api/propostas/concluir/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const index = context.propostas.findIndex(p => p.id === id);
    if (index !== -1) {
        context.propostas[index].status = 'concluida';
        context.propostas[index].dataConclusao = new Date(); 
        res.status(200).json({ message: 'Proposta concluída!' });
    } else {
        res.status(404).json({ message: 'Proposta não encontrada.' });
    }
});

// --- LÓGICA DE CLIENTES E FORNECEDORES ---
app.post('/cadastrar-cliente', (req, res) => {
    const context = getContext(req);
    let clienteData = req.body;
    
    // Gera ID e Data
    clienteData.id = context.clientes.length + 1;
    clienteData.dataCadastro = new Date().toLocaleString('pt-BR');
    
    context.clientes.push(clienteData);
    console.log(`Novo ${clienteData.tipo} cadastrado: ${clienteData.nome}`);
    
    res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
});

app.get('/api/clientes', (req, res) => { 
    const context = getContext(req);
    res.json(context.clientes); 
});

app.delete('/api/clientes/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const index = context.clientes.findIndex(c => c.id === id);
    
    if (index !== -1) {
        context.clientes.splice(index, 1); // Remove do array
        res.status(200).json({ message: 'Cliente removido com sucesso!' });
    } else {
        res.status(404).json({ message: 'Cliente não encontrado.' });
    }
});

// --- DASHBOARD (Calcula com base no contexto) ---
app.get('/api/dashboard/vendas-stats', (req, res) => {
    const context = getContext(req);
    let vendasMesAtualUSD = 0;
    let vendasMesAnteriorUSD = 0;
    let concluidosMesCount = 0;
    
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoDoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

    for (const proposta of context.propostas) {
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
    res.json({ vendasMesAtualUSD, vendasMesAnteriorUSD, concluidosMesCount });
});

// --- CONFIGURAÇÕES ---
app.get('/api/empresa', (req, res) => { res.json(dadosDaEmpresa); });
app.post('/api/empresa', (req, res) => {
    const novosDados = req.body;
    dadosDaEmpresa = { ...dadosDaEmpresa, ...novosDados };
    res.status(200).json({ message: 'Dados da empresa salvos com sucesso!' });
});

// API de Configurações de Cadastro (Salva preferências e permissões)
app.get('/api/configuracoes/cadastro', (req, res) => {
    res.json(configuracoesCadastro);
});
app.post('/api/configuracoes/cadastro', (req, res) => {
    const novosDados = req.body;
    configuracoesCadastro = { ...configuracoesCadastro, ...novosDados };
    console.log("Configurações atualizadas:", configuracoesCadastro);
    res.status(200).json({ message: 'Configurações salvas!' });
});

// --- LÓGICA DE CONFIGURAÇÕES (ABA OPERACIONAL) ---
app.get('/api/configuracoes/operacional', (req, res) => {
    res.json(configuracoesOperacional);
});
app.post('/api/configuracoes/operacional', (req, res) => {
    const novosDados = req.body;
    configuracoesOperacional = { ...configuracoesOperacional, ...novosDados };
    console.log("Configurações operacionais atualizadas:", configuracoesOperacional);
    res.status(200).json({ message: 'Configurações operacionais salvas!' });
});

// --- ROTAS PRINCIPAIS ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'DEV001' && password === 'DEV002') {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

app.listen(PORT, () => { console.log(`Servidor rodando em http://localhost:${PORT}`); });