import * as dotenv from "dotenv";
import { LogLevel } from "./utils/logger";

// Загружаем переменные из .env файла
dotenv.config();

export interface Config {
  bot: {
    token: string;
  };
  openai: {
    apiKey: string;
  };
}

/**
 * Валидирует обязательные параметры конфигурации
 * @param config Объект конфигурации для проверки
 * @throws Ошибку с описанием отсутствующих параметров
 */
const validateRequiredConfig = (config: Partial<Config>): void => {
  const missingVars: string[] = [];

  if (!config.bot?.token) {
    missingVars.push("BOT_TOKEN");
  }

  if (!config.openai?.apiKey) {
    missingVars.push("OPENAI_API_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }
};

/**
 * Создает объект конфигурации на основе переменных окружения
 * @returns Объект Config с параметрами приложения
 */
const createConfig = (): Config => {
  const partialConfig: Partial<Config> = {
    bot: {
      token: process.env.BOT_TOKEN || '',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
  };

  // Проверяем обязательные параметры
  validateRequiredConfig(partialConfig);

  // Если мы дошли до этой точки, значит все обязательные параметры присутствуют
  return partialConfig as Config;
};

// Создаем и экспортируем конфигурацию
export const config: Config = (() => {
  try {
    return createConfig();
  } catch (error) {
    console.error(`FATAL CONFIG ERROR: ${(error as Error).message}`);
    process.exit(1);
  }
})();

// Экспортируем тип конфигурации для использования в context
export type BotConfig = Readonly<Config>;
