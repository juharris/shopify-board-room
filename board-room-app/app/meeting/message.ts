export enum MeetingMessageRole {
  Assistant = 'assistant',
  User = 'user',
  System = 'system'
}

export class MeetingMessage {
  private _id: string = Math.random().toString(36).substring(2)

  // eslint-disable-next-line no-useless-constructor
  public constructor(
    public role: MeetingMessageRole,
    public content: string,
  ) {
  }

  public get id(): string {
    return this._id;
  }
}
