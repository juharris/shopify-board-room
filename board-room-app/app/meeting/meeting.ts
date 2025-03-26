import type { ChatResponse, Ollama, Message as OllamaMessage, Tool, ToolCall } from 'ollama'
import { MeetingMember } from './member'
import { MeetingMessage, MeetingMessageRole } from './message'

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

export class Meeting {
  private _messages: (MeetingMessage | OllamaMessage)[] = []
  private _nextSpeaker: string = "Assistant"

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private ollama: Ollama,
    private nextModel: string,
  ) {
    this.restart()
  }

  public get chatMessages() {
    return this._messages.filter(m => m instanceof MeetingMessage) as MeetingMessage[]
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
    const maxLoopCount = 8
    let loopCount = 0
    while (++loopCount < maxLoopCount && this._nextSpeaker !== REAL_USER_LABEL) {
      const messages = Meeting.convertMessages(this._messages)
      console.debug("messages:", messages)
      const response = await this.ollama.chat({
        model: this.nextModel,
        messages,
        stream: true,
        tools,
      })
      let responseMessage: MeetingMessage | undefined = undefined

      for await (const chunk of response) {
        console.debug("chunk:", chunk)
        if (chunk.message.tool_calls) {
          for (const toolCall of chunk.message.tool_calls) {
            await this.handleToolCall(message, chunk, toolCall)
            cb(responseMessage, undefined)
          }

          responseMessage = undefined
        }

        if (chunk.message.role === 'assistant' && chunk.message.content) {
          if (!responseMessage) {
            responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, chunk.message.content, new MeetingMember(this._nextSpeaker, this._nextSpeaker))
            this._messages.push(responseMessage)
          } else {
            responseMessage.content += chunk.message.content
          }
          cb(responseMessage, chunk.message.content)
        }

        // if (!chunk.done && chunk.message.role === 'assistant') {
        // } else {
        //   if (chunk.message.content) {
        //     throw new Error(`Unexpected content when done. Chunk: ${JSON.stringify(chunk)}`)
        //   }
        // }
      }
    }

    this._nextSpeaker = REAL_USER_LABEL
  }

  public restart() {
    this._messages = []
  }

  private static convertMessages(messages: (MeetingMessage | OllamaMessage)[]): OllamaMessage[] {
    return messages.map(m => {
      if (m instanceof MeetingMessage) {
        return {
          role: m.role,
          content: `${m.from.name}: ${m.content}`,
        }
      }
      return m
    })
  }

  private async handleToolCall(message: MeetingMessage, response: ChatResponse, toolCall: ToolCall) {
    // TODO Use tool call ID?
    // Is this role right?
    this._messages.push(response.message)
    let output: string | undefined = undefined

    switch (toolCall.function.name) {
      case 'select_next_speaker':
        this._nextSpeaker = toolCall.function.arguments.speaker
        console.debug("this._nextSpeaker:", this._nextSpeaker)
        output = `Next speaker: ${this._nextSpeaker}`
        break
      default:
        output = `Unknown tool call: ${toolCall.function.name}`
        break
    }

    const m: OllamaMessage = {
      role: 'tool',
      content: output,
    }
    this._messages.push(m)
  }
}