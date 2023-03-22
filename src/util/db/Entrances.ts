import connection from './connection';

const table = 'entrances';

export const get = (userId: string) => connection.data?.entrances.find((p: any) => p.userId === userId);
export const exists = (userId: string) => !!get(userId);
export const add = (userId: string, sound: string) => {
  connection.data?.entrances.push({ userId: userId, sound: sound });
  connection.write();
};

export const remove = (userId: string) => {
  let result = connection.data?.entrances.find((p: any) => p.userId === userId);
  if (result) {
    connection.data?.entrances.splice(connection.data?.entrances.indexOf(result), 1);
    connection.write();
  }
};
