import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  baseURL: 'https://api.openai.com/v1',
  apiKey: process.env.OPENAI_API_KEY,
}) 