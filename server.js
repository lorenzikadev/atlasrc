const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000; 

// --- BANCO DE DADOS EM MEMÓRIA ---
// Adicionado 'faturas' nas estruturas para manter consistência com o sistema
const db = {
    producao: {
        produtos: [],
        propostas: [],
        clientes: [],
        faturas: [] 
    },
    teste: {
        produtos: [],
        propostas: [],
        clientes: [],
        faturas: [] 
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
const getContext = (req) => {
    const isTest = req.headers['x-test-env'] === 'true';
    return isTest ? db.teste : db.producao;
};

// ==========================================
// LÓGICA DE PRODUTOS
// ==========================================
app.post('/cadastrar-produto', (req, res) => {
    const context = getContext(req);
    let produtoData = req.body;

    if (configuracoesCadastro.avisoEmailAtivo && configuracoesCadastro.emailNotificacao) {
        console.log(`[EMAIL] 📧 Notificação enviada para: ${configuracoesCadastro.emailNotificacao}`);
    }

    if (produtoData.id) {
        // Edição
        const id = parseInt(produtoData.id);
        const index = context.produtos.findIndex(p => p.id === id);
        if (index !== -1) {
            const dataOriginal = context.produtos[index].dataCadastro;
            context.produtos[index] = { ...context.produtos[index], ...produtoData, dataCadastro: dataOriginal, id: id };
            return res.status(200).json({ message: 'Produto atualizado!'}); 
        }
        return res.status(404).json({ message: 'Produto não encontrado.' });
    } else {
        // Novo
        produtoData.id = Date.now();
        produtoData.dataCadastro = new Date().toLocaleString('pt-BR');
        produtoData.dataUltimaAlteracao = produtoData.dataCadastro;
        context.produtos.push(produtoData); 
        return res.status(201).json({ message: 'Produto cadastrado!'}); 
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
    if (produto) res.json(produto); else res.status(404).json({ message: 'Produto não encontrado.' });
});

// ==========================================
// LÓGICA DE PROPOSTAS
// ==========================================
app.post('/cadastrar-proposta', (req, res) => {
    const context = getContext(req);
    let propostaData = req.body;

    if (propostaData.id) {
        const id = parseInt(propostaData.id);
        const index = context.propostas.findIndex(p => p.id === id);
        if (index !== -1) {
            const dataOriginal = context.propostas[index].dataCadastro;
            context.propostas[index] = { ...context.propostas[index], ...propostaData, dataCadastro: dataOriginal, id: id };
            return res.status(200).json({ message: 'Proposta atualizada!'});
        }
        return res.status(404).json({ message: 'Proposta não encontrado.' });
    } else {
        propostaData.id = Date.now();
        propostaData.dataCadastro = new Date().toLocaleString('pt-BR');
        propostaData.status = 'ativa'; 
        context.propostas.push(propostaData);
        return res.status(201).json({ message: 'Proposta cadastrada!'});
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
    if (proposta) res.json(proposta); else res.status(404).json({ message: 'Proposta não encontrada.' });
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

// ==========================================
// LÓGICA DE FATURAS COMERCIAIS (NOVO MÓDULO)
// ==========================================

// 1. Listar Faturas
app.get('/api/faturas', (req, res) => {
    const context = getContext(req);
    // Garante que o array existe
    if (!context.faturas) context.faturas = [];
    res.json(context.faturas);
});

// 2. Buscar Fatura Única
app.get('/api/faturas/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const fatura = context.faturas ? context.faturas.find(f => f.id === id) : null;
    if (fatura) res.json(fatura); 
    else res.status(404).json({ message: "Fatura não encontrada" });
});

// 3. Criar Nova Fatura
app.post('/api/faturas', (req, res) => {
    const context = getContext(req);
    if (!context.faturas) context.faturas = [];

    const novaFatura = req.body;
    novaFatura.id = Date.now();
    novaFatura.dataCriacao = new Date().toLocaleString('pt-BR');
    novaFatura.status = "Rascunho";
    novaFatura.assinada = false;
    
    context.faturas.push(novaFatura);
    res.status(201).json({ success: true, id: novaFatura.id, message: "Fatura criada!" });
});

// 4. Editar Fatura (PUT)
app.put('/api/faturas/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    
    if (!context.faturas) return res.status(404).json({ message: "Nenhuma fatura encontrada." });

    const index = context.faturas.findIndex(f => f.id === id);

    if (index !== -1) {
        // Bloqueio de segurança: Se assinada, não edita
        if (context.faturas[index].assinada) {
            return res.status(403).json({ success: false, message: "Fatura assinada não pode ser editada." });
        }
        
        // Atualiza mantendo ID e Data de Criação originais
        const dadosOriginais = { 
            id: id, 
            dataCriacao: context.faturas[index].dataCriacao,
            status: context.faturas[index].status,
            assinada: context.faturas[index].assinada 
        };

        context.faturas[index] = { ...req.body, ...dadosOriginais };
        // Atualiza dados que podem ter mudado no corpo (exceto ID e assinatura que forçamos acima)
        // Mas se o front mandou status ou outros campos, vamos garantir a mesclagem correta:
        context.faturas[index] = { ...context.faturas[index], ...req.body, id: id, assinada: false }; 
        
        res.json({ success: true, message: "Fatura atualizada!" });
    } else {
        res.status(404).json({ success: false, message: "Fatura não encontrada" });
    }
});

// 5. Assinar Fatura
app.post('/api/faturas/:id/assinar', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    
    if (!context.faturas) return res.status(404).json({ message: "Erro de contexto." });

    const fatura = context.faturas.find(f => f.id === id);

    if (fatura) {
        fatura.assinada = true;
        fatura.status = "Emitida";
        res.json({ success: true, message: "Fatura assinada com sucesso!" });
    } else {
        res.status(404).json({ success: false, message: "Fatura não encontrada" });
    }
});


// ==========================================
// LÓGICA DE CLIENTES E FORNECEDORES
// ==========================================
app.post('/cadastrar-cliente', (req, res) => {
    const context = getContext(req);
    let clienteData = req.body;
    
    if (clienteData.id) {
        // Edição
        const id = parseInt(clienteData.id);
        const index = context.clientes.findIndex(c => c.id === id);
        if (index !== -1) {
            const dataOriginal = context.clientes[index].dataCadastro;
            context.clientes[index] = { ...context.clientes[index], ...clienteData, dataCadastro: dataOriginal, id: id };
            return res.status(200).json({ message: 'Cadastro atualizado!' });
        } else {
             return res.status(404).json({ message: 'Cliente não encontrado.' });
        }
    } else {
        // Novo
        clienteData.id = Date.now(); 
        clienteData.dataCadastro = new Date().toLocaleString('pt-BR');
        
        if (!context.clientes) context.clientes = [];
        
        context.clientes.push(clienteData);
        console.log(`Novo ${clienteData.tipo} cadastrado: ${clienteData.nome}`);
        return res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    }
});

app.get('/api/clientes', (req, res) => { 
    const context = getContext(req);
    res.json(context.clientes || []); 
});

app.get('/api/clientes/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const cliente = context.clientes ? context.clientes.find(c => c.id === id) : null;
    if (cliente) { res.json(cliente); } else { res.status(404).json({ message: 'Cliente não encontrado.' }); }
});

app.delete('/api/clientes/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    
    if (!context.clientes) {
        return res.status(404).json({ message: 'Lista vazia.' });
    }

    const index = context.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
        context.clientes.splice(index, 1);
        res.status(200).json({ message: 'Removido com sucesso.' });
    } else {
        res.status(404).json({ message: 'Cliente não encontrado.' });
    }
});

// ==========================================
// DASHBOARD & CONFIGURAÇÕES
// ==========================================
app.get('/api/dashboard/vendas-stats', (req, res) => {
    const context = getContext(req);
    let vendasMesAtualUSD = 0, vendasMesAnteriorUSD = 0, concluidosMesCount = 0;
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
            } else if (dataConclusao.getMonth() === mesAnterior && dataConclusao.getFullYear() === anoDoMesAnterior) {
                vendasMesAnteriorUSD += valor;
            }
        }
    }
    res.json({ vendasMesAtualUSD, vendasMesAnteriorUSD, concluidosMesCount });
});

app.get('/api/empresa', (req, res) => { res.json(dadosDaEmpresa); });
app.post('/api/empresa', (req, res) => {
    dadosDaEmpresa = { ...dadosDaEmpresa, ...req.body };
    res.status(200).json({ message: 'Salvo!' });
});

app.get('/api/configuracoes/cadastro', (req, res) => res.json(configuracoesCadastro));
app.post('/api/configuracoes/cadastro', (req, res) => {
    configuracoesCadastro = { ...configuracoesCadastro, ...req.body };
    res.status(200).json({ message: 'Salvo!' });
});

app.get('/api/configuracoes/operacional', (req, res) => res.json(configuracoesOperacional));
app.post('/api/configuracoes/operacional', (req, res) => {
    configuracoesOperacional = { ...configuracoesOperacional, ...req.body };
    res.status(200).json({ message: 'Salvo!' });
});

// --- ROTAS DE ARQUIVOS ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// --- SISTEMA DE USUÁRIOS ---
let usuarios = [
    { id: 1, login: 'DEV001', senha: 'DEV002', tipo: 'Admin' }
];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = usuarios.find(u => u.login === username && u.senha === password);
    if (user) {
        res.json({ success: true, user: { id: user.id, login: user.login, tipo: user.tipo } });
    } else {
        res.json({ success: false, message: 'Credenciais inválidas.' });
    }
});

app.get('/api/usuarios', (req, res) => { res.json(usuarios); });

app.post('/api/usuarios', (req, res) => {
    const { login, senha, tipo } = req.body;
    if (usuarios.find(u => u.login === login)) {
        return res.status(400).json({ message: 'Este nome de usuário já existe.' });
    }
    const novoUsuario = { id: Date.now(), login, senha, tipo: tipo || 'Funcionario' };
    usuarios.push(novoUsuario);
    res.status(201).json({ message: 'Usuário criado com sucesso!' });
});

app.put('/api/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { login, senhaAtual, novaSenha } = req.body;
    const index = usuarios.findIndex(u => u.id === id);

    if (index === -1) return res.status(404).json({ message: 'Usuário não encontrado.' });

    if (senhaAtual && novaSenha) {
        if (usuarios[index].senha !== senhaAtual) {
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }
        usuarios[index].senha = novaSenha;
    }
    if (login) {
        const existe = usuarios.find(u => u.login === login && u.id !== id);
        if (existe) return res.status(400).json({ message: 'Nome de usuário indisponível.' });
        usuarios[index].login = login;
    }
    res.json({ success: true, message: 'Dados atualizados com sucesso!' });
});

app.post('/api/mudar-senha', (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    const user = usuarios.find(u => u.senha === senhaAtual);
    if (!user) return res.status(401).json({ success: false, message: 'Senha atual incorreta.' });
    user.senha = novaSenha;
    res.status(200).json({ success: true, message: 'Senha alterada com sucesso!' });
});

// =================================================================
// MÓDULO: PACKING LIST (Lista de Empaque)
// =================================================================

// 1. Listar Packing Lists
app.get('/api/packing-lists', (req, res) => {
    const context = getContext(req);
    if (!context.packingLists) context.packingLists = [];
    res.json(context.packingLists);
});

// 2. Buscar Packing List Único
app.get('/api/packing-lists/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const pl = context.packingLists ? context.packingLists.find(p => p.id === id) : null;
    if (pl) res.json(pl);
    else res.status(404).json({ message: "Packing List não encontrado" });
});

// 3. Criar Novo
app.post('/api/packing-lists', (req, res) => {
    const context = getContext(req);
    if (!context.packingLists) context.packingLists = [];

    const novoPL = req.body;
    novoPL.id = Date.now();
    novoPL.dataCriacao = new Date().toLocaleString('pt-BR');
    novoPL.assinada = false;
    
    context.packingLists.push(novoPL);
    res.status(201).json({ success: true, id: novoPL.id });
});

// 4. Editar
app.put('/api/packing-lists/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    if (!context.packingLists) return res.status(404).json({ message: "Lista vazia." });

    const index = context.packingLists.findIndex(p => p.id === id);
    if (index !== -1) {
        if (context.packingLists[index].assinada) {
            return res.status(403).json({ success: false, message: "Documento assinado não pode ser editado." });
        }
        // Mantém ID e Assinatura originais
        context.packingLists[index] = { ...req.body, id: id, assinada: false };
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Não encontrado" });
    }
});

// 5. Assinar
app.post('/api/packing-lists/:id/assinar', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const pl = context.packingLists.find(p => p.id === id);
    if (pl) {
        pl.assinada = true;
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// 6. Excluir
app.delete('/api/packing-lists/:id', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const index = context.packingLists.findIndex(p => p.id === id);
    if (index !== -1) {
        context.packingLists.splice(index, 1);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

// 7. Duplicar
app.post('/api/packing-lists/:id/duplicar', (req, res) => {
    const context = getContext(req);
    const id = parseInt(req.params.id);
    const original = context.packingLists.find(p => p.id === id);
    
    if (original) {
        const copia = { ...original };
        copia.id = Date.now();
        copia.ref = original.ref + " (Cópia)";
        copia.assinada = false; // Cópia nasce não assinada
        context.packingLists.push(copia);
        res.json({ success: true, id: copia.id });
    } else {
        res.status(404).json({ success: false });
    }
});

app.listen(PORT, () => { console.log(`Servidor rodando em http://localhost:${PORT}`); });