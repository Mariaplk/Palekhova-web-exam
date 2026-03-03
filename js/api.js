/**
 * API ДЛЯ ВЗАИМОДЕЙСТВИЯ С СЕРВЕРОМ
 */

// ВАШ ПЕРСОНАЛЬНЫЙ API КЛЮЧ
const API_KEY = '4077aed9-7913-4553-941e-c2445b06e012';

// ИСПОЛЬЗУЕМ ПРОКСИ для обхода блокировок!
const PROXY_URL = 'https://corsproxy.io/?';
const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';

/**
 * ФОРМИРУЕТ URL ЧЕРЕЗ ПРОКСИ
 */
function buildApiUrl(endpoint, params = {}) {
    // Сначала формируем оригинальный URL с параметрами
    const originalUrl = new URL(`${API_BASE_URL}${endpoint}`);
    originalUrl.searchParams.append('api_key', API_KEY);
    
    // Добавляем все дополнительные параметры
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            originalUrl.searchParams.append(key, params[key]);
        }
    });
    
    // Возвращаем URL через прокси (кодируем оригинальный URL)
    return PROXY_URL + encodeURIComponent(originalUrl.toString());
}

/**
 * GET-ЗАПРОС ЧЕРЕЗ ПРОКСИ
 */
async function apiGet(endpoint, params = {}) {
    try {
        const url = buildApiUrl(endpoint, params);
        console.log('Запрос через прокси:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Получены данные:', data);
        return data;
    } catch (error) {
        console.error('Ошибка в GET запросе:', error);
        throw error;
    }
}

// ===== ФУНКЦИИ ДЛЯ ТОВАРОВ =====
async function getGoods(params = {}) {
    return apiGet('/goods', params);
}

async function getGoodById(goodId) {
    return apiGet(`/goods/${goodId}`);
}

async function getAutocomplete(query) {
    return apiGet('/autocomplete', { query });
}

// ===== ФУНКЦИИ ДЛЯ ЗАКАЗОВ =====
async function getOrders() {
    return apiGet('/orders');
}

async function getOrderById(orderId) {
    return apiGet(`/orders/${orderId}`);
}

async function createOrder(orderData) {
    // Для POST запросов прокси может не работать, но пока оставим
    const url = `https://corsproxy.io/?${encodeURIComponent(API_BASE_URL + '/orders?api_key=' + API_KEY)}`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    });
    
    return await response.json();
}

async function updateOrder(orderId, orderData) {
    const url = `https://corsproxy.io/?${encodeURIComponent(API_BASE_URL + '/orders/' + orderId + '?api_key=' + API_KEY)}`;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    });
    
    return await response.json();
}

async function deleteOrder(orderId) {
    const url = `https://corsproxy.io/?${encodeURIComponent(API_BASE_URL + '/orders/' + orderId + '?api_key=' + API_KEY)}`;
    
    const response = await fetch(url, {
        method: 'DELETE'
    });
    
    return await response.json();
}

// Для отладки
console.log('✅ api.js с прокси загружен');
