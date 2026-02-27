Refactor eligibility rules to be configuration-driven.

Requirements:
- Store rule thresholds (age limits, CGPA, percentage, score, exception count) in a configuration object.
- Validation logic should read from this configuration rather than hardcoded values.
- Make the system resilient to future rule changes.

Do not expose configuration editing in the UI yet.