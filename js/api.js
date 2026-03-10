/**
 * API ДЛЯ ВЗАИМОДЕЙСТВИЯ С СЕРВЕРОМ
 */

// ========== НАСТРОЙКИ API ==========
const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';
const API_KEY = '4077aed9-7913-4553-941e-c2445b06e012';

/**
 * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: формирует URL с параметрами
 */
function buildApiUrl(endpoint, params = {}) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', API_KEY);
    
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });
    
    return url.toString();
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ GET-ЗАПРОСОВ
 * ПОЛУЧАЕМ ГОТОВЫЙ JSON!
 */
async function apiGet(endpoint, params = {}) {
    try {
        const url = buildApiUrl(endpoint, params);
        console.log('Отправляем GET запрос на:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ошибка! Статус: ${response.status}, Сообщение: ${errorText}`);
        }
        
        // ========== ПОЛУЧАЕМ ГОТОВЫЙ JSON ==========
        const data = await response.json(); // ← ПОЛУЧАЕМ УЖЕ РАСПАРСЕННЫЙ ОБЪЕКТ!
        console.log('Получены данные:', data);
        
        return data; // ← ВОЗВРАЩАЕМ ОБЪЕКТ!
        
    } catch (error) {
        console.error('Ошибка в GET запросе:', error);
        throw error;
    }
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ POST-ЗАПРОСОВ
 */
async function apiPost(endpoint, data) {
    try {
        const url = buildApiUrl(endpoint);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ошибка! Статус: ${response.status}, Сообщение: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка в POST запросе:', error);
        throw error;
    }
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ PUT-ЗАПРОСОВ
 */
async function apiPut(endpoint, data) {
    try {
        const url = buildApiUrl(endpoint);
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ошибка! Статус: ${response.status}, Сообщение: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка в PUT запросе:', error);
        throw error;
    }
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ DELETE-ЗАПРОСОВ
 */
async function apiDelete(endpoint) {
    try {
        const url = buildApiUrl(endpoint);
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ошибка! Статус: ${response.status}, Сообщение: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Ошибка в DELETE запросе:', error);
        throw error;
    }
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ТОВАРАМИ ==========
async function getGoods(params = {}) {
    return apiGet('/goods', params);
}

async function getGoodById(goodId) {
    return apiGet(`/goods/${goodId}`);
}

async function getAutocomplete(query) {
    return apiGet('/autocomplete', { query });
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАКАЗАМИ ==========
async function getOrders() {
    return apiGet('/orders');
}

async function getOrderById(orderId) {
    return apiGet(`/orders/${orderId}`);
}

async function createOrder(orderData) {
    return apiPost('/orders', orderData);
}

async function updateOrder(orderId, orderData) {
    return apiPut(`/orders/${orderId}`, orderData);
}

async function deleteOrder(orderId) {
    return apiDelete(`/orders/${orderId}`);
}

console.log('✅ api.js загружен (версия с JSON)');
