import { TitleBar } from "@shopify/app-bridge-react"
import type {
  ScrollableRef
} from "@shopify/polaris"
import {
  BlockStack,
  Button,
  Card,
  Collapsible,
  Divider,
  InlineStack,
  Page,
  Scrollable,
  Spinner,
  Text,
  TextField,
} from "@shopify/polaris"
import { SettingsIcon } from '@shopify/polaris-icons'
import type { StreamingCallback } from "app/meeting/meeting"
import { Meeting } from "app/meeting/meeting"
import { MeetingMessage, MeetingMessageRole, } from "app/meeting/message"
import { type ListResponse, Ollama } from 'ollama'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLoaderData } from "@remix-run/react"

import AdvancedOptions from "app/components/AdvancedOptions"
import ChatMessage from "app/components/ChatMessage"
import SidekickListenerInstructions from "app/components/SidekickListenerInstructions"
import { DEFAULT_OPTIONS, SYSTEM_MEMBER } from "app/config/default"
import type { StoreChatOptions } from "app/config/options"
import { MeetingMember } from "app/meeting/member"
import { getInitialSuggestions, getSuggestions } from "app/suggestions/get-suggestions"
import styles from '../styles/chat.module.css'
import type { LoaderFunctionArgs } from "@remix-run/node"
import { getStoreInfo } from "app/store/info"

// export const PRODUCT_NAME = "ShopifAI ConclAIve Chat"
// export const PRODUCT_NAME = "JustAIce LAIgue Chat"
export const PRODUCT_NAME = "AIvengers Chat"

export async function loader({ request }: LoaderFunctionArgs) {
  const storeInfo = await getStoreInfo(request)

  return { storeInfo }
}

export default function ChatPage() {
  const { storeInfo } = useLoaderData<typeof loader>()
  const userMember = new MeetingMember("You", 'user')

  const messagesScrollableRef = useRef<ScrollableRef>(null)

  // TODO Load from IndexedDB and allow configuring in the UI.
  const initialOptions = useMemo(() => DEFAULT_OPTIONS, [])

  const [errorLoadingOllamaModels, setErrorLoadingOllamaModels] = useState<unknown>(undefined)
  const [areInternalMessagesShown, setAreInternalMessagesShown] = useState(false)
  const [isAdvancedOptionsShown, setShowAdvancedOptions] = useState(false)
  // TODO Set `isChatScrolledToBottom` to false when the user scrolls up.
  const [isChatScrolledToBottom, setIsChatScrolledToBottom] = useState(true)
  const [isProcessingMessage, setIsProcessingMessage] = useState(false)
  const [isSidekickReady, setIsSidekickReady] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<MeetingMessage[]>([])
  const [ollamaModels, setOllamaModels] = useState<ListResponse | undefined>(undefined)
  const [options, setOptions] = useState<StoreChatOptions>(initialOptions)
  const [suggestions, setSuggestions] = useState<MeetingMessage[]>([])

  // TODO Allow changing the host during the meeting.
  const client = useMemo(() => new Ollama({
    host: options.ai.ollama.host,
  }), [options.ai.ollama.host])

  const meeting = useMemo(() => new Meeting(client, options.ai.ollama.model), [client, options.ai.ollama.model])

  const handleRestartMeeting = useCallback(() => {
    meeting.restart()
    if (options.ai.initialMessages) {
      meeting.addMessages(options.ai.initialMessages)
    }

    if (storeInfo) {
      const storeInfoMessage = new MeetingMessage(
        MeetingMessageRole.System,
        `Here is information about the store which can be referenced in the conversation: ${JSON.stringify(storeInfo)}`,
        SYSTEM_MEMBER
      )
      meeting.addMessages([storeInfoMessage])
    }
    setMessages([...meeting.chatMessages])
    setIsProcessingMessage(false)
    setSuggestions(getInitialSuggestions(3))
    setIsChatScrolledToBottom(true)
  }, [meeting, options.ai.initialMessages, storeInfo])

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

  const scrollToEndOfChatIfDesired = useCallback(() => {
    if (isChatScrolledToBottom && messagesScrollableRef.current) {
      // TODO Get the proper end position, but this is good enough for now.
      messagesScrollableRef.current.scrollTo(2 ** 30, {
        behavior: 'smooth',
      })
    }
  }, [isChatScrolledToBottom, messagesScrollableRef])

  const sendMessage = async (message: string | MeetingMessage) => {
    setSuggestions([])
    setIsProcessingMessage(true)

    if (typeof message === 'string') {
      message = new MeetingMessage(MeetingMessageRole.User, message, userMember)
    }
    setMessages(prev => [...prev, message])
    scrollToEndOfChatIfDesired()

    const streamingCallback: StreamingCallback = (meetingId, _message, _newContent) => {
      // Ignore if they're for another meeting, possibly one that was abandoned.
      if (meetingId === meeting.id) {
        setMessages([...meeting.chatMessages])
        scrollToEndOfChatIfDesired()
      }
    }

    try {
      // console.debug("sendMessage: Sending message", message)
      await meeting.sendMessage(message, options.ai.ollama.tools, streamingCallback)
    } catch (error) {
      console.error(error)
      meeting.addMessages([new MeetingMessage(MeetingMessageRole.Assistant, "An error occurred while generating the response. " + error, new MeetingMember("Error", "error"))])
      setMessages([...meeting.chatMessages])
    } finally {
      setIsProcessingMessage(false)
      setSuggestions(getSuggestions(3))
    }
  }

  const handleMessageChange = async (value: string) => {
    // TODO Allow Shift+Enter to not send the message.
    // console.debug("handleMessageChange", value);
    if (value.endsWith("\n")) {
      // console.debug("handleMessageChange: Sending message");
      setMessage("")
      await sendMessage(value.trimEnd())
    } else {
      setMessage(value)
    }
  }

  function handleModelChange(selected: string): void {
    options.ai.ollama.model = selected
    setOptions({ ...options })
  }

  function handleChatScrolledToBottom(): void {
    setIsChatScrolledToBottom(true)
  }

  return (
    <Page>
      <TitleBar title={PRODUCT_NAME} />
      <BlockStack gap='500'>
        <InlineStack gap='200'>
          {messages.length > (options.ai.initialMessages?.length ?? 0) ? (
            <Button onClick={handleRestartMeeting} variant='primary'>
              🧹 Clear Meeting
            </Button>
          ) : (
            <Button onClick={() => sendMessage("Let's begin.")} variant='primary'>
              🆕 Start Meeting
            </Button>
          )}
          <Button variant='secondary'
            icon={SettingsIcon}
            pressed={isAdvancedOptionsShown}
            onClick={() => setShowAdvancedOptions(!isAdvancedOptionsShown)}
          >

          </Button>
          <Button variant='secondary'
            pressed={areInternalMessagesShown}
            onClick={() => setAreInternalMessagesShown(!areInternalMessagesShown)}
          >
            {areInternalMessagesShown ? "🙈 Hide Internal Messages" : "👀 Internal Messages"}
          </Button>
        </InlineStack>

        {errorLoadingOllamaModels !== undefined && (
          <Card>
            <Text as="p" variant="bodyMd">
              ❌ Error loading list of Ollama models. Ensure that Ollama is running.
              See the Advanced Options for more information.
            </Text>
            <Button onClick={() => fetchOllamaModels()}>Try again</Button>
          </Card>
        )}

        {!isSidekickReady && (
          <Card>
            <Text as="p" variant="bodyMd">
              ⚠️ Sidekick is not ready to be used.
            </Text>
            {/* <Button onClick={checkForSidekickListener}>Check again</Button> */}
            <SidekickListenerInstructions />
          </Card>
        )}

        <Collapsible
          open={isAdvancedOptionsShown}
          transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
          expandOnPrint
          id='advanced-options-collapsible'
        >
          <Card>
            <Scrollable className={styles.options} shadow focusable>
              <AdvancedOptions
                handleModelChange={handleModelChange}
                ollamaModels={ollamaModels}
                options={options}
              />
            </Scrollable>
          </Card>
        </Collapsible>

        <Card>
          <BlockStack gap='300'>
            <Text as='h2' variant='headingMd'>
              Meeting
            </Text>
            <Divider />
            <Scrollable className={styles.messages}
              shadow focusable
              ref={messagesScrollableRef}
              onScrolledToBottom={() => handleChatScrolledToBottom()}
            >
              <BlockStack gap="100">
                {messages.map((message, index) => (
                  <ChatMessage key={`${index}-${message.content.length}`}
                    areInternalMessagesShown={areInternalMessagesShown}
                    message={message} />
                ))}
              </BlockStack>
            </Scrollable>
            <div className={styles.suggestions}>
              {isProcessingMessage && <Spinner size="small" />}
              <InlineStack gap='200'>
                {suggestions.map((suggestion, index) => (
                  <Button key={index} variant='primary'
                    onClick={() => sendMessage(suggestion)}>
                    {suggestion.content}
                  </Button>))}
              </InlineStack>
            </div>
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
      </BlockStack>
    </Page >
  )
}
