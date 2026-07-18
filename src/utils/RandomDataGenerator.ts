export class RandomDataGenerator {
  static generate(): string {
    return Math.random().toString(36).slice(2);
  }
}
