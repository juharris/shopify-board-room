import type { StreamingCallback } from "app/meeting/meeting";
import { Meeting } from "app/meeting/meeting";
import { MeetingMessage, MeetingMessageRole } from "app/meeting/message";
import { Ollama } from "ollama";
import * as readline from 'readline';

const ask = (prompt: string, rl: readline.Interface, signal: AbortSignal): Promise<MeetingMessage> => {
  return new Promise((resolve, _reject) => {
    rl.question(prompt, { signal }, (input) => {
      const userMessage = new MeetingMessage(MeetingMessageRole.User, input)
      resolve(userMessage)
    })
  })
}


class ChatRunner {
  public async start(initialModel: string) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ac = new AbortController();
    const signal = ac.signal;

    signal.addEventListener('abort', () => {
      console.log("Meeting adjourned.");
    }, { once: true });

    const ollama = new Ollama()

    const cb: StreamingCallback = (m, chunk) => {
      rl.write(chunk)
    }

    const meeting = new Meeting(ollama, initialModel)

    let isRunning = true
    while (isRunning) {
      const userMessage = await ask(">> You: ", rl, signal)
      rl.write("\n")

      switch (userMessage.content) {
        case '/bye':
          rl.close()
          isRunning = false
          break
      }

      if (!isRunning) {
        break
      }

      await meeting.sendMessage(userMessage, cb)
      rl.write("\n\n")
    }

    console.log("Meeting adjourned.");
    rl.close()
  }
}

const main = () => {
  const runner = new ChatRunner()
  const initialModel = 'llama3.2'
  runner.start(initialModel)
}

main()