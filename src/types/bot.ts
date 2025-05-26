import { Context, Scenes } from 'telegraf';
import { VectaraAdapter } from '../adapters/vectara-adapter';

// Определяю интерфейс для наших кастомных свойств сессии
export interface CustomSession {
  vectaraAdapter?: VectaraAdapter; // Опционально
  currentDocument?: {
    text: string;
    metadata?: Record<string, any>;
  };
}

// Определяю BotContext, расширяющий Context и WizardContext
// Явно указываю тип session как пересечение WizardSessionData и CustomSession
export interface BotContext extends Context, Scenes.WizardContext<BotContext> {
  session: Scenes.WizardSessionData & CustomSession;
  // scene уже типизируется WizardContext и использует session, совместимую с WizardSessionData
}

// Удаляю старые или ненужные интерфейсы сессий
// export interface BotWizardSession extends Scenes.WizardSessionData {
//   vectaraAdapter?: VectaraAdapter; 
//   currentDocument?: {
//     text: string;
//     metadata?: Record<string, any>;
//   };
// }
// export interface SceneSession extends Scenes.SceneSession {
//   vectaraAdapter: VectaraAdapter;
// }
// export interface ChatSceneSession extends SceneSession {
//   // Дополнительные поля для чат-сцены
// }
// export interface DocumentSceneSession extends SceneSession {
//   currentDocument?: {
//     text: string;
//     metadata?: Record<string, any>;
//   };
// } 