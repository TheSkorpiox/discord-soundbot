import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/lib/node';
import Sound from './models/Sound';

interface Database {
  entrances: { userId: string, sound: string }[],
  exits: { userId: string, sound: string }[],
  ignoreList: string[],
  sounds: Sound[],
}

const adapter = new JSONFile<Database>('db.json');
const connection = new Low(adapter);

connection.write();

export default connection;
