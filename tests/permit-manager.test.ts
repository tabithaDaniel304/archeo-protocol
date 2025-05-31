import { describe, it, expect, beforeEach } from "vitest";

// Mock Permit Manager Contract
class MockPermitManager {
  constructor() {
    this.permitRequests = new Map();
    this.permits = new Map();
    this.userRegistry = new Map();
    this.currentSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    this.blockHeight = 1000;
  }

  setSender(sender) {
    this.currentSender = sender;
  }

  setBlockHeight(height) {
    this.blockHeight = height;
  }

  isContractOwner() {
    return this.currentSender === "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
  }

  requestPermit(contractId, functionName) {
    if (!this.userRegistry.get(this.currentSender)) {
      return { error: "ERR-USER-NOT-REGISTERED" };
    }

    const key = `${this.currentSender}-${contractId}-${functionName}`;
    if (this.permitRequests.has(key)) {
      return { error: "ERR-PERMIT-ALREADY-EXISTS" };
    }

    this.permitRequests.set(key, { requested: true });
    return { success: true };
  }

  grantPermit(user, contractId, functionName) {
    if (!this.isContractOwner()) {
      return { error: "ERR-NOT-CONTRACT-OWNER" };
    }

    const key = `${user}-${contractId}-${functionName}`;
    if (!this.permitRequests.has(key)) {
      return { error: "ERR-PERMIT-NOT-FOUND" };
    }

    this.permits.set(key, { permitted: true });
    this.permitRequests.delete(key);
    return { success: true };
  }

  revokePermit(user, contractId, functionName) {
    if (!this.isContractOwner()) {
      return { error: "ERR-NOT-CONTRACT-OWNER" };
    }

    const key = `${user}-${contractId}-${functionName}`;
    if (!this.permits.has(key)) {
      return { error: "ERR-PERMIT-NOT-FOUND" };
    }

    this.permits.delete(key);
    return { success: true };
  }

  hasPermit(user, contractId, functionName) {
    const key = `${user}-${contractId}-${functionName}`;
    return this.permits.get(key) || { permitted: false };
  }

  checkPermit(contractId, functionName) {
    const permit = this.hasPermit(this.currentSender, contractId, functionName);
    return permit.permitted
      ? { success: true }
      : { error: "ERR-NOT-PERMITTED" };
  }
}

describe("Permit Manager Contract", () => {
  let contract;
  const admin = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
  const user = "ST2USER-ADDRESS";
  const targetContract = "ST3TARGET-CONTRACT";

  beforeEach(() => {
    contract = new MockPermitManager();
    contract.setSender(admin);
  });

  describe("Permit Management", () => {
    it("should request permit successfully", () => {
      contract.userRegistry.set(user, { registered: true });
      contract.setSender(user);

      const result = contract.requestPermit(targetContract, "test-function");
      expect(result.success).toBe(true);
    });

    it("should fail to request permit if user not registered", () => {
      contract.setSender(user);
      const result = contract.requestPermit(targetContract, "test-function");
      expect(result.error).toBe("ERR-USER-NOT-REGISTERED");
    });

    it("should fail to request permit if already requested", () => {
      contract.userRegistry.set(user, { registered: true });
      contract.setSender(user);
      contract.requestPermit(targetContract, "test-function");
      const result = contract.requestPermit(targetContract, "test-function");
      expect(result.error).toBe("ERR-PERMIT-ALREADY-EXISTS");
    });

    it("should grant permit successfully", () => {
      contract.userRegistry.set(user, { registered: true });
      contract.setSender(user);
      contract.requestPermit(targetContract, "test-function");
      contract.setSender(admin);

      const result = contract.grantPermit(
        user,
        targetContract,
        "test-function"
      );
      expect(result.success).toBe(true);
      expect(
        contract.hasPermit(user, targetContract, "test-function").permitted
      ).toBe(true);
    });

    it("should fail to grant permit if not contract owner", () => {
      contract.setSender(user);
      const result = contract.grantPermit(
        user,
        targetContract,
        "test-function"
      );
      expect(result.error).toBe("ERR-NOT-CONTRACT-OWNER");
    });

    it("should revoke permit successfully", () => {
      contract.userRegistry.set(user, { registered: true });
      contract.setSender(user);
      contract.requestPermit(targetContract, "test-function");
      contract.setSender(admin);
      contract.grantPermit(user, targetContract, "test-function");

      const result = contract.revokePermit(
        user,
        targetContract,
        "test-function"
      );
      expect(result.success).toBe(true);
      expect(
        contract.hasPermit(user, targetContract, "test-function").permitted
      ).toBe(false);
    });

    it("should fail to revoke permit if not contract owner", () => {
      contract.setSender(user);
      const result = contract.revokePermit(
        user,
        targetContract,
        "test-function"
      );
      expect(result.error).toBe("ERR-NOT-CONTRACT-OWNER");
    });

    it("should check permit correctly", () => {
      contract.userRegistry.set(user, { registered: true });
      contract.setSender(user);
      contract.requestPermit(targetContract, "test-function");
      contract.setSender(admin);
      contract.grantPermit(user, targetContract, "test-function");
      contract.setSender(user);

      const result = contract.checkPermit(targetContract, "test-function");
      expect(result.success).toBe(true);
    });
  });
});

console.log("Permit Manager Contract tests completed successfully!");
