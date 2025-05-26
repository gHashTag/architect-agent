import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatScene } from '../scenes/chat-scene';
import { documentScene } from '../scenes/document-scene';
import { VectaraAdapter } from '../adapters/vectara-adapter';

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
  },
  LogType: {
    SYSTEM: 'SYSTEM',
    ERROR: 'ERROR',
  },
}));

describe('Chat Scene', () => {
  let mockCtx: any;
  let mockVectaraAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVectaraAdapter = new VectaraAdapter({
      customerId: 'test',
      apiKey: 'test',
      corpusId: 'test',
      servingEndpoint: 'test'
    });
    mockCtx = {
      reply: vi.fn(),
      scene: {
        session: {
          vectaraAdapter: mockVectaraAdapter
        },
        leave: vi.fn()
      },
      from: { id: 123, username: 'test_user' },
      message: { text: 'test question' }
    };
  });

  it('should handle text message correctly', async () => {
    mockVectaraAdapter.query.mockResolvedValue({
      response: [
        { text: 'Test answer', score: 0.8 }
      ]
    });

    const textHandler = chatScene.middleware();
    await textHandler(mockCtx);

    expect(mockVectaraAdapter.query).toHaveBeenCalledWith('test question');
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Test answer')
    );
  });

  it('should handle empty response correctly', async () => {
    mockVectaraAdapter.query.mockResolvedValue({
      response: []
    });

    const textHandler = chatScene.middleware();
    await textHandler(mockCtx);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      'К сожалению, я не нашел релевантной информации по вашему вопросу.'
    );
  });

  it('should handle exit command correctly', async () => {
    const exitHandler = chatScene.middleware();
    await exitHandler({ ...mockCtx, message: { text: '/exit' } });

    expect(mockCtx.reply).toHaveBeenCalledWith('До свидания!');
    expect(mockCtx.scene.leave).toHaveBeenCalled();
  });

  it('should handle error in chat scene gracefully', async () => {
    mockVectaraAdapter.query.mockRejectedValue(new Error('Vectara error'));
    const textHandler = chatScene.middleware();
    await textHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.'
    );
  });
});

describe('Document Scene', () => {
  let mockCtx: any;
  let mockVectaraAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockVectaraAdapter = new VectaraAdapter({
      customerId: 'test',
      apiKey: 'test',
      corpusId: 'test',
      servingEndpoint: 'test'
    });
    mockCtx = {
      reply: vi.fn(),
      scene: {
        session: {
          vectaraAdapter: mockVectaraAdapter
        },
        leave: vi.fn()
      },
      from: { id: 123, username: 'test_user' },
      message: { text: 'test document' }
    };
  });

  it('should handle document text correctly', async () => {
    const textHandler = documentScene.middleware();
    await textHandler(mockCtx);

    expect(mockCtx.scene.session.currentDocument).toBeDefined();
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Документ получен')
    );
  });

  it('should handle question correctly', async () => {
    mockVectaraAdapter.query.mockResolvedValue({
      response: [
        { text: 'Test answer', score: 0.8 }
      ]
    });

    const textHandler = documentScene.middleware();
    await textHandler({
      ...mockCtx,
      message: { text: '?test question' }
    });

    expect(mockVectaraAdapter.query).toHaveBeenCalledWith('test question');
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Test answer')
    );
  });

  it('should handle upload command correctly', async () => {
    mockCtx.scene.session.currentDocument = {
      text: 'test document',
      metadata: { timestamp: '2024-01-01' }
    };

    const uploadHandler = documentScene.middleware();
    await uploadHandler({
      ...mockCtx,
      message: { text: '/upload' }
    });

    expect(mockVectaraAdapter.uploadDocument).toHaveBeenCalledWith(
      'test document',
      expect.any(Object)
    );
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Документ успешно загружен в Vectara!'
    );
  });

  it('should handle cancel command correctly', async () => {
    mockCtx.scene.session.currentDocument = {
      text: 'test document',
      metadata: { timestamp: '2024-01-01' }
    };

    const cancelHandler = documentScene.middleware();
    await cancelHandler({
      ...mockCtx,
      message: { text: '/cancel' }
    });

    expect(mockCtx.scene.session.currentDocument).toBeUndefined();
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Текущий документ отменен. Вы можете отправить новый документ.'
    );
  });

  it('should handle exit command correctly', async () => {
    const exitHandler = documentScene.middleware();
    await exitHandler({
      ...mockCtx,
      message: { text: '/exit' }
    });

    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Выход из режима работы с документами.'
    );
    expect(mockCtx.scene.leave).toHaveBeenCalled();
  });

  it('should handle empty text in document scene', async () => {
    const textHandler = documentScene.middleware();
    await textHandler({ ...mockCtx, message: { text: '' } });
    expect(mockCtx.scene.session.currentDocument).toBeDefined();
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Документ получен')
    );
  });

  it('should handle error in document scene gracefully', async () => {
    mockVectaraAdapter.query.mockRejectedValue(new Error('Vectara error'));
    const textHandler = documentScene.middleware();
    await textHandler({ ...mockCtx, message: { text: '?test question' } });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.'
    );
  });

  it('should handle upload command with no document', async () => {
    const uploadHandler = documentScene.middleware();
    await uploadHandler({ ...mockCtx, message: { text: '/upload' } });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Сначала отправьте документ для загрузки.'
    );
  });

  it('should handle error during upload', async () => {
    mockCtx.scene.session.currentDocument = {
      text: 'test document',
      metadata: { timestamp: '2024-01-01' }
    };
    mockVectaraAdapter.uploadDocument.mockRejectedValue(new Error('Upload error'));
    const uploadHandler = documentScene.middleware();
    await uploadHandler({ ...mockCtx, message: { text: '/upload' } });
    expect(mockCtx.reply).toHaveBeenCalledWith(
      'Произошла ошибка при загрузке документа. Пожалуйста, попробуйте позже.'
    );
  });
}); 