/**
 * СКРИПТ ДЛЯ УПРАВЛЕНИЯ ЗАКАЗАМИ (РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ)
 * Отвечает за:
 * - редактирование заказов
 * - удаление заказов
 * - обработку модальных окон
 */

// Текущий выбранный заказ для операций
let currentOrderId = null;

// Элементы модальных окон
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const editOrderIdSpan = document.getElementById('edit-order-id');
const deleteOrderIdSpan = document.getElementById('delete-order-id');
const editForm = document.getElementById('edit-order-form');
const confirmDeleteBtn = document.getElementById('confirm-delete');
const cancelDeleteBtn = document.getElementById('cancel-delete');

/**
 * ИНИЦИАЛИЗАЦИЯ
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('Скрипт управления заказами загружен');
    
    // Добавляем обработчики для форм
    if (editForm) {
        editForm.addEventListener('submit', handleEditSubmit);
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', handleDelete);
    }
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
        });
    }
});

/**
 * ОТКРЫТИЕ МОДАЛЬНОГО ОКНА РЕДАКТИРОВАНИЯ
 * @param {number} orderId - ID заказа
 */
async function editOrder(orderId) {
    currentOrderId = orderId;
    editOrderIdSpan.textContent = orderId;
    
    // Показываем загрузку
    editModal.style.display = 'block';
    
    try {
        // Загружаем данные заказа
        const order = await getOrderById(orderId);
        
        // Заполняем форму
        document.getElementById('edit-full-name').value = order.full_name || '';
        document.getElementById('edit-email').value = order.email || '';
        document.getElementById('edit-phone').value = order.phone || '';
        document.getElementById('edit-delivery-address').value = order.delivery_address || '';
        
        // Преобразуем дату из DD.MM.YYYY в YYYY-MM-DD для input type="date"
        if (order.delivery_date) {
            const dateParts = order.delivery_date.split('.');
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            document.getElementById('edit-delivery-date').value = formattedDate;
        }
        
        document.getElementById('edit-delivery-interval').value = order.delivery_interval || '';
        document.getElementById('edit-comment').value = order.comment || '';
        
    } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        notifications.error('Не удалось загрузить данные заказа');
        editModal.style.display = 'none';
    }
}

/**
 * ОБРАБОТКА ОТПРАВКИ ФОРМЫ РЕДАКТИРОВАНИЯ
 * @param {Event} e - событие отправки
 */
async function handleEditSubmit(e) {
    e.preventDefault();
    
    if (!currentOrderId) return;
    
    try {
        // Собираем данные из формы
        const formData = {
            full_name: document.getElementById('edit-full-name').value.trim(),
            email: document.getElementById('edit-email').value.trim(),
            phone: document.getElementById('edit-phone').value.trim(),
            delivery_address: document.getElementById('edit-delivery-address').value.trim(),
            delivery_interval: document.getElementById('edit-delivery-interval').value,
            comment: document.getElementById('edit-comment').value.trim() || ''
        };
        
        // Преобразуем дату
        const dateInput = document.getElementById('edit-delivery-date').value;
        if (dateInput) {
            const dateParts = dateInput.split('-');
            formData.delivery_date = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
        }
        
        // Валидация
        if (!formData.full_name) throw new Error('Введите имя');
        if (!formData.email) throw new Error('Введите email');
        if (!validateEmail(formData.email)) throw new Error('Введите корректный email');
        if (!formData.phone) throw new Error('Введите телефон');
        if (!formData.delivery_address) throw new Error('Введите адрес доставки');
        if (!formData.delivery_date) throw new Error('Выберите дату доставки');
        if (!formData.delivery_interval) throw new Error('Выберите интервал доставки');
        
        console.log('Отправляем обновление:', formData);
        
        // Отправляем на сервер
        const updatedOrder = await updateOrder(currentOrderId, formData);
        
        // Показываем уведомление
        notifications.success('Заказ успешно обновлен');
        
        // Закрываем модальное окно
        editModal.style.display = 'none';
        
        // Перезагружаем список заказов
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка при обновлении заказа:', error);
        notifications.error('Ошибка при обновлении заказа: ' + error.message);
    }
}

/**
 * ПОДТВЕРЖДЕНИЕ УДАЛЕНИЯ ЗАКАЗА
 * @param {number} orderId - ID заказа
 */
function confirmDelete(orderId) {
    currentOrderId = orderId;
    deleteOrderIdSpan.textContent = orderId;
    deleteModal.style.display = 'block';
}

/**
 * УДАЛЕНИЕ ЗАКАЗА
 */
async function handleDelete() {
    if (!currentOrderId) return;
    
    try {
        // Отправляем запрос на удаление
        const result = await deleteOrder(currentOrderId);
        
        console.log('Заказ удален:', result);
        
        // Показываем уведомление
        notifications.success('Заказ успешно удален');
        
        // Закрываем модальное окно
        deleteModal.style.display = 'none';
        
        // Перезагружаем список заказов
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка при удалении заказа:', error);
        notifications.error('Ошибка при удалении заказа');
        deleteModal.style.display = 'none';
    }
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
window.editOrder = editOrder;
window.confirmDelete = confirmDelete;
