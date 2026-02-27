Add strict validation rules to the eligibility form.

Strict rules:
- Full name must be non-empty, alphabetic, and minimum 2 characters.
- Email must be valid and unique.
- Phone number must be a valid 10-digit Indian mobile number.
- Aadhaar number must be exactly 12 digits.
- Interview status must be one of: Cleared, Waitlisted, Rejected.
- If interview status is Rejected, block submission entirely.
- Offer letter cannot be marked "Yes" unless interview status is Cleared or Waitlisted.

Behavior:
- Validation should occur in real time.
- Violations must block form submission with clear, human-readable messages.