import type { Ollama } from "ollama";
import { MeetingMessage, MeetingMessageRole } from "./message";

export type StreamingCallback = (message: MeetingMessage, chunk: string) => void;

const personas: MeetingMessage[] = [
  new MeetingMessage(MeetingMessageRole.System, "This chat is a meeting between people running a Shopify store.")
]

export class Meeting {
  private messages: MeetingMessage[] = [...personas]

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private ollama: Ollama,
    private initialModel: string,
    private cb: StreamingCallback,
  ) { }

  public async sendMessage(message: MeetingMessage) {
    this.messages.push(message)
    const response = await this.ollama.chat({
      model: this.initialModel,
      messages: this.messages,
      stream: true,
    })
    let responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, "")
    this.messages.push(responseMessage)
    for await (const chunk of response) {
      // console.debug("chunk:", chunk)
      if (!chunk.done && chunk.message.role === 'assistant') {
        responseMessage.content += chunk.message.content
        this.cb(responseMessage, chunk.message.content)
      } else {
        if (chunk.message.content) {
          throw new Error(`Unexpected content when done. Chunk: ${chunk}`)
        }
      }
    }
  }
}