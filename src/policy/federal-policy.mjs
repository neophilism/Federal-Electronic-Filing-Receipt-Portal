/** Versioned portal policy; never an assertion that draft legislation is enacted. */
export function federalPrototypePolicy() {
  return Object.freeze({
    schemaVersion: 1, policyId: "ufr-federal-prototype-v1",
    authority: "prototype-only", filingsAccepted: false,
    governmentReceiptVerified: false, classifiedContentAccepted: false,
    authoritativeDeadlineComputation: false,
    agencyDirectoryGrantsFilingAuthority: false,
  });
}
