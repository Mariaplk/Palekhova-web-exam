/**
 * СКРИПТ ДЛЯ ОТОБРАЖЕНИЯ ТОВАРОВ НА ГЛАВНОЙ СТРАНИЦЕ
 */

// Глобальная переменная для хранения загруженных товаров
window.productsData = null;
window.allGoods = []; // Для совместимости с фильтрами

// Текущее состояние страницы
let currentPage = 1;
let currentSort = 'default';
let isLoading = false;
let hasMore = true;

// Элементы DOM
const goodsContainer = document.getElementById('goods-container');
const loadMoreBtn = document.getElementById('load-more');
const sortSelect = document.getElementById('sort-select');

/**
 * ФОРМАТИРОВАНИЕ ЦЕНЫ (с пробелами)
 */
function formatPrice(price) {
    if (!price && price !== 0) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * СОЗДАНИЕ ЗВЕЗД РЕЙТИНГА
 */
function createStars(rating) {
    rating = rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    let starsHTML = '';
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHTML += '★'; // Полная звезда
        } else if (i === fullStars && hasHalfStar) {
            starsHTML += '½'; // Половина звезды
        } else {
            starsHTML += '☆'; // Пустая звезда
        }
    }
    return starsHTML;
}

/**
 * СОЗДАНИЕ КАРТОЧКИ ТОВАРА
 */
function createProductCard(product) {
    if (!product || !product.id) return null;
    
    // Наличие скидки
    const hasDiscount = product.discount_price && 
        product.discount_price < product.actual_price;
    const discountPercent = hasDiscount ? 
        Math.round((1 - product.discount_price / product.actual_price) * 100) : 0;
    
    // Цена для отображения
    const displayPrice = hasDiscount ? product.discount_price : product.actual_price;
    const originalPrice = product.actual_price;
    
    // Сокращение названия
    const shortName = product.name && product.name.length > 60 ? 
        product.name.substring(0, 60) + '...' : product.name || 'Без названия';
    
    // Проверяем, есть ли товар уже в корзине
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch (error) {
        console.error('Ошибка при чтении корзины:', error);
    }
    
    const isInCart = cart.includes(product.id);
    
    // Кнопка в зависимости от состояния
    let buttonClass = 'good-card__button';
    let buttonText = 'В корзину';
    let disabled = '';
    
    if (isInCart) {
        buttonClass += ' in-cart';
        buttonText = '✓ В корзине';
        disabled = 'disabled';
    }
    
    // Создаем карточку
    const card = document.createElement('div');
    card.className = 'good-card';
    card.dataset.id = product.id;
    
    card.innerHTML = `
        <div class="good-card__image-container">
            <img src="${product.image_url || 'https://via.placeholder.com/200'}" 
                 alt="${product.name}" 
                 class="good-card__image"
                 onerror="this.src='https://via.placeholder.com/200'">
            ${hasDiscount ? `
                <span class="good-card__discount-badge">-${discountPercent}%</span>
            ` : ''}
        </div>
        <h3 class="good-card__title" title="${product.name || ''}">${shortName}</h3>
        <div class="good-card__rating">
            <span class="stars">${createStars(product.rating)}</span>
            <span class="rating-value">${product.rating ? product.rating.toFixed(1) : '0.0'}</span>
        </div>
        <div class="good-card__category">
            ${product.main_category || ''}
        </div>
        <div class="good-card__price">
            ${formatPrice(displayPrice)} ₽
            ${hasDiscount ? `<span class="good-card__old-price">${formatPrice(originalPrice)} ₽</span>` : ''}
        </div>
        <button class="${buttonClass}" data-product-id="${product.id}" ${disabled}>
            ${buttonText}
        </button>
    `;
    
    return card;
}

/**
 * ОТОБРАЖЕНИЕ ВСЕХ ТОВАРОВ
 */
function displayAllProducts(products) {
    if (!goodsContainer) {
        console.error('Контейнер goods-container не найден');
        return;
    }
    
    if (!products || products.length === 0) {
        goodsContainer.innerHTML = `
            <div class="no-goods">
                <p>Товары не найдены</p>
                <p class="text-muted">Попробуйте изменить параметры поиска</p>
            </div>
        `;
        return;
    }
    
    // Очищаем контейнер
    goodsContainer.innerHTML = '';
    
    // Добавляем все карточки
    products.forEach(product => {
        const card = createProductCard(product);
        if (card) {
            goodsContainer.appendChild(card);
        }
    });
}

/**
 * ОСНОВНАЯ ФУНКЦИЯ ЗАГРУЗКИ
 */
async function loadGoods() {
    if (!goodsContainer) {
        console.error('Контейнер goods-container не найден!');
        return;
    }
    
    if (isLoading) return;
    
    isLoading = true;
    
    // Показываем загрузку только на первой странице
    if (currentPage === 1) {
        goodsContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Загружаем товары...</p>
            </div>
        `;
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Загрузка...';
    }
    
    try {
        const params = {
            page: currentPage,
            per_page: 12
        };
        
        console.log(`Загружаем страницу ${currentPage}...`);
        
        // Загружаем товары через API
        let goods = await getGoods(params);
        console.log('Получены товары:', goods);
        
        // Сохраняем в глобальную переменную
        if (!window.allGoods) window.allGoods = [];
        
        if (currentPage === 1) {
            window.allGoods = goods;
            window.productsData = goods;
        } else {
            window.allGoods = [...window.allGoods, ...goods];
            window.productsData = window.allGoods;
        }
        
        // Отображаем товары
        if (currentPage === 1) {
            displayAllProducts(goods);
        } else {
            goods.forEach(product => {
                const card = createProductCard(product);
                if (card) {
                    goodsContainer.appendChild(card);
                }
            });
        }
        
        // Проверяем, есть ли еще товары
        if (goods.length < 12) {
            hasMore = false;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        
        if (currentPage === 1) {
            goodsContainer.innerHTML = `
                <div class="no-goods">
                    <p>Ошибка загрузки товаров</p>
                    <p class="text-muted">Проверьте подключение к интернету</p>
                    <button onclick="location.reload()" class="btn-primary mt-3">
                        Обновить страницу
                    </button>
                </div>
            `;
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
 * ЗАГРУЗКА СЛЕДУЮЩЕЙ СТРАНИЦЫ
 */
function loadMoreGoods() {
    if (!isLoading && hasMore) {
        currentPage++;
        loadGoods();
    }
}

/**
 * ОБНОВЛЕНИЕ СЧЕТЧИКА КОРЗИНЫ
 */
function updateCartCount() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const countElements = document.querySelectorAll('.cart-count');
        countElements.forEach(el => {
            el.textContent = cart.length;
        });
    } catch (error) {
        console.error('Ошибка обновления счетчика:', error);
    }
}

/**
 * ДОБАВЛЕНИЕ ТОВАРА В КОРЗИНУ
 */
function addToCart(productId) {
    try {
        // Получаем текущую корзину
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        // Проверяем, есть ли уже товар
        if (cart.includes(productId)) {
            return false;
        }
        
        // Добавляем новый товар
        cart.push(productId);
        
        // Сохраняем
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Обновляем счетчик
        updateCartCount();
        
        return true;
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        return false;
    }
}

/**
 * ОБРАБОТЧИК КЛИКОВ ПО КНОПКАМ
 */
function setupEventListeners() {
    // Обработчик для кнопок "В корзину"
    document.addEventListener('click', function(e) {
        const addButton = e.target.closest('.good-card__button:not(.in-cart)');
        if (addButton) {
            const productId = parseInt(addButton.dataset.productId);
            if (productId) {
                // Добавляем в корзину
                const success = addToCart(productId);
                
                if (success) {
                    // Меняем внешний вид кнопки
                    addButton.classList.add('in-cart');
                    addButton.textContent = '✓ В корзине';
                    addButton.disabled = true;
                    
                    // Показываем уведомление
                    if (typeof notifications !== 'undefined') {
                        notifications.success('Товар добавлен в корзину');
                    }
                }
            }
        }
    });
    
    // Обработчик для сортировки
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentSort = sortSelect.value;
            currentPage = 1;
            hasMore = true;
            loadGoods();
        });
    }
    
    // Обработчик для кнопки "Загрузить ещё"
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreGoods);
    }
}

/**
 * ИНИЦИАЛИЗАЦИЯ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Скрипт display-products.js загружен');
    
    // Загружаем товары
    loadGoods();
    
    // Настраиваем обработчики
    setupEventListeners();
    
    // Обновляем счетчик корзины
    updateCartCount();
});

// Экспортируем функции для других скриптов
window.getAllGoods = () => window.allGoods || [];
window.loadGoods = loadGoods;
window.reloadCatalog = () => {
    currentPage = 1;
    hasMore = true;
    loadGoods();
};
window.updateCartCount = updateCartCount;
window.addToCart = addToCart;

console.log('✅ display-products.js готов к работе');
