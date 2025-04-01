import { REAL_USER_LABEL } from 'app/meeting/meeting'
import { MeetingMember } from 'app/meeting/member'
import { MeetingMessage, MeetingMessageRole } from 'app/meeting/message'
import type { StoreChatOptions } from './options'

export const SYSTEM_MEMBER = new MeetingMember('System', 'system')

export const DEFAULT_OPTIONS: StoreChatOptions = {
  ai: {
    ollama: {
      host: 'http://localhost:11434',
      model: 'llama3.2:latest',
      tools: [
        {
          type: 'function',
          function: {
            name: 'select_next_speaker',
            description: `Select the next speaker in the conversation. It could be the real person (i.e., the ${REAL_USER_LABEL}) or one of the AI personas.` +
              " After an AI persona sends a message, then they may suggest another persona to speak next or ask the real person for their input." +
              " If they suggest another persona to speak next, then the input speaker to this tool should be the one they suggest to speak." +
              `Do not select ${REAL_USER_LABEL} as the speaker if they were the last to send a message or say something.` +
              "",
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
        "This conversation is a meeting which includes a real person chatting with fake AI personas about how to manage their Shopify store." +
        " The AI personas in assistant messages should mostly chat with each other and ask each other questions." +
        " They may occasionally ask the real person questions." +
        " If the real person starts with something simple such as \"Let's begin.\", " +
        "then the AI personas should start the conversation amongst themselves for a few short messages that are shared in the chat before asking the real person for their input." +
        "\n\n" +
        "The next speaker is inferred from the tool response." +
        " Best speaking, prefix the next speaker's name or title as the first line of the message." +
        " For example, if the next speaker is the CEO, then the first line of the message should be \"**CEO:** \"." +
        // "Use a tool call before changing the persona that responds." +
        // + " "
        // + "Do not change the persona in the same generated response message." +
        // "\n\n Do not include a prefix to indicate the name or title of the persona because it will be inferred from the tool call request arguments." +
        " Do not include (from <title>) at the beginning of a message. For example, do not include \"(from CTO)\" nor \"(from CEO)\" nor \"(from CFO)\" at the beginning of a message." +
        ` Do not impersonate the ${REAL_USER_LABEL} when writing messages from the assistant.` +
        ` Do not write messages from ${REAL_USER_LABEL}.` +
        " Do not write messages from Sidekick. It is a tool that is used to answer messages from the user or one of the AI personas." +
        "\n\nHere are some examples of responses, which can use markdown formatting:" +
        "\n\n```\n<examples>" +
        "\n<example>" +
        "\n**CEO:** I **declare** that we need to use AI more in our strategy to figure out how to manage our Shopify store. I would like to hear from the CTO how we can do that." +
        "\n</example>" +
        "\n<example>" +
        "\n**CTO:** As the CTO, I know 3 clear ways to use AI to improve our Shopify store:" +
        "\n\n1. Use AI to generate product descriptions" +
        "\n2. Use AI to generate product images" +
        "\n3. Use AI to simulate user interactions and the shopping experience" +
        "\n</example>" +
        "\n</examples>```" +
        `\n\n Then a tool call for \`select_next_speaker\`, if enabled, could select a different persona to speak or the ${REAL_USER_LABEL} could speak.` +
        "\n\nResponses are encouraged to use markdown formatting to emphasize points, ideas, lists, titles, bolding, etc." +
        "\n\nStart with 3 to 5 personas discussing a topic suggested by the user." +
        " Have any one of the personas such as the CEO or CTO repeat the topic." +
        " If no topic is introduced by the user, then start with interesting and novel ideas about a topic like how to improve the Shopify store and grow sales." +
        "\n\nThe conversation begins now.",
        SYSTEM_MEMBER),
      // TEMP FOR TESTING
      /*
      new MeetingMessage(MeetingMessageRole.User, "Let's begin.", new MeetingMember('User', 'user')),
      new MeetingMessage(MeetingMessageRole.Assistant, "**CEO:** I **declare** that we need to use AI more in our strategy to figure out how to manage our Shopify store. I would like to hear from the CTO how we can do that.", new MeetingMember('CEO', 'CEO')),
      new MeetingMessage(MeetingMessageRole.Assistant, "**CTO:** Short message.", new MeetingMember('CTO', 'CTO')),
      new MeetingMessage(MeetingMessageRole.Assistant, "**CFO:** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", new MeetingMember('CFO', 'CFO')),
      */
    ],
  },
}