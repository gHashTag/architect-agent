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
    '2. Задать вопрос по документам\n' +
    '3. Выйти из режима документов командой /exit\n\n' +
    'Отправьте документ или задайте вопрос.'
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
    
    // Если это вопрос (начинается с "?" или содержит "вопрос")
    if (text.startsWith('?') || text.toLowerCase().includes('вопрос')) {
      const query = text.startsWith('?') ? text.slice(1).trim() : text;
      logger.info("Processing question in document scene", {
        type: LogType.SYSTEM,
        userId: ctx.from?.id,
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
    } else {
      // Если это документ, сохраняем его в сессии
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
        'Документ получен. Что вы хотите сделать?\n\n' +
        '1. Загрузить документ в Vectara\n' +
        '2. Отменить и ввести новый документ\n' +
        '3. Выйти из режима документов (/exit)'
      );
    }
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

// Обработка команды загрузки документа
documentScene.command('upload', async (ctx) => {
  try {
    const session = ctx.scene.session as any;
    const document = session.currentDocument;
    
    logger.info("Upload command received", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      hasDocument: !!document
    });

    if (!document) {
      await ctx.reply('Сначала отправьте документ для загрузки.');
      return;
    }

    logger.info("Uploading document to Vectara", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id,
      documentLength: document.text.length
    });

    await ctx.scene.session.vectaraAdapter.uploadDocument(document.text, document.metadata);
    
    logger.info("Document uploaded successfully", {
      type: LogType.SYSTEM,
      userId: ctx.from?.id
    });

    await ctx.reply('Документ успешно загружен в Vectara!');
    
    // Очищаем текущий документ
    session.currentDocument = undefined;
  } catch (error) {
    logger.error('Error uploading document', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id,
      username: ctx.from?.username
    });
    await ctx.reply('Произошла ошибка при загрузке документа. Пожалуйста, попробуйте позже.');
  }
});

// Обработка команды отмены
documentScene.command('cancel', async (ctx) => {
  logger.info("Cancel command received", {
    type: LogType.SYSTEM,
    userId: ctx.from?.id,
    username: ctx.from?.username
  });

  const session = ctx.scene.session as any;
  session.currentDocument = undefined;
  await ctx.reply('Текущий документ отменен. Вы можете отправить новый документ.');
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