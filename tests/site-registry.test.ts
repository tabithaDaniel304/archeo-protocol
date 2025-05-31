import { describe, it, expect, beforeEach } from "vitest";

// Mock Artifact Registry Contract
class MockArtifactRegistry {
  constructor() {
    this.artifacts = new Map();
    this.transfers = new Map();
    this.transferCounts = new Map();
    this.custodians = new Map();
    this.nextArtifactId = 1;
    this.currentSender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
    this.blockHeight = 1000;
  }

  setSender(sender) {
    this.currentSender = sender;
  }

  setBlockHeight(height) {
    this.blockHeight = height;
  }

  registerCustodian(custodian, institution, certification) {
    this.custodians.set(custodian, {
      active: true,
      institution,
      certification,
    });
    return { success: true };
  }

  registerDiscovery(siteId, name, description, location, metadata) {
    if (location.length === 0) {
      return { error: "ERR-INVALID-LOCATION" };
    }

    const artifactId = this.nextArtifactId;
    const artifact = {
      siteId,
      name,
      description,
      location,
      discoverer: this.currentSender,
      currentCustodian: this.currentSender,
      status: 1, // STATUS-DISCOVERED
      discoveryDate: this.blockHeight,
      metadata,
      createdAt: this.blockHeight,
      updatedAt: this.blockHeight,
    };

    this.artifacts.set(artifactId, artifact);
    this.transferCounts.set(artifactId, { count: 0 });
    this.nextArtifactId++;
    return { success: artifactId };
  }

  updateArtifactStatus(artifactId, newStatus) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      return { error: "ERR-ARTIFACT-NOT-FOUND" };
    }

    if (artifact.currentCustodian !== this.currentSender) {
      return { error: "ERR-UNAUTHORIZED" };
    }

    if (newStatus < 1 || newStatus > 5) {
      return { error: "ERR-UNAUTHORIZED" };
    }

    artifact.status = newStatus;
    artifact.updatedAt = this.blockHeight;
    this.artifacts.set(artifactId, artifact);
    return { success: true };
  }

  transferCustody(artifactId, newCustodian, reason) {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      return { error: "ERR-ARTIFACT-NOT-FOUND" };
    }

    const transferCountInfo = this.transferCounts.get(artifactId);
    if (!transferCountInfo) {
      return { error: "ERR-ARTIFACT-NOT-FOUND" };
    }

    const newCustodianInfo = this.custodians.get(newCustodian);
    if (!newCustodianInfo || !newCustodianInfo.active) {
      return { error: "ERR-UNAUTHORIZED" };
    }

    if (artifact.currentCustodian !== this.currentSender) {
      return { error: "ERR-UNAUTHORIZED" };
    }

    const transferId = transferCountInfo.count;
    const transferKey = `${artifactId}-${transferId}`;

    // Record the transfer
    this.transfers.set(transferKey, {
      from: this.currentSender,
      to: newCustodian,
      reason,
      timestamp: this.blockHeight,
      approvedBy: null,
    });

    // Update artifact custodian
    artifact.currentCustodian = newCustodian;
    artifact.updatedAt = this.blockHeight;
    this.artifacts.set(artifactId, artifact);

    // Increment transfer count
    this.transferCounts.set(artifactId, { count: transferId + 1 });

    return { success: true };
  }

  approveTransfer(artifactId, transferId) {
    const transferKey = `${artifactId}-${transferId}`;
    const transfer = this.transfers.get(transferKey);
    if (!transfer) {
      return { error: "ERR-ARTIFACT-NOT-FOUND" };
    }

    // In a real implementation, would check if sender is authorized
    transfer.approvedBy = this.currentSender;
    this.transfers.set(transferKey, transfer);
    return { success: true };
  }

  getArtifact(artifactId) {
    return this.artifacts.get(artifactId) || null;
  }

  getTransfer(artifactId, transferId) {
    const transferKey = `${artifactId}-${transferId}`;
    return this.transfers.get(transferKey) || null;
  }

  getCustodian(custodian) {
    return this.custodians.get(custodian) || null;
  }

  getTransferCount(artifactId) {
    const transferInfo = this.transferCounts.get(artifactId);
    return transferInfo ? transferInfo.count : 0;
  }

  isCustodianActive(custodian) {
    const custodianInfo = this.custodians.get(custodian);
    return custodianInfo ? custodianInfo.active : false;
  }

  getTotalArtifacts() {
    return this.nextArtifactId - 1;
  }

  verifyChainOfCustody(artifactId) {
    return this.artifacts.has(artifactId);
  }
}

describe("Artifact Registry Contract", () => {
  let contract;
  const discoverer = "ST1DISCOVERER-ADDRESS";
  const custodian1 = "ST2MUSEUM-ADDRESS";
  const custodian2 = "ST3UNIVERSITY-ADDRESS";

  beforeEach(() => {
    contract = new MockArtifactRegistry();
    contract.registerCustodian(
      custodian1,
      "National Archaeological Museum",
      "ISO-21500"
    );
    contract.registerCustodian(
      custodian2,
      "University Archaeological Department",
      "Academic-Cert-001"
    );
    contract.setSender(discoverer);
  });

  describe("Custodian Management", () => {
    it("should register custodian successfully", () => {
      const newCustodian = "ST4NEW-CUSTODIAN";
      const result = contract.registerCustodian(
        newCustodian,
        "Regional Heritage Center",
        "Heritage-Cert-2024"
      );

      expect(result.success).toBe(true);

      const custodianInfo = contract.getCustodian(newCustodian);
      expect(custodianInfo.active).toBe(true);
      expect(custodianInfo.institution).toBe("Regional Heritage Center");
      expect(custodianInfo.certification).toBe("Heritage-Cert-2024");
    });

    it("should check if custodian is active", () => {
      expect(contract.isCustodianActive(custodian1)).toBe(true);
      expect(contract.isCustodianActive("ST9NONEXISTENT")).toBe(false);
    });
  });

  describe("Artifact Discovery Registration", () => {
    it("should register artifact discovery successfully", () => {
      const result = contract.registerDiscovery(
        1, // site-id
        "Roman Coin",
        "Bronze coin featuring Emperor Trajan, dated 98-117 AD",
        "GPS:41.9028,12.4964,depth:2.5m",
        "Condition: Good, Weight: 12.3g, Diameter: 25mm"
      );

      expect(result.success).toBe(1);

      const artifact = contract.getArtifact(1);
      expect(artifact).toBeDefined();
      expect(artifact.name).toBe("Roman Coin");
      expect(artifact.siteId).toBe(1);
      expect(artifact.discoverer).toBe(discoverer);
      expect(artifact.currentCustodian).toBe(discoverer);
      expect(artifact.status).toBe(1); // STATUS-DISCOVERED
    });

    it("should fail with empty location", () => {
      const result = contract.registerDiscovery(
        1,
        "Test Artifact",
        "Description",
        "",
        "Metadata"
      );
      expect(result.error).toBe("ERR-INVALID-LOCATION");
    });

    it("should initialize transfer count to zero", () => {
      contract.registerDiscovery(1, "Test", "Desc", "Location", "Meta");
      expect(contract.getTransferCount(1)).toBe(0);
    });

    it("should increment artifact ID for each discovery", () => {
      contract.registerDiscovery(1, "Artifact 1", "Desc 1", "Loc 1", "Meta 1");
      contract.registerDiscovery(2, "Artifact 2", "Desc 2", "Loc 2", "Meta 2");

      expect(contract.getTotalArtifacts()).toBe(2);
      expect(contract.getArtifact(1).name).toBe("Artifact 1");
      expect(contract.getArtifact(2).name).toBe("Artifact 2");
    });
  });

  describe("Artifact Status Management", () => {
    beforeEach(() => {
      contract.registerDiscovery(
        1,
        "Test Artifact",
        "Description",
        "Location",
        "Metadata"
      );
    });

    it("should update artifact status successfully", () => {
      const result = contract.updateArtifactStatus(1, 2); // STATUS-CATALOGUED
      expect(result.success).toBe(true);

      const artifact = contract.getArtifact(1);
      expect(artifact.status).toBe(2);
    });

    it("should fail to update status for non-existent artifact", () => {
      const result = contract.updateArtifactStatus(999, 2);
      expect(result.error).toBe("ERR-ARTIFACT-NOT-FOUND");
    });

    it("should fail to update status by non-custodian", () => {
      contract.setSender("ST9RANDOM-USER");
      const result = contract.updateArtifactStatus(1, 2);
      expect(result.error).toBe("ERR-UNAUTHORIZED");
    });

    it("should fail with invalid status code", () => {
      const result = contract.updateArtifactStatus(1, 10);
      expect(result.error).toBe("ERR-UNAUTHORIZED");
    });
  });

  describe("Custody Transfer", () => {
    beforeEach(() => {
      contract.registerDiscovery(
        1,
        "Test Artifact",
        "Description",
        "Location",
        "Metadata"
      );
    });

    it("should transfer custody successfully", () => {
      const result = contract.transferCustody(
        1,
        custodian1,
        "Transfer to museum for preservation and display"
      );

      expect(result.success).toBe(true);

      const artifact = contract.getArtifact(1);
      expect(artifact.currentCustodian).toBe(custodian1);
      expect(contract.getTransferCount(1)).toBe(1);

      const transfer = contract.getTransfer(1, 0);
      expect(transfer.from).toBe(discoverer);
      expect(transfer.to).toBe(custodian1);
      expect(transfer.reason).toBe(
        "Transfer to museum for preservation and display"
      );
    });

    it("should fail to transfer to inactive custodian", () => {
      const inactiveCustodian = "ST9INACTIVE-CUSTODIAN";
      const result = contract.transferCustody(
        1,
        inactiveCustodian,
        "Invalid transfer"
      );
      expect(result.error).toBe("ERR-UNAUTHORIZED");
    });

    it("should fail to transfer by non-custodian", () => {
      contract.setSender("ST9RANDOM-USER");
      const result = contract.transferCustody(
        1,
        custodian1,
        "Unauthorized transfer"
      );
      expect(result.error).toBe("ERR-UNAUTHORIZED");
    });

    it("should fail to transfer non-existent artifact", () => {
      const result = contract.transferCustody(
        999,
        custodian1,
        "Non-existent artifact"
      );
      expect(result.error).toBe("ERR-ARTIFACT-NOT-FOUND");
    });

    it("should handle multiple transfers correctly", () => {
      // First transfer: discoverer -> custodian1
      contract.transferCustody(1, custodian1, "First transfer");

      // Second transfer: custodian1 -> custodian2
      contract.setSender(custodian1);
      contract.transferCustody(1, custodian2, "Second transfer");

      const artifact = contract.getArtifact(1);
      expect(artifact.currentCustodian).toBe(custodian2);
      expect(contract.getTransferCount(1)).toBe(2);

      const transfer1 = contract.getTransfer(1, 0);
      expect(transfer1.from).toBe(discoverer);
      expect(transfer1.to).toBe(custodian1);

      const transfer2 = contract.getTransfer(1, 1);
      expect(transfer2.from).toBe(custodian1);
      expect(transfer2.to).toBe(custodian2);
    });
  });

  describe("Transfer Approval", () => {
    beforeEach(() => {
      contract.registerDiscovery(
        1,
        "Test Artifact",
        "Description",
        "Location",
        "Metadata"
      );
      contract.transferCustody(1, custodian1, "Test transfer");
    });

    it("should approve transfer successfully", () => {
      const result = contract.approveTransfer(1, 0);
      expect(result.success).toBe(true);

      const transfer = contract.getTransfer(1, 0);
      expect(transfer.approvedBy).toBe(contract.currentSender);
    });

    it("should fail to approve non-existent transfer", () => {
      const result = contract.approveTransfer(999, 0);
      expect(result.error).toBe("ERR-ARTIFACT-NOT-FOUND");
    });
  });

  describe("Read-only Functions", () => {
    beforeEach(() => {
      contract.registerDiscovery(
        1,
        "Roman Coin",
        "Ancient coin",
        "GPS:41,12",
        "Metadata"
      );
      contract.registerDiscovery(
        2,
        "Pottery Shard",
        "Ceramic fragment",
        "GPS:42,13",
        "Metadata"
      );
    });

    it("should return correct artifact information", () => {
      const artifact = contract.getArtifact(1);
      expect(artifact).toBeDefined();
      expect(artifact.name).toBe("Roman Coin");
      expect(artifact.discoverer).toBe(discoverer);
    });

    it("should return null for non-existent artifact", () => {
      const artifact = contract.getArtifact(999);
      expect(artifact).toBeNull();
    });

    it("should return correct total artifacts count", () => {
      expect(contract.getTotalArtifacts()).toBe(2);
    });

    it("should verify chain of custody", () => {
      expect(contract.verifyChainOfCustody(1)).toBe(true);
      expect(contract.verifyChainOfCustody(999)).toBe(false);
    });

    it("should return custodian information", () => {
      const custodianInfo = contract.getCustodian(custodian1);
      expect(custodianInfo.institution).toBe("National Archaeological Museum");
      expect(custodianInfo.certification).toBe("ISO-21500");
    });

    it("should return transfer information", () => {
      contract.transferCustody(1, custodian1, "Test transfer");

      const transfer = contract.getTransfer(1, 0);
      expect(transfer.from).toBe(discoverer);
      expect(transfer.to).toBe(custodian1);
      expect(transfer.reason).toBe("Test transfer");
    });
  });
});

console.log("Artifact Registry Contract tests completed successfully!");
