export const checkForSidekickListener = () => {
  window.parent.postMessage({
    type: 'ping'
  }, "*")
}

export interface AskSidekickResponse {
  response: string
}

export const askSidekick = (messageText: string): Promise<AskSidekickResponse> => {
  window.parent.postMessage({
    type: 'askSidekick',
    messageText
  }, "*")

  return new Promise<AskSidekickResponse>((resolve, _reject) => {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'askSidekickResponse') {
        resolve(event.data.response)
      }
    })
  })
}
