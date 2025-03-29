import { useAppBridge } from '@shopify/app-bridge-react'
import { Button, Collapsible, Layout, Text } from '@shopify/polaris'
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
  const [open, setOpen] = useState(true)
  const handleToggle = useCallback(() => setOpen((open) => !open), [])
  const shopify = useAppBridge()
  return (
    <Layout>
      <Layout.Section>
        <Text as="p" variant="bodyMd">
          To include Sidekick in the meeting, run this following in the parent window:
        </Text>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(CODE)
            shopify.toast.show("Code copied to clipboard")
          }}
        >
          Copy code
        </Button>
        <div>
          <Button
            onClick={handleToggle}
            ariaExpanded={open}
            ariaControls="basic-collapsible"
          >
            Click to show code
          </Button>

          <Collapsible
            open={open}
            id="basic-collapsible"
            transition={{ duration: '500ms', timingFunction: 'ease-in-out' }}
            expandOnPrint
          >
            <pre>
              {CODE}
            </pre>
          </Collapsible>
        </div>
      </Layout.Section>
    </Layout>
  )
}