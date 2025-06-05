import { beforeEach, afterEach, mock, expect } from 'bun:test';
import * as dotenv from 'dotenv';
import { beforeAll, afterAll } from 'vitest';

// Загружаем тестовые переменные окружения
beforeAll(async () => {
  // Устанавливаем тестовые переменные окружения
  process.env.NODE_ENV = 'test';
  process.env.BOT_TOKEN = 'test-bot-token';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  
  dotenv.config({ path: '.env.test' });
});

// Проверяем наличие необходимых переменных окружения
const requiredEnvVars = [
  'BOT_TOKEN',
  'OPENAI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Создаем базовые моки
export const telegrafMocks = {
  use: mock(() => undefined),
  launch: mock(() => undefined),
  stop: mock(() => undefined),
  command: mock(() => undefined),
  hears: mock(() => undefined),
  action: mock(() => undefined),
  on: mock(() => undefined),
  telegram: {
    sendMessage: mock(() => undefined),
    setMyCommands: mock(() => undefined),
  },
};

export const scenesMocks = {
  enter: mock(() => undefined),
  leave: mock(() => undefined),
  command: mock(() => undefined),
  action: mock(() => undefined),
  on: mock(() => undefined),
  emit: mock(() => undefined),
};

// Создаем моки для Telegraf
export const MockTelegraf = mock(() => telegrafMocks);

export const MockMarkup = {
  inlineKeyboard: mock((buttons: any) => ({
    reply_markup: { inline_keyboard: buttons },
  })),
  button: {
    callback: mock((text: string, data: string) => ({ text, callback_data: data })),
  },
};

export const MockScenes = {
  BaseScene: mock(() => scenesMocks),
  Stage: mock(() => ({
    middleware: mock(() => undefined),
  })),
};

// Мокируем функции скрапера
export const scraperMocks = {
  scrapeInstagramReels: mock(() => [{ reels_url: "https://instagram.com/p/123", views_count: 100000 }]),
  convertToStorageReel: mock((reel: any, projectId: any, sourceType: any, sourceId: any) => ({
    project_id: projectId,
    source_type: sourceType,
    source_id: sourceId,
    reels_url: reel.url,
    views_count: reel.viewCount,
    parsed_at: new Date(),
  })),
};

// Настройка перед каждым тестом
beforeEach(() => {
  Object.values(telegrafMocks).forEach(fn => typeof fn === 'function' && fn.mockClear());
  Object.values(scenesMocks).forEach(fn => typeof fn === 'function' && fn.mockClear());
  MockTelegraf.mockClear();
  Object.values(MockMarkup).forEach(fn => typeof fn === 'function' && fn.mockClear());
  Object.values(MockScenes).forEach(fn => typeof fn === 'function' && fn.mockClear());
  Object.values(scraperMocks).forEach(fn => typeof fn === 'function' && fn.mockClear());
});

// Очистка после каждого теста
afterEach(() => {
  Object.values(telegrafMocks).forEach(fn => typeof fn === 'function' && fn.mockClear());
  Object.values(scenesMocks).forEach(fn => typeof fn === 'function' && fn.mockClear());
  MockTelegraf.mockClear();
  Object.values(MockMarkup).forEach(fn => typeof fn === 'function' && fn.mockClear());
  Object.values(MockScenes).forEach(fn => typeof fn === 'function' && fn.mockClear());
  Object.values(scraperMocks).forEach(fn => typeof fn === 'function' && fn.mockClear());
});

// Устанавливаем глобальную переменную для Neon
(global as any).__NEON_CONNECTION_STRING__ =
  "postgresql://fake:fake@fake.neon.tech/fake";

// Настройка глобальных моков
mock.module('telegraf', () => ({
  Telegraf: mock(() => ({
    command: mock(),
    start: mock(),
    help: mock(),
    catch: mock(),
    launch: mock(),
    stop: mock(),
    use: mock(),
  })),
  Scenes: {
    BaseScene: mock(),
    Stage: mock(),
  },
}));
