import { describe, it, expect, beforeAll } from 'bun:test';
import { VectaraAdapter } from '../adapters/vectara-adapter';
import { config } from '../config';

describe('Vectara Connection Test', () => {
  let vectaraAdapter: VectaraAdapter;

  beforeAll(() => {
    // Проверяем наличие необходимых переменных окружения
    expect(config.vectara.customerId).toBeTruthy();
    expect(config.vectara.apiKey).toBeTruthy();
    expect(config.vectara.corpusId).toBeTruthy();
    expect(config.vectara.servingEndpoint).toBeTruthy();

    vectaraAdapter = new VectaraAdapter(config.vectara);
  });

  it('should successfully connect to Vectara and perform a test query', async () => {
    // Выполняем тестовый запрос
    const result = await vectaraAdapter.query('test');
    
    // Проверяем структуру ответа
    expect(result).toBeDefined();
    expect(Array.isArray(result.response)).toBe(true);
    
    // Выводим результаты для проверки
    console.log('Vectara connection test results:', {
      responseCount: result.response.length,
      firstResponse: result.response[0],
    });
  }, 10000); // Увеличиваем таймаут до 10 секунд для сетевого запроса
}); 