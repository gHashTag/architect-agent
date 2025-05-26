import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Telegraf } from 'telegraf';
import { BotContext } from '../types/bot';
import { VectaraAdapter } from '../adapters/vectara-adapter';

const telegrafMock = mock(function () {
  return {
    command: mock(),
    start: mock(),
    help: mock(),
    catch: mock(),
    launch: mock(),
    stop: mock(),
    use: mock(),
  };
});
mock.module('telegraf', () => ({
  Telegraf: telegrafMock,
  Scenes: { BaseScene: mock(), Stage: mock() },
}));

const vectaraAdapterMock = mock(() => ({
  query: mock(),
  uploadDocument: mock(),
}));
mock.module('../adapters/vectara-adapter', () => ({
  VectaraAdapter: vectaraAdapterMock,
}));

mock.module('../logger', () => ({
  logger: {
    info: mock(),
    error: mock(),
    fatal: mock(),
    configure: mock(),
  },
  LogType: {
    SYSTEM: 'SYSTEM',
    ERROR: 'ERROR',
  },
}));

const validConfig = {
  customerId: 'test',
  apiKey: 'test',
  corpusId: 'test',
  servingEndpoint: 'test',
};

let mockBot: any;
let mockVectaraAdapter: any;

beforeEach(() => {
  // Очищаем все моки вручную
  telegrafMock.mockClear();
  vectaraAdapterMock.mockClear();
  Object.values(vectaraAdapterMock()).forEach(fn => typeof fn === 'function' && fn.mockClear());
  mockBot = new Telegraf<BotContext>('test-token');
  mockVectaraAdapter = new VectaraAdapter(validConfig);
});

describe('Bot', () => {
  it('should initialize bot with correct commands', async () => {
    expect(telegrafMock().command).toHaveBeenCalledWith('chat', expect.any(Function));
    expect(telegrafMock().command).toHaveBeenCalledWith('documents', expect.any(Function));
    expect(telegrafMock().start).toHaveBeenCalled();
    expect(telegrafMock().help).toHaveBeenCalled();
  });

  it('should handle chat command correctly', async () => {
    const mockCtx = {
      reply: mock(),
      scene: {
        session: {},
        enter: mock(),
      },
      from: { id: 123, username: 'test_user' },
    };
    const chatCall = telegrafMock().command.mock.calls.find((call: any) => call[0] === 'chat');
    if (!chatCall) throw new Error('chat command handler not registered');
    const chatHandler = chatCall[1];
    await chatHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalled();
  });

  it('should handle documents command correctly', async () => {
    const mockCtx = {
      reply: mock(),
      scene: {
        session: {},
        enter: mock(),
      },
      from: { id: 123, username: 'test_user' },
    };
    const documentsCall = telegrafMock().command.mock.calls.find((call: any) => call[0] === 'documents');
    if (!documentsCall) throw new Error('documents command handler not registered');
    const documentsHandler = documentsCall[1];
    await documentsHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalled();
  });

  it('should handle start command correctly', async () => {
    const mockCtx = {
      reply: mock(),
      from: { first_name: 'Test User' },
    };
    const startCalls = telegrafMock().start.mock.calls;
    if (!startCalls[0]) throw new Error('start command handler not registered');
    const startHandler = startCalls[0][0];
    await startHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Привет, Test User!')
    );
  });

  it('should handle help command correctly', async () => {
    const mockCtx = {
      reply: mock(),
    };
    const helpCalls = telegrafMock().help.mock.calls;
    if (!helpCalls[0]) throw new Error('help command handler not registered');
    const helpHandler = helpCalls[0][0];
    await helpHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Доступные команды:')
    );
  });

  it('should handle errors correctly', async () => {
    const mockCtx = {
      reply: mock(),
      from: { id: 123, username: 'test_user' },
    };
    const catchCalls = telegrafMock().catch.mock.calls;
    if (!catchCalls[0]) throw new Error('catch handler not registered');
    const errorHandler = catchCalls[0][0];
    await errorHandler(new Error('Test error'), mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Произошла ошибка. Пожалуйста, попробуйте позже.'
    );
  });
}); 