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

interface VectaraResponse {
  responseSet: Array<{
    response: Array<{
      text: string;
      score: number;
      metadata: Array<{
        name: string;
        value: string;
      }>;
      documentIndex: number;
      resultLength: number;
    }>;
    document: Array<{
      id: string;
      metadata: Array<{
        name: string;
        value: string;
      }>;
    }>;
  }>;
}

const MAX_DOCUMENT_LENGTH = 100000; // 100KB

export class VectaraAdapter {
  private config: VectaraConfig;

  constructor(config: VectaraConfig) {
    this.config = config;
  }

  async query(
    query: string,
    ctx?: { from?: { id: number } }
  ): Promise<VectaraQueryResult> {
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

      // Логируем сырой ответ от API
      logger.info('Raw Vectara API Response:', {
        type: LogType.EXTERNAL_SERVICE,
        data: response.data,
        query
      });

      // Проверяем структуру ответа
      if (!response.data.responseSet?.[0]?.response) {
        throw new Error('Invalid response format from Vectara');
      }

      // Логируем детали каждого результата
      response.data.responseSet[0].response.forEach((result: VectaraResponse['responseSet'][0]['response'][0], index: number) => {
        // Получаем документ, к которому относится результат
        const document = response.data.responseSet[0].document[result.documentIndex];
        
        // Преобразуем метаданные в удобный формат
        const metadataObj = result.metadata.reduce((acc: Record<string, string>, meta: { name: string; value: string }) => {
          acc[meta.name] = meta.value;
          return acc;
        }, {});

        logger.info(`Search Result #${index + 1}:`, {
          type: LogType.EXTERNAL_SERVICE,
          data: {
            document: {
              id: document.id,
              title: document.metadata.find((m: { name: string; value: string }) => m.name === 'title')?.value
            },
            text: result.text,
            score: result.score,
            section: metadataObj.section,
            breadcrumb: metadataObj.breadcrumb ? JSON.parse(metadataObj.breadcrumb) : []
          },
          query
        });
      });

      // Логируем информацию о документах
      logger.info('Documents in corpus:', {
        type: LogType.SYSTEM,
        data: {
          documents: response.data.responseSet[0].document.map((doc: VectaraResponse['responseSet'][0]['document'][0]) => ({
            id: doc.id,
            title: doc.metadata.find((m: { name: string; value: string }) => m.name === 'title')?.value
          }))
        }
      });

      // Логируем общую статистику
      logger.info('Search statistics:', {
        type: LogType.SYSTEM,
        userId: ctx?.from?.id,
        data: {
          totalResults: response.data.responseSet[0].response.length,
          totalDocuments: response.data.responseSet[0].document.length,
          queryUuid: response.data.responseSet[0].queryUuid
        }
      });

      return {
        response: response.data.responseSet[0].response.map((item: VectaraResponse['responseSet'][0]['response'][0]) => ({
          text: item.text || '',
          score: item.score || 0,
          metadata: item.metadata || [],
        }))
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