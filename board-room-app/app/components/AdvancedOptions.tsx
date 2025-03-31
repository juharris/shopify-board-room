import { BlockStack, Button, InlineStack, Scrollable, Select, Text } from '@shopify/polaris'
import type { ListResponse } from 'ollama'
import { useEffect, useState } from 'react'

import type { StoreChatOptions } from '../config/options'
import codeStyles from '../styles/code.module.css'

interface AdvancedOptionsProps {
  // Internal Messages
  areInternalMessagesShown: boolean
  setAreInternalMessagesShown: (areInternalMessagesShown: boolean) => void

  // Models
  handleModelChange: (selected: string) => void
  ollamaModels: ListResponse | undefined

  // Options
  options: StoreChatOptions
}

export default function AdvancedOptions(
  {
    areInternalMessagesShown,
    setAreInternalMessagesShown,
    handleModelChange,
    ollamaModels,
    options,
  }: AdvancedOptionsProps) {
  const [origin, setOrigin] = useState('*')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return (<>
    <BlockStack gap='200'>
      <Text as='h2' variant='headingMd'>
        🤓 Advanced Options
      </Text>
      <InlineStack gap='200'>
        <Button variant='secondary'
          pressed={areInternalMessagesShown}
          onClick={() => setAreInternalMessagesShown(!areInternalMessagesShown)}
        >
          {areInternalMessagesShown ? "🙈 Hide Internal Messages" : "👀 Show Internal Messages"}
        </Button>
      </InlineStack>

      {ollamaModels?.models.length ? (
        <div>
          <InlineStack gap='200'>
            <Select
              label='Ollama Model'
              options={ollamaModels?.models.map(model => ({ label: model.name, value: model.name })) ?? []}
              onChange={handleModelChange}
              value={options.ai.ollama.model}
            />
          </InlineStack>
        </div>
      ) : <div>
        <Text as='p' variant='bodyMd'>
          To allow requests to your local Ollama server, run:
        </Text>
        <pre>OLLAMA_ORIGINS='{origin}' ollama serve</pre>
      </div>}

      {/* <SidekickListenerInstructions /> */}

      {/* TODO Add section for configuring the meeting members. */}
      <Text as='h3' variant='headingSm'>
        Current Configuration
      </Text>
      <Scrollable focusable>
        <pre className={codeStyles.code}>
          {JSON.stringify(options, null, 2)}
        </pre>
      </Scrollable>
    </BlockStack>
  </>)
}
