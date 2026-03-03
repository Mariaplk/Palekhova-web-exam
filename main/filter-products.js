/**
 * СКРИПТ ДЛЯ ФИЛЬТРАЦИИ ТОВАРОВ НА ГЛАВНОЙ СТРАНИЦЕ
 * Отвечает за фильтрацию товаров по категориям, диапазону цен и наличию скидки
 */

// Текущие фильтры
let currentFilters = {
    categories: [],
    priceFrom: null,
    priceTo: null,
    discountOnly: false
};

// Элементы DOM
const filterForm = document.getElementById('filter-form');
const categoriesList = document.getElementById('categories-list');
const priceFromInput = document.getElementById('price-from');
const priceToInput = document.getElementById('price-to');
const discountOnlyCheckbox = document.getElementById('discount-only');

/**
 * ИНИЦИАЛИЗАЦИЯ ФИЛЬТРОВ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Скрипт filter-products.js загружен');
    
    // Загружаем категории для фильтра
    loadCategories();
    
    // Добавляем обработчик отправки формы фильтрации
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Предотвращаем перезагрузку страницы
            applyFilters();
        });
    }
});

/**
 * ЗАГРУЗКА КАТЕГОРИЙ ДЛЯ ФИЛЬТРА
 * Получает список всех категорий из загруженных товаров
 */
async function loadCategories() {
    if (!categoriesList) return;
    
    try {
        // Загружаем первую страницу товаров для получения категорий
        const goods = await getGoods({ per_page: 50 });
        
        // Извлекаем уникальные категории
        const categories = [...new Set(goods.map(g => g.main_category))];
        categories.sort(); // Сортируем по алфавиту
        
        // Отображаем категории с чекбоксами
        categoriesList.innerHTML = categories.map(category => `
            <label class="category-label">
                <input type="checkbox" name="category" value="${category}"> 
                ${category}
            </label>
        `).join('');
        
        console.log(`Загружено ${categories.length} категорий`);
        
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        categoriesList.innerHTML = '<p class="error">Не удалось загрузить категории</p>';
    }
}

/**
 * ПРИМЕНЕНИЕ ФИЛЬТРОВ
 * Собирает значения из формы и применяет фильтрацию
 */
function applyFilters() {
    console.log('Применяем фильтры...');
    
    // Собираем выбранные категории
    const categoryCheckboxes = document.querySelectorAll('input[name="category"]:checked');
    currentFilters.categories = Array.from(categoryCheckboxes).map(cb => cb.value);
    
    // Собираем ценовые фильтры
    currentFilters.priceFrom = priceFromInput && priceFromInput.value ? 
        Number(priceFromInput.value) : null;
    currentFilters.priceTo = priceToInput && priceToInput.value ? 
        Number(priceToInput.value) : null;
    
    // Фильтр по скидке
    currentFilters.discountOnly = discountOnlyCheckbox ? discountOnlyCheckbox.checked : false;
    
    console.log('Текущие фильтры:', currentFilters);
    
    // Получаем все загруженные товары
    const allGoods = window.getAllGoods ? window.getAllGoods() : [];
    
    if (allGoods.length === 0) {
        // Если товары еще не загружены, перезагружаем каталог
        if (window.reloadCatalog) {
            window.reloadCatalog();
        }
        return;
    }
    
    // Фильтруем товары
    const filteredGoods = filterGoods(allGoods, currentFilters);
    
    // Получаем текущую сортировку
    const sortSelect = document.getElementById('sort-select');
    const currentSort = sortSelect ? sortSelect.value : 'default';
    
    // Сортируем отфильтрованные товары
    const sortedGoods = sortGoods(filteredGoods, currentSort);
    
    // Отображаем отфильтрованные товары
    if (window.displayFilteredGoods) {
        window.displayFilteredGoods(sortedGoods);
    } else {
        // Если функция не найдена, используем стандартную
        const goodsContainer = document.getElementById('goods-container');
        if (goodsContainer) {
            goodsContainer.innerHTML = '';
            sortedGoods.forEach(good => {
                const card = window.createGoodCard ? 
                    window.createGoodCard(good, window.getCart().includes(good.id)) : 
                    createSimpleCard(good);
                goodsContainer.appendChild(card);
            });
        }
    }
    
    // Показываем уведомление о результате фильтрации
    if (notifications) {
        notifications.info(`Найдено товаров: ${filteredGoods.length}`);
    }
}

/**
 * ФИЛЬТРАЦИЯ ТОВАРОВ ПО ЗАДАННЫМ КРИТЕРИЯМ
 * @param {Array} goods - массив товаров
 * @param {Object} filters - объект с фильтрами
 * @returns {Array} - отфильтрованный массив
 */
function filterGoods(goods, filters) {
    return goods.filter(good => {
        // Фильтр по категориям
        if (filters.categories && filters.categories.length > 0) {
            if (!filters.categories.includes(good.main_category)) {
                return false;
            }
        }
        
        // Определяем цену для фильтрации (со скидкой или без)
        const price = good.discount_price || good.actual_price;
        
        // Фильтр по минимальной цене
        if (filters.priceFrom && price < filters.priceFrom) {
            return false;
        }
        
        // Фильтр по максимальной цене
        if (filters.priceTo && price > filters.priceTo) {
            return false;
        }
        
        // Фильтр по наличию скидки
        if (filters.discountOnly && !good.discount_price) {
            return false;
        }
        
        return true;
    });
}

/**
 * СОРТИРОВКА ТОВАРОВ
 * @param {Array} goods - массив товаров
 * @param {string} sortType - тип сортировки
 * @returns {Array} - отсортированный массив
 */
function sortGoods(goods, sortType) {
    const sorted = [...goods];
    
    switch (sortType) {
        case 'price-asc':
            sorted.sort((a, b) => {
                const priceA = a.discount_price || a.actual_price;
                const priceB = b.discount_price || b.actual_price;
                return priceA - priceB;
            });
            break;
            
        case 'price-desc':
            sorted.sort((a, b) => {
                const priceA = a.discount_price || a.actual_price;
                const priceB = b.discount_price || b.actual_price;
                return priceB - priceA;
            });
            break;
            
        case 'rating-desc':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
            
        case 'name-asc':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
            
        default:
            // По умолчанию - по ID (как пришло с сервера)
            sorted.sort((a, b) => a.id - b.id);
    }
    
    return sorted;
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
        <h3 class="good-card__title">${good.name}</h3>
        <div class="good-card__rating">★ ${good.rating}</div>
        <div class="good-card__price">${currentPrice} ₽</div>
        <button class="good-card__button">В корзину</button>
    `;
    
    return card;
}

// Делаем функции доступными глобально
window.applyFilters = applyFilters;
window.filterGoods = filterGoods;
window.sortGoods = sortGoods;
