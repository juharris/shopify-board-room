import type { MeetingMember } from "./member"

export enum MeetingMessageRole {
  Assistant = 'assistant',
  User = 'user',
  System = 'system',
  Tool = 'tool',
}

export const getMeetingMessageRole = (role: string): MeetingMessageRole => {
  const result = MeetingMessageRole[role as keyof typeof MeetingMessageRole]
  if (result === undefined) {
    // The above lookup should work, but it does not locally.
    switch (role) {
      case 'assistant':
        return MeetingMessageRole.Assistant
      case 'system':
        return MeetingMessageRole.System
      case 'tool':
        return MeetingMessageRole.Tool
      case 'user':
        return MeetingMessageRole.User
    }
  }
  return result
}

export class MeetingMessage {
  private _id: string = Math.random().toString(36).substring(2)
  public isGenerating: boolean = false

  // eslint-disable-next-line no-useless-constructor
  public constructor(
    public role: MeetingMessageRole,
    public content: string,
    public from: MeetingMember,
  ) {
  }

  public get id(): string {
    return this._id
  }

  public withContent(content: string): MeetingMessage {
    return new MeetingMessage(this.role, content, this.from)
  }
}
