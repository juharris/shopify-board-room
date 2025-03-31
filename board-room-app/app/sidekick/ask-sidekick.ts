import type { Tool } from "ollama"

const DESCRIPTION = `
Ask the Shopify's Sidekick assistant for help.

Sidekick can:
- Answer questions about Shopify features and e-commerce
- Create or update products, collections, and discounts
- Analyze your store's performance and sales data
- Segment your customers for targeted marketing
- Help with domain setup and troubleshooting
- Find specific resources in your store
- Guide you to the right pages in your Shopify admin
`.trim()


export const ASK_SIDEKICK_TOOL_CONFIG: Tool = {
  type: 'function',
  function: {
    name: 'ask_Shopify_Sidekick',
    description: DESCRIPTION,
    parameters: {
      type: 'object',
      required: ['message'],
      properties: {
        message: {
          type: 'string',
          description: 'The message to ask the sidekick',
        },
      },
    },
  }
}