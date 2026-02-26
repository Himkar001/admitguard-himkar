# Sprint Log — AdmitGuard

## Sprint 0 
- **Goal:** Understand the admission eligibility problem, plan solution approach, set up repository
- **Done:** Repository initialized with planned folder structure and documentation files
- **Research:** Initial exploration of Google AI Studio (Vibe Coding) concepts
- **Blockers:** None
- **Key Decision:** Chose a single-page form with real-time validation instead of a multi-step wizard for faster data entry and fewer errors
- **Prompts Drafted:** None yet

## Sprint 1 
- **Goal:** Design UX and validation flow for AdmitGuard
- **Done:** Created low-fidelity wireframes for form, exceptions, success, and audit views
- **Key Decision:** Single-page form with inline validation instead of multi-step wizard
- **Blockers:** None
- **Artifacts:** docs/wireframe-1-form.png, wireframe-2-success.png, wireframe-3-exceptions.png, wireframe-4-audit.png

## Sprint 2 
- **Goal:** Implement complete eligibility evaluation logic with governance
- **Done:**
  - Real-time strict and soft rule validation
  - Exception handling with rationale quality enforcement
  - Config-driven eligibility rules
  - Eligibility summary and submission success screen
  - Client-side audit log with persistence and clear-history control
- **Key Decisions:**
  - Enforced keyword-based rationale validation for audit readiness
- **Blockers:** None
- **Outcome:** AdmitGuard functions as a complete eligibility gate with audit trail