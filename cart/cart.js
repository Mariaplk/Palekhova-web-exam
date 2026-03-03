const cartContainer = document.getElementById("cartItems"); // Получаем контейнер для товаров из корзины

// Функция загрузки товаров из localStorage и отображения их на странице
async function loadCart() {
    // Получаем корзину из localStorage или создаем пустую, если корзина пуста
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Если корзина пуста, выводим сообщение
    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>Ваша корзина пуста.</p>";
        return;
    }

    // Загружаем все товары с API
    const response = await fetch("https://fakestoreapi.com/products");
    const products = await response.json();

    // Фильтруем товары, которые находятся в корзине
    const cartProducts = products.filter((product) => cart.includes(product.id));

    // Если есть товары в корзине, выводим их
    cartProducts.forEach((product) => {
        const productDiv = document.createElement("div"); // Создаем элемент для товара
        productDiv.innerHTML = `
            <h3>${product.title}</h3>
            <p>Цена: ${product.price}$</p>
        `;

        // Добавляем элемент товара в контейнер
        cartContainer.appendChild(productDiv);
    });
}

// Вызываем функцию для загрузки товаров в корзину
loadCart();

// Обработчик для кнопки оформления заказа
document.getElementById("checkoutBtn").addEventListener("click", () => {
    // Очищаем корзину в localStorage после оформления заказа
    localStorage.removeItem("cart");

    // Перенаправляем пользователя на главную страницу или страницу с подтверждением
    alert("Ваш заказ оформлен! Спасибо за покупку!");
    window.location.href = "index.html"; // Перенаправляем на главную страницу
});
