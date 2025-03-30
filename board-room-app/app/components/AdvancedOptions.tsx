import { Select, Text } from '@shopify/polaris';
import type { StoreChatOptions } from 'app/routes/app._index';
import type { ListResponse } from 'ollama';
import { useEffect, useState } from 'react';

interface AdvancedOptionsProps {
  handleModelChange: (selected: string) => void;
  ollamaModels: ListResponse | undefined;
  options: StoreChatOptions;
}

export default function AdvancedOptions(
  {
    handleModelChange,
    ollamaModels,
    options,
  }: AdvancedOptionsProps) {
  const [origin, setOrigin] = useState('*')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  return (<>
    <Text as="h2" variant="headingMd">
      🤓 Advanced Options
    </Text>

    <Text as="p" variant="bodyMd">
      To allow requests to your local Ollama server, run:
    </Text>
    <pre>OLLAMA_ORIGINS='{origin}' ollama serve</pre>

    {ollamaModels?.models.length && (
      <div>
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
    <Text as="h3" variant="headingSm">
      Current Configuration
    </Text>
    <pre>
      {JSON.stringify(options, null, 2)}
    </pre>
  </>)
}
