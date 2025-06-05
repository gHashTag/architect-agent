import { Context } from 'telegraf';
import { Scenes } from 'telegraf';

// Расширяем базовые данные сессии сцен
export interface CustomSessionData extends Scenes.SceneSessionData {
  // Базовые данные сессии
  userId?: number;
  username?: string;
  lastActivity?: string;
  
  // Данные для текущего документа
  currentDocument?: {
    text: string;
    metadata: {
      timestamp: string;
      source: string;
      userId?: number;
    };
  };
}

// Определяю BotContext, расширяющий базовый SceneContext
export interface BotContext extends Scenes.SceneContext<CustomSessionData> {
  // Дополнительные поля если нужны
}
