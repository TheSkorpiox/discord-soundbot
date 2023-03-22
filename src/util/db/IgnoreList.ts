import connection from './connection';

export const exists = (id: string) =>
  !!connection.data?.ignoreList.find((v: any) => v === id);

export const add = (id: string) => {
  if (exists(id)) return;

  connection.data?.ignoreList.push(id);
  connection.write();
};

export const remove = (id: string) => {
  let result = connection.data?.ignoreList.find((v: any) => v === id);
  if (result) {
    connection.data?.ignoreList.splice(connection.data?.ignoreList.indexOf(result), 1);
    connection.write();
  }
};
