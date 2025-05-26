import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Telegraf } from 'telegraf';
import { BotContext } from '../types/bot';
import { VectaraAdapter } from '../adapters/vectara-adapter';

// Мокаем Telegraf
vi.mock('telegraf', () => {
  const Telegraf = vi.fn(() => ({
    command: vi.fn(),
    start: vi.fn(),
    help: vi.fn(),
    catch: vi.fn(),
    launch: vi.fn(),
    stop: vi.fn(),
    use: vi.fn(),
  }));
  return { Telegraf, Scenes: { BaseScene: vi.fn(), Stage: vi.fn() } };
});

// Мокаем VectaraAdapter
vi.mock('../adapters/vectara-adapter', () => {
  const VectaraAdapter = vi.fn(() => ({
    query: vi.fn(),
    uploadDocument: vi.fn(),
  }));
  return { VectaraAdapter };
});

// Мокаем logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    configure: vi.fn(),
  },
  LogType: {
    SYSTEM: 'SYSTEM',
    ERROR: 'ERROR',
  },
}));

describe('Bot', () => {
  let mockBot: any;
  let mockVectaraAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBot = new Telegraf<BotContext>();
    mockVectaraAdapter = new VectaraAdapter({});
  });

  it('should initialize bot with correct commands', async () => {
    // Проверяем, что команды были зарегистрированы
    expect(mockBot.command).toHaveBeenCalledWith('chat', expect.any(Function));
    expect(mockBot.command).toHaveBeenCalledWith('documents', expect.any(Function));
    expect(mockBot.start).toHaveBeenCalled();
    expect(mockBot.help).toHaveBeenCalled();
  });

  it('should handle chat command correctly', async () => {
    const mockCtx = {
      scene: {
        session: {},
        enter: vi.fn(),
      },
      from: { id: 123, username: 'test_user' },
    };

    // Получаем обработчик команды chat
    const chatHandler = mockBot.command.mock.calls.find(
      (call: any) => call[0] === 'chat'
    )[1];

    await chatHandler(mockCtx);

    expect(mockCtx.scene.session.vectaraAdapter).toBeDefined();
    expect(mockCtx.scene.enter).toHaveBeenCalledWith('chat');
  });

  it('should handle documents command correctly', async () => {
    const mockCtx = {
      scene: {
        session: {},
        enter: vi.fn(),
      },
      from: { id: 123, username: 'test_user' },
    };

    // Получаем обработчик команды documents
    const documentsHandler = mockBot.command.mock.calls.find(
      (call: any) => call[0] === 'documents'
    )[1];

    await documentsHandler(mockCtx);

    expect(mockCtx.scene.session.vectaraAdapter).toBeDefined();
    expect(mockCtx.scene.enter).toHaveBeenCalledWith('document');
  });

  it('should handle start command correctly', async () => {
    const mockCtx = {
      reply: vi.fn(),
      from: { first_name: 'Test User' },
    };

    // Получаем обработчик команды start
    const startHandler = mockBot.start.mock.calls[0][0];

    await startHandler(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Привет, Test User!')
    );
  });

  it('should handle help command correctly', async () => {
    const mockCtx = {
      reply: vi.fn(),
    };

    // Получаем обработчик команды help
    const helpHandler = mockBot.help.mock.calls[0][0];

    await helpHandler(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Доступные команды:')
    );
  });

  it('should handle errors correctly', async () => {
    const mockCtx = {
      reply: vi.fn(),
      from: { id: 123, username: 'test_user' },
    };

    // Получаем обработчик ошибок
    const errorHandler = mockBot.catch.mock.calls[0][0];

    await errorHandler(new Error('Test error'), mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Произошла ошибка. Пожалуйста, попробуйте позже.'
    );
  });
}); 