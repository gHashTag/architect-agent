import { Scenes } from 'telegraf';
import { logger, LogType } from '../logger';
import { BotContext } from '../types/bot';

// Возвращаю на BaseScene
export const documentScene = new Scenes.BaseScene<BotContext>('document');

documentScene.enter(async (ctx) => {
  logger.info("Entering document scene", {
    type: LogType.SYSTEM,
    userId: ctx.from?.id,
    username: ctx.from?.username
  });
  await ctx.reply(
    'Добро пожаловать в режим работы с документами!\n\n' +
    'Вы можете:\n' +
    '1. Отправить текстовый документ\n' +
    '2. Просмотреть сохраненный документ\n' +
    '3. Выйти из режима документов командой /exit\n\n' +
    'Отправьте документ.'
  );
});

// Обработка текстовых сообщений
documentScene.on('text', async (ctx) => {
  // Игнорируем команды (сообщения, начинающиеся с '/')
  if (ctx.message.text.startsWith('/')) {
    return;
  }

  try {
    const text = ctx.message.text;
    logger.info("Processing text in document scene", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      username: ctx.from?.username,
      textLength: text.length
    });
    
    // Сохраняем документ в сессии
    const session = ctx.scene.session as any;
    session.currentDocument = {
      text,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'telegram',
        userId: ctx.from?.id
      }
    };

    logger.info("Document saved in session", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      documentLength: text.length
    });

    await ctx.reply(
      'Документ получен и сохранен в сессии. Что вы хотите сделать?\n\n' +
      '1. Отправить новый документ (перезапишет текущий)\n' +
      '2. Просмотреть сохраненный документ (/view)\n' +
      '3. Очистить документ (/clear)\n' +
      '4. Выйти из режима документов (/exit)'
    );
  } catch (error) {
    logger.error('Error in document scene', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id,
      username: ctx.from?.username
    });
    await ctx.reply('Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.');
  }
});

// Обработка команды просмотра документа
documentScene.command('view', async (ctx) => {
  try {
    const session = ctx.scene.session as any;
    const document = session.currentDocument;
    
    logger.info("View command received", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      hasDocument: !!document
    });

    if (!document) {
      await ctx.reply('Сначала отправьте документ для сохранения.');
      return;
    }

    await ctx.reply(
      `📄 Сохраненный документ:\n\n${document.text}\n\n` +
      `📅 Время сохранения: ${document.metadata.timestamp}`
    );
  } catch (error) {
    logger.error('Error viewing document', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id,
      username: ctx.from?.username
    });
    await ctx.reply('Произошла ошибка при просмотре документа. Пожалуйста, попробуйте позже.');
  }
});

// Обработка команды очистки
documentScene.command('clear', async (ctx) => {
  logger.info("Clear command received", {
    type: LogType.SYSTEM,
    userId: ctx.from?.id,
    username: ctx.from?.username
  });

  const session = ctx.scene.session as any;
  session.currentDocument = undefined;
  await ctx.reply('Документ очищен. Вы можете отправить новый документ.');
});

// Обработка команды выхода
documentScene.command('exit', async (ctx) => {
  logger.info("Exiting document scene", {
    type: LogType.SYSTEM,
    userId: ctx.from?.id,
    username: ctx.from?.username
  });

  await ctx.reply('Выход из режима работы с документами.');
  await ctx.scene.leave();
}); 