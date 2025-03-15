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

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  // console.log(window.location)

  // TODO Set host to ngrok URL.
  const client = new Ollama({
    // proxy: true,
    // fetch: (url, options) => {
    //   console.log("fetch", url, options)
    //   options.mode = "no-cors"
    //   return fetch(url, options)
    // }
  });
  const sendMessage = async (model: string, text: string) => {
    const responseIndex = responses.length;
    setResponses(prev => [...prev, ""]);

    // TODO Add instructions with other board member profiles and use tool calling,
    // perhaps to select the board member to speak next.
    const message = { role: 'user', content: text }
    const response = await client.chat({
      model,
      messages: [message],
      stream: true,
    })
    try {
      for await (const chunk of response) {
        setResponses(prev => {
          const newResponses = [...prev];
          newResponses[responseIndex] += chunk.message.content;
          return newResponses;
        });
      }
    } catch (error) {
      // FIXME We don't end up here.
      console.error("in catch")
      console.error(error)
      setResponses(prev => {
        const newResponses = [...prev];
        newResponses[responseIndex] = "An error occurred while generating the response. " + error;
        return newResponses;
      });
    }
  }

  const handleSubmit = async () => {
    // TODO Add model selector based on installed models from ollama.list.
    if (message.trim()) {
      await sendMessage('phi3', message);
      setMessage('');
    }
  };

  return (
    <Page>
      <TitleBar title="Chat" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              {responses.map((response, index) => (
                <Text key={index} as="p" variant="bodyMd">
                  {response}
                </Text>
              ))}
              <TextField
                label="Message"
                value={message}
                onChange={setMessage}
                multiline={3}
                placeholder="Type your message and press Enter to send..."
                autoComplete="off"
                onBlur={() => handleSubmit()}
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
