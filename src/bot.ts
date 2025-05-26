import * as dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { logger, LogLevel, LogType } from "./utils/logger";
import { config } from "./config";
import { Scenes, session as sessionMiddleware } from 'telegraf';
import { chatScene } from './scenes/chat-scene';
import { documentScene } from './scenes/document-scene';
import { VectaraAdapter } from './adapters/vectara-adapter';
import { BotContext, SceneSession } from './types/bot';

let bot: Telegraf<BotContext>;

// --- Основная функция запуска бота ---
async function startBot() {
  logger.info("Starting bot initialization...", { type: LogType.SYSTEM });
  dotenv.config();
  logger.info("Environment variables loaded", { type: LogType.SYSTEM });

  logger.configure({
    logToConsole: true,
    minLevel: LogLevel.DEBUG,
  });
  logger.info("Logger configured", { type: LogType.SYSTEM });

  const BOT_TOKEN = process.env.BOT_TOKEN || config.BOT_TOKEN;
  logger.info("BOT_TOKEN status", { 
    type: LogType.SYSTEM,
    hasToken: !!BOT_TOKEN 
  });
  
  if (!BOT_TOKEN) {
    logger.fatal("BOT_TOKEN not found in .env file or configuration", {
      type: LogType.SYSTEM,
    });
    process.exit(1);
  }

  logger.info("Creating Telegraf instance...", { type: LogType.SYSTEM });
  bot = new Telegraf<BotContext>(BOT_TOKEN);
  logger.info("Telegraf instance created", { type: LogType.SYSTEM });

  // Инициализация Vectara адаптера
  logger.info("Initializing Vectara adapter...", { type: LogType.SYSTEM });
  const vectaraAdapter = new VectaraAdapter(config.vectara);
  logger.info("Vectara adapter initialized", { type: LogType.SYSTEM });

  // Создание менеджера сцен
  logger.info("Creating scene manager...", { type: LogType.SYSTEM });
  const stage = new Scenes.Stage<BotContext>([chatScene, documentScene]);
  logger.info("Scene manager created", { type: LogType.SYSTEM });

  // Добавление middleware для сцен
  logger.info("Setting up middleware...", { type: LogType.SYSTEM });
  bot.use(sessionMiddleware());
  bot.use(stage.middleware());
  logger.info("Middleware setup completed", { type: LogType.SYSTEM });

  // Добавление команды для запуска чат-бота
  bot.command('chat', async (ctx) => {
    logger.info("Chat command received", { 
      type: LogType.COMMAND,
      userId: ctx.from?.id,
      username: ctx.from?.username 
    });
    ctx.scene.session.vectaraAdapter = vectaraAdapter;
    await ctx.scene.enter('chat');
  });

  // Добавление команды для работы с документами
  bot.command('documents', async (ctx) => {
    logger.info("Documents command received", { 
      type: LogType.COMMAND,
      userId: ctx.from?.id,
      username: ctx.from?.username 
    });
    ctx.scene.session.vectaraAdapter = vectaraAdapter;
    await ctx.scene.enter('document');
  });

  // Базовые команды
  bot.start(async (ctx) => {
    logger.info("Start command received", { 
      type: LogType.COMMAND,
      userId: ctx.from?.id,
      username: ctx.from?.username 
    });
    const userFirstName = ctx.from?.first_name || "незнакомец";
    await ctx.reply(
      `Привет, ${userFirstName}! Я чат-бот на базе Vectara.\n\n` +
      `Доступные команды:\n` +
      `/chat - Начать диалог с ботом\n` +
      `/documents - Работа с документами\n` +
      `/help - Показать справку`
    );
  });

  bot.help(async (ctx) => {
    logger.info("Help command received", { 
      type: LogType.COMMAND,
      userId: ctx.from?.id,
      username: ctx.from?.username 
    });
    const helpMessage =
      "Доступные команды:\n" +
      "/start - Начальное приветствие\n" +
      "/help - Это сообщение\n" +
      "/chat - Начать диалог с ботом\n" +
      "/documents - Работа с документами\n\n" +
      "В режиме документов:\n" +
      "- Отправьте текстовый документ для загрузки\n" +
      "- Используйте команду /upload для загрузки документа\n" +
      "- Используйте команду /cancel для отмены текущего документа\n" +
      "- Используйте команду /exit для выхода из режима документов\n" +
      "- Задайте вопрос, начиная с '?' или содержащий слово 'вопрос'";
    await ctx.reply(helpMessage);
  });

  // Обработка ошибок
  bot.catch((err: any, ctx) => {
    logger.error("Bot error occurred", {
      type: LogType.ERROR,
      error: err instanceof Error ? err : new Error(String(err)),
      userId: ctx.from?.id,
      username: ctx.from?.username,
      message: ctx.message?.text
    });
    ctx.reply("Произошла ошибка. Пожалуйста, попробуйте позже.").catch(() => {});
  });

  // Запуск бота
  try {
    logger.info("Launching bot...", { type: LogType.SYSTEM });
    await bot.launch();
    logger.info("Bot launched successfully!", { type: LogType.SYSTEM });
  } catch (error) {
    logger.fatal("Error launching bot", {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error))
    });
    process.exit(1);
  }

  // Graceful shutdown
  process.once("SIGINT", () => {
    logger.info("Received SIGINT, stopping bot...", { type: LogType.SYSTEM });
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", () => {
    logger.info("Received SIGTERM, stopping bot...", { type: LogType.SYSTEM });
    bot.stop("SIGTERM");
  });
}

// Запускаем бота
logger.info("Starting bot...", { type: LogType.SYSTEM });
startBot().catch((error) => {
  logger.fatal("Critical error during bot startup", {
    type: LogType.SYSTEM,
    error: error instanceof Error ? error : new Error(String(error))
  });
  process.exit(1);
});
