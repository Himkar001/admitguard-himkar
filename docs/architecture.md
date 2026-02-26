# AdmitGuard — Architecture Overview

## 1. High-Level Design

AdmitGuard is a lightweight, client-side eligibility evaluation system designed for admissions operations teams.

The application intentionally avoids backend infrastructure and databases for the prototype phase. All logic, validation, and persistence are handled on the client side.

Key design goals:
- Early eligibility validation to prevent downstream operational waste
- Clear separation between strict rules and soft (exception-allowed) rules
- Full auditability of eligibility decisions
- Config-driven rule management

---

## 2. Core Components

### 2.1 Eligibility Form
- Single-page form capturing all candidate details
- Real-time field-level validation
- Structured grouping of identity, academic, and assessment information

### 2.2 Rules Engine
- Centralized configuration defines all eligibility rules
- Supports:
  - Strict rules (hard blocks)
  - Soft rules (exception-allowed)
  - Dependency rules (e.g., offer letter vs interview status)
- Validation logic reads thresholds and constraints directly from config

### 2.3 Exception Handling
- Soft rule violations trigger exception eligibility
- Each exception requires:
  - Explicit override toggle
  - Quality-enforced rationale
- Exception count is tracked per candidate
- Entries exceeding the exception limit are flagged for manager review

### 2.4 Eligibility Evaluation
- Evaluation occurs only when:
  - All strict rules pass
  - All soft rule violations are either resolved or overridden with rationale
- Final eligibility states:
  - Eligible
  - Eligible with Exceptions
  - Blocked

---

## 3. Audit & Governance Layer

### 3.1 Audit Log
- Every eligibility evaluation generates an immutable audit record
- Each record includes:
  - Timestamp
  - Candidate identifiers
  - Eligibility outcome
  - Soft rule violations
  - Exception details and rationale
  - Governance flags (manager review required)

### 3.2 Persistence
- Audit records are stored in client-side storage (localStorage)
- Records persist across page refreshes
- Clear-history action explicitly removes audit data when required

---

## 4. Data Flow Summary

1. User enters candidate data
2. Strict rules validate fields in real time
3. Soft rules detect eligibility deviations
4. Exceptions (if any) are explicitly justified
5. Eligibility evaluation is executed
6. Audit record is created and stored
7. Audit log supports review and export (CSV/JSON)

---

## 5. Rationale for Client-Side Architecture

For the prototype phase:
- No backend reduces setup complexity
- Enables rapid iteration with operations teams
- Keeps focus on eligibility logic and governance

The architecture can later be extended with:
- Backend APIs
- Authentication
- Role-based approvals
- Centralized databases

---

## 6. Non-Goals (Intentional Exclusions)

- No authentication or user roles
- No automatic approvals
- No backend persistence
- No draft saving or PDF exports

These were intentionally excluded to maintain scope discipline.