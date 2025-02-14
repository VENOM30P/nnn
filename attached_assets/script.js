
// Funções de utilidade
const showNotification = (message, isError = false) => {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};

const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);
};

// Funções principais
const addToCart = async (productId) => {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_id: productId })
        });

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error('Resposta inválida do servidor - esperado JSON');
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
            showNotification('Produto adicionado ao carrinho!');
            const button = document.querySelector(`button[onclick="addToCart(${productId})"]`);
            if (button) {
                button.textContent = 'Adicionado ✓';
                setTimeout(() => {
                    button.textContent = 'Adicionar ao Carrinho';
                }, 2000);
            }
        } else {
            throw new Error(data.error || 'Falha ao adicionar produto');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification(error.message, true);
    }
};

const initPayment = async () => {
    try {
        const response = await fetch('/api/payment/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new Error('Resposta inválida do servidor - esperado JSON');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao gerar PIX: ${errorText}`);
        }
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);

        document.getElementById('pix-code').textContent = data.pix_code;
        document.getElementById('payment-modal').style.display = 'flex';
        
        checkPaymentStatus();
    } catch (error) {
        showNotification(error.message, true);
    }
};

const checkPaymentStatus = async () => {
    const statusElement = document.getElementById('payment-status');
    let attempts = 0;

    const checkStatus = async () => {
        try {
            const response = await fetch('/api/payment/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (data.status === 'approved') {
                statusElement.textContent = 'Pagamento aprovado!';
                showNotification('Pagamento confirmado!');
                setTimeout(() => window.location.href = '/', 2000);
                return;
            } else if (data.status === 'rejected') {
                statusElement.textContent = 'Pagamento rejeitado';
                return;
            }

            if (attempts++ < 30) {
                statusElement.textContent = 'Aguardando pagamento...';
                setTimeout(checkStatus, 2000);
            }
        } catch (error) {
            statusElement.textContent = 'Erro ao verificar pagamento';
        }
    };

    checkStatus();
};

const copyPixCode = () => {
    const pixCode = document.getElementById('pix-code').textContent;
    navigator.clipboard.writeText(pixCode);
    showNotification('Código PIX copiado!');
};

const closePaymentModal = () => {
    document.getElementById('payment-modal').style.display = 'none';
};

const subscribe = async (planId) => {
    try {
        showNotification('Processando sua assinatura...');
        // Simulando processamento
        await new Promise(resolve => setTimeout(resolve, 1500));
        showNotification('Assinatura realizada com sucesso!');
    } catch (error) {
        showNotification('Erro ao processar assinatura', true);
    }
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script carregado e inicializado');
});

// Exportando funções para uso global
window.addToCart = addToCart;
window.subscribe = subscribe;
window.initPayment = initPayment;
window.copyPixCode = copyPixCode;
window.closePaymentModal = closePaymentModal;
