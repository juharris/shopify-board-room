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

export const PRODUCT_NAME = "ShopifAI ConclAIve Chat"

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
              description: "Select the next speaker in the conversation. It could be the real person (i.e., the real_user) or one of the AI personas." +
                " After an AI persona sends a message, then they may suggest another persona to speak next or ask the real person for their input.",
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
          "This conversation is a meeting which includes a real person chatting with fake AI personas about how to manage their Shopify store. " +
          "The AI personas may chat with each and ask each other questions or ask the real person questions." +
          "If the real person starts with something simple such as \"Let's begin.\", " +
          "then the AI personas should start the conversation amongst themselves for a few short messages before asking the real person for their input.",
          systemMember),
      ],
    },
  }

  const [errorLoadingOllamaModels, setErrorLoadingOllamaModels] = useState<unknown | undefined>(undefined)
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
