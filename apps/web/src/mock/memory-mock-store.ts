import { canonicalJson, cloneValue, OperationIdReuseError } from "../backend/backend-contracts";
import { createCanonicalSeedState, type MockState } from "./seed-data";

interface StoredOperation {
  payload: string;
  response: unknown;
}

interface PersistedMockStore {
  schemaVersion: 1;
  state: MockState;
  operations: [string, StoredOperation][];
}

export class MemoryMockStore {
  private state: MockState;
  private readonly operations: Map<string, StoredOperation>;
  private persist: (() => void) | null = null;

  private constructor(
    state: MockState,
    readonly clock: () => string,
    operations: Iterable<[string, StoredOperation]> = [],
  ) {
    this.state = cloneValue(state);
    this.operations = new Map(operations);
  }

  static createCanonical({ clock }: { clock: () => string }): MemoryMockStore {
    return new MemoryMockStore(createCanonicalSeedState(clock()), clock);
  }

  static createPersistent({
    clock,
    storage,
    storageKey,
  }: {
    clock: () => string;
    storage: Storage;
    storageKey: string;
  }): MemoryMockStore {
    let persisted: PersistedMockStore | null = null;
    try {
      const raw = storage.getItem(storageKey);
      const value = raw ? JSON.parse(raw) as Partial<PersistedMockStore> : null;
      if (
        value?.schemaVersion === 1 &&
        value.state &&
        typeof value.state === "object" &&
        Array.isArray(value.operations)
      ) {
        persisted = value as PersistedMockStore;
      }
    } catch {
      storage.removeItem(storageKey);
    }
    const store = persisted
      ? new MemoryMockStore(persisted.state, clock, persisted.operations)
      : MemoryMockStore.createCanonical({ clock });
    store.persist = () => {
      const snapshot: PersistedMockStore = {
        schemaVersion: 1,
        state: cloneValue(store.state),
        operations: [...store.operations.entries()].map(([key, operation]) => [key, cloneValue(operation)]),
      };
      storage.setItem(storageKey, JSON.stringify(snapshot));
    };
    return store;
  }

  read<T>(reader: (state: Readonly<MockState>) => T): T {
    return cloneValue(reader(this.state));
  }

  execute<T>(
    operationId: string,
    semanticPayload: unknown,
    mutation: (draft: MockState) => T,
  ): T {
    const payload = canonicalJson(semanticPayload);
    const prior = this.operations.get(operationId);
    if (prior) {
      if (prior.payload !== payload) throw new OperationIdReuseError(operationId);
      return cloneValue(prior.response as T);
    }

    const draft = cloneValue(this.state);
    const response = mutation(draft);
    this.state = draft;
    this.operations.set(operationId, { payload, response: cloneValue(response) });
    this.persist?.();
    return cloneValue(response);
  }
}
