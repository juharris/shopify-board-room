import { MeetingMessageRole, type MeetingMessage } from 'app/meeting/message';
import {
  Text,
} from '@shopify/polaris';
import styles from 'app/styles/chat.module.css';
import Markdown from 'markdown-to-jsx';

type Props = {
  message: MeetingMessage;
};

export default function ChatMessage({ message }: Props) {
  // TODO Style messages.
  // TODO Left align messages from the user.
  // TODO Right align other messages.
  // TODO Add advanced option to show tool calls and results and do not show them by default.


  const { content } = message
  let contents: React.ReactNode

  switch (message.from.id) {
    case 'tool_call':
    case 'tool_result':
      contents = (<details>
        <summary>
          <Text as='span' variant='bodyMd'>
            <i title={message.from.id}>{message.from.name}</i>:
          </Text>
        </summary>
        <pre className={styles.code}>{message.content}</pre>
      </details>)
  }

  if (!contents) {
    switch (message.role) {
      case MeetingMessageRole.Assistant:
        contents = (<Text as='p' variant='bodyMd'>
          {/* The message will contain their name or title as a prefix. The model really wanted to do this, probably cause I just tested with a small one (llama3.2:3b).
          So I gave up and told it to do this in the instructions. */}
          {/* <b title={message.from.id}>{message.from.name}</b>: */}
          <Markdown>{content}</Markdown>
        </Text>)
        break
      case MeetingMessageRole.System:
        contents = (<details>
          <summary>
            <Text as='span' variant='bodyMd'>
              <i title={message.from.id}>{message.from.name}</i>:
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
        throw new Error(`Unknown message role: ${message.role}`)
    }
  }

  return (<div className={`${message.role}-message`}>
    {contents}
  </div>)
}
