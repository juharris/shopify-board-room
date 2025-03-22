import { TitleBar } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Button,
  Card,
  Layout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import type { StreamingCallback } from "app/meeting/meeting";
import { Meeting } from "app/meeting/meeting";
import { MeetingMessage, MeetingMessageRole, } from "app/meeting/message";
import { Ollama } from 'ollama';
import { useState } from 'react';


export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MeetingMessage[]>([]);

  // TODO Allow the host to be configurable.
  const client = new Ollama({
    // host: 'http://localhost:11434',
  });

  // TODO Add model selector.
  const meeting = new Meeting(client, 'llama3.2');

  const sendMessage = async (text: string) => {
    const message = new MeetingMessage(MeetingMessageRole.User, text)
    const responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, "")
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
        new MeetingMessage(MeetingMessageRole.Assistant, "An error occurred while generating the response. " + error),
      ])
    }
  }

  const handleMessageChange = async (value: string) => {
    // TODO Allow Shift+Enter to not send the message.
    if (value.endsWith("\n")) {
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
        <Layout.Section>
          <Button onClick={handleRestartMeeting} variant="primary" disabled={messages.length === 0}>
            New Meeting
          </Button>
        </Layout.Section>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              {messages.map((message, index) => (
                <Text key={index} as="p" variant="bodyMd">
                  {message.role}: {message.content}
                </Text>
              ))}
              <TextField
                label="Message"
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
