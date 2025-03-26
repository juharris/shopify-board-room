import type { MeetingMessage } from "app/meeting/message";
import {
  Text,
} from "@shopify/polaris";

export default function ChatMessage({ message }: { message: MeetingMessage }) {
  return (
    // TODO Style messages.
    // TODO Left align messages from the user.
    // TODO Right align other messages.
    // TODO Render content as markdown.
    <Text as="p" variant="bodyMd">
      <b title={message.from.id}>{message.from.name}</b>: {message.content}
    </Text>)
}
