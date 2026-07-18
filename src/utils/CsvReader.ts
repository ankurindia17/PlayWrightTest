import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Method Description: Reads a CSV file and returns its content as an array of objects of type T.
// Variable Description: filePath - The path to the CSV file to be read.

export type CsvRow = Record<string, string>;

export interface CsvReadOptions<T extends CsvRow> {
    headerMap?: Partial<Record<string, keyof T & string>>;
    trim?: boolean;
}

export function readCSV<T extends CsvRow = CsvRow>(
    filePath: string,
    options?: CsvReadOptions<T>
): T[] {
    const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(filePath);

    console.log(`readCSV resolved path: ${resolvedPath}`);

    const fileContent = fs.readFileSync(resolvedPath, 'utf8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: options?.trim ?? true,
    }) as Array<Record<string, string>>;

    return records.map((record) => {
        const mappedRecord = {} as T;

        Object.entries(record).forEach(([header, value]) => {
            const normalizedHeader = header.trim();
            const targetHeader = options?.headerMap?.[normalizedHeader] ?? normalizedHeader;
            (mappedRecord as Record<string, string>)[String(targetHeader)] = value;
        });

        return mappedRecord;
    });
}

// Example usage:
// import { readCSV } from './src/utils/CsvReader';

// interface LoginData {
//   username: string;
//   password: string;
//   expected: string;
//   run: string;
// [key: string]: string;
// }
//
// const rows = readCSV<LoginData>('data/testData.csv');
//
// If your CSV headers do not match the interface property names exactly,
// you can provide a header map:
//
// const rows = readCSV<LoginData>('data/testData.csv', {
//   headerMap: {
//     user_name: 'username',
//     pass_word: 'password',
//   },
// });