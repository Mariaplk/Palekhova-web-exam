/**
 * API ДЛЯ ВЗАИМОДЕЙСТВИЯ С СЕРВЕРОМ
 */

const API_KEY = '4077aed9-7913-4553-941e-c2445b06e012';
const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';

// Используем другой прокси
const PROXY_URL = 'https://api.allorigins.win/get?url=';

function buildApiUrl(endpoint, params = {}) {
    const originalUrl = new URL(`${API_BASE_URL}${endpoint}`);
    originalUrl.searchParams.append('api_key', API_KEY);
    
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            originalUrl.searchParams.append(key, params[key]);
        }
    });
    
    // allorigins.win возвращает данные в поле contents
    return PROXY_URL + encodeURIComponent(originalUrl.toString());
}

async function apiGet(endpoint, params = {}) {
    try {
        const url = buildApiUrl(endpoint, params);
        console.log('Запрос через прокси:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Ответ от прокси:', data);
        
        // allorigins.win возвращает { contents: "..." }
        if (data && data.contents) {
            return JSON.parse(data.contents);
        } else {
            throw new Error('Неверный формат ответа от прокси');
        }
    } catch (error) {
        console.error('Ошибка в GET запросе:', error);
        throw error;
    }
}

// Остальные функции без изменений
async function getGoods(params = {}) {
    return apiGet('/goods', params);
}

async function getGoodById(goodId) {
    return apiGet(`/goods/${goodId}`);
}

async function getAutocomplete(query) {
    return apiGet('/autocomplete', { query });
}

async function getOrders() {
    return apiGet('/orders');
}

async function getOrderById(orderId) {
    return apiGet(`/orders/${orderId}`);
}

// Для POST/PUT/DELETE нужно отдельно, но пока оставим
console.log('✅ api.js с allorigins.win загружен');
