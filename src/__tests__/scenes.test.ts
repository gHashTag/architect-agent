import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chatScene } from '../scenes/chat-scene';
import { documentScene } from '../scenes/document-scene';

describe('Scenes Tests', () => {
  let mockCtx: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockCtx = {
      reply: vi.fn(),
      from: { id: 123, username: 'test_user' },
      message: { text: 'test message' },
      scene: {
        session: {},
        leave: vi.fn(),
        enter: vi.fn()
      }
    };
  });

  describe('Chat Scene', () => {
    it('should respond to text messages', async () => {
      // Симулируем вход в сцену
      await chatScene.enter(mockCtx);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Привет! Я простой чат-бот')
      );
    });
  });

  describe('Document Scene', () => {
    it('should handle document upload', async () => {
      // Симулируем вход в сцену
      await documentScene.enter(mockCtx);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        expect.stringContaining('Добро пожаловать в режим работы с документами')
      );
    });
  });
}); 