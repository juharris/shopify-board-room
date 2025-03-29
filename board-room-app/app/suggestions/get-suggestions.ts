import { MeetingMember } from 'app/meeting/member'
import { MeetingMessage, MeetingMessageRole } from 'app/meeting/message'

const USER_MEMBER = new MeetingMember('user', 'user')

const CANDIDATES: MeetingMessage[] = [
  new MeetingMessage(MeetingMessageRole.User, "Ask the CTO", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Ask the CIO", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Ask the CEO", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Ask the CFO", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Ask my weird cousin Jeff", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "What would Bill Gates do?", USER_MEMBER),
]

const INITIAL_SUGGESTIONS = [
  new MeetingMessage(MeetingMessageRole.User, "Let's begin", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Let's discuss our marketing strategy", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Let's depose the CEO", USER_MEMBER),
  new MeetingMessage(MeetingMessageRole.User, "Let's discuss our product catalog", USER_MEMBER),
]

export const getSuggestions = (count: number, candidates: MeetingMessage[] = CANDIDATES) => {
  const indices = new Set<number>()
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * candidates.length))
  }
  const result = []
  for (const index of indices) {
    result.push(candidates[index])
  }
  return result
}

export const getInitialSuggestions = (count: number, candidates: MeetingMessage[] = INITIAL_SUGGESTIONS) => {
  return getSuggestions(count, candidates)
}
