import connection from './connection';

const table = 'exits';

export const get = (userId: string) => connection.data?.exits.find((p: any) => p.userId === userId);
export const exists = (userId: string) => !!get(userId);
export const add = (userId: string, sound: string) => {
  connection.data?.exits.push({ userId: userId, sound: sound });
  connection.write();
};

export const remove = (userId: string) => {
  let result = connection.data?.exits.find((p: any) => p.userId === userId);
  if (result) {
    connection.data?.exits.splice(connection.data?.exits.indexOf(result), 1);
    connection.write();
  }
};