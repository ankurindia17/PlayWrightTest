import fs from 'fs';
import path from 'path';
import { readCSV, type CsvReadOptions, type CsvRow } from './CsvReader';
import { JsonReader } from './JsonReader';
import { ExcelReader, type ExcelReadOptions } from './ExcelReader';

// Method Description: Provides utility functions for file operations, including reading/writing JSON, CSV, and Excel files, as well as directory management.
// Variable Description: filePath - The path to the file to be read or written. dirPath - The path to the directory to be managed.

export class FileUtils {
  private static resolvePath(filePath: string): string {
    return path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
  }

  /**
   * Ensures that a directory exists. If it doesn't, it creates it.
   */
  public static ensureDirectory(dirPath: string): void {
    const resolvedDir = this.resolvePath(dirPath);
    if (!fs.existsSync(resolvedDir)) {
      fs.mkdirSync(resolvedDir, { recursive: true });
    }
  }

  /**
   * Deletes all files and folders within a directory without deleting the directory itself.
   */
  public static cleanDirectory(dirPath: string): void {
    const resolvedDir = this.resolvePath(dirPath);
    if (fs.existsSync(resolvedDir)) {
      const entries = fs.readdirSync(resolvedDir);
      for (const entry of entries) {
        const currentPath = path.join(resolvedDir, entry);
        if (fs.lstatSync(currentPath).isDirectory()) {
          fs.rmSync(currentPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(currentPath);
        }
      }
    }
  }

  /**
   * Reads a JSON file and parses it into an object.
   */
  public static readJson<T>(filePath: string): T {
    const resolvedPath = this.resolvePath(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found at: ${resolvedPath}`);
    }

    const rawData = fs.readFileSync(resolvedPath, 'utf-8');
    return JSON.parse(rawData) as T;
  }

  /**
   * Writes an object to a JSON file with clean formatting.
   */
  public static writeJson(filePath: string, data: unknown): void {
    const resolvedPath = this.resolvePath(filePath);
    this.ensureDirectory(path.dirname(resolvedPath));
    fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Reads text content from a file.
   */
  public static readText(filePath: string): string {
    const resolvedPath = this.resolvePath(filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found at: ${resolvedPath}`);
    }

    return fs.readFileSync(resolvedPath, 'utf-8');
  }

  /**
   * Writes text content to a file.
   */
  public static writeText(filePath: string, content: string): void {
    const resolvedPath = this.resolvePath(filePath);
    this.ensureDirectory(path.dirname(resolvedPath));
    fs.writeFileSync(resolvedPath, content, 'utf-8');
  }

  /**
   * Appends text content to a file.
   */
  public static appendText(filePath: string, content: string): void {
    const resolvedPath = this.resolvePath(filePath);
    this.ensureDirectory(path.dirname(resolvedPath));
    fs.appendFileSync(resolvedPath, content, 'utf-8');
  }

  /**
   * Checks if a file exists.
   */
  public static fileExists(filePath: string): boolean {
    return fs.existsSync(this.resolvePath(filePath));
  }

  /**
   * Deletes a file if it exists.
   */
  public static deleteFile(filePath: string): void {
    const resolvedPath = this.resolvePath(filePath);
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  }

  /**
   * Copies a file from source to destination.
   */
  public static copyFile(sourcePath: string, destinationPath: string): void {
    const resolvedSource = this.resolvePath(sourcePath);
    const resolvedDestination = this.resolvePath(destinationPath);

    if (!fs.existsSync(resolvedSource)) {
      throw new Error(`Source file not found at: ${resolvedSource}`);
    }

    this.ensureDirectory(path.dirname(resolvedDestination));
    fs.copyFileSync(resolvedSource, resolvedDestination);
  }

  /**
   * Returns the file name with or without the extension.
   */
  public static getFileName(filePath: string, withExtension: boolean = true): string {
    const resolvedPath = this.resolvePath(filePath);
    const fileName = path.basename(resolvedPath);
    return withExtension ? fileName : fileName.replace(path.extname(fileName), '');
  }

  /**
   * Returns the file extension without the dot.
   */
  public static getExtension(filePath: string): string {
    return path.extname(this.resolvePath(filePath)).replace('.', '');
  }

  /**
   * Lists files in a directory. Set recursive to true for nested directories.
   */
  public static listFiles(dirPath: string, recursive: boolean = false): string[] {
    const resolvedDir = this.resolvePath(dirPath);
    if (!fs.existsSync(resolvedDir)) {
      return [];
    }

    if (!recursive) {
      return fs.readdirSync(resolvedDir)
        .filter((entry) => fs.statSync(path.join(resolvedDir, entry)).isFile())
        .map((entry) => path.join(resolvedDir, entry));
    }

    const results: string[] = [];
    const walk = (currentDir: string): void => {
      for (const entry of fs.readdirSync(currentDir)) {
        const fullPath = path.join(currentDir, entry);
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath);
        } else {
          results.push(fullPath);
        }
      }
    };

    walk(resolvedDir);
    return results;
  }

  /**
   * Waits for a file to exist on disk (useful for checking completed downloads).
   */
  public static async waitForFile(filePath: string, timeoutMs: number = 10000): Promise<boolean> {
    const resolvedPath = this.resolvePath(filePath);
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).size > 0) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return false;
  }

  /**
   * Reads CSV data from a file and returns strongly typed rows.
   */
  public static readCsv<T extends CsvRow = CsvRow>(
    filePath: string,
    options?: CsvReadOptions<T>
  ): T[] {
    return readCSV<T>(filePath, options);
  }

  /**
   * Reads JSON data from a file and returns it as a strongly typed object.
   */
  public static readJsonFile<T = Record<string, unknown>>(filePath: string): T {
    return JsonReader.read<T>(filePath);
  }

  /**
   * Reads Excel data from a file and returns strongly typed rows.
   */
  public static async readExcel<T extends Record<string, unknown>>(
    filePath: string,
    options?: ExcelReadOptions<T>
  ): Promise<T[]> {
    return ExcelReader.read<T>(filePath, options);
  }
}

// Example usage:
// import { FileUtils } from './src/utils/FileUtil';
//
// interface LoginData {
//   username: string;
//   password: string;
//   expected: string;
//   run: string;
// }
//
// // Read CSV data
// const csvRows = FileUtils.readCsv<LoginData>('data/testData.csv');
// If your CSV headers do not match the interface property names exactly,
// you can provide a header map:
//
// const csvRows = FileUtils.readCsv<LoginData>('data/testData.csv', {
//   headerMap: {
//     'User Name': 'username',
//     'User Password': 'password'
//   }
// });
//
// // Read JSON data
// const loginData = FileUtils.readJsonFile<LoginData>('data/loginData.json');

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
// const testUsersData = FileUtils.readJsonFile<TestUsersJson>('data/testUsers.json');
//
// Read Excel data
// const excelRows = await FileUtils.readExcel<LoginData>('data/testData.xlsx');
//
// If your Excel headers do not match the interface property names exactly,
// you can provide a header map:
// const excelRows = await FileUtils.readExcel<LoginData>('data/testData.xlsx', {
//   headerMap: {
//     'User Name': 'username',
//     'User Password': 'password'
//   }
// });
//
// // Create folders for reports or screenshots
// FileUtils.ensureDirectory('artifacts/screenshots');
//
// // Write an artifact or report file
// FileUtils.writeText('artifacts/reports/test-summary.txt', 'Test passed');
//
// // Wait for a downloaded file in Playwright tests
// const downloaded = await FileUtils.waitForFile('downloads/report.pdf', 15000);
//
// // Check if a screenshot exists
// const exists = FileUtils.fileExists('artifacts/screenshots/login.png');
//
// // Use in a test class or page object
// // const screenshotPath = 'artifacts/screenshots/login.png';
// // await page.screenshot({ path: screenshotPath });
// // FileUtils.ensureDirectory(path.dirname(screenshotPath));

