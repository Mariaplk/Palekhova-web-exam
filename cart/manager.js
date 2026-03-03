/**
 * СКРИПТ ДЛЯ УПРАВЛЕНИЯ ОФОРМЛЕНИЕМ ЗАКАЗА 
 * Скрипт отвечает за:
 * - отправку данных заказа на сервер
 * - валидацию формы
 * - обработку ответа от сервера
 */

// Элементы DOM
const orderForm = document.getElementById('order-form');
const submitButton = document.getElementById('submit-order');

/**
 * ИНИЦИАЛИЗАЦИЯ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Менеджер заказов загружен');
    
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderSubmit);
    }
});

/**
 * ОБРАБОТКА ОТПРАВКИ ФОРМЫ ЗАКАЗА
 * @param {Event} e - событие отправки формы
 */
async function handleOrderSubmit(e) {
    e.preventDefault();
    
    // Блокируем кнопку на время отправки
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Отправка...';
    }
    
    try {
        // Получаем данные из формы
        const formData = collectFormData();
        
        // Проверяем, есть ли товары в корзине
        const cart = getCart();
        if (cart.length === 0) {
            throw new Error('Корзина пуста');
        }
        
        // Добавляем ID товаров в данные заказа
        formData.good_ids = cart;
        
        console.log('Отправляем заказ:', formData);
        
        // Отправляем запрос на сервер
        const result = await createOrder(formData);
        
        console.log('Заказ создан:', result);
        
        // Показываем уведомление об успехе
        if (notifications) {
            notifications.success(`Заказ №${result.id} успешно оформлен!`);
        }
        
        // Очищаем корзину
        localStorage.removeItem('cart');
        
        // Перенаправляем на главную через 2 секунды
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Ошибка при оформлении заказа:', error);
        
        if (notifications) {
            notifications.error('Ошибка при оформлении заказа: ' + error.message);
        }
    } finally {
        // Разблокируем кнопку
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Оформить заказ';
        }
    }
}

/**
 * СБОР ДАННЫХ ИЗ ФОРМЫ
 * @returns {Object} - объект с данными заказа
 */
function collectFormData() {
    // Получаем значения полей
    const full_name = document.getElementById('full-name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const delivery_address = document.getElementById('delivery-address')?.value.trim();
    const delivery_date = document.getElementById('delivery-date')?.value;
    const delivery_interval = document.getElementById('delivery-interval')?.value;
    const comment = document.getElementById('comment')?.value.trim() || '';
    
    // Получаем значение чекбокса подписки (0 или 1)
    const subscribeCheckbox = document.getElementById('subscribe');
    const subscribe = subscribeCheckbox && subscribeCheckbox.checked ? 1 : 0;
    
    // Валидация
    if (!full_name) throw new Error('Введите имя');
    if (!email) throw new Error('Введите email');
    if (!validateEmail(email)) throw new Error('Введите корректный email');
    if (!phone) throw new Error('Введите телефон');
    if (!delivery_address) throw new Error('Введите адрес доставки');
    if (!delivery_date) throw new Error('Выберите дату доставки');
    if (!delivery_interval) throw new Error('Выберите интервал доставки');
    
    // Преобразуем дату в нужный формат (DD.MM.YYYY)
    const dateParts = delivery_date.split('-');
    const formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
    
    return {
        full_name,
        email,
        phone,
        delivery_address,
        delivery_date: formattedDate,
        delivery_interval,
        comment,
        subscribe
    };
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
 * ВАЛИДАЦИЯ EMAIL
 * @param {string} email - email для проверки
 * @returns {boolean} - true если email корректен
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Делаем функции доступными глобально
window.handleOrderSubmit = handleOrderSubmit;
