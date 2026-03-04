/**
 * СКРИПТ ДЛЯ СТРАНИЦЫ КОРЗИНЫ
 * Студент: Палехова Мария Алексеевна, группа 241-372
 * 
 * Этот файл отвечает за:
 * - загрузку товаров из localStorage (корзина)
 * - получение полных данных о товарах через API
 * - отображение товаров на странице
 * - удаление товаров из корзины
 * - обновление счетчика корзины в шапке
 */

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
// Массив ID товаров в корзине (числа)
let cartItems = [];
// Массив ПОЛНЫХ данных о товарах (объекты с названием, ценой и т.д.)
let cartGoods = [];

// ========== ПОЛУЧЕНИЕ ССЫЛОК НА ЭЛЕМЕНТЫ DOM ==========
// Контейнер для отображения товаров в корзине
const cartContainer = document.getElementById('cart-container');
// Блок с формой оформления заказа (изначально скрыт)
const orderSection = document.getElementById('order-section');
// Элементы для отображения цен
const totalGoodsPriceSpan = document.getElementById('total-goods-price');
const deliveryPriceSpan = document.getElementById('delivery-price');
const totalOrderPriceSpan = document.getElementById('total-order-price');
// Поля для расчета доставки
const deliveryDateInput = document.getElementById('delivery-date');
const deliveryIntervalSelect = document.getElementById('delivery-interval');

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
 * Срабатывает когда весь HTML загружен и построен
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Страница корзины загружена');
    
    // Загружаем товары из корзины
    loadCartItems();
    
    // Устанавливаем минимальную дату доставки (завтрашний день)
    setMinDeliveryDate();
    
    // Добавляем обработчики для пересчета стоимости доставки
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
 * Асинхронная функция (async) - работает с промисами
 */
async function loadCartItems() {
    // Получаем ID товаров из localStorage
    cartItems = getCart();
    
    // Если корзина пуста (нет ID)
    if (cartItems.length === 0) {
        // Показываем сообщение о пустой корзине с синей кнопкой
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Корзина пуста</p>
                <a href="../index.html" class="catalog-link">Перейти в каталог</a>
            </div>
        `;
        // Скрываем форму оформления заказа
        if (orderSection) {
            orderSection.style.display = 'none';
        }
        return; // Выходим из функции
    }
    
    // Если товары есть - показываем форму оформления
    if (orderSection) {
        orderSection.style.display = 'block';
    }
    
    // Показываем индикатор загрузки
    cartContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
    
    try {
        // ДЛЯ КАЖДОГО ID запрашиваем данные с сервера
        // getGoodById - функция из api.js, возвращает промис
        const goodsPromises = cartItems.map(id => getGoodById(id));
        
        // Ждем, когда ВСЕ промисы выполнятся
        // Promise.all - ждет завершения всех запросов
        cartGoods = await Promise.all(goodsPromises);
        
        console.log(`Загружено товаров: ${cartGoods.length}`);
        
        // Отображаем товары на странице
        displayCartItems();
        
        // Обновляем общую стоимость
        updateTotalPrice();
        
    } catch (error) {
        // Если произошла ошибка (сервер не отвечает и т.д.)
        console.error('Ошибка загрузки товаров корзины:', error);
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Ошибка загрузки</p>
                <a href="../index.html" class="catalog-link">Вернуться в каталог</a>
            </div>
        `;
        // Показываем уведомление об ошибке
        if (notifications) {
            notifications.error('Не удалось загрузить товары из корзины');
        }
    }
}

/**
 * ОТОБРАЖЕНИЕ ТОВАРОВ НА СТРАНИЦЕ
 */
function displayCartItems() {
    // Если после загрузки массив пуст
    if (cartGoods.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Корзина пуста</p>
                <a href="../index.html" class="catalog-link">Перейти в каталог</a>
            </div>
        `;
        return;
    }
    
    // Очищаем контейнер (убираем "Загрузка...")
    cartContainer.innerHTML = '';
    
    // Для каждого товара создаем карточку и добавляем в контейнер
    cartGoods.forEach(good => {
        const item = createCartItem(good);
        cartContainer.appendChild(item);
    });
}

/**
 * СОЗДАНИЕ HTML-ЭЛЕМЕНТА КАРТОЧКИ ТОВАРА
 * @param {Object} good - объект с данными товара из API
 * @returns {HTMLElement} - DOM-элемент карточки
 */
function createCartItem(good) {
    // Создаем div для карточки
    const item = document.createElement('div');
    item.className = 'cart-item'; // Для стилей CSS
    item.dataset.id = good.id;    // Сохраняем ID в data-атрибуте
    
    // Определяем цену (со скидкой или обычную)
    const currentPrice = good.discount_price || good.actual_price;
    
    // Заполняем HTML-содержимое
    // Используем шаблонные строки (``) для вставки переменных
    item.innerHTML = `
        <img src="${good.image_url}" alt="${good.name}" class="cart-item__image"
             onerror="this.src='https://via.placeholder.com/150'">
        <h3 class="cart-item__title" title="${good.name}">${truncateText(good.name, 50)}</h3>
        <div class="cart-item__rating">★ ${good.rating}</div>
        <div class="cart-item__price">${currentPrice} ₽</div>
        <button class="cart-item__remove">Удалить</button>
    `;
    
    // Находим кнопку удаления внутри созданной карточки
    const removeBtn = item.querySelector('.cart-item__remove');
    
    // Добавляем обработчик клика на кнопку удаления
    removeBtn.addEventListener('click', () => {
        removeFromCart(good.id);
    });
    
    return item;
}

/**
 * УДАЛЕНИЕ ТОВАРА ИЗ КОРЗИНЫ
 * @param {number} goodId - ID товара для удаления
 */
function removeFromCart(goodId) {
    // Удаляем ID из массива cartItems
    cartItems = cartItems.filter(id => id !== goodId);
    
    // Удаляем товар из массива cartGoods
    cartGoods = cartGoods.filter(g => g.id !== goodId);
    
    // Сохраняем обновленную корзину в localStorage
    saveCart(cartItems);
    
    // Находим элемент карточки на странице и удаляем его
    const item = document.querySelector(`.cart-item[data-id="${goodId}"]`);
    if (item) {
        item.remove();
    }
    
    // Показываем уведомление
    if (notifications) {
        notifications.info('Товар удален из корзины');
    }
    
    // Если корзина стала пустой
    if (cartItems.length === 0) {
        // Показываем сообщение о пустой корзине
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <p>Корзина пуста</p>
                <a href="../index.html" class="catalog-link">Перейти в каталог</a>
            </div>
        `;
        // Скрываем форму оформления
        if (orderSection) {
            orderSection.style.display = 'none';
        }
    } else {
        // Если товары еще есть - пересчитываем стоимость
        updateTotalPrice();
    }
    
    // Обновляем счетчик корзины в шапке
    updateCartCount();
}

/**
 * УСТАНОВКА МИНИМАЛЬНОЙ ДАТЫ ДОСТАВКИ
 * Запрещаем выбирать прошедшие даты и сегодняшний день
 */
function setMinDeliveryDate() {
    if (!deliveryDateInput) return;
    
    // Получаем текущую дату
    const today = new Date();
    
    // Создаем дату на завтра
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Форматируем в YYYY-MM-DD (требование input type="date")
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    // Устанавливаем минимальную дату и значение по умолчанию
    deliveryDateInput.min = `${year}-${month}-${day}`;
    deliveryDateInput.value = `${year}-${month}-${day}`;
}

/**
 * ОБНОВЛЕНИЕ ОБЩЕЙ СТОИМОСТИ ЗАКАЗА
 * Сумма товаров + стоимость доставки
 */
function updateTotalPrice() {
    // Проверяем, что все нужные элементы существуют
    if (!totalGoodsPriceSpan || !deliveryPriceSpan || !totalOrderPriceSpan) return;
    
    // Суммируем цены всех товаров (со скидкой если есть)
    const goodsTotal = cartGoods.reduce((sum, good) => {
        return sum + (good.discount_price || good.actual_price);
    }, 0); // 0 - начальное значение суммы
    
    totalGoodsPriceSpan.textContent = goodsTotal;
    
    // Рассчитываем стоимость доставки
    const deliveryCost = calculateDeliveryCost();
    deliveryPriceSpan.textContent = deliveryCost;
    
    // Итог = товары + доставка
    totalOrderPriceSpan.textContent = goodsTotal + deliveryCost;
}

/**
 * РАСЧЕТ СТОИМОСТИ ДОСТАВКИ ПО ЗАДАНИЮ
 * Базовая: 200 руб.
 * Вечером в будни (18:00-22:00): +200 руб.
 * В выходные: +300 руб.
 * @returns {number} - стоимость доставки
 */
function calculateDeliveryCost() {
    let cost = 200; // Базовая стоимость
    
    // Получаем выбранные дату и интервал
    const deliveryDate = deliveryDateInput ? deliveryDateInput.value : null;
    const deliveryInterval = deliveryIntervalSelect ? deliveryIntervalSelect.value : null;
    
    // Если что-то не выбрано - возвращаем базовую стоимость
    if (!deliveryDate || !deliveryInterval) {
        return cost;
    }
    
    // Определяем день недели (0 - воскресенье, 6 - суббота)
    const date = new Date(deliveryDate);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Сб или Вс
    
    // Проверяем, выбран ли вечерний интервал
    const isEvening = deliveryInterval === '18:00-22:00';
    
    // Применяем правила из задания
    if (isWeekend) {
        cost += 300; // Выходные +300
    } else if (isEvening) {
        cost += 200; // Вечер в будни +200
    }
    
    return cost;
}

/**
 * ПОЛУЧЕНИЕ КОРЗИНЫ ИЗ LOCALSTORAGE
 * @returns {Array} - массив ID товаров
 */
function getCart() {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : []; // Если корзина есть - парсим, иначе пустой массив
    } catch (e) {
        console.error('Ошибка чтения корзины:', e);
        return [];
    }
}

/**
 * СОХРАНЕНИЕ КОРЗИНЫ В LOCALSTORAGE
 * @param {Array} cart - массив ID товаров
 */
function saveCart(cart) {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
        console.error('Ошибка сохранения корзины:', e);
    }
}

/**
 * ОБНОВЛЕНИЕ СЧЕТЧИКА КОРЗИНЫ В ШАПКЕ
 */
function updateCartCount() {
    const cart = getCart();
    // Находим все элементы с классом cart-count (обычно в шапке)
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = cart.length; // Ставим количество товаров
    });
}

/**
 * УСЕЧЕНИЕ ДЛИННОГО ТЕКСТА
 * @param {string} text - исходный текст
 * @param {number} maxLength - максимальная длина
 * @returns {string} - усеченный текст с многоточием
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ========== ЭКСПОРТ ФУНКЦИЙ ==========
// Делаем функции доступными глобально для других скриптов (например, manager.js)
window.removeFromCart = removeFromCart;
window.updateTotalPrice = updateTotalPrice;
