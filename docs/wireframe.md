# AdmitGuard — Wireframe (Sprint 1)

## Screen 1: Candidate Eligibility Form

--------------------------------------------------
AdmitGuard — Candidate Eligibility Form
--------------------------------------------------

[ Full Name ]
- Inline validation: required, min 2 chars, alphabets only

[ Email Address ]
- Inline validation: valid format
- Inline validation: must be unique

[ Phone Number ]
- Inline validation: 10-digit Indian number

[ Date of Birth ]
- Inline validation: age 18–35
- If violated → Exception Allowed (toggle appears)

[ Highest Qualification ]
- Dropdown (B.Tech, B.E, B.Sc, BCA, M.Tech, M.Sc, MCA, MBA)

[ Graduation Year ]
- Inline validation: 2015–2025
- If violated → Exception Allowed (toggle appears)

[ Percentage / CGPA ]
- Radio: Percentage | CGPA
- Value input
- Inline validation based on type
- If violated → Exception Allowed (toggle appears)

[ Screening Test Score ]
- Inline validation: ≥ 40
- If violated → Exception Allowed (toggle appears)

[ Interview Status ]
- Dropdown: Cleared | Waitlisted | Rejected
- If Rejected → Hard block submission

[ Aadhaar Number ]
- Inline validation: exactly 12 digits

[ Offer Letter Sent ]
- Radio: Yes | No
- If Yes → Interview must be Cleared/Waitlisted

--------------------------------------------------
Eligibility Status Indicator
- Eligible (Green)
- Exception Required (Amber)
- Blocked (Red)

Exception Count: X / 2
--------------------------------------------------

[ Exception Rationale Box ]
- Visible only if exceptions enabled
- Minimum length enforced
- Keyword guidance shown

[ Submit Button ]
- Disabled until:
  - All strict rules pass
  - Exceptions (if any) have rationale
--------------------------------------------------


## Screen 2: Submission Success Screen

------------------------------------
Submission Successful ✅
------------------------------------

Candidate Summary:
- Name
- Email
- Eligibility Status

Exceptions Applied (if any):
- Rule violated
- Rationale provided

Audit Reference ID: AG-XXXX

[ Back to Form ]
------------------------------------


## Screen 3: Audit Log (Optional View)

--------------------------------------------------
Audit Log
--------------------------------------------------
| Timestamp | Name | Status | Exceptions | Review |
--------------------------------------------------
| 10:12 AM  | A.B. | OK     | 0          | -      |
| 10:25 AM  | C.D. | WARN   | 3          | Yes ⚠ |
--------------------------------------------------