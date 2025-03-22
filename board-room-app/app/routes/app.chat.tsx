import {
  Card,
  Layout,
  Page,
  Text,
  BlockStack,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
// import ollama from 'ollama'
import { Ollama } from 'ollama';
import { useState } from 'react';
import { MeetingMessage, MeetingMessageRole, } from "app/meeting/message";


export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  /*
  fetch('http://localhost:11434')
    .then(async res => await res.text())
    .then(console.log)
    .catch(err => console.error(err))
  */

  // TODO Allow the host to be configurable.
  const client = new Ollama({
    // host: 'http://localhost:11434',
  });
  const sendMessage = async (model: string, text: string) => {
    const message = new MeetingMessage(MeetingMessageRole.User, text)
    const responseIndex = messages.length + 1;
    const responseMessage = new MeetingMessage(MeetingMessageRole.Assistant, "")
    setMessages(prev => [...prev, message, responseMessage]);

    // TODO Add instructions with other board member profiles and use tool calling,
    // perhaps to select the board member to speak next.
    try {
      const response = await client.chat({
        model,
        messages: [message],
        stream: true,
      })
      for await (const chunk of response) {
        // console.debug("chunk", chunk)
        const newContent = chunk.message.content
        setMessages(prev => {
          const newMessages = [...prev];
          const responseMessage = newMessages[responseIndex]
          newMessages[responseIndex] = responseMessage.withContent(responseMessage.content + newContent)
          return newMessages;
        });
      }
      //*/
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
      await sendMessage('llama3.2', value.trimEnd());
    } else {
      setMessage(value);
    }
  }

  return (
    <Page>
      <TitleBar title="Chat" />
      <Layout>
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
