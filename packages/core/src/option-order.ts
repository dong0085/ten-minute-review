export function isIndexOrder(order: readonly number[] | undefined, count: number): boolean {
  if (!order || order.length !== count) {
    return false;
  }
  return (
    new Set(order).size === count &&
    order.every((index) => Number.isInteger(index) && index >= 0 && index < count)
  );
}

export function shuffledIndexOrder(
  count: number,
  previous?: readonly number[],
  random: () => number = Math.random,
): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const value = order[index] as number;
    order[index] = order[swapIndex] as number;
    order[swapIndex] = value;
  }

  if (
    count > 1 &&
    isIndexOrder(previous, count) &&
    order.every((value, index) => value === previous?.[index])
  ) {
    order.push(order.shift() as number);
  }

  return order;
}
