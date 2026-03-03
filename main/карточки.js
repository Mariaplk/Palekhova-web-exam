/**
 * СКРИПТ ДЛЯ СОЗДАНИЯ КАРТОЧЕК ТОВАРОВ
 * Отвечает за создание HTML-карточек товаров
 * и управление добавлением/удалением из корзины
 */

/**
 * СОЗДАНИЕ КАРТОЧКИ ТОВАРА
 * @param {Object} good - данные товара из API
 * @param {boolean} inCart - находится ли товар в корзине
 * @returns {HTMLElement} - DOM элемент карточки
 */
function createGoodCard(good, inCart = false) {
    const card = document.createElement('div');
    card.className = 'good-card';
    card.dataset.id = good.id;
    
    // Определяем цены
    const currentPrice = good.discount_price || good.actual_price;
    const oldPrice = good.discount_price ? good.actual_price : null;
    
    // Создаем внутреннюю структуру карточки
    card.innerHTML = `
        <img src="${good.image_url}" alt="${good.name}" class="good-card__image" 
             onerror="this.src='https://via.placeholder.com/200x200?text=Нет+фото'">
        <h3 class="good-card__title" title="${good.name}">${truncateText(good.name, 50)}</h3>
        <div class="good-card__rating">★ ${good.rating} / 5</div>
        <div class="good-card__price">
            ${currentPrice} ₽
            ${oldPrice ? `<span class="good-card__old-price">${oldPrice} ₽</span>` : ''}
        </div>
        <button class="good-card__button ${inCart ? 'in-cart' : ''}">
            ${inCart ? '✓ В корзине' : 'В корзину'}
        </button>
    `;
    
    // Добавляем обработчик на кнопку
    const button = card.querySelector('.good-card__button');
    button.addEventListener('click', (e) => {
        e.stopPropagation(); // Предотвращаем всплытие события
        toggleCartItem(good.id, button);
    });
    
    return card;
}

/**
 * УСЕЧЕНИЕ ДЛИННОГО ТЕКСТА
 * @param {string} text - исходный текст
 * @param {number} maxLength - максимальная длина
 * @returns {string} - усеченный текст
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * ПЕРЕКЛЮЧЕНИЕ ТОВАРА В КОРЗИНЕ
 * @param {number} goodId - ID товара
 * @param {HTMLElement} button - кнопка, на которую нажали
 */
function toggleCartItem(goodId, button) {
    // Получаем текущую корзину
    const cart = window.getCart ? window.getCart() : getCartFallback();
    
    // Проверяем, есть ли товар в корзине
    const index = cart.indexOf(goodId);
    
    if (index === -1) {
        // Добавляем в корзину
        cart.push(goodId);
        button.textContent = '✓ В корзине';
        button.classList.add('in-cart');
        if (notifications) {
            notifications.success('Товар добавлен в корзину');
        }
    } else {
        // Удаляем из корзины
        cart.splice(index, 1);
        button.textContent = 'В корзину';
        button.classList.remove('in-cart');
        if (notifications) {
            notifications.info('Товар удален из корзины');
        }
    }
    
    // Сохраняем корзину
    if (window.saveCart) {
        window.saveCart(cart);
    } else {
        saveCartFallback(cart);
    }
}

/**
 * ОТОБРАЖЕНИЕ СПИСКА ТОВАРОВ
 * @param {Array} goods - массив товаров
 * @param {boolean} replace - заменить существующие или добавить
 */
function displayGoods(goods, replace = true) {
    const container = document.getElementById('goods-container');
    if (!container) return;
    
    if (replace) {
        container.innerHTML = '';
    }
    
    if (goods.length === 0) {
        if (replace) {
            container.innerHTML = '<p class="no-goods">Товары не найдены</p>';
        }
        return;
    }
    
    // Получаем текущую корзину для подсветки
    const cart = window.getCart ? window.getCart() : getCartFallback();
    
    // Создаем и добавляем карточки
    goods.forEach(good => {
        const card = createGoodCard(good, cart.includes(good.id));
        container.appendChild(card);
    });
}

/**
 * ОТОБРАЖЕНИЕ ОТФИЛЬТРОВАННЫХ ТОВАРОВ
 * @param {Array} goods - отфильтрованный массив товаров
 */
function displayFilteredGoods(goods) {
    const container = document.getElementById('goods-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (goods.length === 0) {
        container.innerHTML = '<p class="no-goods">Нет товаров, соответствующих фильтрам</p>';
        return;
    }
    
    const cart = window.getCart ? window.getCart() : getCartFallback();
    
    goods.forEach(good => {
        const card = createGoodCard(good, cart.includes(good.id));
        container.appendChild(card);
    });
    
    // Скрываем кнопку "Загрузить ещё" при фильтрации
    const loadMoreBtn = document.getElementById('load-more');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }
}

/**
 * ЗАПАСНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С КОРЗИНОЙ (если нет основных)
 */
function getCartFallback() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCartFallback(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    // Обновляем счетчик
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = cart.length;
    });
}

// Делаем функции доступными глобально
window.createGoodCard = createGoodCard;
window.displayGoods = displayGoods;
window.displayFilteredGoods = displayFilteredGoods;
