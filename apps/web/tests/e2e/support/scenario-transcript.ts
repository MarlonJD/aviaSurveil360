import { expect } from "@playwright/test";

export interface CanonicalScenarioTranscript {
  auditId: string;
  questionId: string;
  potentialFindingId: string;
  findingNumber: string;
  afterConversion: string;
  afterCapSubmission: string;
  afterCapAcceptance: string;
  afterPartialClose: string;
  afterNotClose: string;
  afterEvidenceClose: string;
  closureBasis: string;
  evidenceVersions: number;
  reportStatus: string;
  reportFindingStatus: string;
  managerClosedFindings: number;
  auditeeForbiddenDataPresent: boolean;
}

export function expectCanonicalScenarioTranscript(transcript: CanonicalScenarioTranscript): void {
  expect(transcript).toEqual({
    auditId: "AUD-2026-001",
    questionId: "CAB-EMEQ-PBE-001",
    potentialFindingId: "PF-2026-001",
    findingNumber: "CAB-2026-001",
    afterConversion: "WAITING_FOR_CAP",
    afterCapSubmission: "CAP_SUBMITTED",
    afterCapAcceptance: "EVIDENCE_REQUIRED",
    afterPartialClose: "EVIDENCE_MORE_INFORMATION_REQUESTED",
    afterNotClose: "EVIDENCE_MORE_INFORMATION_REQUESTED",
    afterEvidenceClose: "CLOSED",
    closureBasis: "EVIDENCE_VERIFIED",
    evidenceVersions: 3,
    reportStatus: "LOCKED",
    reportFindingStatus: "EVIDENCE_REQUIRED",
    managerClosedFindings: 1,
    auditeeForbiddenDataPresent: false,
  });
}
