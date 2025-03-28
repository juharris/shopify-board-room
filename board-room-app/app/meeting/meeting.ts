import {
  type ChatResponse,
  type Ollama,
  type Message as OllamaMessage,
  type Tool,
  type ToolCall,
} from 'ollama'
import { MeetingMember } from './member'
import { getMeetingMessageRole, MeetingMessage, MeetingMessageRole } from './message'

/**
 * Callback for streaming the response from the AI.
 * @param message The latest version of the generated message.
 * @param chunk New text that was appended to the end of the message's content.
 */
export type StreamingCallback = (
  message: MeetingMessage | undefined,
  chunk: string | undefined,
) => void;

export const REAL_USER_LABEL = 'real_user'

// Very ad-hoc for now, could generalize later.
class HandleToolCallResponse {
  nextSpeaker?: string = undefined
  nextTools?: Tool[] = undefined
}

export class Meeting {
  private _messages: (MeetingMessage | OllamaMessage)[] = []

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _ollamaClient: Ollama,
    private _nextModel: string,
  ) {
    this.restart()
  }

  public get chatMessages(): MeetingMessage[] {
    // Ideally:
    // return this._messages.filter(m => m instanceof MeetingMessage)

    // With showing the tool calls:
    return this._messages.map(m => {
      if (m instanceof MeetingMessage) {
        return m
      }
      if (m.role) {
        const role = getMeetingMessageRole(m.role)
        const name = role === MeetingMessageRole.Tool ? "Tool Result" : "Tool Call"
        const fromId = role === MeetingMessageRole.Tool ? "tool_result" : "tool_call"
        return new MeetingMessage(
          role,
          m.content || JSON.stringify(m.tool_calls, null, 2),
          new MeetingMember(name, fromId))
      }

      // Shouldn't happen.
      throw new Error(`Unexpected message: ${JSON.stringify(m)}`)
    })
  }

  public addMessages(messages: MeetingMessage[]) {
    this._messages.push(...messages)
  }

  public async sendMessage(
    message: MeetingMessage,
    tools: Tool[] | undefined,
    cb: StreamingCallback,
  ) {
    this._messages.push(message)
    await this.generateResponses(message, tools, cb)
  }

  public async generateResponses(
    message: MeetingMessage,
    tools: Tool[] | undefined,
    cb: StreamingCallback,
  ) {
    // console.debug("Meeting.generateResponses: message:", message)
    const maxLoopCount = 9
    let loopCount = 0
    let nextTools = tools
    let nextSpeaker = "Assistant"
    let hadAssistantMessage = false
    while (++loopCount < maxLoopCount && nextSpeaker !== REAL_USER_LABEL) {
      console.debug("Meeting.generateResponses: loopCount:", loopCount)
      const messages = Meeting.convertMessages(this._messages)
      // console.debug("messages:", messages, JSON.stringify(messages))
      console.debug("Meeting.generateResponses: nextTools:", nextTools)
      const response = await this._ollamaClient.chat({
        model: this._nextModel,
        messages,
        stream: true,
        tools: nextTools,
      })

      let responseMessage: MeetingMessage | undefined = undefined
      let hadToolCall = false
      for await (const chunk of response) {
        console.debug("chunk:", chunk)
        if (chunk.message.tool_calls) {
          hadToolCall = true
          for (const toolCall of chunk.message.tool_calls) {
            const handleToolCallResponse = await this.handleToolCall(message, chunk, toolCall)
            nextTools = handleToolCallResponse.nextTools
            nextSpeaker = handleToolCallResponse.nextSpeaker || nextSpeaker
            cb(responseMessage, undefined)
            if (!hadAssistantMessage && nextSpeaker === REAL_USER_LABEL) {
              // Try force the assistant to respond.
              nextSpeaker = "Assistant"
            }
          }

          responseMessage = undefined
        }

        if (chunk.message.role === 'assistant' && chunk.message.content) {
          if (!responseMessage) {
            responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, chunk.message.content, new MeetingMember(nextSpeaker, nextSpeaker))
            this._messages.push(responseMessage)

            // Reset the tools for the next round.
            nextTools = tools
            hadAssistantMessage = true
          } else {
            responseMessage.content += chunk.message.content
          }
          cb(responseMessage, chunk.message.content)
        }

        // Detect when the model outputs no tools calls and no content, then give control back to the user.
        if (!hadToolCall && responseMessage === undefined
          && chunk.done && chunk.done_reason === 'stop'
          && chunk.message.role === 'assistant' && !chunk.message.content) {
          // It generated an empty message, which means it's done.
          console.debug("Meeting.generateResponses: done")
          nextSpeaker = REAL_USER_LABEL
        }

        // if (!chunk.done && chunk.message.role === 'assistant') {
        // } else {
        //   if (chunk.message.content) {
        //     throw new Error(`Unexpected content when done. Chunk: ${JSON.stringify(chunk)}`)
        //   }
        // }
      }
    }
  }

  public restart() {
    this._messages = []
  }

  private static convertMessages(messages: (MeetingMessage | OllamaMessage)[]): OllamaMessage[] {
    return messages.map(m => {
      if (m instanceof MeetingMessage) {
        const prefix = m.role === MeetingMessageRole.Assistant ?
          `(from ${m.from.name}) `
          : ""
        return {
          role: m.role,
          content: `${prefix}${m.content}`,
        }
      }
      return m
    })
  }

  private async handleToolCall(message: MeetingMessage, response: ChatResponse, toolCall: ToolCall)
    : Promise<HandleToolCallResponse> {
    const knownFunctions = ['select_next_speaker']
    if (!knownFunctions.includes(toolCall.function.name)) {
      // It happens, just ignore it for now.
      return {}
    }

    this._messages.push(response.message)

    let output: string | undefined = undefined
    let nextSpeaker: string | undefined = undefined
    let nextTools: Tool[] | undefined = undefined
    switch (toolCall.function.name) {
      case 'select_next_speaker':
        nextSpeaker = toolCall.function.arguments.speaker
        console.debug("handleToolCall: nextSpeaker:", nextSpeaker)
        output = `Next speaker: ${nextSpeaker}`
        // We want to let someone else speak, so we should not use a tool next time,
        // also, Ollama will not stream the response if we include tools in the request.
        nextTools = []
        break
      default:
        // Won't happen because of the check above for the function name.
        throw new Error(`Unknown tool call: ${toolCall.function.name}`)
    }

    const toolResponseMessage: OllamaMessage = {
      role: 'tool',
      content: output,
    }
    this._messages.push(toolResponseMessage)


    return {
      nextSpeaker,
      nextTools,
    }
  }
}