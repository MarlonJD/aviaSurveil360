import { canonicalJson, cloneValue, OperationIdReuseError } from "../backend/backend-contracts";
import { createCanonicalSeedState, type MockState } from "./seed-data";

interface StoredOperation {
  payload: string;
  response: unknown;
}

export class MemoryMockStore {
  private state: MockState;
  private readonly operations = new Map<string, StoredOperation>();

  private constructor(
    state: MockState,
    readonly clock: () => string,
  ) {
    this.state = cloneValue(state);
  }

  static createCanonical({ clock }: { clock: () => string }): MemoryMockStore {
    return new MemoryMockStore(createCanonicalSeedState(clock()), clock);
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
    return cloneValue(response);
  }
}
