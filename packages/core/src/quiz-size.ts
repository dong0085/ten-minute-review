export function quizSize(bankSize: number): number {
  if (bankSize <= 0) {
    return 0;
  }
  return Math.min(20, Math.max(8, Math.floor(bankSize / 8)));
}
