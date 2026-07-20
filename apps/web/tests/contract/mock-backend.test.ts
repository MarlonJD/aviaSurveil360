import { backendContract, FIXED_NOW, type BackendContractHarness } from "./backend-contract";
import { createMockBackend } from "../../src/mock/create-mock-backend";
import { MemoryMockStore } from "../../src/mock/memory-mock-store";

backendContract(async (): Promise<BackendContractHarness> => {
  const store = MemoryMockStore.createCanonical({ clock: () => FIXED_NOW });
  return {
    backendFor(principal) {
      return createMockBackend({ store, principal });
    },
  };
});
