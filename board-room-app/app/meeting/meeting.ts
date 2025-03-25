import type { Message, Ollama, Tool, ToolCall } from "ollama";
import { MeetingMessage, MeetingMessageRole } from "./message";
import { MeetingMember } from "./member";

/**
 * Callback for streaming the response from the AI.
 * @param message The latest version of the generated message.
 * @param chunk New text that was appended to the end of the message's content.
 */
export type StreamingCallback = (message: MeetingMessage, chunk: string) => void;

export class Meeting {
  private _messages: MeetingMessage[] = []

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private ollama: Ollama,
    private nextModel: string,
  ) {
    this.restart()
  }

  public get messages() {
    return this._messages
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
    const response = await this.ollama.chat({
      model: this.nextModel,
      messages: Meeting.convertMessages(this._messages),
      stream: true,
      tools,
    })
    let responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, "", new MeetingMember("Assistant", "assistant"))
    this._messages.push(responseMessage)
    for await (const chunk of response) {
      // console.debug("chunk:", chunk)
      if (chunk.message.tool_calls) {
        for (const toolCall of chunk.message.tool_calls) {
          await this.handleToolCall(message, toolCall, "TODO id")
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
    this._messages = []
  }

  private static convertMessages(messages: MeetingMessage[]): Message[] {
    return messages.map(m => ({
      role: m.role,
      content: m.content,
    }))
  }

  private async handleToolCall(message: MeetingMessage, toolCall: ToolCall, toolCallId: string) {
    // TODO Use tool call ID?
    // Is this role right?
    this._messages.push(new MeetingMessage(MeetingMessageRole.Tool, JSON.stringify(toolCall.function.arguments), message.from))

    switch (toolCall.function.name) {
      case 'select_next_speaker':
        // const speaker = toolCall.function.arguments.speaker
        // TODO If the next speaker is not the user, get the model to say something from the persona.
        // Otherwise, let the user say something.
        break
    }

    const m = new MeetingMessage(MeetingMessageRole.Tool, "TODO result", message.from)
    m.tool_call_id = toolCallId
    this._messages.push(m)
  }
}