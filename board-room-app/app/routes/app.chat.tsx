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

class Message {
  role: string;
  content: string;
  constructor(role: string, content: string) {
    this.role = role;
    this.content = content;
  }
}

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  // console.log(window.location)

  // TODO Set host to ngrok URL.
  // Seems to be 403 forbidden with ngrok and with the tunnel. Should work if the origin header is removed, but we can't do that from the browser.
  const client = new Ollama({
    host: 'https://board-room-ollama.tunnel.shopifycloud.tech',
    // host: 'http://localhost:11434',
    // host: 'https://354c-173-214-130-173.ngrok-free.app',
    fetch: (url, options) => {
      console.log("fetch", url, options)
      options = { ...options, mode: "no-cors" }
      return fetch(url, options)
    }
  });
  const sendMessage = async (model: string, text: string) => {
    const message = { role: 'user', content: text }
    const responseIndex = messages.length + 1;
    setMessages(prev => [...prev, new Message("user", text), new Message("assistant", "")]);

    // TODO Add instructions with other board member profiles and use tool calling,
    // perhaps to select the board member to speak next.
    console.debug("Sending message", message)
    try {
      const response = await client.chat({
        model,
        messages: [message],
        stream: true,
        // stream: false,
      })
      console.log("response", response)
      // setMessages(prev => {
      //   const newResponses = [...prev];
      //   newResponses[responseIndex].content += response.message.content;
      //   return newResponses;
      // });
      //*
      for await (const chunk of response) {
        console.log("chunk", chunk)
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[responseIndex].content += chunk.message.content;
          return newMessages;
        });
      }
      //*/
    } catch (error) {
      console.error(error)
      setMessages(prev => {
        const newResponses = [...prev];
        newResponses[responseIndex].content = "An error occurred while generating the response. " + error;
        return newResponses;
      });
    }
  }

  const handleMessageChange = async (value: string) => {
    // TODO Allow Shift+Enter to not send the message.
    if (value.endsWith("\n")) {
      setMessage("");
      await sendMessage('llama3.2', value.trimEnd());
    }
    setMessage(value);
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
