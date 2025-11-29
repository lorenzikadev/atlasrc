// main.js

// Variáveis globais
let listaProdutos = [];
let listaPropostas = []; 

// --- INTERCEPTADOR DE AMBIENTE DE TESTE ---
// Isso garante que NENHUM dado de teste vá para o banco de produção
const originalFetch = window.fetch;
window.fetch = function(url, options) {
    const isTest = localStorage.getItem('isTestEnv') === 'true';
    
    // Se estiver em modo de teste, injeta o aviso no cabeçalho da requisição
    if (isTest) {
        if (!options) options = {};
        if (!options.headers) options.headers = {};
        
        // Adiciona a tag 'x-test-env'
        if (options.headers.constructor === Object) {
            options.headers['x-test-env'] = 'true';
        }
    }
    
    return originalFetch(url, options);
};

// --- FUNÇÕES HELPER DE FORMATAÇÃO ---
function formatCurrency(value) {
    if (isNaN(value) || value === null || value === "" || value === 0) return "R$ 0,00";
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}
function formatCurrencyInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === "") { input.value = ""; return; }
    let valueNum = parseInt(value, 10) / 100;
    input.value = valueNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
}
function unformatCurrency(value) {
    if (typeof value !== 'string') return value;
    let unformatted = value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(unformatted) || 0;
}
function formatCurrencyUSD(value) {
    if (isNaN(value) || value === null || value === "" || value === 0) return "$ 0.00";
    return Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}
function formatCurrencyInputUSD(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === "") { input.value = ""; return; }
    let valueNum = parseInt(value, 10) / 100;
    input.value = valueNum.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}
function unformatCurrencyUSD(value) {
    if (typeof value !== 'string') return value;
    let unformatted = value.replace('$', '').replace(/,/g, '').trim(); 
    return parseFloat(unformatted) || 0;
}
function formatDateInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 2) { value = value.substring(0, 2) + '/' + value.substring(2); }
    if (value.length > 5) { value = value.substring(0, 5) + '/' + value.substring(5, 9); }
    input.value = value;
}
const checkNA = (value) => {
    if (value === "" || value === null || value === undefined || value === "R$ 0,00" || value === "$ 0.00" || value === 0) {
        return "N/A";
    }
    return value;
}
// --- FIM HELPER ---

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA GLOBAL DE TAMANHO DA FONTE ---
    const aplicarTamanhoFonteSalvo = () => {
        const tamanho = localStorage.getItem('fontSize') || '100'; 
        document.documentElement.style.setProperty('--base-font-size-percent', `${tamanho}%`);
    };
    aplicarTamanhoFonteSalvo();
    // --- FIM LÓGICA DE FONTE ---

    // --- LÓGICA GLOBAL DE FOTO DE PERFIL ---
    const loadProfilePic = () => {
        const profilePicDataUrl = localStorage.getItem('userProfilePic');
        if (profilePicDataUrl) {
            const sidebarPic = document.getElementById('sidebar-profile-pic');
            if (sidebarPic) {
                sidebarPic.src = profilePicDataUrl;
            }
            const modalPic = document.getElementById('modal-profile-pic-avatar');
             if (modalPic) {
                modalPic.src = profilePicDataUrl;
            }
        }
    };
    loadProfilePic();
    // --- FIM LÓGICA DE FOTO ---

    // --- LÓGICA DA TELA DE LOGIN ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('error-message');
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });
                const data = await response.json();
                if (data.success) {
                    window.location.href = '/dashboard.html';
                } else {
                    errorMessage.textContent = data.message || 'Erro ao tentar fazer login.';
                }
            } catch (error) {
                errorMessage.textContent = 'Erro de conexão com o servidor.';
            }
        });
    }

    // --- LÓGICA DO DASHBOARD (SIDEBAR) ---
    // Função de logout reutilizável
    const handleLogout = (e) => {
        e.preventDefault();
        window.location.href = '/index.html';
    };

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // --- LÓGICA DO DASHBOARD (CARDS ATUALIZADA) ---
    const cardPropostasCount = document.getElementById('propostas-ativas-count'); 
    const cardVendasTotal = document.getElementById('total-vendas-mes');     
    const cardConcluidosCount = document.getElementById('concluidos-mes-count'); 
    const cardComparativo = document.getElementById('comparativo-vendas-mes'); 

    const renderComparativoChart = (container, mesAtual, mesAnterior) => {
        const body = container.querySelector('.card-body');
        if (!body) return;
        let percentual = 0;
        let status = 'estável';
        let cor = '#7a7a9d'; 
        if (mesAnterior > 0) {
            percentual = ((mesAtual - mesAnterior) / mesAnterior) * 100;
        } else if (mesAtual > 0) {
            percentual = 100;
        }
        if (percentual > 0) {
            status = `(${percentual.toFixed(0)}%) acima do mês anterior`;
            cor = '#27ae60';
        } else if (percentual < 0) {
            status = `(${percentual.toFixed(0)}%) abaixo do mês anterior`;
            cor = '#e74c3c';
        }
        let alturaAtual = (mesAnterior === 0 && mesAtual === 0) ? 0 : (mesAtual >= mesAnterior ? 80 : 50);
        let alturaAnterior = (mesAnterior === 0 && mesAtual === 0) ? 0 : (mesAtual >= mesAnterior ? 50 : 80);
        if (mesAtual === 0 && mesAnterior === 0) {
             body.innerHTML = '<p class="placeholder-text">Sem dados para exibir.</p>';
             return;
        }
        body.innerHTML = `
            <div class="comparativo-grafico" style="--cor-status: ${cor};">
                <div class="grafico-barras">
                    <div class="barra" style="height: ${alturaAnterior}%; background-color: #7a7a9d;">
                        <span>Mês Anterior</span>
                    </div>
                    <div class="barra" style="height: ${alturaAtual}%; background-color: ${cor};">
                        <span>Mês Atual</span>
                    </div>
                </div>
                <div class="grafico-legenda">
                    <p class="legenda-valor">${formatCurrencyUSD(mesAtual)}</p>
                    <p class="legenda-status">${status}</p>
                </div>
            </div>
        `;
    };
    const loadDashboardStats = async () => {
        const valorVendasEl = document.querySelector('#total-vendas-mes .value');
        const valorConcluidosEl = document.querySelector('#concluidos-mes-count .value');
        const valorPropostasEl = document.querySelector('#propostas-ativas-count .value');
        try {
            const statsRes = await fetch('/api/dashboard/vendas-stats');
            const stats = await statsRes.json();
            const propostasRes = await fetch('/api/propostas');
            const propostasAtivas = (await propostasRes.json()).filter(p => p.status === 'ativa'); 
            valorVendasEl.textContent = formatCurrencyUSD(stats.vendasMesAtualUSD);
            valorConcluidosEl.textContent = stats.concluidosMesCount;
            valorPropostasEl.textContent = propostasAtivas.length;
            if (cardComparativo) {
                renderComparativoChart(cardComparativo, stats.vendasMesAtualUSD, stats.vendasMesAnteriorUSD);
            }
        } catch (error) {
            console.error('Erro ao carregar stats do dashboard:', error);
            if(valorVendasEl) valorVendasEl.textContent = "Erro";
            if(valorConcluidosEl) valorConcluidosEl.textContent = "Erro";
            if(valorPropostasEl) valorPropostasEl.textContent = "Erro";
        }
    };
    if (cardVendasTotal) { 
        loadDashboardStats();
    }

    // --- LÓGICA DO FORMULÁRIO DE CADASTRO (PRODUTOS) ---
    const cadastroForm = document.getElementById('cadastro-form');
    if (cadastroForm) {
        const formSteps = document.querySelectorAll('.form-step');
        const progressSteps = document.querySelectorAll('.progress-step');
        const btnProximo = document.getElementById('btn-proximo');
        const btnVoltar = document.getElementById('btn-voltar');
        let hiddenIdInput = document.getElementById('produtoId');
        if (!hiddenIdInput) {
            hiddenIdInput = document.createElement('input');
            hiddenIdInput.type = 'hidden';
            hiddenIdInput.name = 'id';
            hiddenIdInput.id = 'produtoId';
            cadastroForm.prepend(hiddenIdInput); 
        }
        let currentStep = 0;
        const showStep = (stepIndex) => {
            formSteps.forEach(step => step.classList.remove('active'));
            formSteps[stepIndex].classList.add('active');
            progressSteps.forEach((step, index) => {
                if (index <= stepIndex) { step.classList.add('active'); } 
                else { step.classList.remove('active'); }
            });
            if (stepIndex === 0) {
                btnVoltar.style.display = 'none';
            } else {
                btnVoltar.style.display = 'inline-block';
            }
            const isEditing = hiddenIdInput.value;
            if (stepIndex === formSteps.length - 1) {
                btnProximo.textContent = isEditing ? 'Salvar Alterações' : 'Salvar';
            } else {
                btnProximo.textContent = 'Próximo';
            }
        };
        const submitForm = async () => {
            const formData = new FormData(cadastroForm);
            const produtoData = Object.fromEntries(formData.entries());
            produtoData.dataUltimaAlteracao = new Date().toLocaleString('pt-BR');
            const currencyFields = [
                'custo_materia_prima', 
                'proc1_custo', 'proc2_custo', 'proc3_custo', 'proc4_custo', 'proc5_custo'
            ];
            currencyFields.forEach(field => {
                if (produtoData[field]) {
                    produtoData[field] = unformatCurrency(produtoData[field]);
                }
            });
            const isEditing = produtoData.id;
            const endpoint = '/cadastrar-produto';
            const method = 'POST';
            try {
                const response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(produtoData)
                });
                if (response.ok) {
                    alert(`Produto ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
                    window.location.href = '/estoque.html';
                } else {
                    alert(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} produto.`);
                }
            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Erro de conexão com o servidor.');
            }
        };
        btnProximo.addEventListener('click', () => {
            if (currentStep === formSteps.length - 1) { submitForm(); } 
            else { currentStep++; showStep(currentStep); }
        });
        btnVoltar.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
        const ncmInput = document.getElementById('ncm');
        if (ncmInput) {
            ncmInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, ''); 
                if (value.length > 4) { value = value.substring(0, 4) + '.' + value.substring(4); }
                if (value.length > 7) { value = value.substring(0, 7) + '.' + value.substring(7, 9); }
                e.target.value = value;
            });
        }
        const currencyInputs = document.querySelectorAll('.currency-input');
        currencyInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                formatCurrencyInput(e.target);
            });
        });
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId'); 
        if (editId) {
            const loadProductForEdit = async (id) => {
                try {
                    const response = await fetch(`/api/produtos/${id}`); 
                    if (!response.ok) { throw new Error('Produto não encontrado'); }
                    const produtoParaEditar = await response.json();
                    for (const key in produtoParaEditar) {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (input.classList.contains('currency-input')) {
                                input.value = formatCurrency(produtoParaEditar[key]);
                            } else {
                                input.value = produtoParaEditar[key];
                            }
                        }
                    }
                    hiddenIdInput.value = id;
                    document.title = `Edição de Produto | ${produtoParaEditar.nome}`;
                    document.querySelector('.header-title h1').textContent = 'Edição de Produto';
                    showStep(currentStep); 
                } catch (error) {
                    console.error('Erro ao carregar produto para edição:', error);
                    alert('Erro: Produto não encontrado.');
                    window.location.href = '/cadastro-produto.html'; 
                }
            };
            loadProductForEdit(editId); 
        } else {
            showStep(currentStep);
        }
    }

    // --- LÓGICA DA CONSULTA DE ESTOQUE (PRODUTOS) ---
    const produtosTable = document.getElementById('produtosTable');
    const modal = document.getElementById('product-detail-modal');
    if (produtosTable) {
        const closeModalButtons = document.querySelectorAll('#close-modal-btn, #close-modal-btn-bottom');
        const editButton = document.getElementById('edit-product-btn'); 
        let currentProductId = null;
        const abrirModal = (produto, id) => {
            currentProductId = id; 
            document.getElementById('modal-title').textContent = `Detalhes do Produto: ${produto.nome}`;
            const detailMapping = {
                'sku': produto.sku,
                'nome': produto.nome,
                'modelo_maquina_ref': produto.modelo_maquina_ref,
                'fabricante': produto.fabricante,
                'ncm': produto.ncm,
                'cfop': produto.cfop,
                'medida_largura': produto.medida_largura,
                'medida_altura': produto.medida_altura,
                'medida_comprimento': produto.medida_comprimento,
                'materia_prima': produto.materia_prima,
                'custo_materia_prima': formatCurrency(produto.custo_materia_prima),
                'ultima_encomenda': produto.ultima_encomenda,
                'proc1_nome': produto.proc1_nome,
                'proc1_custo': formatCurrency(produto.proc1_custo),
                'proc2_nome': produto.proc2_nome,
                'proc2_custo': formatCurrency(produto.proc2_custo),
                'proc3_nome': produto.proc3_nome,
                'proc3_custo': formatCurrency(produto.proc3_custo),
                'proc4_nome': produto.proc4_nome,
                'proc4_custo': formatCurrency(produto.proc4_custo),
                'proc5_nome': produto.proc5_nome,
                'proc5_custo': formatCurrency(produto.proc5_custo),
                'dataCadastro': produto.dataCadastro,
                'dataUltimaAlteracao': produto.dataUltimaAlteracao || produto.dataCadastro
            };
            for (const key in detailMapping) {
                const element = document.querySelector(`#product-detail-modal span[data-detail="${key}"]`);
                if (element) {
                    element.textContent = ''; 
                    element.textContent = checkNA(detailMapping[key]);
                }
            }
            modal.style.display = 'block'; 
        };
        const fecharModal = () => {
            modal.style.display = 'none';
            currentProductId = null;
        };
        if (editButton) {
            editButton.addEventListener('click', () => {
                if (currentProductId !== null) {
                    window.location.href = `/cadastro-produto.html?editId=${currentProductId}`;
                }
            });
        }
        async function carregarProdutos() {
            const tbody = produtosTable.querySelector('tbody');
            if (!tbody) return; 
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando...</td></tr>';
            try {
                const response = await fetch('/api/produtos');
                listaProdutos = await response.json(); 
                tbody.innerHTML = ''; 
                if (listaProdutos.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum produto cadastrado ainda.</td></tr>';
                    return;
                }
                listaProdutos.forEach((produto) => {
                    const row = tbody.insertRow();
                    row.setAttribute('data-produto-id', produto.id); 
                    row.insertCell().textContent = checkNA(produto.sku);
                    row.insertCell().textContent = checkNA(produto.nome);
                    row.insertCell().textContent = checkNA(produto.modelo_maquina_ref);
                    row.insertCell().textContent = checkNA(produto.fabricante);
                    row.insertCell().textContent = formatCurrency(produto.custo_materia_prima);
                    row.insertCell().textContent = checkNA(produto.dataCadastro);
                });
            } catch (error) {
                console.error('Erro ao buscar produtos:', error);
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar dados.</td></tr>';
                }
            }
        }
        produtosTable.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row && row.hasAttribute('data-produto-id')) {
                const id = parseInt(row.getAttribute('data-produto-id'));
                const produto = listaProdutos.find(p => p.id === id);
                if (produto) {
                    abrirModal(produto, id); 
                }
            }
        });
        closeModalButtons.forEach(button => {
            button.addEventListener('click', fecharModal);
        });
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModal();
            }
        });
        carregarProdutos();
    }

    // --- LÓGICA DA PÁGINA DE PROPOSTAS (LISTAGEM) ---
    const propostasTable = document.getElementById('propostasTable');
    // REMOVI O CÓDIGO ANTIGO DO FORMULÁRIO AQUI PARA INSERIR O NOVO ABAIXO

    // --- LÓGICA DO FORMULÁRIO DE PROPOSTAS (ATUALIZADO COM ITENS) ---
    const propostaForm = document.getElementById('proposta-form');
    
    if (propostaForm) {
        // 1. Variáveis de Estado
        let itensProposta = []; // Array que guarda os itens adicionados
        let todosProdutos = []; // Cache para a busca

        // 2. Carregar produtos do estoque para a busca
        fetch('/api/produtos')
            .then(r => r.json())
            .then(data => todosProdutos = data)
            .catch(e => console.error("Erro ao carregar produtos:", e));

        // 3. Elementos da Interface
        const searchInput = document.getElementById('produto-search');
        const resultsBox = document.getElementById('search-results');
        const tbodyItens = document.getElementById('itens-tbody');
        const inputTotalUSD = document.getElementById('valor_total_usd');
        const validadeInput = document.getElementById('validade_proposta');
        const hiddenIdInput = document.getElementById('propostaId');

        // Formatação inicial dos inputs
        if (validadeInput) validadeInput.addEventListener('input', (e) => formatDateInput(e.target));
        // O inputTotalUSD agora é readonly, não precisa de evento de input manual

        // --- FUNÇÕES DE BUSCA E SELEÇÃO ---
        
        // Filtrar produtos ao digitar
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const termo = e.target.value.toLowerCase();
                if (termo.length < 2) {
                    resultsBox.style.display = 'none';
                    return;
                }
                
                const resultados = todosProdutos.filter(p => {
                    const textoCompleto = `${p.sku || ''} ${p.nome} ${p.ncm || ''}`.toLowerCase();
                    return textoCompleto.includes(termo);
                });

                renderResultadosBusca(resultados);
            });

            // Fechar busca ao clicar fora
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#produto-search') && !e.target.closest('#search-results')) {
                    resultsBox.style.display = 'none';
                }
            });
        }

        const renderResultadosBusca = (lista) => {
            resultsBox.innerHTML = '';
            if (lista.length === 0) {
                resultsBox.style.display = 'none';
                return;
            }

            lista.forEach(p => {
                const div = document.createElement('div');
                div.className = 'result-item';
                div.innerHTML = `<strong>${p.sku || 'S/C'}</strong> - ${p.nome} <small>(${formatCurrency(p.salePrice || 0)})</small>`;
                div.addEventListener('click', () => adicionarItemNaTabela(p));
                resultsBox.appendChild(div);
            });
            resultsBox.style.display = 'block';
        };

        const adicionarItemNaTabela = (produto) => {
            // Verifica se já adicionou
            const existe = itensProposta.find(i => i.id === produto.id);
            if (existe) {
                alert('Este produto já está na lista.');
                return;
            }

            // Cria o objeto do item
            // Tenta pegar o preço de venda se existir, senão 0
            const precoBase = produto.salePrice || 0; // Se tiver salePrice no BD, usa. Se não, 0.

            itensProposta.push({
                id: produto.id,
                sku: produto.sku || '',
                nome: produto.nome,
                ncm: produto.ncm || '',
                qtd: 1,
                valorUnit: precoBase
            });

            searchInput.value = '';
            resultsBox.style.display = 'none';
            renderTabela();
        };

        // --- FUNÇÕES DA TABELA DE ITENS ---

        const renderTabela = () => {
            tbodyItens.innerHTML = '';

            if (itensProposta.length === 0) {
                tbodyItens.innerHTML = '<tr id="empty-row"><td colspan="7" style="text-align: center; padding: 20px; color: #a9a9c8;">Nenhum item adicionado. Use a busca acima.</td></tr>';
                atualizarTotalGeral();
                return;
            }

            itensProposta.forEach((item, index) => {
                const tr = document.createElement('tr');
                const totalItem = item.qtd * item.valorUnit;

                tr.innerHTML = `
                    <td>${item.sku}</td>
                    <td>${item.nome}</td>
                    <td>${item.ncm}</td>
                    <td><input type="number" class="qtd-input" data-index="${index}" value="${item.qtd}" min="1" style="width: 60px; text-align: center;"></td>
                    <td><input type="text" class="val-input" data-index="${index}" value="${formatCurrencyUSD(item.valorUnit)}" style="width: 100px;"></td>
                    <td style="color: #fff;">${formatCurrencyUSD(totalItem)}</td>
                    <td style="text-align: center;">
                        <button type="button" class="btn-remove-item" data-index="${index}" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </td>
                `;
                tbodyItens.appendChild(tr);
            });

            // Adicionar eventos aos inputs da tabela (Qtd e Valor)
            document.querySelectorAll('.qtd-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    itensProposta[idx].qtd = parseInt(e.target.value) || 1;
                    renderTabela(); // Re-renderiza para atualizar totais
                });
            });

            document.querySelectorAll('.val-input').forEach(input => {
                input.addEventListener('input', (e) => formatCurrencyInputUSD(e.target));
                input.addEventListener('change', (e) => {
                    const idx = e.target.getAttribute('data-index');
                    itensProposta[idx].valorUnit = unformatCurrencyUSD(e.target.value);
                    renderTabela();
                });
            });

            document.querySelectorAll('.btn-remove-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = e.target.closest('button').getAttribute('data-index');
                    itensProposta.splice(idx, 1); // Remove do array
                    renderTabela();
                });
            });

            atualizarTotalGeral();
        };

        const atualizarTotalGeral = () => {
            const total = itensProposta.reduce((acc, item) => acc + (item.qtd * item.valorUnit), 0);
            if (inputTotalUSD) {
                inputTotalUSD.value = formatCurrencyUSD(total);
            }
        };

        // --- SUBMIT DO FORMULÁRIO ---
        const submitPropostaForm = async (e) => {
            e.preventDefault();
            const formData = new FormData(propostaForm);
            const propostaData = Object.fromEntries(formData.entries());
            
            // Pega o valor total calculado (removendo formatação)
            propostaData.valor_total_usd = unformatCurrencyUSD(inputTotalUSD.value);
            propostaData.dataUltimaAlteracao = new Date().toLocaleString('pt-BR');
            
            // Adiciona a lista de itens ao objeto que vai pro servidor
            propostaData.itens = itensProposta;

            const isEditing = propostaData.id;
            const endpoint = '/cadastrar-proposta';
            const method = 'POST';

            try {
                const response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(propostaData)
                });
                if (response.ok) {
                    alert(`Proposta ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!`);
                    window.location.href = '/propostas.html';
                } else {
                    alert('Erro ao salvar proposta.');
                }
            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Erro de conexão.');
            }
        };
        propostaForm.addEventListener('submit', submitPropostaForm);

        // --- CARREGAMENTO (EDIÇÃO E CONFIGURAÇÕES) ---
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');

        // Se for EDIÇÃO: Carrega dados + Itens
        if (editId) {
            const loadPropostaForEdit = async (id) => {
                try {
                    const response = await fetch(`/api/propostas/${id}`);
                    if (!response.ok) throw new Error('Proposta não encontrada');
                    const proposta = await response.json();
                    
                    // Preenche campos normais
                    for (const key in proposta) {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (key === 'valor_total_usd') {
                                // O total será recalculado pelos itens, mas preenchemos por segurança
                                input.value = formatCurrencyUSD(proposta[key]);
                            } else {
                                input.value = proposta[key];
                            }
                        }
                    }
                    hiddenIdInput.value = id;
                    document.title = `Edição | ${proposta.ordem_compra || id}`;
                    document.querySelector('.header-title h1').textContent = 'Edição de Proposta';
                    document.getElementById('proposta-submit-btn').textContent = 'Salvar Alterações';

                    // Preenche a Tabela de Itens
                    if (proposta.itens && Array.isArray(proposta.itens)) {
                        itensProposta = proposta.itens;
                        renderTabela();
                    }

                } catch (error) {
                    console.error('Erro ao carregar:', error);
                    alert('Erro ao carregar proposta.');
                    window.location.href = '/propostas.html';
                }
            };
            loadPropostaForEdit(editId);
        } else {
            // Se for NOVA PROPOSTA: Aplica Configurações Operacionais
            fetch('/api/configuracoes/operacional')
                .then(r => r.json())
                .then(config => {
                    // Validade Automática
                    if (config.validadePadrao && config.validadePadrao > 0) {
                        const hoje = new Date();
                        hoje.setDate(hoje.getDate() + parseInt(config.validadePadrao));
                        const dia = String(hoje.getDate()).padStart(2, '0');
                        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                        const ano = hoje.getFullYear();
                        if (validadeInput) {
                            validadeInput.value = `${dia}/${mes}/${ano}`;
                            validadeInput.dispatchEvent(new Event('input'));
                        }
                    }
                    // Numeração Automática
                    if (config.numeracaoAuto) {
                        const inputRef = document.getElementById('ordem_compra');
                        if (inputRef) {
                            inputRef.value = `REF-${Date.now().toString().slice(-6)}`;
                            inputRef.setAttribute('readonly', true);
                            inputRef.style.backgroundColor = '#e9ecef';
                        }
                    }
                })
                .catch(() => {});
        }
    }

 if (propostasTable) {
        
        // Helper: Carrega imagem e retorna suas dimensões
        const carregarImagem = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
            });
        };

        // --- FUNÇÃO: GERAR PDF DA PROPOSTA ---
        const gerarPDFProposta = async (id) => {
            try {
                // 1. Buscar dados
                const response = await fetch(`/api/propostas/${id}`);
                if (!response.ok) throw new Error('Erro ao buscar dados');
                const prop = await response.json();

                // 2. Carregar Imagem (Apenas Logo 2)
                const logo2 = await carregarImagem('/logo2.png');

                // 3. Inicializar jsPDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                // --- CABEÇALHO ---
                
                // Logo 2 (Posicionada na Esquerda)
                if (logo2) {
                    const imgWidth = 40;
                    const imgHeight = (logo2.height / logo2.width) * imgWidth;
                    doc.addImage(logo2, 'PNG', 15, 10, imgWidth, imgHeight); // X=15 (Esquerda)
                }

                // Dados da Empresa (Centralizado no Topo)
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(0, 51, 102);
                doc.text("RODRIGO A AMORIM CENTRIFUGAS", 105, 18, { align: "center" });
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
                doc.setTextColor(80);
                const dadosEmpresa = [
                    "Rua Colômbia, 36 - Jd. Belo Horizonte; 1350-184",
                    "CNPJ: 07.176.742/0001-11",
                    "Telefone: (19) 99208-0035 | E-mail: comex@srccentrifugas.com"
                ];
                doc.text(dadosEmpresa, 105, 23, { align: "center", lineHeightFactor: 1.2 });

                // Linha divisória
                doc.setDrawColor(230, 126, 34); 
                doc.setLineWidth(0.5);
                doc.line(15, 40, 195, 40);

                // --- TÍTULO DA PROPOSTA ---
                doc.setFontSize(14);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0);
                doc.text(`PROPOSTA COMERCIAL #${prop.ordem_compra || id}`, 15, 50);

                // Detalhes
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text(`Data de Emissão: ${checkNA(prop.dataCadastro)}`, 15, 57);
                doc.text(`Validade: ${checkNA(prop.validade_proposta)}`, 80, 57);
                doc.text(`Incoterm: ${checkNA(prop.incoterms)}`, 140, 57);

                // --- DADOS DO IMPORTADOR ---
                doc.setFillColor(245, 245, 245);
                doc.rect(15, 63, 180, 22, 'F');
                
                doc.setFont("helvetica", "bold");
                doc.text("IMPORTADOR:", 18, 69);
                
                doc.setFont("helvetica", "normal");
                doc.text(`${checkNA(prop.nome_importador)}`, 18, 74);
                
                doc.setFontSize(8);
                const enderecoSplit = doc.splitTextToSize(checkNA(prop.endereco_importador), 170);
                doc.text(enderecoSplit, 18, 79);

                // --- TABELA DE ITENS ---
                const colunas = ["Código", "Produto", "NCM", "Qtd", "V. Unit (USD)", "Total (USD)"];
                const linhas = prop.itens ? prop.itens.map(item => [
                    item.sku,
                    item.nome,
                    item.ncm,
                    item.qtd,
                    formatCurrencyUSD(item.valorUnit),
                    formatCurrencyUSD(item.qtd * item.valorUnit)
                ]) : [];

                doc.autoTable({
                    startY: 90,
                    head: [colunas],
                    body: linhas,
                    theme: 'striped',
                    headStyles: { 
                        fillColor: [230, 126, 34], 
                        textColor: 255, 
                        fontStyle: 'bold',
                        halign: 'center'
                    },
                    styles: { fontSize: 9, cellPadding: 3 },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 25, halign: 'center' },
                        3: { cellWidth: 15, halign: 'center' },
                        4: { cellWidth: 25, halign: 'right' },
                        5: { cellWidth: 25, halign: 'right' }
                    }
                });

                // --- TOTAL GERAL ---
                const finalY = doc.lastAutoTable.finalY + 5;
                doc.setFillColor(230, 126, 34);
                doc.rect(140, finalY, 55, 10, 'F');
                doc.setTextColor(255);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(`TOTAL: ${formatCurrencyUSD(prop.valor_total_usd)}`, 192, finalY + 7, { align: "right" });

                // --- RODAPÉ (DADOS BANCÁRIOS) ---
                const pageHeight = doc.internal.pageSize.height;
                
                doc.setDrawColor(200);
                doc.line(15, pageHeight - 45, 195, pageHeight - 45);

                // Dados Bancários
                doc.setTextColor(0);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bold");
                doc.text("DADOS BANCÁRIOS PARA PAGAMENTO:", 15, pageHeight - 38);

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text("Banco: Santander", 15, pageHeight - 32);
                doc.text("IBAN: BR8690400888000900130131417C1", 60, pageHeight - 32);
                doc.text("SWIFT: BSCHBRSPXXX", 140, pageHeight - 32);
                doc.text("Agência: 0090  |  Conta: 130131417", 15, pageHeight - 27);

                // --- SALVAR ---
                doc.save(`Proposta_${prop.ordem_compra || id}.pdf`);

            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                alert("Erro ao gerar PDF. Verifique o console.");
            }
        };

        // --- MANIPULAÇÃO DA TABELA ---
        const marcarPropostaConcluida = async (id, row) => {
            try {
                const response = await fetch(`/api/propostas/concluir/${id}`, { method: 'POST' });
                if (!response.ok) throw new Error('Falha ao atualizar status.');
                row.classList.add('proposta-concluida');
                const kebabCell = row.querySelector('.kebab-cell');
                if (kebabCell) {
                    kebabCell.innerHTML = '<i class="fas fa-check" style="color: #27ae60; font-size: 1.2rem;"></i>';
                }
                if (typeof loadDashboardStats === 'function') loadDashboardStats(); 
            } catch (error) {
                console.error("Erro ao concluir proposta:", error);
                alert("Não foi possível marcar a proposta como concluída.");
            }
        };

        const carregarPropostas = async () => {
            const tbody = propostasTable.querySelector('tbody');
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Carregando...</td></tr>';
            try {
                const response = await fetch('/api/propostas');
                listaPropostas = await response.json();
                tbody.innerHTML = '';
                if (listaPropostas.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Sem propostas a exibir.</td></tr>';
                    return;
                }
                listaPropostas.forEach(proposta => {
                    const row = tbody.insertRow();
                    row.setAttribute('data-proposta-id', proposta.id);
                    row.insertCell().textContent = checkNA(proposta.ordem_compra);
                    row.insertCell().textContent = checkNA(proposta.nome_importador);
                    row.insertCell().textContent = formatCurrencyUSD(proposta.valor_total_usd);
                    row.insertCell().textContent = checkNA(proposta.validade_proposta);
                    row.insertCell().textContent = checkNA(proposta.dataUltimaAlteracao);
                    const acoesCell = row.insertCell();
                    acoesCell.classList.add('kebab-cell');
                    
                    if (proposta.status === 'concluida') {
                        row.classList.add('proposta-concluida');
                        acoesCell.innerHTML = '<i class="fas fa-check" style="color: #27ae60; font-size: 1.2rem;"></i>';
                    } else {
                        acoesCell.innerHTML = `
                            <div class="kebab-menu">
                                <button class="kebab-btn"><i class="fas fa-ellipsis-v"></i></button>
                                <div class="dropdown-content">
                                    <a href="#" class="btn-editar-proposta"><i class="fas fa-edit"></i> Editar</a>
                                    <a href="#" class="btn-exportar-pdf"><i class="fas fa-file-pdf"></i> Exportar PDF</a>
                                    <a href="#" class="btn-concluir-proposta"><i class="fas fa-check"></i> Concluir</a>
                                </div>
                            </div>
                        `;
                    }
                });
            } catch (error) {
                console.error('Erro ao buscar propostas:', error);
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar dados.</td></tr>';
            }
        };

        propostasTable.addEventListener('click', (e) => {
            e.preventDefault(); 
            const target = e.target;
            const btn = target.closest('a');
            const row = target.closest('tr');
            
            if (target.closest('.kebab-btn')) {
                const menu = target.closest('.kebab-menu');
                document.querySelectorAll('.kebab-menu.open').forEach(m => {
                    if (m !== menu) m.classList.remove('open');
                });
                menu.classList.toggle('open');
                return;
            }

            if (!btn || !row) return;
            const id = parseInt(row.getAttribute('data-proposta-id'));
            
            if (btn.classList.contains('btn-editar-proposta')) {
                window.location.href = `/cadastro-proposta.html?editId=${id}`;
            }
            
            if (btn.classList.contains('btn-exportar-pdf')) {
                document.querySelectorAll('.kebab-menu.open').forEach(menu => menu.classList.remove('open'));
                gerarPDFProposta(id);
            }

            if (btn.classList.contains('btn-concluir-proposta')) {
                if (confirm(`Tem certeza que deseja marcar a proposta como concluída?`)) {
                    marcarPropostaConcluida(id, row);
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.kebab-menu')) {
                document.querySelectorAll('.kebab-menu.open').forEach(menu => {
                    menu.classList.remove('open');
                });
            }
        });

        carregarPropostas();
    }


    // --- LÓGICA DE CONFIGURAÇÕES (NOVA) ---
    if (window.location.pathname.includes('configuracoes.html')) {
        
        // 1. Alternância de Abas
        const tabLinks = document.querySelectorAll('.config-tab-link');
        const tabContents = document.querySelectorAll('.config-tab-content');

        if (tabLinks.length > 0) {
            tabLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Reseta todas as abas
                    tabLinks.forEach(l => l.classList.remove('active'));
                    tabContents.forEach(c => c.style.display = 'none');
                    
                    // Ativa a aba clicada
                    link.classList.add('active');
                    const targetId = link.getAttribute('data-target');
                    const target = document.getElementById(targetId);
                    if (target) target.style.display = 'block';
                });
            });
        }

        // 2. Switch de E-mail (Setor 1)
        const emailSwitch = document.getElementById('emailNotification');
        const emailContainer = document.getElementById('emailInputContainer');
        
        if (emailSwitch && emailContainer) {
            // Verifica se já estava marcado (simulação)
            const savedPref = localStorage.getItem('prefEmailNotify') === 'true';
            emailSwitch.checked = savedPref;
            emailContainer.style.display = savedPref ? 'block' : 'none';

            emailSwitch.addEventListener('change', (e) => {
                emailContainer.style.display = e.target.checked ? 'block' : 'none';
                localStorage.setItem('prefEmailNotify', e.target.checked);
                if (e.target.checked) {
                    setTimeout(() => document.getElementById('notificationEmail')?.focus(), 100);
                }
            });
        }

        // 3. Entrar no Ambiente de Teste (Setor 2)
        const btnEnterTest = document.getElementById('btnEnterTestEnv');
        if (btnEnterTest) {
            btnEnterTest.addEventListener('click', () => {
                if(confirm('Tem certeza que deseja entrar no Ambiente de Teste?')) {
                    localStorage.setItem('isTestEnv', 'true');
                    window.location.reload();
                }
            });
        }

        // 4. Upload de Certificado Digital (Setor 3)
        const btnUploadCert = document.getElementById('btn-upload-certificado');
        const inputCert = document.getElementById('input-certificado');
        const modalCert = document.getElementById('modal-certificado');
        const btnConfirmCert = document.getElementById('btn-confirmar-cert');
        const btnCancelCert = document.getElementById('btn-cancelar-cert');

        // Ação do botão "Selecionar Certificado"
        if (btnUploadCert && inputCert) {
            btnUploadCert.addEventListener('click', () => inputCert.click());
            
            inputCert.addEventListener('change', () => {
                if (inputCert.files.length > 0 && modalCert) {
                    modalCert.style.display = 'flex'; // Abre o modal simulado
                }
            });
        }

        // Ações do Modal
        if (modalCert) {
            if (btnConfirmCert) {
                btnConfirmCert.addEventListener('click', () => {
                    modalCert.style.display = 'none';
                    alert('Certificado cadastrado com sucesso!');
                });
            }
            if (btnCancelCert) {
                btnCancelCert.addEventListener('click', () => {
                    modalCert.style.display = 'none';
                    inputCert.value = ''; // Limpa a seleção
                });
            }
        }

        // 5. Configurações Operacionais (Validade e Numeração)
        const validadeInput = document.getElementById('validadePadrao');
        const numeracaoSwitch = document.getElementById('numeracaoAuto');

        if (validadeInput || numeracaoSwitch) {
            // Carregar configurações salvas ao abrir a tela
            fetch('/api/configuracoes/operacional')
                .then(r => r.json())
                .then(config => {
                    if (validadeInput) validadeInput.value = config.validadePadrao || '';
                    if (numeracaoSwitch) numeracaoSwitch.checked = config.numeracaoAuto || false;
                })
                .catch(e => console.log('Sem config operacional salva'));

            // Salvar ao alterar Validade
            if (validadeInput) {
                validadeInput.addEventListener('change', (e) => {
                    sendData('configuracoes/operacional', { validadePadrao: e.target.value });
                });
            }

            // Salvar ao alterar Numeração Automática
            if (numeracaoSwitch) {
                numeracaoSwitch.addEventListener('change', (e) => {
                    sendData('configuracoes/operacional', { numeracaoAuto: e.target.checked });
                });
            }
        }
    }

    // --- LÓGICA GLOBAL: AMBIENTE DE TESTE (Executa em TODAS as páginas) ---
    if (localStorage.getItem('isTestEnv') === 'true') {
        // 1. Indicador Visual (Borda Laranja no Topo)
        document.body.style.borderTop = '5px solid #E67E22';

        // 2. Gerenciar Botão Flutuante de Sair
        let btnExit = document.getElementById('btn-sair-teste');
        
        // Se o botão não existir no HTML da página atual, cria dinamicamente via JS
        if (!btnExit) {
            btnExit = document.createElement('button');
            btnExit.id = 'btn-sair-teste';
            btnExit.className = 'floating-test-btn'; // Usa a classe do CSS
            btnExit.innerHTML = '<i class="fas fa-times-circle"></i> Sair do Ambiente de Teste';
            // Garante estilos inline críticos caso o CSS não carregue a classe
            btnExit.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #c0392b; color: white; border: none; padding: 12px 20px; border-radius: 30px; cursor: pointer; z-index: 9999; font-weight: bold; display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);";
            document.body.appendChild(btnExit);
        }
        
        btnExit.style.display = 'flex';
        
        btnExit.addEventListener('click', () => {
            if(confirm('Deseja sair do modo de teste e voltar para a produção?')) {
                localStorage.setItem('isTestEnv', 'false');
                window.location.reload();
            }
        });
    }

    // --- LÓGICA DO MENU DESLIZANTE (FLYOUT) ---
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const bodyContainer = document.querySelector('.sidebar-container');

    if (sidebar && toggleBtn && bodyContainer) {
        let isPinned = localStorage.getItem('sidebarPinned') === 'true';

        // Função para aplicar o estado (expandido ou não)
        const aplicarEstadoSidebar = () => {
            if (isPinned) {
                bodyContainer.classList.add('sidebar-expanded');
                sidebar.classList.add('expanded');
            } else {
                bodyContainer.classList.remove('sidebar-expanded');
                sidebar.classList.remove('expanded');
            }
        };

        // Aplica o estado salvo ao carregar a página
        aplicarEstadoSidebar();

        // 1. Lógica do Clique no Botão (Travar/Soltar)
        toggleBtn.addEventListener('click', () => {
            isPinned = !isPinned; // Inverte o estado
            localStorage.setItem('sidebarPinned', isPinned); // Salva a preferência
            aplicarEstadoSidebar();
        });

        // 2. Lógica do Mouse Enter (Expandir)
        sidebar.addEventListener('mouseenter', () => {
            if (!isPinned) {
                bodyContainer.classList.add('sidebar-expanded');
                sidebar.classList.add('expanded');
            }
        });

        // 3. Lógica do Mouse Leave (Encolher)
        sidebar.addEventListener('mouseleave', () => {
            if (!isPinned) {
                bodyContainer.classList.remove('sidebar-expanded');
                sidebar.classList.remove('expanded');
            }
        });
    }

// ============================================================
    // LÓGICA DE CLIENTES E FORNECEDORES (Versão Final Otimizada)
    // ============================================================
    
    // 1. TELA DE LISTAGEM (clientes.html)
    const clientesTable = document.getElementById('clientesTable');
    if (clientesTable) {
        const carregarClientes = async () => {
            const tbody = clientesTable.querySelector('tbody');
            try {
                const response = await fetch('/api/clientes');
                const lista = await response.json();
                tbody.innerHTML = '';
                
                if (lista.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #aaa;">Nenhum contato cadastrado.</td></tr>';
                    return;
                }

                lista.forEach(cliente => {
                    const row = tbody.insertRow();
                    
                    row.insertCell().innerHTML = `<strong>${cliente.nome}</strong><br><small style="color:#7a7a9d">${cliente.ruc || ''}</small>`;
                    row.insertCell().textContent = cliente.apelido || '-';
                    row.insertCell().textContent = cliente.telefone || '-';
                    
                    const tipoCell = row.insertCell();
                    let corTipo = '#7f8c8d'; 
                    let icone = 'fa-question';
                    if(cliente.tipo === 'Cliente') { corTipo = '#27ae60'; icone = 'fa-user-tie'; }
                    if(cliente.tipo === 'Fornecedor') { corTipo = '#E67E22'; icone = 'fa-truck'; }
                    if(cliente.tipo === 'Funcionario') { corTipo = '#2980b9'; icone = 'fa-id-badge'; }
                    tipoCell.innerHTML = `<span style="background-color: ${corTipo}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 5px;"><i class="fas ${icone}"></i> ${cliente.tipo}</span>`;
                    
                    const enderecoCompleto = `${cliente.endereco}, ${cliente.numero} - ${cliente.pais}`;
                    row.insertCell().textContent = enderecoCompleto;

                    const acoesCell = row.insertCell();
                    acoesCell.style.textAlign = 'center';
                    acoesCell.innerHTML = `
                        <button type="button" class="btn-editar-cliente" data-id="${cliente.id}" style="background:none; border:none; color:#f39c12; cursor:pointer; font-size: 1.1rem; margin-right: 10px;" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-excluir-cliente" data-id="${cliente.id}" data-nome="${cliente.nome}" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size: 1.1rem;" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                });
            } catch (error) {
                console.error(error);
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #e74c3c;">Erro ao carregar dados. Verifique se o servidor está rodando.</td></tr>';
            }
        };

        // Delegação de Eventos (Melhor performance e evita bugs de clique)
        clientesTable.addEventListener('click', async (e) => {
            const btnEdit = e.target.closest('.btn-editar-cliente');
            const btnDel = e.target.closest('.btn-excluir-cliente');

            // Editar
            if (btnEdit) {
                const id = btnEdit.getAttribute('data-id');
                window.location.href = `/cadastro-cliente.html?editId=${id}`;
            }

            // Excluir
            if (btnDel) {
                const id = btnDel.getAttribute('data-id');
                const nome = btnDel.getAttribute('data-nome');
                if (confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
                    try {
                        const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
                        if (res.ok) {
                            alert('Cadastro excluído!');
                            carregarClientes();
                        } else {
                            alert('Erro ao excluir. Talvez o servidor tenha reiniciado?');
                        }
                    } catch (err) {
                        alert('Erro de conexão.');
                    }
                }
            }
        });

        carregarClientes();
    }

    // 2. TELA DE FORMULÁRIO (cadastro-cliente.html)
    const clienteForm = document.getElementById('cadastro-cliente-form');
    if (clienteForm) {
        const hiddenId = document.getElementById('clienteId');
        const submitBtn = document.getElementById('cliente-submit-btn');
        
        // Verifica se é edição
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');
        
        if(editId) {
            document.querySelector('.header-title h1').textContent = 'Editar Cadastro';
            if(submitBtn) submitBtn.textContent = 'Salvar Alterações';
            if(hiddenId) hiddenId.value = editId;
            
            // Carrega dados
            fetch(`/api/clientes/${editId}`)
                .then(r => {
                    if(!r.ok) throw new Error("Cliente não encontrado (Servidor reiniciou?)");
                    return r.json();
                })
                .then(data => {
                    // Preenche campos
                    const inputs = clienteForm.querySelectorAll('input:not([type=radio]), select, textarea');
                    inputs.forEach(input => {
                        if (data[input.name]) input.value = data[input.name];
                    });
                    // Preenche Tipo
                    const radios = clienteForm.querySelectorAll('input[type="radio"][name="tipo"]');
                    radios.forEach(radio => {
                        if (radio.value === data.tipo) radio.checked = true;
                    });
                })
                .catch(err => {
                    console.error(err);
                    alert("Erro: Cliente não encontrado. Se você reiniciou o servidor, os dados foram limpos.");
                    window.location.href = '/clientes.html';
                });
        }

        // Salvar
        clienteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(clienteForm);
            const data = Object.fromEntries(formData.entries());
            
            // ID para edição
            if (hiddenId && hiddenId.value) {
                data.id = hiddenId.value;
            }

            try {
                const res = await fetch('/cadastrar-cliente', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                
                if(res.ok) {
                    alert('Salvo com sucesso!');
                    window.location.href = '/clientes.html';
                } else {
                    alert('Erro ao salvar.');
                }
            } catch(err) {
                console.error(err);
                alert('Erro de conexão.');
            }
        });
    }

});