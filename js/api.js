/**
 * API ДЛЯ ВЗАИМОДЕЙСТВИЯ С СЕРВЕРОМ
 * Содержит все функции для работы с API Московского Политеха
 */

// ========== НАСТРОЙКИ API ==========
// Базовый URL API (для GitHub Pages используем этот адрес)
const API_BASE_URL = 'https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api';

// Мой API ключ
const API_KEY = '4077aed9-7913-4553-941e-c2445b06e012';

/**
 * ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: формирует URL с параметрами
 * @param {string} endpoint - конечная точка API (например, /goods)
 * @param {Object} params - дополнительные параметры запроса (page, query и т.д.)
 * @returns {string} - полный URL для запроса
 */
function buildApiUrl(endpoint, params = {}) {
    // Создаем новый URL объект
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    // Добавляем API ключ к каждому запросу 
    url.searchParams.append('api_key', API_KEY);
    
    // Добавляем все дополнительные параметры 
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });
    
    return url.toString();
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ GET-ЗАПРОСОВ
 * Используется для получения данных с сервера
 * @param {string} endpoint - конечная точка API
 * @param {Object} params - параметры запроса
 * @returns {Promise} - промис с данными ответа
 */
async function apiGet(endpoint, params = {}) {
    try {
        // Формируем URL и отправляем запрос
        const url = buildApiUrl(endpoint, params);
        console.log('Отправляем GET запрос на:', url); // Для отладки
        
        const response = await fetch(url);
        
        // Проверяем, успешен ли запрос
        if (!response.ok) {
            // Пытаемся получить текст ошибки от сервера
            const errorText = await response.text();
            throw new Error(`HTTP ошибка! Статус: ${response.status}, Сообщение: ${errorText}`);
        }
        
        // Преобразуем ответ в JSON
        return await response.json();
    } catch (error) {
        console.error('Ошибка в GET запросе:', error);
        throw error; // Пробрасываем ошибку дальше для обработки в других функциях
    }
}

/**
 * УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ДЛЯ POST-ЗАПРОСОВ
 * Используется для создания новых записей (оформление заказа)
 * @param {string} endpoint - конечная точка API
 * @param {Object} data - данные для отправки (в формате JSON)
 * @returns {Promise} - промис с данными ответа
 */
async function apiPost(endpoint, data) {
    try {
        const url = buildApiUrl(endpoint);
        console.log('Отправляем POST запрос на:', url); // Для отладки
        console.log('Данные:', data); // Для отладки
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Указываем, что отправляем JSON
            },
            body: JSON.stringify(data) // Преобразуем объект в JSON строку
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
 * Используется для обновления существующих записей (редактирование заказа)
 * @param {string} endpoint - конечная точка API
 * @param {Object} data - данные для отправки (в формате JSON)
 * @returns {Promise} - промис с данными ответа
 */
async function apiPut(endpoint, data) {
    try {
        const url = buildApiUrl(endpoint);
        console.log('Отправляем PUT запрос на:', url); // Для отладки
        console.log('Данные:', data); // Для отладки
        
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
 * Используется для удаления записей (удаление заказа)
 * @param {string} endpoint - конечная точка API
 * @returns {Promise} - промис с данными ответа
 */
async function apiDelete(endpoint) {
    try {
        const url = buildApiUrl(endpoint);
        console.log('Отправляем DELETE запрос на:', url); // Для отладки
        
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

/**
 * Получает список товаров с возможностью фильтрации и пагинации
 * @param {Object} params - параметры запроса 
 * @param {number} params.page - номер страницы
 * @param {number} params.per_page - количество товаров на странице
 * @param {string} params.query - поисковый запрос
 * @returns {Promise} - промис с массивом товаров
 */
async function getGoods(params = {}) {
    return apiGet('/goods', params);
}

/**
 * Получает данные конкретного товара по ID
 * @param {number} goodId - ID товара
 * @returns {Promise} - промис с данными товара
 */
async function getGoodById(goodId) {
    return apiGet(`/goods/${goodId}`);
}

/**
 * Получает варианты автодополнения для поиска
 * @param {string} query - поисковый запрос
 * @returns {Promise} - промис с массивом подсказок
 */
async function getAutocomplete(query) {
    return apiGet('/autocomplete', { query });
}

// ========== ФУНКЦИИ ДЛЯ РАБОТЫ С ЗАКАЗАМИ ==========

/**
 * Получает список заказов текущего пользователя
 * @returns {Promise} - промис с массивом заказов
 */
async function getOrders() {
    return apiGet('/orders');
}

/**
 * Получает данные конкретного заказа по ID
 * @param {number} orderId - ID заказа
 * @returns {Promise} - промис с данными заказа
 */
async function getOrderById(orderId) {
    return apiGet(`/orders/${orderId}`);
}

/**
 * Создает новый заказ
 * @param {Object} orderData - данные заказа
 * @returns {Promise} - промис с созданным заказом
 */
async function createOrder(orderData) {
    return apiPost('/orders', orderData);
}

/**
 * Обновляет существующий заказ
 * @param {number} orderId - ID заказа
 * @param {Object} orderData - обновленные данные заказа
 * @returns {Promise} - промис с обновленным заказом
 */
async function updateOrder(orderId, orderData) {
    return apiPut(`/orders/${orderId}`, orderData);
}

/**
 * Удаляет заказ
 * @param {number} orderId - ID заказа
 * @returns {Promise} - промис с результатом удаления
 */
async function deleteOrder(orderId) {
    return apiDelete(`/orders/${orderId}`);
}
