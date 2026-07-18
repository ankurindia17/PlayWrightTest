export class DateUtil {
  static getCurrentDate(): string {
    return new Date().toISOString();
  }
}
