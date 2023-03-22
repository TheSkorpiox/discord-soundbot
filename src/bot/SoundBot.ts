import { Client, Guild, Message, TextChannel, VoiceState, PermissionsBitField, GatewayIntentBits } from 'discord.js';
import { VoiceChannel } from 'discord.js';

import Config from '../config/Config';
import QueueItem from '../queue/QueueItem';
import SoundQueue from '../queue/SoundQueue';
import * as entrances from '../util/db/Entrances';
import * as exits from '../util/db/Exits';
import localize from '../util/i18n/localize';
import { getSounds } from '../util/SoundUtil';

import Command from '../commands/base/Command';
import CommandCollection from './CommandCollection';
import MessageHandler from './MessageHandler';

export default class SoundBot extends Client {
  private readonly config: Config;
  private readonly commands: CommandCollection;
  private readonly messageHandler: MessageHandler;
  private readonly queue: SoundQueue;

  constructor(
    config: Config,
    commands: CommandCollection,
    messageHandler: MessageHandler,
    queue: SoundQueue
  ) {
    super({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.MessageContent]
    });

    this.config = config;
    this.commands = commands;
    this.messageHandler = messageHandler;
    this.queue = queue;

    this.addEventListeners();
  }

  public start() {
    this.login(this.config.token);
  }

  public registerAdditionalCommands(commands: Command[]) {
    this.commands.registerCommands(commands);
  }

  private addEventListeners() {
    this.on('ready', this.onReady);
    this.on('message', this.onMessage);
    this.on('voiceStateUpdate', this.onUserLeavesVoiceChannel);
    this.on('voiceStateUpdate', this.onUserJoinsVoiceChannel);
    this.on('guildCreate', this.onBotJoinsServer);
  }

  private onReady() {
    if (!this.user) return;

    this.user.setActivity(this.config.game);
    this.commands.registerUserCommands(this.user);
  }

  private onUserJoinsVoiceChannel(oldState: VoiceState, newState: VoiceState) {
    const { channel: previousVoiceChannel } = oldState;
    const { channel: currentVoiceChannel, member } = newState;

    if (!member) return;
    if (!currentVoiceChannel || previousVoiceChannel === currentVoiceChannel) return;
    if (!entrances.exists(member.id)) return;

    const sound = entrances.get(member.id);
    if (!getSounds().includes(sound!.sound)) return;

    this.queue.add(new QueueItem(sound!.sound, <VoiceChannel>currentVoiceChannel));
  }

  private onUserLeavesVoiceChannel(oldState: VoiceState, newState: VoiceState) {
    const { channel: previousVoiceChannel } = oldState;
    const { channel: currentVoiceChannel, member } = newState;

    if (!member) return;
    if (!previousVoiceChannel || previousVoiceChannel === currentVoiceChannel) return;
    if (!exits.exists(member.id)) return;

    const sound = exits.get(member.id);
    if (!getSounds().includes(sound!.sound)) return;

    this.queue.add(new QueueItem(sound!.sound, <VoiceChannel>previousVoiceChannel));
  }

  private onMessage(message: Message) {
    this.messageHandler.handle(message);
  }

  private onBotJoinsServer(guild: Guild) {
    if (!guild.available) return;

    const channel = this.findFirstWritableChannel(guild);
    if (!channel) return;

    channel.send(localize.t('welcome', { prefix: this.config.prefix }));
  }

  private findFirstWritableChannel(guild: Guild) {
    if (!guild.members.me) return undefined;

    const channels = guild.channels.cache
      .filter(channel => channel.isTextBased())
      .filter(channel => {
        const permissions = channel.permissionsFor(guild.members.me!);

        return Boolean(permissions && permissions.has(PermissionsBitField.Flags.SendMessages));
      });

    if (!channels.size) return undefined;
    return channels.first() as TextChannel;
  }
}
