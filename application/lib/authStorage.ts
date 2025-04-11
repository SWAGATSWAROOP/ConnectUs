// // lib/authStorage.ts
// import * as SQLite from 'expo-sqlite';

// const db = SQLite.openDatabase('auth.db');

// export const initAuthDb = () => {
//   db.transaction(tx => {
//     tx.executeSql(
//       'CREATE TABLE IF NOT EXISTS auth (id INTEGER PRIMARY KEY NOT NULL, token TEXT);'
//     );
//   });
// };

// export const storeToken = (token: string) => {
//   db.transaction(tx => {
//     tx.executeSql('DELETE FROM auth;');
//     tx.executeSql('INSERT INTO auth (token) VALUES (?);', [token]);
//   });
// };

// export const getToken = (): Promise<string | null> => {
//   return new Promise((resolve) => {
//     db.transaction(tx => {
//       tx.executeSql('SELECT token FROM auth LIMIT 1;', [], (_, { rows }) => {
//         if (rows.length > 0) {
//           resolve(rows._array[0].token);
//         } else {
//           resolve(null);
//         }
//       });
//     });
//   });
// };

// export const clearToken = () => {
//   db.transaction(tx => {
//     tx.executeSql('DELETE FROM auth;');
//   });
// };
