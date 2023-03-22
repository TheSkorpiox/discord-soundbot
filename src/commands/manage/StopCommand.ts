import { Message } from 'discord.js';

import QueueCommand from '../base/QueueCommand';

export class StopCommand extends QueueCommand {
  public readonly triggers = ['leave', 'stop'];

  public run(message: Message) {
    if (!message.member) return;
    if (!message.member.voice) return;

    this.queue.clear();

    message.member.voice.disconnect();
  }
}
