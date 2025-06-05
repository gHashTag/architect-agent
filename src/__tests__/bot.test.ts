import { describe, it, expect, beforeEach, vi } from 'vitest';
import { config } from '../config';

// Мокаем все зависимости
vi.mock('../config');
vi.mock('../utils/logger');
vi.mock('../scenes/chat-scene');
vi.mock('../scenes/document-scene');
vi.mock('../utils/aiAssistantHandler');

describe('Bot Configuration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have required configuration properties', () => {
      expect(config).toBeDefined();
      expect(config.bot).toBeDefined();
      expect(config.bot.token).toBeDefined();
      expect(config.openai).toBeDefined();
      expect(config.openai.apiKey).toBeDefined();
    });
  });
}); 