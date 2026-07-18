import fs from 'fs';
import path from 'path';
 
// Method Description: Reads a JSON file and returns its content as an object of type T.
// Variable Description: filePath - The path to the JSON file to be read.

export class JsonReader {
  static read<T = Record<string, unknown>>(filePath: string): T {
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(filePath);

    console.log(`JsonReader resolved path: ${resolvedPath}`);

    const fileContent = fs.readFileSync(resolvedPath, 'utf8');
    return JSON.parse(fileContent) as T;
  }

  static readNested<T = Record<string, unknown>>(filePath: string): T {
    return this.read<T>(filePath);
  }
}

// Example usage for a flat JSON object:
// interface LoginData {
//   username: string;
//   password: string;
// }
//
// const data = JsonReader.read<LoginData>('data/loginData.json');
// console.log(data.username);

// Example usage for a nested JSON object:
// interface UserCredentials {
//   username: string;
//   password: string;
// }
//
// interface TestUsersJson {
//   validUser: UserCredentials;
//   invalidUser: UserCredentials;
// }
//
// const data = JsonReader.read<TestUsersJson>('data/testUsers.json');
// console.log(data.validUser.username);
// console.log(data.invalidUser.password);

// Example JSON:
// {
//   "validUser": {
//     "username": "standard_user",
//     "password": "secret_sauce"
//   },
//   "invalidUser": {
//     "username": "invalid_user",
//     "password": "invalid_password"
//   }
// }