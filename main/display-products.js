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
        loadMore
