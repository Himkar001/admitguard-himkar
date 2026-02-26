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

## Sprint 3 

- **Goal:** Deploy the working application and prepare it for evaluation and sharing
- **Done:**
  - Integrated frontend application exported from Google AI Studio
  - Verified local build and development server using Vite
  - Deployed AdmitGuard as a live client-side application on Vercel
  - Enabled CSV and JSON export of audit logs
- **Blockers:** 
  - Initial difficulty locating export option in AI Studio; resolved by using download feature
- **Key Decisions:**
  - Chose Vercel over GitHub Pages for faster deployment and a more professional presentation
  - Deferred README deployment updates to Sprint 4 to avoid fragmenting Sprint 3 commits
- **Outcome:** 
  - AdmitGuard is accessible via a public URL and fully functional in a deployed environment

---

## Sprint 4 

- **Goal:** Make the project evaluator-ready through clear documentation 
- **Done:**
  - Updated README with live deployment link and local run instructions
  - Added screenshots demonstrating form validation, exception handling, evaluation result, and audit log
  - Created architecture documentation explaining data flow, rules engine, and audit design
  - Prepared a structured presentation deck outlining the business problem, solution, and impact
- **Blockers:** None
- **Key Decisions:**
  - Focused Sprint 4 strictly on documentation and communication, with no code or UI changes
  - Used screenshots and demo flow to reduce the need for live explanation during evaluation
- **Outcome:** 
  - Project is fully documented, easy to understand, and ready for review, demo, or interview discussion