# Hello World Telegraph Bot

Простой бот на базе фреймворка Telegraph, демонстрирующий базовую функциональность.

## Установка

1. Клонируйте репозиторий:
    ```bash
git clone <repository-url>
cd hello-world-telegraph-bot
    ```

2. Установите зависимости:
    ```bash
    npm install
    ```

3. Создайте файл .env на основе example.env:
    ```bash
cp example.env .env
    ```

4. Отредактируйте .env и добавьте ваш BOT_TOKEN, полученный от @BotFather в Telegram.

## Запуск

### Разработка
    ```bash
npm run dev
```

### Продакшн
```bash
npm run build
npm start
```

## Доступные команды

- `/start` - Начальное приветствие
- `/help` - Список доступных команд

## Структура проекта

```
src/
  ├── bot.ts         # Основной файл бота
  ├── config.ts      # Конфигурация
  └── utils/
      └── logger.ts  # Логгер
```

## Технологии

- TypeScript
- Telegraph (Telegram Bot Framework)
- dotenv для конфигурации
