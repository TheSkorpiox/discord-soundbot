import connection from './connection';
import Sound from './models/Sound';

const all = () => connection.data?.sounds;

export const findByName = (name: string) => all()?.find((sound: Sound) => sound.name === name);

// TODO: Fix
const addSingleTag = (sound: string, tag: string) => {
  const { tags } = findByName(sound) as Sound;
  if (tags.includes(tag)) return;

  tags.push(tag);
  //findByName(sound)?.tags = tags;
  connection.write();
};

export const exists = (name: string) => !!findByName(name);

export const add = (sound: string) => {
  all()?.push(new Sound(sound));
  connection.write();
};

// TODO: Fix
export const rename = (oldName: string, newName: string) => {
  // findByName(oldName)?.name = newName;
  // connection.write();
};

export const remove = (name: string) => {
  let result = connection.data?.sounds.find((v: any) => v.name === name);
  if (result) {
    connection.data?.sounds.splice(connection.data?.sounds.indexOf(result), 1);
    connection.write();
  }
};

// TODO: Fix
export const incrementCount = (sound: string) => {
  // if (!exists(sound)) add(sound);

  // const newValue = (findByName(sound).value() as Sound).count + 1;
  // findByName(sound).set('count', newValue).write();
};

// TODO: Fix
export const withTag = (tag: string) => [];
// all()
//   .filter((sound: Sound) => sound.tags.includes(tag))
//   .map((sound: Sound) => sound.name)
//   .value();

// TODO: Fix
export const addTags = (sound: string, tags: string[]) => {
  // if (!exists(sound)) add(sound);
  // tags.forEach(tag => addSingleTag(sound, tag));
};

// TODO: Fix
export const listTags = (sound: string) => {
  if (!exists(sound)) return [];

  return (findByName(sound) as Sound).tags.sort();
};

// TODO: Fix
export const clearTags = (sound: string) => {
  // if (!exists(sound)) return;

  // findByName(sound).assign({ tags: [] }).write();
};

export const mostPlayed = (limit = 15) => [];//all().sortBy('count').reverse().take(limit).value();
