// Указываем URL для получения товаров
const API_URL = "https://fakestoreapi.com/products";

// Ссылаемся на контейнер для отображения товаров
const productContainer = document.getElementById("productContainer");

// Ссылаемся на поле ввода для поиска
const searchField = document.getElementById("productSearch");

// Ссылаемся на кнопку поиска
const searchButton = document.getElementById("searchBtn");

// Переменная для хранения списка товаров
let productsList = [];

// Функция для получения товаров с API
async function getProducts() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            // Если ошибка при получении данных, выводим сообщение
            throw new Error("Не удалось загрузить товары");
        }

        // Преобразуем ответ в JSON и сохраняем в переменную
        productsList = await response.json();
        
        // Отображаем товары
        displayProducts(productsList);
    } catch (error) {
        // Если произошла ошибка, выводим сообщение на странице
        productContainer.innerHTML = `
            <div class="error-message">
                <h3>Ошибка: ${error.message}</h3>
            </div>
        `;
    }
}

// Функция для отображения товаров на странице
function displayProducts(products) {
    // Очищаем контейнер перед повторным отображением товаров
    productContainer.innerHTML = "";

    // Для каждого товара создаем карточку
    products.forEach((product) => {
        // Создаем новый элемент div для карточки товара
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        // Вставляем HTML в карточку товара
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}" />
            <h4>${product.title}</h4>
            <p>Цена: ${product.price}$</p>
            <button class="add-to-cart-btn" data-id="${product.id}">
                Добавить в корзину
            </button>
        `;

        // Добавляем карточку товара в контейнер
        productContainer.appendChild(productCard);
    });

    // Добавляем обработчики на кнопки "Добавить в корзину"
    const addButtons = document.querySelectorAll(".add-to-cart-btn");

    addButtons.forEach((button) => {
        button.addEventListener("click", () => {
            // При нажатии добавляем товар в корзину
            addToCart(button.dataset.id);
        });
    });
}

// Функция для добавления товара в корзину
function addToCart(productId) {
    // Получаем корзину из localStorage или создаем пустую
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Добавляем товар, если его нет в корзине
    if (!cart.includes(productId)) {
        cart.push(productId);
        // Сохраняем обновленную корзину
        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Товар добавлен в корзину");
    } else {
        alert("Товар уже в корзине");
    }
}

// Обработчик события для кнопки поиска
searchButton.addEventListener("click", function () {
    const query = searchField.value.toLowerCase();

    // Фильтруем товары по названию
    const filteredProducts = productsList.filter((product) =>
        product.title.toLowerCase().includes(query)
    );

    // Отображаем отфильтрованные товары
    displayProducts(filteredProducts);
});

// Загружаем товары при загрузке страницы
getProducts();
