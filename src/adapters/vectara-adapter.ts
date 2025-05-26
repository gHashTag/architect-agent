import axios from 'axios';
import { logger } from '../logger';
import { LogType } from '../logger';

export interface VectaraConfig {
  customerId: string;
  apiKey: string;
  corpusId: string;
  servingEndpoint: string;
}

export interface VectaraQueryResult {
  response: Array<{
    text: string;
    score: number;
    metadata?: Array<{ name: string; value: string }>;
  }>;
}

const MAX_DOCUMENT_LENGTH = 100000; // 100KB

export class VectaraAdapter {
  private config: VectaraConfig;

  constructor(config: VectaraConfig) {
    this.config = config;
  }

  async query(query: string): Promise<VectaraQueryResult> {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    try {
      const response = await axios.post(
        `https://${this.config.servingEndpoint}/v1/query`,
        {
          query: [
            {
              query: query,
              numResults: 5,
              corpusKey: [
                {
                  customerId: this.config.customerId,
                  corpusId: this.config.corpusId,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
          },
        }
      );

      // Логируем сырой ответ от Vectara
      logger.info('Raw Vectara API Response:', {
        type: LogType.EXTERNAL_SERVICE,
        data: response.data,
        query
      });

      if (!response.data || !response.data.responseSet || !response.data.responseSet[0]?.response) {
        throw new Error('Invalid response format from Vectara');
      }

      return {
        response: response.data.responseSet[0].response.map((item: any) => ({
          text: item.text || '',
          score: item.score || 0,
          metadata: item.metadata || [],
        })),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Vectara API credentials');
        } else if (error.response?.status === 404) {
          throw new Error('Vectara corpus not found');
        } else if (error.response?.status === 429) {
          throw new Error('Vectara API rate limit exceeded');
        }
      }
      logger.error('Error querying Vectara:', { 
        error: error instanceof Error ? error : new Error(String(error)),
        query
      });
      throw new Error('Failed to query Vectara');
    }
  }

  async uploadDocument(document: string, metadata?: Record<string, any>): Promise<void> {
    if (!document || typeof document !== 'string') {
      throw new Error('Document text cannot be empty');
    }

    if (document.length > MAX_DOCUMENT_LENGTH) {
      throw new Error('Document text is too long');
    }

    try {
      const response = await axios.post(
        `https://${this.config.servingEndpoint}/v1/upload`,
        {
          document: {
            documentId: `doc_${Date.now()}`,
            section: [
              {
                text: document,
                metadata: metadata || {},
              },
            ],
          },
          corpusKey: {
            customerId: this.config.customerId,
            corpusId: this.config.corpusId,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
          },
        }
      );

      // Логируем сырой ответ от Vectara при загрузке документа
      logger.info('Raw Vectara Upload Response:', {
        type: LogType.EXTERNAL_SERVICE,
        data: response.data,
        documentLength: document.length
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error('Failed to upload document to Vectara');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Vectara API credentials');
        } else if (error.response?.status === 404) {
          throw new Error('Vectara corpus not found');
        } else if (error.response?.status === 429) {
          throw new Error('Vectara API rate limit exceeded');
        }
      }
      logger.error('Error uploading document to Vectara:', { 
        error: error instanceof Error ? error : new Error(String(error)),
        documentLength: document.length
      });
      throw new Error('Failed to upload document to Vectara');
    }
  }
} 