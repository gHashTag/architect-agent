import { config } from 'dotenv';
import { resolve } from 'path';

// Загружаем переменные окружения из .env файла
config({ path: resolve(process.cwd(), '.env') });

// Проверяем наличие токена
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в .env файле!');
  process.exit(1);
}

// Запускаем бота
import '../src/bot'; 