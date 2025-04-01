import type { MeetingMessage } from 'app/meeting/message'
import type { Tool } from 'ollama'
import { DEFAULT_OPTIONS } from './default'
import { ASK_SIDEKICK_TOOL_CONFIG } from 'app/sidekick/ask-sidekick'

export interface StoreChatOptions {
  ai: {
    ollama: {
      host: string
      model: string
      tools?: Tool[]
    },
    initialMessages?: MeetingMessage[]
  }
}

export const getOptions = (isSidekickEnabled: boolean): StoreChatOptions => {
  // TODO Load from IndexedDB and allow configuring in the UI.

  return DEFAULT_OPTIONS
}

export const updateOptionsUsingSidekickStatus = (options: StoreChatOptions, isSidekickEnabled: boolean): StoreChatOptions => {
  // Deep copy
  options = JSON.parse(JSON.stringify(options))
  if (isSidekickEnabled) {
    if (!options.ai.ollama.tools) {
      options.ai.ollama.tools = []
    }
    if (!options.ai.ollama.tools.find(tool => tool.function.name === ASK_SIDEKICK_TOOL_CONFIG.function.name)) {
      options.ai.ollama.tools.push(ASK_SIDEKICK_TOOL_CONFIG)
    }
  } else {
    options.ai.ollama.tools = options.ai.ollama.tools?.filter(tool => tool.function.name !== ASK_SIDEKICK_TOOL_CONFIG.function.name)
  }

  return options
}
