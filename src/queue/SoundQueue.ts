import { Message } from 'discord.js';
import { joinVoiceChannel, VoiceConnection, createAudioPlayer, AudioPlayer, createAudioResource, AudioPlayerStatus } from '@discordjs/voice';
import { Collection } from 'discord.js';

import Config from '../config/Config';
import * as sounds from '../util/db/Sounds';
import localize from '../util/i18n/localize';
import { getPathForSound } from '../util/SoundUtil';

import ChannelTimeout from './ChannelTimeout';
import QueueItem from './QueueItem';

export default class SoundQueue {
  private readonly config: Config;

  private queue: QueueItem[] = [];
  private currentSound: Nullable<QueueItem>;
  private player: AudioPlayer;

  constructor(config: Config) {
    this.config = config;
    this.player = createAudioPlayer();
  }

  public add(item: QueueItem) {
    this.queue.push(item);
    if (this.isStartable()) this.playNext();
  }

  public addBefore(item: QueueItem) {
    this.queue.unshift(item);

    if (this.isStartable()) this.playNext();
  }

  public next() {
    if (!this.player) return;

    this.player.stop();//.emit('finish');
  }

  public clear() {
    if (!this.currentSound) return;
    if (this.config.deleteMessages) this.deleteMessages();

    // Prevent further looping
    this.currentSound.count = 0;
    this.queue = [];
  }

  private isStartable() {
    return !this.currentSound;
  }

  private deleteMessages() {
    if (!this.currentSound) return;
    if (this.isEmpty()) return;

    let deleteableMessages = this.queue
      .map(item => item.message)
      .filter((message): message is Message => !!message);

    const { message: currentMessage } = this.currentSound;
    if (currentMessage) {
      deleteableMessages = deleteableMessages.filter(msg => msg.id !== currentMessage.id);
    }

    // Do not try to delete the same sound multiple times (!combo)
    Array.from(new Set(deleteableMessages)).forEach(message => message.delete());
  }

  private async playNext() {
    this.currentSound = this.queue.shift()!;
    const sound = getPathForSound(this.currentSound.name);

    try {
      const connection = joinVoiceChannel({
        channelId: this.currentSound.channel.id,
        guildId: this.currentSound.channel.guild.id,
        adapterCreator: this.currentSound.channel.guild.voiceAdapterCreator,
        selfDeaf: true
      });
      connection.subscribe(this.player);

      await this.playSound(sound);
      this.handleFinishedPlayingSound(connection);
    } catch (error: any) {
      this.handleError(error);
    }
  }

  private playSound(name: string): Promise<void> {
    return new Promise(resolve => {
      this.player.play(createAudioResource(name));
      // .play(name, { volume: this.config.volume })
      // this.player.on(AudioPlayerStatus.Idle, resolve)
      // .on('close', resolve);
    });
  }

  private handleFinishedPlayingSound(connection: VoiceConnection) {
    const { name, channel, message, count } = this.currentSound!;
    sounds.incrementCount(name);

    if (count > 1) {
      this.add(new QueueItem(name, channel, message, count - 1));
    } else {
      this.deleteCurrentMessage();
    }

    this.currentSound = null;

    if (!this.isEmpty()) {
      this.playNext();
      return;
    }

    if (!this.config.stayInChannel) {
      connection.disconnect();
      return;
    }

    if (this.config.timeout > 0) ChannelTimeout.start(connection);
  }

  private async handleError(error: { code: string }) {
    if (error.code === 'VOICE_JOIN_CHANNEL' && this.currentSound?.message) {
      await this.currentSound.message.channel.send(localize.t('errors.permissions'));
      process.exit();
    }

    console.error('Error occured!', '\n', error);

    this.currentSound = null;
  }

  private deleteCurrentMessage() {
    if (!this.config.deleteMessages) return;
    if (!this.currentSound || !this.currentSound.message) return;
    if (!this.isLastSoundFromCurrentMessage(this.currentSound.message)) return;
    if (this.wasMessageAlreadyDeleted(this.currentSound.message)) return;

    this.currentSound.message.delete();
  }

  private isEmpty() {
    return this.queue.length === 0;
  }

  private wasMessageAlreadyDeleted(message: Message) {
    if (!message) return false;

    return message.channel.messages.cache.get(message.id) === undefined;
  }

  private isLastSoundFromCurrentMessage(message: Message) {
    return !this.queue.some(item => !!item.message && item.message.id === message.id);
  }
}
