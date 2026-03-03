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
            goodsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
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
        
        // Добавляем поисковый запрос, если есть
        if (window.searchQuery) {
            params.query = window.searchQuery;
        }
        
        console.log(`Загружаем страницу ${currentPage}...`);
        const goods = await getGoods(params);
        
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
                if (currentPage === 1) {
                    goodsContainer.innerHTML = '';
                }
                goods.forEach(good => {
                    const card = createSimpleCard(good);
                    goodsContainer.appendChild(card);
                });
            }
                        
            // Проверяем, есть ли еще товары
            if (goods.length < 12) {
                hasMore = false;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        if (currentPage === 1) {
            goodsContainer.innerHTML = '<p class="no-goods">Ошибка загрузки. Проверьте API ключ.</p>';
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
    goodsContainer.innerHTML = '<div class="loading">Загрузка товаров...</div>';
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
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

/**
 * СОХРАНЕНИЕ КОРЗИНЫ В LOCALSTORAGE
 * @param {Array} cart - массив ID товаров
 */
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

/**
 * ПРОСТАЯ КАРТОЧКА ТОВАРА (запасной вариант)
 * @param {Object} good - данные товара
 * @returns {HTMLElement} - DOM элемент
 */
function createSimpleCard(good) {
    const card = document.createElement('div');
    card.className = 'good-card';
    card.dataset.id = good.id;
    
    const currentPrice = good.discount_price || good.actual_price;
    
    card.innerHTML = `
        <img src="${good.image_url}" alt="${good.name}" class="good-card__image"
             onerror="this.src='https://via.placeholder.com/200'">
        <h3 class="good-card__title">${good.name.substring(0, 40)}${good.name.length > 40 ? '...' : ''}</h3>
        <div class="good-card__rating">★ ${good.rating}</div>
        <div class="good-card__price">${currentPrice} ₽</div>
        <button class="good-card__button">В корзину</button>
    `;
    
    return card;
}

// Делаем функции доступными глобально для других скриптов
window.getAllGoods = getAllGoods;
window.loadGoods = loadGoods;
window.reloadCatalog = reloadCatalog;
window.updateCartCount = updateCartCount;
window.getCart = getCart;
window.saveCart = saveCart;

console.log('✅ display-products.js полностью загружен и готов к работе');
