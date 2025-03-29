import { MeetingMessageRole, type MeetingMessage } from 'app/meeting/message';
import {
  Text,
} from '@shopify/polaris';
import styles from 'app/styles/chat.module.css';
import Markdown from 'markdown-to-jsx';

import './../styles/chat-message.css'

type Props = {
  message: MeetingMessage;
};

export default function ChatMessage({ message }: Props) {
  // TODO Style messages.
  // TODO Left align messages from the user.
  // TODO Right align other messages.
  // TODO Add advanced option to show tool calls and results and do not show them by default.


  const { content, role } = message
  let contents: React.ReactNode
  let titleText: string | undefined = undefined
  if (['tool_call', 'tool_result'].includes(message.from.id)) {
    switch (message.from.id) {
      case 'tool_call':
        try {
          const toolCalls = JSON.parse(message.content)
          if (Array.isArray(toolCalls) && toolCalls.length === 1) {
            titleText = `${toolCalls[0].function.name}(${JSON.stringify(toolCalls[0].function.arguments)})`
          }
        } catch (e) {
          console.error(e)
        }
        break
      case 'tool_result':
        titleText = getSummaryText(content)
    }

    contents = (<details>
      <summary>
        <Text as='span' variant='bodyMd'>
          <i title={message.from.id}>{message.from.name}</i>: <code>{titleText}</code>
        </Text>
      </summary>
      <pre className={styles.code}>{content}</pre>
    </details>)
  }

  if (!contents) {
    switch (role) {
      case MeetingMessageRole.Assistant:
        contents = (<Text as='p' variant='bodyMd'>
          {/* The message will contain their name or title as a prefix. The model really wanted to do this, probably cause I just tested with a small one (llama3.2:3b).
          So I gave up and told it to do this in the instructions. */}
          {/* <b title={message.from.id}>{message.from.name}</b>: */}
          <Markdown>{content}</Markdown>
        </Text>)
        break
      case MeetingMessageRole.System:
        titleText = getSummaryText(content)
        contents = (<details>
          <summary>
            <Text as='span' variant='bodyMd'>
              <i title={message.from.id}>{message.from.name}</i>: {titleText}
            </Text>
          </summary>
          <Markdown>{content}</Markdown>
        </details>)
        break
      case MeetingMessageRole.Tool:
        contents = (<details>
          <summary>
            <Text as='span' variant='bodyMd'>
              <i title={message.from.id}>{message.from.name}</i>:
            </Text>
          </summary>
          <pre className={styles.code}>{content}</pre>
        </details>)
        break
      case MeetingMessageRole.User:
        contents = (<Text as='p' variant='bodyMd'>
          <b title={message.from.id}>{message.from.name}</b>: {content}
        </Text>)
        break
      default:
        throw new Error(`Unknown message role: ${role}`)
    }
  }

  let className = message.from.id === 'tool_call' ? 'tool-message' : `${role}-message`
  return (<div className={className}>
    {contents}
  </div>)
}

const getSummaryText = (content: string) => {
  const maxLength = 60;
  if (content.length <= maxLength + 1) {
    return content;
  }

  return content.slice(0, maxLength).trim() + '…';
}
