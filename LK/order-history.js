/**
 * СКРИПТ ДЛЯ ОТОБРАЖЕНИЯ ИСТОРИИ ЗАКАЗОВ
 * Отвечает за:
 * - загрузку списка заказов с сервера
 * - отображение заказов в таблице
 * - просмотр деталей заказа
 */

// Данные заказов
let orders = [];

// Элементы DOM
const ordersContainer = document.getElementById('orders-container');

// Модальные окна
const viewModal = document.getElementById('view-modal');
const viewOrderIdSpan = document.getElementById('view-order-id');
const viewOrderDetails = document.getElementById('view-order-details');

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница истории заказов загружена');
    
    // Загружаем заказы
    loadOrders();
    
    // Добавляем обработчики для закрытия модальных окон
    setupModalHandlers();
});

/**
 * ЗАГРУЗКА ЗАКАЗОВ С СЕРВЕРА
 */
async function loadOrders() {
    if (!ordersContainer) return;
    
    ordersContainer.innerHTML = '<div class="loading">Загрузка заказов...</div>';
    
    try {
        orders = await getOrders();
        console.log(`Загружено заказов: ${orders.length}`);
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="no-orders">
                    <p>У вас пока нет заказов</p>
                    <p><a href="../index.html" class="btn-primary">Перейти в каталог</a></p>
                </div>
            `;
        } else {
            displayOrders(orders);
        }
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        ordersContainer.innerHTML = `
            <div class="no-orders">
                <p>Ошибка загрузки заказов</p>
                <p><button onclick="location.reload()" class="btn-primary">Повторить</button></p>
            </div>
        `;
        if (notifications) {
            notifications.error('Не удалось загрузить историю заказов');
        }
    }
}

/**
 * ОТОБРАЖЕНИЕ ЗАКАЗОВ В ТАБЛИЦЕ
 * @param {Array} orders - массив заказов
 */
function displayOrders(orders) {
    // Сортируем заказы по дате создания (новые сверху)
    const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
    );
    
    let tableHTML = `
        <div class="orders-table-container">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Дата заказа</th>
                        <th>Состав</th>
                        <th>Сумма</th>
                        <th>Дата доставки</th>
                        <th>Интервал</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    sortedOrders.forEach((order, index) => {
        // Форматируем дату заказа
        const orderDate = new Date(order.created_at);
        const formattedOrderDate = orderDate.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Формируем строку с составом заказа
        const goodsCount = order.good_ids.length;
        const goodsText = goodsCount === 1 ? '1 товар' : 
                         (goodsCount >= 2 && goodsCount <= 4) ? `${goodsCount} товара` : 
                         `${goodsCount} товаров`;
        
        // Рассчитываем сумму (нужно будет загрузить товары)
        // Пока показываем заглушку
        const total = '...';
        
        tableHTML += `
            <tr data-order-id="${order.id}">
                <td>${index + 1}</td>
                <td>${formattedOrderDate}</td>
                <td>${goodsText}</td>
                <td class="order-total-${order.id}">${total} ₽</td>
                <td>${formatDate(order.delivery_date)}</td>
                <td>${order.delivery_interval}</td>
                <td class="order-actions">
                    <button class="action-btn view-btn" onclick="viewOrder(${order.id})">Просмотр</button>
                    <button class="action-btn edit-btn" onclick="editOrder(${order.id})">Редактировать</button>
                    <button class="action-btn delete-btn" onclick="confirmDelete(${order.id})">Удалить</button>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    
    ordersContainer.innerHTML = tableHTML;
    
    // Загружаем суммы заказов
    orders.forEach(order => calculateOrderTotal(order.id));
}

/**
 * РАСЧЕТ ИТОГОВОЙ СУММЫ ЗАКАЗА
 * @param {number} orderId - ID заказа
 */
async function calculateOrderTotal(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    try {
        // Загружаем данные о товарах
        const goodsPromises = order.good_ids.map(id => getGoodById(id));
        const goods = await Promise.all(goodsPromises);
        
        // Считаем сумму
        const total = goods.reduce((sum, good) => {
            return sum + (good.discount_price || good.actual_price);
        }, 0);
        
        // Добавляем стоимость доставки (200 руб. базовая)
        const deliveryCost = calculateDeliveryCostForOrder(order);
        const finalTotal = total + deliveryCost;
        
        // Обновляем ячейку в таблице
        const totalCell = document.querySelector(`.order-total-${orderId}`);
        if (totalCell) {
            totalCell.textContent = `${finalTotal} ₽`;
        }
    } catch (error) {
        console.error(`Ошибка расчета суммы заказа ${orderId}:`, error);
    }
}

/**
 * РАСЧЕТ СТОИМОСТИ ДОСТАВКИ ДЛЯ ЗАКАЗА
 * @param {Object} order - заказ
 * @returns {number} - стоимость доставки
 */
function calculateDeliveryCostForOrder(order) {
    let cost = 200; // Базовая
    
    // Определяем день недели
    const dateParts = order.delivery_date.split('.');
    const dateStr = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Проверяем интервал
    const isEvening = order.delivery_interval === '18:00-22:00';
    
    if (isWeekend) {
        cost += 300;
    } else if (isEvening) {
        cost += 200;
    }
    
    return cost;
}

/**
 * ФОРМАТИРОВАНИЕ ДАТЫ
 * @param {string} dateStr - дата в формате DD.MM.YYYY
 * @returns {string} - отформатированная дата
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    return dateStr; // Уже в нужном формате
}

/**
 * НАСТРОЙКА ОБРАБОТЧИКОВ ДЛЯ МОДАЛЬНЫХ ОКОН
 */
function setupModalHandlers() {
    // Закрытие по клику на крестик
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            viewModal.style.display = 'none';
            document.getElementById('edit-modal').style.display = 'none';
            document.getElementById('delete-modal').style.display = 'none';
        });
    });
    
    // Закрытие по клику вне модального окна
    window.addEventListener('click', (e) => {
        if (e.target === viewModal) {
            viewModal.style.display = 'none';
        }
        if (e.target === document.getElementById('edit-modal')) {
            document.getElementById('edit-modal').style.display = 'none';
        }
        if (e.target === document.getElementById('delete-modal')) {
            document.getElementById('delete-modal').style.display = 'none';
        }
    });
}

/**
 * ПРОСМОТР ЗАКАЗА
 * @param {number} orderId - ID заказа
 */
async function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    viewOrderIdSpan.textContent = orderId;
    viewOrderDetails.innerHTML = '<div class="loading">Загрузка...</div>';
    viewModal.style.display = 'block';
    
    try {
        // Загружаем товары
        const goodsPromises = order.good_ids.map(id => getGoodById(id));
        const goods = await Promise.all(goodsPromises);
        
        // Рассчитываем сумму
        const total = goods.reduce((sum, good) => {
            return sum + (good.discount_price || good.actual_price);
        }, 0);
        
        const deliveryCost = calculateDeliveryCostForOrder(order);
        const finalTotal = total + deliveryCost;
        
        // Формируем HTML
        let detailsHTML = `
            <div class="order-detail-row">
                <span class="order-detail-label">Заказчик:</span>
                <span class="order-detail-value">${order.full_name}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Email:</span>
                <span class="order-detail-value">${order.email}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Телефон:</span>
                <span class="order-detail-value">${order.phone}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Адрес доставки:</span>
                <span class="order-detail-value">${order.delivery_address}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Дата доставки:</span>
                <span class="order-detail-value">${order.delivery_date}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Интервал:</span>
                <span class="order-detail-value">${order.delivery_interval}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Комментарий:</span>
                <span class="order-detail-value">${order.comment || '—'}</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Товары:</span>
                <span class="order-detail-value">
                    <ul class="order-goods-list">
        `;
        
        goods.forEach(good => {
            const price = good.discount_price || good.actual_price;
            detailsHTML += `<li>${good.name} - ${price} ₽</li>`;
        });
        
        detailsHTML += `
                    </ul>
                </span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Сумма товаров:</span>
                <span class="order-detail-value">${total} ₽</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">Доставка:</span>
                <span class="order-detail-value">${deliveryCost} ₽</span>
            </div>
            <div class="order-detail-row">
                <span class="order-detail-label">ИТОГО:</span>
                <span class="order-detail-value"><strong>${finalTotal} ₽</strong></span>
            </div>
        `;
        
        viewOrderDetails.innerHTML = detailsHTML;
        
    } catch (error) {
        console.error('Ошибка загрузки деталей заказа:', error);
        viewOrderDetails.innerHTML = '<p class="error">Ошибка загрузки данных</p>';
    }
}

// Делаем функции доступными глобально
window.viewOrder = viewOrder;
