export const checkForSidekickListener = () => {
  window.parent.postMessage({
    type: 'ping'
  }, "*")
}

export const askSidekick = (messageText: string) => {
  window.parent.postMessage({
    type: 'askSidekick',
    messageText
  }, "*")
}

