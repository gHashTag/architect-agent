import { Context } from 'telegraf'
import { getAiFeedbackFromOpenAI, ARCHITECT_AGENT_ASSISTANT_ID } from './getAiFeedbackFromOpenAI'
import { logger, LogType } from './logger'

export interface AIContext extends Context {
  // Расширяем контекст для AI-агента
  session?: {
    awaitingAIResponse?: boolean
    userLanguage?: string
  }
}

/**
 * Обработчик команды /ai - запуск диалога с AI-агентом архитектором
 */
export async function handleAICommand(ctx: AIContext) {
  try {
    logger.info('AI command received', {
      type: LogType.USER_ACTION,
      userId: ctx.from?.id,
      username: ctx.from?.username
    })

    const userFirstName = ctx.from?.first_name || 'Уважаемый Клиент'
    const userLanguage = ctx.from?.language_code || 'ru'

    // Инициализируем сессию если её нет
    if (!ctx.session) {
      ctx.session = {}
    }
    ctx.session.userLanguage = userLanguage

    const welcomeMessage = `🏗️ Добро пожаловать к AI-Архитектору!

🤖 Я - ваш персональный AI-консультант по архитектурным решениям и строительству.

📐 Специализируюсь на:
- Архитектурном планировании и дизайне
- HAUS блоках и современных материалах
- Энергоэффективных решениях
- Технических расчетах и консультациях

💬 Отправьте мне ваш вопрос или описание проекта, и я дам вам профессиональную консультацию!

⚡ Используйте /ai_stop для завершения диалога`

    await ctx.reply(welcomeMessage)

    // Устанавливаем флаг ожидания AI ответа
    ctx.session.awaitingAIResponse = true

  } catch (error) {
    logger.error('Error in AI command handler', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id
    })
    await ctx.reply('❌ Произошла ошибка при запуске AI-агента. Попробуйте позже.')
  }
}

/**
 * Обработчик команды /ai_stop - завершение диалога с AI-агентом
 */
export async function handleAIStopCommand(ctx: AIContext) {
  try {
    logger.info('AI stop command received', {
      type: LogType.USER_ACTION,
      userId: ctx.from?.id,
      username: ctx.from?.username
    })

    if (ctx.session) {
      ctx.session.awaitingAIResponse = false
    }

    const farewellMessage = `🙏 Спасибо за беседу!

🏗️ Диалог с AI-Архитектором завершен. Надеюсь, наша консультация была полезной для вашего проекта!

🔄 Используйте /ai чтобы начать новый диалог в любое время.

🌟 Удачи в реализации ваших архитектурных проектов!`

    await ctx.reply(farewellMessage)

  } catch (error) {
    logger.error('Error in AI stop command handler', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id
    })
    await ctx.reply('❌ Произошла ошибка при завершении диалога.')
  }
}

/**
 * Обработчик текстовых сообщений для AI-агента
 */
export async function handleAIMessage(ctx: AIContext) {
  try {
    // Проверяем, ожидаем ли мы AI ответ
    if (!ctx.session?.awaitingAIResponse) {
      return // Не обрабатываем, если не в режиме AI диалога
    }

    const messageText = (ctx.message as any)?.text
    if (!messageText) {
      await ctx.reply('⚠️ Пожалуйста, отправьте текстовое сообщение для AI-агента.')
      return
    }

    logger.info('Processing AI message', {
      type: LogType.USER_ACTION,
      userId: ctx.from?.id,
      textLength: messageText.length
    })

    // Показываем индикатор печати
    await ctx.sendChatAction('typing')

    const userFirstName = ctx.from?.first_name || 'Уважаемый Клиент'
    const userLanguage = ctx.session.userLanguage || 'ru'

    // Вызываем AI-агента
    const aiResponse = await getAiFeedbackFromOpenAI({
      assistant_id: ARCHITECT_AGENT_ASSISTANT_ID,
      report: messageText,
      language_code: userLanguage,
      full_name: userFirstName
    })

    // Отправляем ответ пользователю БЕЗ Markdown парсинга
    await ctx.reply(aiResponse.ai_response)

    logger.info('AI response sent successfully', {
      type: LogType.USER_ACTION,
      userId: ctx.from?.id,
      responseLength: aiResponse.ai_response.length
    })

  } catch (error) {
    logger.error('Error processing AI message', {
      type: LogType.SYSTEM,
      error: error instanceof Error ? error : new Error(String(error)),
      userId: ctx.from?.id
    })

    const errorMessage = `Извините, произошла ошибка при обработке вашего запроса.

Возможные причины:
- Временные проблемы с AI-сервисом
- Превышение лимитов запросов  
- Проблемы с сетевым соединением

Попробуйте повторить запрос через несколько минут или используйте /ai_stop для завершения диалога.`

    await ctx.reply(errorMessage)
  }
} 