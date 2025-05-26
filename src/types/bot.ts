import { Context, Scenes } from 'telegraf';
import { VectaraAdapter } from '../adapters/vectara-adapter';

export interface BotContext extends Context {
  scene: Scenes.SceneContextScene<BotContext, SceneSession>;
  session: SceneSession;
}

export interface SceneSession extends Scenes.SceneSession {
  vectaraAdapter: VectaraAdapter;
}

export interface ChatSceneSession extends SceneSession {
  // Дополнительные поля для чат-сцены
}

export interface DocumentSceneSession extends SceneSession {
  currentDocument?: {
    text: string;
    metadata?: Record<string, any>;
  };
} 