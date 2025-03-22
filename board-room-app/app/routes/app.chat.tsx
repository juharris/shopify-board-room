import { TitleBar } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Button,
  Card,
  Divider,
  Layout,
  Page,
  Scrollable,
  Text,
  TextField,
} from "@shopify/polaris";
import type { StreamingCallback } from "app/meeting/meeting";
import { Meeting } from "app/meeting/meeting";
import { MeetingMessage, MeetingMessageRole, } from "app/meeting/message";
import { Ollama } from 'ollama';
import { useState } from 'react';

import styles from '../styles/chat.module.css';
import { MeetingMember } from "app/meeting/member";


export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  // TODO Allow the host to be configurable.
  const client = new Ollama({
    // host: 'http://localhost:11434',
  });

  // TODO Add model selector.
  const meeting = new Meeting(client, 'llama3.2');
  const userMember = new MeetingMember("You", "user");

  const sendMessage = async (text: string) => {
    const message = new MeetingMessage(MeetingMessageRole.User, text, userMember)

    // TODO Let the meeting create the response message.
    const responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, "", new MeetingMember("Assistant", "assistant"))
    const responseIndex = messages.length + 1
    setMessages(prev => [...prev, message, responseMessage])

    const streamingCallback: StreamingCallback = (message, newContent) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const responseMessage = newMessages[responseIndex]
        newMessages[responseIndex] = responseMessage.withContent(responseMessage.content + newContent)
        return newMessages;
      });
    }

    // TODO Add instructions with other board member profiles and use tool calling,
    // perhaps to select the board member to speak next.
    try {
      await meeting.sendMessage(message, streamingCallback)
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        new MeetingMessage(MeetingMessageRole.Assistant, "An error occurred while generating the response. " + error, new MeetingMember("Error", "error")),
      ])
    }
  }

  const handleMessageChange = async (value: string) => {
    // TODO Allow Shift+Enter to not send the message.
    console.debug("handleMessageChange", value);
    if (value.endsWith("\n")) {
      console.debug("Sending message");
      setMessage("");
      await sendMessage(value.trimEnd());
    } else {
      setMessage(value);
    }
  }

  const handleRestartMeeting = () => {
    meeting.restart()
    setMessages([])
  }

  return (
    <Page>
      <TitleBar title="Chat" />
      <Layout>
        <Layout.Section variant="oneThird">
          <Button variant="primary"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            {showAdvancedOptions ? "Hide Advanced Options" : "🤓 Advanced Options"}
          </Button>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          {messages.length > 0 && (
            <Button onClick={handleRestartMeeting} variant="primary">
              🔄 New Meeting
            </Button>
          )}
        </Layout.Section>

        {showAdvancedOptions && (
          <Layout.Section variant="fullWidth">
            <Card>
              <Scrollable className={styles.options} shadow focusable>
                <Text as="h2" variant="headingMd">
                  🤓 Advanced Options
                </Text>
                {/* TODO Add section for configuring the meeting members. */}
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
                    // TODO Style messages.
                    // TODO Left align messages from the user.
                    // TODO Right align other messages.
                    <Text key={index} as="p" variant="bodyMd">
                      <b>{message.member.name}</b>: {message.content}
                    </Text>
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
    </Page>
  );
}
