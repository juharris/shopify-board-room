import {
  Icon,
  InlineStack,
  Text
} from '@shopify/polaris'
import {
  MagicIcon,
  PersonFilledIcon
} from '@shopify/polaris-icons'
import { MeetingMessageRole, type MeetingMessage } from 'app/meeting/message'
import styles from 'app/styles/chat.module.css'
import Markdown from 'markdown-to-jsx'

import messageStylesUrl from '../styles/chat-message.css?url'

export const links = () => [
  {
    rel: 'stylesheet',
    href: styles,
  },
  {
    rel: 'stylesheet',
    href: messageStylesUrl,
  },
]

type Props = {
  areInternalMessagesShown: boolean
  message: MeetingMessage
}

export default function ChatMessage({ areInternalMessagesShown, message }: Props) {
  const { content, role } = message
  if (!areInternalMessagesShown &&
    (role === MeetingMessageRole.System || role === MeetingMessageRole.Tool || message.from.id === 'tool_call')) {
    return null
  }

  let icon: React.ReactNode | undefined = undefined

  let contents: React.ReactNode
  let summaryText: string | undefined = undefined
  if (['tool_call', 'tool_result'].includes(message.from.id)) {
    icon = <Icon source={MagicIcon} tone='base' />
    switch (message.from.id) {
      case 'tool_call':
        try {
          const toolCalls = JSON.parse(message.content)
          if (Array.isArray(toolCalls) && toolCalls.length === 1) {
            summaryText = getSummaryText(`${toolCalls[0].function.name}(${JSON.stringify(toolCalls[0].function.arguments)})`)
          }
        } catch (e) {
          console.error(e)
        }
        break
      case 'tool_result':
        summaryText = getSummaryText(content)
    }

    contents = (<details>
      <summary>
        <Text as='span' variant='bodyMd'>
          <i title={message.from.id}>{message.from.name}</i>: <code>{summaryText}</code>
        </Text>
      </summary>
      <pre className={styles.code}>{content}</pre>
    </details>)
  }

  if (!contents) {
    switch (role) {
      case MeetingMessageRole.Assistant:
        contents = (<>
          {/* The message will contain their name or title as a prefix. The model really wanted to do this, probably cause I just tested with a small one (llama3.2:3b).
          So I gave up and told it to do this in the instructions. */}
          {/* <b title={message.from.id}>{message.from.name}</b>: */}
          <Markdown>{content}</Markdown>
        </>)
        break
      case MeetingMessageRole.System:
        icon = <Icon source={MagicIcon} tone='base' />
        summaryText = getSummaryText(content)
        contents = (<details>
          <summary>
            <Text as='span' variant='bodyMd'>
              <i title={message.from.id}>{message.from.name}</i>: {summaryText}
            </Text>
          </summary>
          <Markdown>{content}</Markdown>
        </details>)
        break
      case MeetingMessageRole.Tool:
        // icon = <Icon source={MagicIcon} tone='base' />
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
        icon = <Icon source={PersonFilledIcon} tone='base' />
        contents = (<Text as='p' variant='bodyMd'>
          <b title={message.from.id}>{message.from.name}</b>: {content}
        </Text>)
        break
      default:
        throw new Error(`Unknown message role: ${role}`)
    }
  }

  const className = message.from.id === 'tool_call' ? 'tool-message' : `${role}-message`
  return (<div className={`${className} ${styles.message}`}>
    <InlineStack blockAlign='start' gap='200' wrap={false} align='start'>
      {icon}
      {contents}
    </InlineStack>
  </div>)
}

const getSummaryText = (content: string) => {
  const maxLength = 60
  if (content.length <= maxLength + 1) {
    return content
  }

  return content.slice(0, maxLength).trim() + '…'
}
