# Lab 7.4 Retrospective

**Project:** Macau678 Purchase Approval System  
**Date:** 2026-11-27  
**Team:** Macau678 Engineering Team (`bravefe` & `SaintCrois`)  

---

### 1. What helped the maintenance work?
Having comprehensive contract-first documentation (Lab 7.1 change impact analysis) and existing integration tests (`TEST-INT-07`) in place clearly defined the exact state-machine boundaries and API contracts before touching any implementation code. This allowed us to immediately detect the intended behavioral difference (HTTP 409 versus HTTP 200) via automated runners without guesswork.

### 2. What made the maintenance work difficult?
Shared test fixture coupling caused unexpected false-positive failures during test execution: multiple test cases previously asserted against the same seeded pending request record, so state modifications in one test unexpectedly broke downstream assertions in another. This required diagnosing and merging a separate fixture isolation fix (PR #71) before the maintenance feature could cleanly integrate.

### 3. What will the team change before Final Delivery?
Before Final Delivery, the team will refactor test data setup across all integration suites so that every test case generates an isolated, ephemeral request fixture with a distinct ID, eliminating test pollution. Additionally, we will incorporate automated Playwright E2E checks directly into the GitHub Actions pull-request gate to catch regression issues prior to branch merge rather than relying on manual post-merge execution.
