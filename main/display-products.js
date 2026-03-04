/**
 * СКРИПТ ДЛЯ ОТОБРАЖЕНИЯ ТОВАРОВ НА ГЛАВНОЙ СТРАНИЦЕ
 * Отвечает за загрузку и отображение товаров из API
 */

// Текущее состояние страницы
let currentPage = 1;
let currentSort = 'default';
let allGoods = []; // Кеш всех загруженных товаров
let isLoading = false;
let hasMore = true;

// Элементы DOM
const goodsContainer = document.getElementById('goods-container');
const loadMoreBtn = document.getElementById('load-more');
const sortSelect = document.getElementById('sort-select');

/**
 * ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Скрипт display-products.js загружен');
    
    // Загружаем первую страницу товаров
    loadGoods();
    
    // Добавляем обработчик для сортировки
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            // При изменении сортировки начинаем с первой страницы
            currentPage = 1;
            hasMore = true;
            if (goodsContainer) {
                goodsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
            }
            loadGoods();
        });
    }
    
    // Добавляем обработчик для кнопки "Загрузить ещё"
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (!isLoading && hasMore) {
                loadMoreGoods();
            }
        });
    }
    
    // Обновляем счетчик корзины
    updateCartCount();
});

/**
 * ЗАГРУЗКА ТОВАРОВ С УЧЕТОМ ПАГИНАЦИИ
 */
async function loadGoods() {
    // Проверяем, есть ли контейнер
    if (!goodsContainer) {
        console.error('Контейнер goods-container не найден!');
        return;
    }
    
    if (isLoading) return;
    
    isLoading = true;
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Загрузка...';
    }
    
    try {
        // Формируем параметры запроса
        const params = {
            page: currentPage,
            per_page: 12
        };
        
        console.log(`Загружаем страницу ${currentPage}...`);
        
        // Пробуем загрузить товары
        let goods;
        try {
            goods = await getGoods(params);
            console.log('Получены товары (сырые):', goods);
        } catch (error) {
            console.error('Ошибка при вызове getGoods:', error);
            goodsContainer.innerHTML = '<p class="no-goods">Ошибка соединения с сервером. Проверьте интернет или API ключ.</p>';
            isLoading = false;
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Повторить попытку';
            }
            return;
        }
        
        // ========== УЛУЧШЕННАЯ ПРОВЕРКА ДАННЫХ ==========
        // Проверяем, что данные вообще существуют
        if (!goods) {
            console.error('Нет данных от сервера (goods = null/undefined)');
            goodsContainer.innerHTML = '<p class="no-goods">Нет данных от сервера</p>';
            isLoading = false;
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Повторить попытку';
            }
            return;
        }
        
        // ЕСЛИ ДАННЫЕ ПРИШЛИ КАК ОБЪЕКТ С ПОЛЕМ contents (от прокси allorigins.win)
        if (goods.contents && typeof goods.contents === 'string') {
            try {
                console.log('Обнаружено поле contents, парсим...');
                goods = JSON.parse(goods.contents);
                console.log('После парсинга contents:', goods);
            } catch (e) {
                console.error('Ошибка парсинга contents:', e);
                goodsContainer.innerHTML = '<p class="no-goods">Ошибка формата данных от прокси</p>';
                isLoading = false;
                if (loadMoreBtn) {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.textContent = 'Повторить попытку';
                }
                return;
            }
        }
        
        // Финальная проверка - должны получить массив
        if (!Array.isArray(goods)) {
            console.error('Данные не являются массивом даже после обработки:', goods);
            console.log('Тип данных:', typeof goods);
            goodsContainer.innerHTML = '<p class="no-goods">Ошибка формата данных от сервера</p>';
            isLoading = false;
            if (loadMoreBtn) {
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Повторить попытку';
            }
            return;
        }
        
        console.log(`Успешно получили массив из ${goods.length} товаров`);
        // ========== КОНЕЦ ПРОВЕРКИ ==========
        
        if (goods.length === 0) {
            hasMore = false;
            if (currentPage === 1) {
                goodsContainer.innerHTML = '<p class="no-goods">Товары не найдены</p>';
            }
        } else {
            // Добавляем в общий кеш
            allGoods = [...allGoods, ...goods];
            
            // Отображаем товары
            if (typeof displayGoods === 'function') {
                displayGoods(goods, currentPage === 1);
            } else {
                // Если функция не найдена, используем простой вывод
                console.warn('Функция displayGoods не найдена, используем createSimpleCard');
                if (currentPage === 1) {
                    goodsContainer.innerHTML = '';
                }
                goods.forEach(good => {
                    const card = createSimpleCard(good);
                    if (card) {
                        goodsContainer.appendChild(card);
                    }
                });
            }
            
            // Проверяем, есть ли еще товары
            if (goods.length < 12) {
                hasMore = false;
            }
        }
    } catch (error) {
        console.error('Необработанная ошибка в loadGoods:', error);
        if (currentPage === 1) {
            goodsContainer.innerHTML = '<p class="no-goods">Произошла ошибка. Обновите страницу.</p>';
        }
    } finally {
        isLoading = false;
        if (loadMoreBtn) {
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = hasMore ? 'Загрузить ещё' : 'Все товары загружены';
        }
    }
}

/**
 * ЗАГРУЗКА СЛЕДУЮЩЕЙ СТРАНИЦЫ ТОВАРОВ
 */
function loadMoreGoods() {
    currentPage++;
    loadGoods();
}

/**
 * ПЕРЕЗАГРУЗКА КАТАЛОГА (с первой страницы)
 */
function reloadCatalog() {
    currentPage = 1;
    hasMore = true;
    allGoods = [];
    if (goodsContainer) {
        goodsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
    }
    loadGoods();
}

/**
 * ПОЛУЧЕНИЕ ВСЕХ ЗАГРУЖЕННЫХ ТОВАРОВ
 * @returns {Array} - массив всех товаров
 */
function getAllGoods() {
    return allGoods;
}

/**
 * ОБНОВЛЕНИЕ СЧЕТЧИКА КОРЗИНЫ В ШАПКЕ
 */
function updateCartCount() {
    const cart = getCart();
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = cart.length;
    });
}

/**
 * ПОЛУЧЕНИЕ КОРЗИНЫ ИЗ LOCALSTORAGE
 * @returns {Array} - массив ID товаров
 */
function getCart() {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
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
        updateCartCount();
    } catch (e) {
        console.error('Ошибка сохранения корзины:', e);
    }
}

/**
 * ПРОСТАЯ КАРТОЧКА ТОВАРА (запасной вариант)
 * @param {Object} good - данные товара
 * @returns {HTMLElement} - DOM элемент
 */
function createSimpleCard(good) {
    if (!good || !good.id) {
        console.error('Неверные данные товара:', good);
        return null;
    }
    
    const card = document.createElement('div');
    card.className = 'good-card';
    card.dataset.id = good.id;
    
    const currentPrice = good.discount_price || good.actual_price || 0;
    const imageUrl = good.image_url || 'https://via.placeholder.com/200';
    const title = good.name || 'Без названия';
    const rating = good.rating || 0;
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${title}" class="good-card__image"
             onerror="this.src='https://via.placeholder.com/200'">
        <h3 class="good-card__title">${title.substring(0, 40)}${title.length > 40 ? '...' : ''}</h3>
        <div class="good-card__rating">★ ${rating}</div>
        <div class="good-card__price">${currentPrice} ₽</div>
        <button class="good-card__button">В корзину</button>
    `;
    
    // Добавляем обработчик на кнопку
    const button = card.querySelector('.good-card__button');
    if (button) {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const cart = getCart();
            if (!cart.includes(good.id)) {
                cart.push(good.id);
                saveCart(cart);
                button.textContent = '✓ В корзине';
                button.classList.add('in-cart');
                if (typeof notifications !== 'undefined') {
                    notifications.success('Товар добавлен в корзину');
                }
            }
        });
    }
    
    return card;
}

// Делаем функции доступными глобально для других скриптов
window.getAllGoods = getAllGoods;
window.loadGoods = loadGoods;
window.reloadCatalog = reloadCatalog;
window.updateCartCount = updateCartCount;
window.getCart = getCart;
window.saveCart = saveCart;
window.createSimpleCard = createSimpleCard;

console.log('✅ display-products.js полностью загружен и готов к работе');
