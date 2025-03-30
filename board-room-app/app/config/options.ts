import type { MeetingMessage } from 'app/meeting/message'
import type { Tool } from 'ollama'

export interface StoreChatOptions {
  ai: {
    ollama: {
      host: string;
      model: string;
      tools?: Tool[]
    },
    initialMessages?: MeetingMessage[]
  }
}