# AdmitGuard

AdmitGuard is a lightweight eligibility validation system that prevents ineligible candidates from progressing through advanced admission stages.

## Problem
Manual data entry and complex eligibility rules cause ineligible candidates to be identified too late in the admission pipeline, wasting operational effort and damaging candidate experience.

## Solution
AdmitGuard enforces eligibility rules at the point of data entry using real-time validation, structured exception handling, and a full audit trail.

## Constraints
- No backend server
- Config-driven eligibility rules
- Built using Google AI Studio (Vibe Coding)

This repository follows a sprint-based development approach.

## Wireframes (Sprint 1)

Low-fidelity wireframes created to validate UX and rule enforcement before coding.

Screens included:
- **Candidate Eligibility Form** — inline validation, strict vs soft rules
- **Submission Success Screen** — candidate summary + audit reference
- **Exception Handling View** — rationale capture and exception count
- **Audit Log View** — submission history and manager review flags

Screenshots available in `/docs`:
- wireframe-1-form.png
- wireframe-2-success.png
- wireframe-3-exceptions.png
- wireframe-4-audit.png

## Core Functionality (Sprint 2)

AdmitGuard currently functions as a complete eligibility evaluation gate with governance and auditability.

### Eligibility Evaluation
- Real-time field-level validation during data entry
- Strict rules block progression immediately with clear messages
- Soft rule violations require explicit exception handling

### Exception Handling
- Per-rule exception overrides for soft eligibility violations
- Mandatory, quality-enforced rationale for every exception
- Automatic exception counting with manager review flag when limits are exceeded

### Config-Driven Rules
- All eligibility rules and thresholds are defined in a centralized configuration
- Rule updates do not require UI or logic changes

### Audit Trail
- Every eligibility evaluation is recorded with:
  - Timestamp
  - Candidate details
  - Eligibility outcome
  - Exceptions applied with rationale
  - Governance flags
- Audit data is stored client-side for the prototype and can be cleared explicitly

### Scope Clarification
- The system focuses strictly on eligibility validation and audit readiness

## Live Deployment (Sprint 3)

The AdmitGuard application is deployed as a client-side web application.

🔗 **Live URL:**  
https://admitguard-himkar.vercel.app/

> Note: The application runs entirely on the client side. No backend services are used in this prototype.

---

## Running the Project Locally

To run the project locally:

```bash
npm install
npm run dev

## How to Use AdmitGuard (Demo Flow)

1. Enter candidate details in the eligibility form.
2. Strict rule violations will block progression immediately with clear messages.
3. Soft rule violations can be overridden using structured exception toggles.
4. Provide a professional rationale for every exception (quality enforced).
5. Evaluate eligibility to view the final decision.
6. Review the audit log to see all recorded evaluations with governance flags.
7. Export audit data as CSV or JSON if required.

---

## Scope & Design Decisions

- The system is intentionally client-side to enable rapid prototyping and easy sharing.
- All eligibility rules are config-driven and not hardcoded in UI logic.
- Strict rules enforce hard eligibility blocks; soft rules allow governed exceptions.
- Exceptions require structured, quality-validated rationale.
- Audit records are immutable once created.
- Save Draft and PDF export features were intentionally excluded to maintain scope discipline.

---

## Documentation & Artifacts

- **Architecture Overview:** `docs/architecture.md`
- **Presentation Deck:** `docs/presentation.pdf`
- **Rule Configuration:** `config/rules.json`
- **Sprint Log:** `sprint-log.md`

## Advanced Governance Features (Sprint 5)

### Rules Configuration Console
AdmitGuard includes a Rules Configuration page that allows operations teams to modify eligibility thresholds without changing application code.

Configurable parameters include:
- Minimum and maximum age limits
- Percentage and CGPA thresholds
- Screening test score limits
- Graduation year range
- Maximum allowed exceptions per candidate

All changes are validated, persisted client-side, and apply only to future eligibility evaluations. Core rule logic and strict vs soft classifications remain unchanged.

---

### Audit Dashboard
The Audit Log view includes a summary dashboard that provides operational visibility into eligibility decisions.

The dashboard displays:
- Total evaluations
- Eligible candidates
- Eligible with exceptions
- Blocked / rejected candidates
- Manager review required count
- Exception usage rate

All metrics are derived dynamically from existing audit records and are read-only.

---

### Enhanced CSV Export
Audit data can be exported as a comprehensive CSV file suitable for operational review and compliance reporting.

Each export includes:
- Complete candidate input details
- Academic and assessment data
- Final eligibility outcome
- Exception rules and rationales
- Governance flags and timestamps

The export reflects the audit log exactly and does not modify stored records.