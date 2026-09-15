/** 1回あたりの調査対象が多すぎる場合に分割する（AI側の応答が重くなるのを防ぐため） */
export function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  if (batchSize <= 0) throw new Error("batchSize must be positive");
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
