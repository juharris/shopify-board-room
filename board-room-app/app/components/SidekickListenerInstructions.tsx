import { Text } from "@shopify/polaris"

export default function SidekickListenerInstructions() {
  return (
    <div>
      <Text as="p" variant="bodyMd">
        To include Sidekick in the meeting, run this following in the parent window:
      </Text>
      <pre>
        {`
        window.addEventListener("message", (event) => {
          console.debug("message", event)
          if (event.data.type === 'ping') {
            event.source.postMessage({
              type: 'pong'
            }, "*")
          }
        }, false)
        `}
      </pre>
      <Text as="p" variant="bodyMd">
        Then click "Check again" to see if Sidekick is ready.
      </Text>
    </div>
  )
}