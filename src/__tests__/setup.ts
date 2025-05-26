import { beforeEach, afterEach, mock, expect } from "bun:test";
import * as dotenv from 'dotenv';
import { vi } from 'vitest';

// Загружаем переменные окружения из .env файла
dotenv.config();

// Проверяем наличие необходимых переменных окружения
const requiredEnvVars = [
  'BOT_TOKEN',
  'VECTARA_CUSTOMER_ID',
  'VECTARA_API_KEY',
  'VECTARA_CORPUS_ID',
  'VECTARA_SERVING_ENDPOINT'
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
  // В Bun нет прямого аналога resetAll, поэтому очищаем каждый мок отдельно
  Object.values(telegrafMocks).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  Object.values(scenesMocks).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  MockTelegraf.mockClear();
  Object.values(MockMarkup).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  Object.values(MockScenes).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  Object.values(scraperMocks).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
});

// Очистка после каждого теста
afterEach(() => {
  // В Bun нет прямого аналога resetAll, поэтому очищаем каждый мок отдельно
  Object.values(telegrafMocks).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  Object.values(scenesMocks).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  MockTelegraf.mockClear();
  Object.values(MockMarkup).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  Object.values(MockScenes).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  Object.values(scraperMocks).forEach(mockFn => {
    if (typeof mockFn === 'function') mockFn.mockClear();
  });
  vi.clearAllMocks();
});

// Устанавливаем глобальную переменную для Neon
(global as any).__NEON_CONNECTION_STRING__ =
  "postgresql://fake:fake@fake.neon.tech/fake";

// Настройка глобальных моков
vi.mock('../adapters/vectara-adapter', () => ({
  VectaraAdapter: vi.fn(() => ({
    query: vi.fn(),
    uploadDocument: vi.fn(),
  })),
}));

vi.mock('telegraf', () => ({
  Telegraf: vi.fn(() => ({
    command: vi.fn(),
    start: vi.fn(),
    help: vi.fn(),
    catch: vi.fn(),
    launch: vi.fn(),
    stop: vi.fn(),
    use: vi.fn(),
  })),
  Scenes: {
    BaseScene: vi.fn(),
    Stage: vi.fn(),
  },
}));
