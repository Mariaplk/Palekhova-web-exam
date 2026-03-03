/**
 * МОДУЛЬ ДЛЯ РАБОТЫ С УВЕДОМЛЕНИЯМИ
 */

class NotificationManager {
    constructor() {
        // Находим или создаем контейнер для уведомлений
        this.container = document.getElementById('notification-area');
        if (!this.container) {
            // Если контейнер не найден, создаем его
            this.container = document.createElement('div');
            this.container.id = 'notification-area';
            this.container.className = 'notification-area';
            document.body.appendChild(this.container);
        }
        
        // Максимальное количество одновременно отображаемых уведомлений
        this.maxNotifications = 3;
    }

    /**
     * ПОКАЗАТЬ УВЕДОМЛЕНИЕ
     * @param {string} message - текст уведомления
     * @param {string} type - тип уведомления: 'success' (зеленый), 'error' (красный), 'info' (синий)
     * @param {number} duration - время показа в миллисекундах (по умолчанию 5000 = 5 секунд)
     */
    show(message, type = 'info', duration = 5000) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Добавляем в контейнер
        this.container.appendChild(notification);
        
        // Автоматически удаляем через указанное время
        setTimeout(() => {
            // Анимация исчезновения
            notification.style.animation = 'slideIn 0.3s reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        // Удаляем старые уведомления, если их слишком много
        this.cleanup();
        
        console.log(`Уведомление: ${type} - ${message}`); // Для отладки
    }

    /**
     * УДАЛЯЕТ СТАРЫЕ УВЕДОМЛЕНИЯ (оставляет не более maxNotifications)
     */
    cleanup() {
        const notifications = this.container.children;
        while (notifications.length > this.maxNotifications) {
            notifications[0].remove();
        }
    }

    /**
     * ПОКАЗЫВАЕТ УВЕДОМЛЕНИЕ ОБ УСПЕХЕ (зеленое)
     * @param {string} message - текст уведомления
     */
    success(message) {
        this.show(message, 'success');
    }

    /**
     * ПОКАЗЫВАЕТ УВЕДОМЛЕНИЕ ОБ ОШИБКЕ (красное)
     * @param {string} message - текст уведомления
     */
    error(message) {
        this.show(message, 'error');
    }

    /**
     * ПОКАЗЫВАЕТ ИНФОРМАЦИОННОЕ УВЕДОМЛЕНИЕ (синее)
     * @param {string} message - текст уведомления
     */
    info(message) {
        this.show(message, 'info');
    }
}

// Создаем глобальный экземпляр менеджера уведомлений
// Теперь в любом скрипте можно писать: notifications.success('Товар добавлен');
const notifications = new NotificationManager();
