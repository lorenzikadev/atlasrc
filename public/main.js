// main.js

// Variáveis globais
let listaProdutos = [];
let listaPropostas = []; 

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

    // --- NOVO: LÓGICA GLOBAL DE TAMANHO DA FONTE ---
    const aplicarTamanhoFonteSalvo = () => {
        const tamanho = localStorage.getItem('fontSize') || '100'; 
        document.documentElement.style.setProperty('--base-font-size-percent', `${tamanho}%`);
    };
    aplicarTamanhoFonteSalvo();
    // --- FIM LÓGICA DE FONTE ---

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
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/index.html';
        });
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
            const propostasAtivas = await propostasRes.json(); 
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

    // --- LÓGICA DA PÁGINA DE PROPOSTAS ---
    const propostasTable = document.getElementById('propostasTable');
    const propostaForm = document.getElementById('proposta-form');

    if (propostaForm) {
        // (Lógica do Formulário de Propostas)
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('editId');
        const hiddenIdInput = document.getElementById('propostaId');
        const validadeInput = document.getElementById('validade_proposta');
        if (validadeInput) {
            validadeInput.addEventListener('input', (e) => formatDateInput(e.target));
        }
        const valorUsdInput = document.getElementById('valor_total_usd');
        if (valorUsdInput) {
            valorUsdInput.addEventListener('input', (e) => formatCurrencyInputUSD(e.target));
        }
        const submitPropostaForm = async (e) => {
            e.preventDefault();
            const formData = new FormData(propostaForm);
            const propostaData = Object.fromEntries(formData.entries());
            propostaData.valor_total_usd = unformatCurrencyUSD(propostaData.valor_total_usd);
            propostaData.dataUltimaAlteracao = new Date().toLocaleString('pt-BR');
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
                    alert(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} proposta.`);
                }
            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Erro de conexão com o servidor.');
            }
        };
        propostaForm.addEventListener('submit', submitPropostaForm);
        if (editId) {
            const loadPropostaForEdit = async (id) => {
                try {
                    const response = await fetch(`/api/propostas/${id}`);
                    if (!response.ok) throw new Error('Proposta não encontrada');
                    const proposta = await response.json();
                    for (const key in proposta) {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            if (key === 'valor_total_usd') {
                                input.value = formatCurrencyUSD(proposta[key]);
                            } else {
                                input.value = proposta[key];
                            }
                        }
                    }
                    hiddenIdInput.value = id;
                    document.title = `Edição de Proposta | ${proposta.ordem_compra || id}`;
                    document.querySelector('.header-title h1').textContent = 'Edição de Proposta';
                    document.getElementById('proposta-submit-btn').textContent = 'Salvar Alterações';
                } catch (error) {
                    console.error('Erro ao carregar proposta:', error);
                    alert('Erro: Proposta não encontrada.');
                    window.location.href = '/propostas.html';
                }
            };
            loadPropostaForEdit(editId);
        }
    }

    if (propostasTable) {
        // (Lógica da Tabela de Propostas)
        const marcarPropostaConcluida = async (id, row) => {
            try {
                const response = await fetch(`/api/propostas/concluir/${id}`, { method: 'POST' });
                if (!response.ok) throw new Error('Falha ao atualizar status.');
                row.classList.add('proposta-concluida');
                const kebabCell = row.querySelector('.kebab-cell');
                if (kebabCell) {
                    kebabCell.innerHTML = '<i class="fas fa-check" style="color: #27ae60; font-size: 1.2rem;"></i>';
                }
                loadDashboardStats(); 
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
                                    <a href="#" class="btn-editar-proposta">Editar</a>
                                    <a href="#" class="btn-concluir-proposta">Marcar como concluído</a>
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
            const row = target.closest('tr');
            if (!row) return;
            if (row.classList.contains('proposta-concluida')) {
                return; 
            }
            const id = parseInt(row.getAttribute('data-proposta-id'));
            if (target.classList.contains('btn-editar-proposta')) {
                window.location.href = `/cadastro-proposta.html?editId=${id}`;
            }
            if (target.classList.contains('btn-concluir-proposta')) {
                if (confirm(`Tem certeza que deseja marcar a proposta "${row.cells[0].textContent}" como concluída?`)) {
                    marcarPropostaConcluida(id, row);
                }
            }
            if (target.closest('.kebab-btn')) {
                document.querySelectorAll('.kebab-menu.open').forEach(menu => {
                    if (menu !== target.closest('.kebab-menu')) {
                        menu.classList.remove('open');
                    }
                });
                target.closest('.kebab-menu').classList.toggle('open');
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


    // ------------------------------------------------------------------
    // --- NOVO: LÓGICA DA PÁGINA DE CONFIGURAÇÕES ---
    // ------------------------------------------------------------------
    const configForm = document.getElementById('config-form-geral');
    if (configForm) {
        let dadosOriginaisDaEmpresa = {}; // Armazena os dados carregados
        const saveBar = document.getElementById('save-bar');
        const saveButton = document.getElementById('save-config-btn');
        const cancelButton = document.getElementById('cancel-config-btn');
        const inputs = configForm.querySelectorAll('input, select, textarea');

        // --- 1. Lógica de Salvar/Cancelar ---
        const mostrarSaveBar = () => {
            if (saveBar) saveBar.classList.add('visible');
        };
        const esconderSaveBar = () => {
            if (saveBar) saveBar.classList.remove('visible');
        };

        // Monitora qualquer mudança nos inputs
        const monitorarMudancas = () => {
            inputs.forEach(input => {
                input.addEventListener('input', mostrarSaveBar);
            });
        };

        // Função para preencher o formulário
        const preencherFormulario = (dados) => {
            for (const key in dados) {
                const input = configForm.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = dados[key];
                }
            }
        };

        // Carrega os dados da empresa
        const carregarDadosEmpresa = async () => {
            try {
                const response = await fetch('/api/empresa');
                if (!response.ok) throw new Error('Falha ao carregar dados da empresa');
                dadosOriginaisDaEmpresa = await response.json();
                preencherFormulario(dadosOriginaisDaEmpresa);
                // Começa a monitorar *depois* que os dados são carregados
                monitorarMudancas(); 
            } catch (error) {
                console.error(error);
                alert('Não foi possível carregar as configurações da empresa.');
            }
        };

        // Ação do Botão Cancelar
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                if (confirm('Descartar alterações não salvas?')) {
                    preencherFormulario(dadosOriginaisDaEmpresa); // Restaura dados originais
                    esconderSaveBar();
                }
            });
        }

        // Ação do Botão Salvar
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                // Validação de campos obrigatórios
                let formularioValido = true;
                inputs.forEach(input => {
                    // Limpa bordas de erro antigas
                    input.style.borderColor = '#4a627a';
                    // Checa se é obrigatório e está vazio
                    if (input.hasAttribute('required') && input.value.trim() === "") {
                        formularioValido = false;
                        input.style.borderColor = '#e74c3c'; // Destaca o campo inválido
                    }
                });

                if (!formularioValido) {
                    alert('Por favor, preencha todos os campos obrigatórios (destacados em vermelho).');
                    return;
                }

                // Coleta os dados
                const formData = new FormData(configForm);
                const novosDados = Object.fromEntries(formData.entries());

                try {
                    const response = await fetch('/api/empresa', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(novosDados)
                    });

                    if (!response.ok) throw new Error('Falha ao salvar');

                    alert('Configurações salvas com sucesso!');
                    dadosOriginaisDaEmpresa = novosDados; // Atualiza os dados originais
                    esconderSaveBar();

                } catch (error) {
                    console.error(error);
                    alert('Erro ao salvar as configurações.');
                }
            });
        }

        // --- 2. Lógica do Tamanho da Fonte ---
        const btnDecrease = document.getElementById('font-decrease');
        const btnIncrease = document.getElementById('font-increase');

        const mudarTamanhoFonte = (direcao) => {
            const root = document.documentElement;
            // Pega o valor atual, remove o '%' e converte para número
            let tamanhoAtualCSS = getComputedStyle(root).getPropertyValue('--base-font-size-percent').trim().replace('%', '');
            let tamanhoAtual = parseInt(tamanhoAtualCSS || '100');

            if (direcao === 'increase' && tamanhoAtual < 130) { // Limite máximo
                tamanhoAtual += 10;
            } else if (direcao === 'decrease' && tamanhoAtual > 70) { // Limite mínimo
                tamanhoAtual -= 10;
            }
            
            root.style.setProperty('--base-font-size-percent', `${tamanhoAtual}%`);
            localStorage.setItem('fontSize', tamanhoAtual.toString());
            mostrarSaveBar(); // Alterar a fonte também é uma "mudança"
        };

        if (btnIncrease && btnDecrease) {
            btnIncrease.addEventListener('click', () => mudarTamanhoFonte('increase'));
            btnDecrease.addEventListener('click', () => mudarTamanhoFonte('decrease'));
        }

        // --- 3. Carregamento Inicial ---
        carregarDadosEmpresa();
    }
});