import type { Message, Ollama, Tool, ToolCall } from "ollama";
import { MeetingMessage, MeetingMessageRole } from "./message";

export type StreamingCallback = (message: MeetingMessage, chunk: string) => void;

const personas: MeetingMessage[] = [
  new MeetingMessage(MeetingMessageRole.System, "This conversation is a meeting which includes a real person chatting with fake AI personas about how to manage their Shopify store.")
]

const TOOLS: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'select_next_speaker',
      description: 'Select the next speaker in the conversation. It could be the real person, or one of the AI personas.',
      parameters: {
        type: 'object',
        required: ['speaker'],
        properties: {
          speaker: {
            type: 'string',
            description: 'The next speaker in the conversation. It could be the real person, or one of the AI personas.',
            enum: ['real_user', 'CEO', 'CFO', 'COO',]
          }
        },
      }
    }
  }
]

export class Meeting {
  private _messages: MeetingMessage[] = []

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private ollama: Ollama,
    private nextModel: string,
  ) {
    this.restart()
  }

  public async sendMessage(
    message: MeetingMessage,
    cb: StreamingCallback,
  ) {
    this._messages.push(message)
    const response = await this.ollama.chat({
      model: this.nextModel,
      messages: Meeting.convertMessages(this._messages),
      stream: true,
      // tools: TOOLS,
    })
    let responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, "")
    this._messages.push(responseMessage)
    for await (const chunk of response) {
      // console.debug("chunk:", chunk)
      if (chunk.message.tool_calls) {
        for (const toolCall of chunk.message.tool_calls) {
          await this.handleToolCall(toolCall, "TODO id")
        }
      }
      if (!chunk.done && chunk.message.role === 'assistant') {
        responseMessage.content += chunk.message.content
        cb(responseMessage, chunk.message.content)
      } else {
        if (chunk.message.content) {
          throw new Error(`Unexpected content when done. Chunk: ${chunk}`)
        }
      }
    }
  }

  public restart() {
    this._messages = [...personas]
  }

  private static convertMessages(messages: MeetingMessage[]): Message[] {
    return messages.map(m => ({
      role: m.role,
      content: m.content,
    }))
  }

  private async handleToolCall(toolCall: ToolCall, toolCallId: string) {
    // TODO Use tool call ID?
    // Is this role right?
    this._messages.push(new MeetingMessage(MeetingMessageRole.Tool, JSON.stringify(toolCall.function.arguments)))

    switch (toolCall.function.name) {
      case 'select_next_speaker':
        // const speaker = toolCall.function.arguments.speaker
        // TODO If the next speaker is not the user, get the model to say something from the persona.
        // Otherwise, let the user say something.
        break
    }

    const m = new MeetingMessage(MeetingMessageRole.Tool, "TODO result")
    m.tool_call_id = toolCallId
    this._messages.push(m)
  }
}