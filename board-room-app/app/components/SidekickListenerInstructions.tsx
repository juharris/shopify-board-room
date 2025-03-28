import { Text } from "@shopify/polaris"

export default function SidekickListenerInstructions() {
  return (
    <div>
      <Text as="p" variant="bodyMd">
        To include Sidekick in the meeting, run this following in the parent window:
      </Text>
      <details>
        <summary>
          <Text as="span" variant="bodyMd">
            Click to show code
          </Text>
        </summary>
        <pre>
          {`
        window.addEventListener("message", (event) => {
          // console.debug("message", event)
          switch (event.data.type) {
            case 'askSidekick':
              const { messageText } = event.data
              document.querySelector('[name=sidekickMessage]').value = messageText
              document.querySelector('div span button[aria-label=Send]').disabled = false
              // TODO Try to send the message.
              event.source.postMessage({
                type: 'askedSidekick'
              }, "*")
              break
            case 'ping':
              event.source.postMessage({
                type: 'pong'
              }, "*")
              break
            default:
              break
          }
        }, false)
        document.querySelector('iframe[title=board-room-app]').contentWindow.postMessage({type: 'pong'}, '*')
        `}
        </pre>
      </details>
    </div>
  )
}