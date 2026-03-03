/**
 * СКРИПТ ДЛЯ СТРАНИЦЫ КОРЗИНЫ - ОСНОВНАЯ ЛОГИКА
 * Отвечает за:
 * - загрузку товаров из корзины
 * - отображение товаров
 * - удаление товаров из корзины
 */

// Данные корзины
let cartItems = []; // ID товаров
let cartGoods = []; // Полные данные товаров

// Элементы DOM
const cartContainer = document.getElementById('cart-container');
const orderSection = document.getElementById('order-section');
const totalGoodsPriceSpan = document.getElementById('total-goods-price');
const deliveryPriceSpan = document.getElementById('delivery-price');
const totalOrderPriceSpan = document.getElementById('total-order-price');
const deliveryDateInput = document.getElementById('delivery-date');
const deliveryIntervalSelect = document.getElementById('delivery-interval');

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница корзины загружена');
    
    // Загружаем товары из корзины
    loadCartItems();
    
    // Устанавливаем минимальную дату для доставки (сегодня + 1 день)
    setMinDeliveryDate();
    
    // Добавляем обработчики для расчета стоимости доставки
    if (deliveryDateInput) {
        deliveryDateInput.addEventListener('change', updateTotalPrice);
    }
    if (deliveryIntervalSelect) {
        deliveryIntervalSelect.addEventListener('change', updateTotalPrice);
    }
    
    // Обновляем счетчик корзины в шапке
    updateCartCount();
});

/**
 * ЗАГРУЗКА ТОВАРОВ ИЗ КОРЗИНЫ
 * Получает ID из localStorage и запрашивает данные с API
 */
async function loadCartItems() {
    // Получаем ID товаров из localStorage
    cartItems = getCart();
    
    if (cartItems.length === 0) {
        // Корзина пуста
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Корзина пуста</p>
                <p>Перейдите в <a href="../index.html">каталог</a>, чтобы добавить товары</p>
            </div>
        `;
        if (orderSection) {
            orderSection.style.display = 'none';
        }
        return;
    }
    
    // Показываем форму оформления
    if (orderSection) {
        orderSection.style.display = 'block';
    }
    
    // Показываем загрузку
    cartContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
    
    try {
        // Загружаем данные о каждом товаре по отдельности
        const goodsPromises = cartItems.map(id => getGoodById(id));
        cartGoods = await Promise.all(goodsPromises);
        
        console.log(`Загружено товаров: ${cartGoods.length}`);
        
        // Отображаем товары
        displayCartItems();
        
        // Обновляем общую стоимость
        updateTotalPrice();
        
    } catch (error) {
        console.error('Ошибка загрузки товаров корзины:', error);
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Ошибка загрузки товаров</p>
                <p><button onclick="location.reload()" class="btn-primary">Повторить</button></p>
            </div>
        `;
        if (notifications) {
            notifications.error('Не удалось загрузить товары из корзины');
        }
    }
}

/**
 * ОТОБРАЖЕНИЕ ТОВАРОВ В КОРЗИНЕ
 */
function displayCartItems() {
    if (cartGoods.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Корзина пуста</p>
                <p><a href="../index.html">Перейти в каталог</a></p>
            </div>
        `;
        return;
    }
    
    cartContainer.innerHTML = '';
    
    cartGoods.forEach(good => {
        const item = createCartItem(good);
        cartContainer.appendChild(item);
    });
}

/**
 * СОЗДАНИЕ ЭЛЕМЕНТА ТОВАРА В КОРЗИНЕ
 * @param {Object} good - данные товара
 * @returns {HTMLElement} - DOM элемент
 */
function createCartItem(good) {
    const item = document.createElement('div');
    item.className = 'cart-item';
    item.dataset.id = good.id;
    
    const currentPrice = good.discount_price || good.actual_price;
    
    item.innerHTML = `
        <img src="${good.image_url}" alt="${good.name}" class="cart-item__image"
             onerror="this.src='https://via.placeholder.com/150'">
        <h3 class="cart-item__title" title="${good.name}">${truncateText(good.name, 50)}</h3>
        <div class="cart-item__rating">★ ${good.rating}</div>
        <div class="cart-item__price">${currentPrice} ₽</div>
        <button class="cart-item__remove">Удалить</button>
    `;
    
    // Обработчик удаления
    const removeBtn = item.querySelector('.cart-item__remove');
    removeBtn.addEventListener('click', () => {
        removeFromCart(good.id);
    });
    
    return item;
}

/**
 * УДАЛЕНИЕ ТОВАРА ИЗ КОРЗИНЫ
 * @param {number} goodId - ID товара
 */
function removeFromCart(goodId) {
    // Удаляем из массивов
    cartItems = cartItems.filter(id => id !== goodId);
    cartGoods = cartGoods.filter(g => g.id !== goodId);
    
    // Сохраняем в localStorage
    saveCart(cartItems);
    
    // Удаляем элемент со страницы
    const item = document.querySelector(`.cart-item[data-id="${goodId}"]`);
    if (item) {
        item.remove();
    }
    
    if (notifications) {
        notifications.info('Товар удален из корзины');
    }
    
    // Если корзина пуста, показываем сообщение
    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Корзина пуста</p>
                <p><a href="../index.html">Перейти в каталог</a></p>
            </div>
        `;
        if (orderSection) {
            orderSection.style.display = 'none';
        }
    } else {
        // Обновляем общую стоимость
        updateTotalPrice();
    }
    
    // Обновляем счетчик в шапке
    updateCartCount();
}

/**
 * УСТАНОВКА МИНИМАЛЬНОЙ ДАТЫ ДОСТАВКИ
 * Завтрашний день (нельзя выбрать сегодня)
 */
function setMinDeliveryDate() {
    if (!deliveryDateInput) return;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    deliveryDateInput.min = `${year}-${month}-${day}`;
    deliveryDateInput.value = `${year}-${month}-${day}`;
}

/**
 * ОБНОВЛЕНИЕ ОБЩЕЙ СТОИМОСТИ ЗАКАЗА
 * Учитывает стоимость товаров и доставки
 */
function updateTotalPrice() {
    if (!totalGoodsPriceSpan || !deliveryPriceSpan || !totalOrderPriceSpan) return;
    
    // Сумма товаров
    const goodsTotal = cartGoods.reduce((sum, good) => {
        return sum + (good.discount_price || good.actual_price);
    }, 0);
    
    totalGoodsPriceSpan.textContent = goodsTotal;
    
    // Стоимость доставки
    const deliveryCost = calculateDeliveryCost();
    deliveryPriceSpan.textContent = deliveryCost;
    
    // Итоговая стоимость
    totalOrderPriceSpan.textContent = goodsTotal + deliveryCost;
}

/**
 * РАСЧЕТ СТОИМОСТИ ДОСТАВКИ
 * Базовая: 200 руб.
 * Вечером в будни (18:00-22:00): +200 руб.
 * В выходные: +300 руб.
 * @returns {number} - стоимость доставки
 */
function calculateDeliveryCost() {
    let cost = 200; // Базовая стоимость
    
    const deliveryDate = deliveryDateInput ? deliveryDateInput.value : null;
    const deliveryInterval = deliveryIntervalSelect ? deliveryIntervalSelect.value : null;
    
    if (!deliveryDate || !deliveryInterval) {
        return cost;
    }
    
    // Определяем день недели (0 - воскресенье, 6 - суббота)
    const date = new Date(deliveryDate);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Проверяем, вечерний ли интервал
    const isEvening = deliveryInterval === '18:00-22:00';
    
    if (isWeekend) {
        cost += 300; // Выходные +300
    } else if (isEvening) {
        cost += 200; // Вечер в будни +200
    }
    
    return cost;
}

/**
 * ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
 */

function getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = cart.length;
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Делаем функции доступными глобально
window.removeFromCart = removeFromCart;
window.updateTotalPrice = updateTotalPrice;
