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