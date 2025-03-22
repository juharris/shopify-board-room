import type { MeetingMember } from "./member";

export enum MeetingMessageRole {
  Assistant = 'assistant',
  User = 'user',
  System = 'system',
  Tool = 'tool',
}

export class MeetingMessage {
  private _id: string = Math.random().toString(36).substring(2)

  public tool_call_id: string | undefined = undefined

  // eslint-disable-next-line no-useless-constructor
  public constructor(
    public role: MeetingMessageRole,
    public content: string,
    public member: MeetingMember,
  ) {
  }

  public get id(): string {
    return this._id;
  }

  public withContent(content: string): MeetingMessage {
    return new MeetingMessage(this.role, content, this.member);
  }
}
