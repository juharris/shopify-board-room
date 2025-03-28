import { TitleBar } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Button,
  Card,
  Divider,
  Layout,
  Page,
  Scrollable,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import type { StreamingCallback } from "app/meeting/meeting";
import { Meeting, REAL_USER_LABEL } from "app/meeting/meeting";
import { MeetingMessage, MeetingMessageRole, } from "app/meeting/message";
import { type ListResponse, Ollama, type Tool } from 'ollama';
import { useCallback, useEffect, useMemo, useState } from 'react';

import styles from '../styles/chat.module.css';
import { MeetingMember } from "app/meeting/member";
import ChatMessage from "app/components/ChatMessage";
import SidekickListenerInstructions from "app/components/SidekickListenerInstructions";
import { checkForSidekickListener } from "app/sidekick/message-passing";

// export const PRODUCT_NAME = "ShopifAI ConclAIve Chat"
export const PRODUCT_NAME = "JustAIce LAIgue Chat"

interface StoreChatOptions {
  ai: {
    ollama: {
      host: string;
      model: string;
      tools?: Tool[]
    },
    initialMessages?: MeetingMessage[]
  }
}

export default function ChatPage() {
  const systemMember = new MeetingMember("System", 'system');
  const userMember = new MeetingMember("You", 'user');

  // TODO Load from IndexedDB and allow configuring in the UI.
  const initialOptions: StoreChatOptions = {
    ai: {
      ollama: {
        host: 'http://localhost:11434',
        model: 'llama3.2:latest',
        tools: [
          {
            type: 'function',
            function: {
              name: 'select_next_speaker',
              description: `Select the next speaker in the conversation. It could be the real person (i.e., the ${REAL_USER_LABEL}) or one of the AI personas.` +
                " After an AI persona sends a message, then they may suggest another persona to speak next or ask the real person for their input." +
                " If they suggest another persona to speak next, then the input speaker to this tool should be the one they suggest to speak." +
                `Do not select ${REAL_USER_LABEL} as the speaker if they were the last to say something.` +
                "",
              parameters: {
                type: 'object',
                required: ['speaker'],
                properties: {
                  speaker: {
                    type: 'string',
                    description: 'The next speaker in the conversation. It could be the real person, or one of the AI personas.',
                    enum: [
                      REAL_USER_LABEL,
                      'CEO',
                      'CFO',
                      'COO',
                      'contrarian',
                    ]
                  },
                },
              },
            },
          },
        ],
      },
      initialMessages: [
        new MeetingMessage(MeetingMessageRole.System,
          "This conversation is a meeting which includes a real person chatting with fake AI personas about how to manage their Shopify store." +
          " The AI personas in assistant messages should mostly chat with each other and ask each other questions." +
          " They may occasionally ask the real person questions." +
          " If the real person starts with something simple such as \"Let's begin.\", " +
          "then the AI personas should start the conversation amongst themselves for a few short messages before asking the real person for their input." +
          "\n\n" +
          "The next speaker is inferred from the tool response." +
          " Best speaking, prefix the next speaker's name or title as the first line of the message." +
          " For example, if the next speaker is the CEO, then the first line of the message should be \"**CEO:** \"." +
          // "Use a tool call before changing the persona that responds." +
          // + " "
          // + "Do not change the persona in the same generated response message." +
          // "\n\n Do not include a prefix to indicate the name or title of the persona because it will be inferred from the tool call request arguments." +
          " Do not include (from <title>) at the beginning of a message. For example, do not include \"(from CTO)\" nor \"(from CEO)\" nor \"(from CFO)\" at the beginning of a message." +
          "\n\nHere are some examples of responses, which can use markdown formatting:" +
          "\n\n```\n<examples>" +
          "\n<example>" +
          "\n**CEO:** I **declare** that we need to use AI more in our strategy to figure out how to manage our Shopify store. I would like to hear from the CTO how we can do that." +
          "\n</example>" +
          "\n<example>" +
          "\n**CTO:** As the CTO, I know 3 clear ways to use AI to improve our Shopify store:" +
          "\n\n1. Use AI to generate product descriptions" +
          "\n2. Use AI to generate product images" +
          "\n3. Use AI to simulate user interactions and the shopping experience" +
          "\n</example>" +
          "\n</examples>```" +
          `\n\n Then a tool call for \`select_next_speaker\`, if enabled, could select a different persona to speak or the ${REAL_USER_LABEL} could speak.` +
          "\n\nResponse and encourage to use markdown formatting to emphasize points, ideas, lists, titles, bolding, etc." +
          "\n\n The conversation begins now. Start with 3 or 4 personas discussing a topic for how to improve the store and grow sales.",
          systemMember),
      ],
    },
  }

  const [errorLoadingOllamaModels, setErrorLoadingOllamaModels] = useState<unknown | undefined>(undefined)
  const [isSidekickReady, setIsSidekickReady] = useState(false)
  const [options, setOptions] = useState<StoreChatOptions>(initialOptions)
  const [ollamaModels, setOllamaModels] = useState<ListResponse | undefined>(undefined)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<MeetingMessage[]>([])
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // TODO Allow changing the host during the meeting.
  const client = useMemo(() => new Ollama({
    host: options.ai.ollama.host,
  }), [options.ai.ollama.host])

  // TODO Allow changing the model during the meeting.
  const meeting = useMemo(() => new Meeting(client, options.ai.ollama.model), [client, options.ai.ollama.model])

  const handleRestartMeeting = useCallback(() => {
    meeting.restart()
    if (options.ai.initialMessages) {
      meeting.addMessages(options.ai.initialMessages)
    }
    setMessages([...meeting.chatMessages])
  }, [meeting, options.ai.initialMessages])

  const fetchOllamaModels = async () => {
    try {
      const modelListResponse = await client.list()
      setOllamaModels(modelListResponse)
      setErrorLoadingOllamaModels(undefined)
    } catch (error) {
      console.error(error)
      setErrorLoadingOllamaModels(error)
    }
  }

  // Run this once when the page loads.
  useEffect(() => {
    handleRestartMeeting()

    fetchOllamaModels()

    window.addEventListener("message", (event) => {
      if (event.data.type === 'pong') {
        console.debug("pong received")
        setIsSidekickReady(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = async (text: string) => {
    const message = new MeetingMessage(MeetingMessageRole.User, text, userMember)

    setMessages(prev => [...prev, message])

    const streamingCallback: StreamingCallback = (_message, _newContent) => {
      // TODO Ignore if they're for another meeting that has ended after restarting.
      setMessages([...meeting.chatMessages])
      // TODO Automatically scroll to the bottom of the messages if already scrolled to the bottom.
    }

    try {
      // console.debug("sendMessage: Sending message", message)
      await meeting.sendMessage(message, options.ai.ollama.tools, streamingCallback)
    } catch (error) {
      console.error(error)
      meeting.addMessages([new MeetingMessage(MeetingMessageRole.Assistant, "An error occurred while generating the response. " + error, new MeetingMember("Error", "error"))])
      setMessages([...meeting.chatMessages])
    }
  }

  const handleMessageChange = async (value: string) => {
    // TODO Allow Shift+Enter to not send the message.
    // console.debug("handleMessageChange", value);
    if (value.endsWith("\n")) {
      // console.debug("handleMessageChange: Sending message");
      setMessage("");
      await sendMessage(value.trimEnd());
    } else {
      setMessage(value);
    }
  }

  function handleModelChange(selected: string, id: string): void {
    options.ai.ollama.model = selected
    setOptions({ ...options })
  }

  return (
    <Page>
      <TitleBar title={PRODUCT_NAME} />
      <Layout>
        <Layout.Section variant="oneThird">
          {messages.length > (options.ai.initialMessages?.length ?? 0) ? (
            <Button onClick={handleRestartMeeting} variant="secondary">
              🧹 Clear Meeting
            </Button>
          ) : (
            <Button onClick={() => sendMessage("Let's begin.")} variant="primary">
              🆕 Start Meeting
            </Button>
          )}
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <Button variant="primary"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? "Hide Advanced Options" : "🤓 Advanced Options"}
          </Button>
        </Layout.Section>

        {errorLoadingOllamaModels !== undefined && (
          <Layout.Section variant="fullWidth">
            <Card>
              <Text as="p" variant="bodyMd">
                ❌ Error loading list of Ollama models. Ensure that Ollama is running.
                See the Advanced Options for more information.
              </Text>
              <Button onClick={() => fetchOllamaModels()}>Try again</Button>
            </Card>
          </Layout.Section>
        )}

        {!isSidekickReady && (
          <Layout.Section variant="fullWidth">
            <Card>
              <Text as="p" variant="bodyMd">
                ❌ Sidekick is not ready to be used.
              </Text>
              <Button onClick={checkForSidekickListener}>Check again</Button>
              <SidekickListenerInstructions />
            </Card>
          </Layout.Section>
        )}

        {showAdvancedOptions && (
          <Layout.Section variant="fullWidth">
            <Card>
              <Scrollable className={styles.options} shadow focusable>
                <Text as="h2" variant="headingMd">
                  🤓 Advanced Options
                </Text>

                <Text as="p" variant="bodyMd">
                  To allow requests to your local Ollama server, run:
                </Text>
                <pre>OLLAMA_ORIGINS='{window.location.origin}' ollama serve</pre>

                {errorLoadingOllamaModels !== undefined && (
                  <Text as="p" variant="bodyMd">
                    ❌ Error loading list of Ollama models. Ensure that Ollama is running.
                  </Text>
                )}

                {ollamaModels?.models.length && (
                  <div>
                    <Text as="p" variant="bodyMd">
                      ✅ Found models hosted on your local Ollama server.
                    </Text>
                    <Select
                      label="Ollama Model"
                      options={ollamaModels?.models.map(model => ({ label: model.name, value: model.name })) ?? []}
                      onChange={handleModelChange}
                      value={options.ai.ollama.model}
                    />
                  </div>
                )}

                {/* <SidekickListenerInstructions /> */}

                {/* TODO Add section for configuring the meeting members. */}
                < Text as="h3" variant="headingSm">
                  Current Configuration
                </Text>
                <pre>
                  {JSON.stringify(options, null, 2)}
                </pre>
              </Scrollable>
            </Card>
          </Layout.Section>
        )}

        <Layout.Section variant="fullWidth">
          <Card>
            <BlockStack gap="300">
              <Scrollable className={styles.messages} shadow focusable>
                <BlockStack gap="100">
                  {messages.map((message, index) => (
                    <ChatMessage key={`${index}-${message.content.length}`} message={message} />
                  ))}
                </BlockStack>
              </Scrollable>
              <Divider />
              {/* TODO Add suggestions like "Ask the CTO" or "Invite my cousin Zach" */}
              <TextField
                label=""
                value={message}
                onChange={handleMessageChange}
                multiline={3}
                placeholder="Type your message and press Enter to send..."
                autoComplete="off"
              />
            </BlockStack>
          </Card>
        </Layout.Section>
        {/*
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Previous Chats
              </Text>
              <List>
                <List.Item>
                </List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
        */}
      </Layout>
    </Page >
  );
}
