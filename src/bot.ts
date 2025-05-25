import * as dotenv from "dotenv";
import { Telegraf, Context } from "telegraf";
import { logger, LogLevel, LogType } from "./utils/logger";
import { config } from "./config";

let bot: Telegraf<Context>;

// --- Основная функция запуска бота ---
async function startBot() {
  console.log("Starting bot initialization...");
  dotenv.config();
  console.log("Environment variables loaded");

  logger.configure({
    logToConsole: true,
    minLevel: LogLevel.DEBUG,
  });
  logger.info("Запуск бота...", { type: LogType.SYSTEM });

  const BOT_TOKEN = process.env.BOT_TOKEN || config.BOT_TOKEN;
  console.log("BOT_TOKEN found:", BOT_TOKEN ? "Yes" : "No");
  
  if (!BOT_TOKEN) {
    logger.fatal("BOT_TOKEN не найден в .env файле или конфигурации.", {
      type: LogType.SYSTEM,
    });
    process.exit(1);
  }

  console.log("Creating Telegraf instance...");
  bot = new Telegraf<Context>(BOT_TOKEN);
  console.log("Telegraf instance created");

  // Базовые команды
  bot.start(async (ctx: Context) => {
    console.log("Received /start command");
    const userFirstName = ctx.from?.first_name || "незнакомец";
    await ctx.reply(`Привет, ${userFirstName}! Я простой Hello World бот.`);
  });

  bot.help(async (ctx: Context) => {
    console.log("Received /help command");
    const helpMessage =
      "Доступные команды:\n" +
      "/start - Начальное приветствие\n" +
      "/help - Это сообщение";
    await ctx.reply(helpMessage);
  });

  // Обработка ошибок
  bot.catch((err: any, ctx: Context) => {
    console.error("Bot error:", err);
    logger.error("Ошибка в боте:", {
      error: err instanceof Error ? err : new Error(String(err)),
      type: LogType.SYSTEM,
    });
    ctx.reply("Произошла ошибка. Пожалуйста, попробуйте позже.").catch(() => {});
  });

  // Запуск бота
  try {
    console.log("Launching bot...");
    await bot.launch();
    console.log("Bot launched successfully!");
    logger.info("Бот успешно запущен!", { type: LogType.SYSTEM });
  } catch (error) {
    console.error("Error launching bot:", error);
    logger.fatal("Ошибка при запуске бота:", {
      error: error instanceof Error ? error : new Error(String(error)),
      type: LogType.SYSTEM,
    });
    process.exit(1);
  }

  // Graceful shutdown
  process.once("SIGINT", () => {
    console.log("Received SIGINT, stopping bot...");
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", () => {
    console.log("Received SIGTERM, stopping bot...");
    bot.stop("SIGTERM");
  });
}

// Запускаем бота
console.log("Starting bot...");
startBot().catch((error) => {
  console.error("Critical error:", error);
  logger.fatal("Критическая ошибка при запуске бота:", {
    error: error instanceof Error ? error : new Error(String(error)),
    type: LogType.SYSTEM,
  });
  process.exit(1);
});
