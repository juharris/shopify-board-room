import { type MeetingMessage } from "app/meeting/message";
import {
  Text,
} from "@shopify/polaris";
import styles from "app/styles/chat.module.css";

export default function ChatMessage({ message }: { message: MeetingMessage }) {
  // TODO Style messages.
  // TODO Left align messages from the user.
  // TODO Right align other messages.
  // TODO Render content as markdown.
  // TODO Add advanced option to show tool calls and results and do not show them by default.
  switch (message.from.id) {
    case "tool_call":
    case "tool_result":
      return (<div>
        <details>
          <summary>
            <Text as="span" variant="bodyMd">
              <i title={message.from.id}>{message.from.name}</i>:
            </Text>
          </summary>
          <pre className={styles.code}>{message.content}</pre>
        </details>
      </div>)
  }

  const content = message.content
  return (<div>
    <Text as="p" variant="bodyMd">
      <b title={message.from.id}>{message.from.name}</b>: {content}
    </Text>
  </div>)
}
