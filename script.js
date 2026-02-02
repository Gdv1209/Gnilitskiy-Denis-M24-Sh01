// Обработчик события загрузки страницы.
// Когда HTML-документ полностью загружен — вызываем loadTransactions()
window.onload = function () {
    loadTransactions();
};


// ===== ЗАГРУЗКА СПИСКА ТРАНЗАКЦИЙ С СЕРВЕРА =====
function loadTransactions() {

    // Создаём объект XMLHttpRequest — старый, но надёжный способ делать HTTP-запросы
    var xhr = new XMLHttpRequest();

    // Настраиваем GET-запрос к PHP-API
    // true — асинхронный запрос (не блокирует страницу)
    xhr.open('GET', 'api/budget_service.php', true);

    // Обработчик успешного ответа от сервера
    xhr.onload = function () {

        // Проверяем, что HTTP-статус в диапазоне 2xx (успешный ответ)
        if (xhr.status >= 200 && xhr.status < 300) {

            // Парсим JSON-строку ответа в JS-объект
            var transactions = JSON.parse(xhr.responseText);

            // Отрисовываем список транзакций на странице
            displayTransactions(transactions);

            // Пересчитываем и отображаем баланс
            calculateBalance(transactions);
        } else {
            // Если сервер вернул ошибку (4xx / 5xx)
            alert('Ошибка при загрузке операций');
        }
    };

    // Обработчик сетевой ошибки (сервер недоступен, нет интернета и т.д.)
    xhr.onerror = function () {
        alert('Сетевая ошибка');
    };

    // Отправляем запрос на сервер
    xhr.send();
}


// ===== ПОДСЧЁТ ТЕКУЩЕГО БАЛАНСА =====
function calculateBalance(transactions) {

    // Переменная для хранения текущего баланса
    var balance = 0;

    // Проходим по всем транзакциям
    for (var i = 0; i < transactions.length; i++) {

        // Текущая транзакция
        var transaction = transactions[i];

        // Если тип "income" — прибавляем сумму
        if (transaction.type === 'income') {
            balance += parseFloat(transaction.amount);

        // Если тип "expense" — вычитаем сумму
        } else if (transaction.type === 'expense') {
            balance -= parseFloat(transaction.amount);
        }
    }
    
    // Получаем DOM-элемент, в котором отображается баланс
    var balanceElement = document.getElementById('balance');

    // Записываем отформатированное значение баланса (2 знака после запятой)
    balanceElement.textContent = balance.toFixed(2) + ' ₽';
    
    // В зависимости от значения баланса меняем CSS-класс
    if (balance >= 0) {
        // Положительный баланс
        balanceElement.className = 'balance-amount positive';
    } else {
        // Отрицательный баланс
        balanceElement.className = 'balance-amount negative';
    }
}


// ===== ОТРИСОВКА СПИСКА ТРАНЗАКЦИЙ =====
function displayTransactions(transactions) {

    // Получаем контейнер, куда будем вставлять транзакции
    var transactionsList = document.getElementById('transactions-list');

    // Если транзакций нет — показываем сообщение
    if (transactions.length === 0) {
        transactionsList.innerHTML =
            '<div class="empty-message">У вас пока нет операций. Добавьте первую!</div>';
        return;
    }

    // Очищаем контейнер перед новой отрисовкой
    transactionsList.innerHTML = '';

    // Проходим по массиву транзакций
    for (var i = 0; i < transactions.length; i++) {

        // Текущая транзакция
        var transaction = transactions[i];

        // Создаём DOM-элемент для одной транзакции
        var transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-item';

        // Преобразуем дату из строки в объект Date
        var date = new Date(transaction.created_at);

        // Форматируем дату под русский формат
        var dateStr = date.toLocaleString('ru-RU');

        // Человекочитаемый текст типа операции
        var typeText = transaction.type === 'income' ? 'Доход' : 'Расход';

        // CSS-класс для типа операции
        var typeClass = transaction.type === 'income'
            ? 'type-income'
            : 'type-expense';

        // Знак суммы (+ или -)
        var amountSign = transaction.type === 'income' ? '+' : '-';

        // CSS-класс для суммы
        var amountClass = transaction.type === 'income'
            ? 'amount-income'
            : 'amount-expense';

        // Формируем HTML-разметку транзакции
        transactionDiv.innerHTML =
            '<div class="transaction-header">' +
                '<div class="transaction-type ' + typeClass + '">' +
                    escapeHtml(typeText) +
                '</div>' +
                '<div class="transaction-amount ' + amountClass + '">' +
                    amountSign +
                    parseFloat(transaction.amount).toFixed(2) + ' ₽' +
                '</div>' +
            '</div>' +

            // Категория (если не указана — "Без категории")
            '<div class="transaction-category">Категория: ' +
                escapeHtml(transaction.category || 'Без категории') +
            '</div>' +

            // Описание (выводится только если оно есть)
            (transaction.description
                ? '<div class="transaction-description">' +
                    escapeHtml(transaction.description) +
                  '</div>'
                : '') +

            // Дата операции
            '<div class="transaction-date">' + dateStr + '</div>';

        // Добавляем транзакцию в контейнер
        transactionsList.appendChild(transactionDiv);
    }
}


// ===== ОБРАБОТКА ОТПРАВКИ ФОРМЫ =====
document.getElementById('transaction-form').onsubmit = function (e) {

    // Отменяем стандартное поведение формы (перезагрузку страницы)
    e.preventDefault();

    // Получаем значения полей формы
    var type = document.getElementById('type').value;
    var amount = document.getElementById('amount').value;
    var category = document.getElementById('category').value;
    var description = document.getElementById('description').value;

    // Проверка: выбран ли тип операции
    if (!type) {
        alert('Выберите тип операции');
        return;
    }

    // Проверка: корректна ли сумма
    if (!amount || parseFloat(amount) <= 0) {
        alert('Сумма должна быть больше нуля');
        return;
    }

    // Создаём новый XMLHttpRequest для POST-запроса
    var xhr = new XMLHttpRequest();

    // URL API для добавления операции
    var url = 'api/budget_service.php';

    // FormData — удобный объект для отправки данных формы
    var params = new FormData();

    // Добавляем поля формы в тело запроса
    params.append('type', type);
    params.append('amount', amount);
    params.append('category', category);
    params.append('description', description);

    // Настраиваем POST-запрос
    xhr.open('POST', url, true);

    // Обработчик ответа сервера
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {

            // Парсим ответ сервера
            var response = JSON.parse(xhr.responseText);

            if (response.success) {
                // Если операция успешно сохранена:
                // очищаем форму
                document.getElementById('transaction-form').reset();

                // заново загружаем список транзакций
                loadTransactions();
            } else {
                // Если сервер вернул ошибку в JSON
                alert(response.error || 'Ошибка при сохранении');
            }
        } else {
            // Сервер вернул ошибочный HTTP-код
            alert('Ошибка сервера');
        }
    };

    // Обработчик сетевой ошибки
    xhr.onerror = function () {
        alert('Сетевая ошибка');
    };

    // Отправляем POST-запрос с данными формы
    xhr.send(params);
};


// ===== ЗАЩИТА ОТ XSS =====
function escapeHtml(text) {

    // Создаём временный DOM-элемент
    var div = document.createElement('div');

    // Записываем текст как textContent (не HTML!)
    div.textContent = text;

    // Возвращаем безопасную HTML-строку
    return div.innerHTML;
}
