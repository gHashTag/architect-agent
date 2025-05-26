import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import axios from 'axios';
import { VectaraAdapter } from '../../adapters/vectara-adapter';

const axiosPostMock = mock();
mock.module('axios', () => ({
  post: axiosPostMock,
}));

describe('VectaraAdapter', () => {
  const mockConfig = {
    customerId: 'test-customer',
    apiKey: 'test-key',
    corpusId: 'test-corpus',
    servingEndpoint: 'https://api.vectara.io',
  };

  let adapter: VectaraAdapter;

  beforeEach(() => {
    adapter = new VectaraAdapter(mockConfig);
    axiosPostMock.mockReset();
  });

  describe('query', () => {
    it('should make correct query request', async () => {
      const mockResponse = {
        data: {
          response: [
            {
              text: 'Test response',
              score: 0.95,
              metadata: [{ name: 'source', value: 'test' }],
            },
          ],
        },
      };
      axiosPostMock.mockImplementation(() => Promise.resolve(mockResponse));
      const result = await adapter.query('test query');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.vectara.io/v1/query',
        {
          query: [
            {
              query: 'test query',
              numResults: 5,
              corpusKey: [
                {
                  customerId: mockConfig.customerId,
                  corpusId: mockConfig.corpusId,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': mockConfig.apiKey,
          },
        }
      );
      expect(result).toEqual({
        response: [
          {
            text: 'Test response',
            score: 0.95,
            metadata: [{ name: 'source', value: 'test' }],
          },
        ],
      });
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          response: [],
        },
      };
      axiosPostMock.mockImplementation(() => Promise.resolve(mockResponse));
      const result = await adapter.query('test query');
      expect(result).toEqual({
        response: [],
      });
    });

    it('should handle API errors', async () => {
      axiosPostMock.mockImplementation(() => Promise.reject({
        response: {
          status: 401,
        },
      }));
      await expect(adapter.query('test query')).rejects.toThrow('Invalid Vectara API credentials');
    });

    it('should validate input', async () => {
      await expect(adapter.query('')).rejects.toThrow('Query must be a non-empty string');
      await expect(adapter.query(null as any)).rejects.toThrow('Query must be a non-empty string');
    });
  });

  describe('uploadDocument', () => {
    it('should upload document correctly', async () => {
      const mockResponse = {
        data: {
          status: 'success',
        },
      };
      axiosPostMock.mockImplementation(() => Promise.resolve(mockResponse));
      await adapter.uploadDocument('test document', { source: 'test' });
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.vectara.io/v1/upload',
        {
          document: {
            documentId: expect.stringMatching(/^doc_\d+$/),
            section: [
              {
                text: 'test document',
                metadata: { source: 'test' },
              },
            ],
          },
          corpusKey: {
            customerId: mockConfig.customerId,
            corpusId: mockConfig.corpusId,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': mockConfig.apiKey,
          },
        }
      );
    });

    it('should handle API errors', async () => {
      axiosPostMock.mockImplementation(() => Promise.reject({
        response: {
          status: 404,
        },
      }));
      await expect(adapter.uploadDocument('test document')).rejects.toThrow('Vectara corpus not found');
    });

    it('should validate input', async () => {
      await expect(adapter.uploadDocument('')).rejects.toThrow('Document text cannot be empty');
      await expect(adapter.uploadDocument(null as any)).rejects.toThrow('Document text cannot be empty');
      const longDocument = 'a'.repeat(100001);
      await expect(adapter.uploadDocument(longDocument)).rejects.toThrow('Document text is too long');
    });
  });
}); 