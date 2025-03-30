import { useAppBridge } from '@shopify/app-bridge-react'
import { BlockStack, Button, Collapsible, InlineStack, Text } from '@shopify/polaris'
import { useCallback, useState } from 'react'

const CODE = `
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
`

export default function SidekickListenerInstructions() {
  const [open, setOpen] = useState(false)
  const handleToggle = useCallback(() => setOpen((open) => !open), [])
  const shopify = useAppBridge()
  return (
    <BlockStack gap='200'>
      <Text as="p" variant="bodyMd">
        To include Sidekick in the meeting, run this code in the parent window:
      </Text>
      <InlineStack gap='200'>
        <Button
          onClick={handleToggle}
          ariaExpanded={open}
          ariaControls="basic-collapsible"
        >
          {open ? "Hide code" : "Show code"}
        </Button>
        <Button variant='primary'
          onClick={() => {
            navigator.clipboard.writeText(CODE)
            shopify.toast.show("Code copied to clipboard")
          }}
        >
          Copy code
        </Button>
      </InlineStack>

      <Collapsible
        open={open}
        id='sidekick-listener-code-collapsible'
        transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
        expandOnPrint
      >
        <pre>
          {CODE}
        </pre>
      </Collapsible>
    </BlockStack>
  )
}