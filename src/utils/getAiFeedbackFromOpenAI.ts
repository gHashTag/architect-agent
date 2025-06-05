import { openai } from './openai'

type GetAiSupabaseFeedbackT = {
  assistant_id: string
  report: string
  language_code: string
  full_name: string
}

function removeAnnotations(text: string): string {
  // Регулярное выражение для поиска шаблона аннотаций
  const annotationPattern = /【\d+:\d+†source】/g
  // Заменяем все совпадения на пустую строку
  return text.replace(annotationPattern, '')
}

export async function getAiFeedbackFromOpenAI({
  assistant_id,
  report,
  language_code,
  full_name,
}: GetAiSupabaseFeedbackT): Promise<{ ai_response: string }> {
  if (!assistant_id) throw new Error('Assistant ID is not set')
  if (!report) throw new Error('Report is not set')
  if (!language_code) throw new Error('Language code is not set')
  if (!full_name) throw new Error('Full name is not set')

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not set')
  }

  try {
    // Step 1: Create a thread with necessary parameters
    const thread = await openai.beta.threads.create()

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: report,
    })

    // Step 3: Run the assistant using assistantId
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id,
      instructions: `You are a professional Architect-Agent AI consultant specializing in architectural design, construction, and building technology. You provide expert guidance on architectural planning, HAUS construction blocks, materials selection, energy efficiency, and innovative building solutions. Address the user by their name: ${full_name}, and respond in the language: ${language_code}. 

IMPORTANT FORMATTING RULES for Telegram:
1. Use clean Markdown formatting without excessive asterisks
2. For headings: Use ## for main sections  
3. For emphasis: Use single *italics* for emphasis, **bold** for important terms
4. For lists: Use simple bullet points with -
5. For separators: Use --- for horizontal lines
6. Include relevant architectural and spiritual emojis
7. Keep formatting clean and readable
8. Avoid nested formatting like ***bold-italic***

Structure your responses professionally with clear sections and helpful information.`,
    })

    // Step 4: Periodically retrieve the run to check its status
    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(run.thread_id)
      console.log(messages, 'messages')
      for (const message of messages.data.reverse()) {
        if (message.role === 'assistant') {
          console.log(message.content, 'message.content')

          const content = message.content[0]
          console.log(content, 'content')
          if (content && content.type === 'text' && content.text) {
            return {
              ai_response: removeAnnotations(content.text.value),
            }
          }
        }
      }
    } else {
      console.log(run.status)
    }
    
    // Если не удалось получить ответ от ассистента
    throw new Error(`Assistant run completed with status: ${run.status}, but no valid response received`)
  } catch (error) {
    console.error('Error querying OpenAI Assistant:', error)
    throw error
  }
}

// Константа Assistant ID для Architect-Agent
export const ARCHITECT_AGENT_ASSISTANT_ID = 'asst_PySiojCYw43zDhNMWouynfWc'
