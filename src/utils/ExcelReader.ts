import path from 'path';
import XLSX from 'xlsx';

// Method Description: Reads an Excel file and returns its content as an array of objects of type T.
// Variable Description: filePath - The path to the Excel file to be read.

export interface ExcelReadOptions<T extends Record<string, unknown>> {
  sheetName?: string;
  headerMap?: Partial<Record<string, keyof T & string>>;
}

export class ExcelReader {
  static read<T extends Record<string, unknown>>(
    filePath: string,
    options?: ExcelReadOptions<T>
  ): T[] {
    return readExcel<T>(filePath, options);
  }
}

export function readExcel<T extends Record<string, unknown>>(
  filePath: string,
  sheetNameOrOptions?: string | ExcelReadOptions<T>,
  options?: ExcelReadOptions<T>
): T[] {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(filePath);

  console.log(`readExcel resolved path: ${resolvedPath}`);

  const resolvedOptions = typeof sheetNameOrOptions === 'string'
    ? { ...options, sheetName: sheetNameOrOptions }
    : sheetNameOrOptions ?? options ?? {};

  const workbook = XLSX.readFile(resolvedPath);
  const worksheet = resolvedOptions?.sheetName
    ? workbook.Sheets[resolvedOptions.sheetName]
    : workbook.Sheets[workbook.SheetNames[0]];

  if (!worksheet) {
    throw new Error(`Worksheet not found: ${resolvedOptions?.sheetName ?? 'default'}`);
  }

  const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Array<Record<string, unknown>>;

  return rows.map((row) => {
    const mappedRow = {} as T;

    Object.entries(row).forEach(([header, value]) => {
      const normalizedHeader = header?.trim();
      const targetHeader = resolvedOptions?.headerMap?.[normalizedHeader ?? ''] ?? normalizedHeader;
      (mappedRow as Record<string, unknown>)[String(targetHeader)] = value;
    });

    return mappedRow;
  });
}

// Example usage:
// interface LoginData {
//   username: string;
//   password: string;
//   expected: string;
//   run: string;
// }
//
// const rows = readExcel<LoginData>('data/testData.xlsx', 'Sheet1');
//
// If your Excel headers do not match the interface property names exactly,
// you can provide a header map:
//
// const rows = readExcel<LoginData>('data/testData.xlsx', {
//   sheetName: 'Sheet1',
//   headerMap: {
//     user_name: 'username',
//     pass_word: 'password',
//   },
// });
