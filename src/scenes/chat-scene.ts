import { Scenes } from 'telegraf';
import { logger, LogType } from '../logger';
import { BotContext } from '../types/bot';

// Возвращаю на BaseScene
export const chatScene = new Scenes.BaseScene<BotContext>('chat');

chatScene.enter(async (ctx) => {
  logger.info("Entering chat scene", {
    type: LogType.SYSTEM,
    userId: ctx.from?.id,
    username: ctx.from?.username
  });
  await ctx.reply('Привет! Я чат-бот на базе Vectara. Задайте мне вопрос, и я постараюсь найти ответ в документации.\n\nИспользуйте /exit для выхода.');
});

chatScene.on('text', async (ctx) => {
  // Игнорируем команды (сообщения, начинающиеся с '/')
  if (ctx.message.text.startsWith('/')) {
    return; 
  }

  if (!ctx.message || !('text' in ctx.message)) {
      return;
  }

  const query = ctx.message.text;

  try {
    logger.info("Processing chat query", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      query
    });

    const results = await ctx.scene.session.vectaraAdapter.query(query);
    logger.info("Vectara query results", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      resultsCount: results.response.length
    });

    if (results.response.length === 0) {
      logger.info("No relevant information found", {
        type: LogType.SYSTEM,
        userId: ctx.from?.id,
        query
      });
      await ctx.reply('К сожалению, я не нашел релевантной информации по вашему вопросу.');
      return;
    }

    // Формируем ответ на основе найденных результатов
    const response = results.response
      .map((result, index) => `${index + 1}. ${result.text}\n(Релевантность: ${Math.round(result.score * 100)}%)`)
      .join('\n\n');

    logger.info("Sending response to user", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      responseLength: response.length
    });

    await ctx.reply(response);
  } catch (error) {
    logger.error('Error in chat scene', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id,
      username: ctx.from?.username,
      query: ctx.message.text
    });
    await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
  }
});

chatScene.command('exit', async (ctx) => {
  logger.info("Exiting chat scene", {
    type: LogType.SYSTEM,
    userId: ctx.from?.id,
    username: ctx.from?.username
  });
  await ctx.reply('До свидания!');
  await ctx.scene.leave();
}); 