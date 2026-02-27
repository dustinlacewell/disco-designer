export interface DiffResult<TDesired, TCurrent> {
  toCreate: TDesired[];
  toUpdate: { desired: TDesired; current: TCurrent }[];
  toDelete: TCurrent[];
}

/**
 * Generic diff between a desired state and current state, keyed by name.
 *
 * @param desired - Array of desired items
 * @param current - Array of current items
 * @param desiredKey - Extracts the key from a desired item
 * @param currentKey - Extracts the key from a current item
 * @param isEqual - Returns true if desired and current are equivalent (no update needed)
 */
export function diff<TDesired, TCurrent>(
  desired: TDesired[],
  current: TCurrent[],
  desiredKey: (item: TDesired) => string,
  currentKey: (item: TCurrent) => string,
  isEqual: (desired: TDesired, current: TCurrent) => boolean,
): DiffResult<TDesired, TCurrent> {
  const desiredMap = new Map<string, TDesired>();
  for (const item of desired) {
    desiredMap.set(desiredKey(item), item);
  }

  const currentMap = new Map<string, TCurrent>();
  for (const item of current) {
    currentMap.set(currentKey(item), item);
  }

  const toCreate: TDesired[] = [];
  const toUpdate: { desired: TDesired; current: TCurrent }[] = [];
  const toDelete: TCurrent[] = [];

  // Items in desired but not in current → create
  // Items in both → check if equal, update if different
  for (const [key, desiredItem] of desiredMap) {
    const currentItem = currentMap.get(key);
    if (!currentItem) {
      toCreate.push(desiredItem);
    } else if (!isEqual(desiredItem, currentItem)) {
      toUpdate.push({ desired: desiredItem, current: currentItem });
    }
  }

  // Items in current but not in desired → delete
  for (const [key, currentItem] of currentMap) {
    if (!desiredMap.has(key)) {
      toDelete.push(currentItem);
    }
  }

  return { toCreate, toUpdate, toDelete };
}
