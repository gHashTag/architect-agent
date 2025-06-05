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
  await ctx.reply('Привет! Я простой чат-бот. Отправьте мне сообщение, и я отвечу.\n\nИспользуйте /exit для выхода.');
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

    // Простой эхо-ответ
    await ctx.reply(`Вы написали: "${query}"\n\nЯ пока простой эхо-бот. Для AI-консультаций используйте команду /ai`);
    
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