export const ELIGIBILITY_RULES = {
  strict_rules: {
    fullName: {
      required: true,
      minLength: 2,
      pattern: /^[a-zA-Z\s]+$/,
      errorMessage: 'Enter a valid full name as per official documents.'
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      errorMessage: 'Enter a valid email address.'
    },
    phone: {
      required: true,
      pattern: /^[6-9]\d{9}$/,
      errorMessage: 'Enter a valid 10-digit Indian mobile number.'
    },
    aadhaar: {
      required: true,
      length: 12,
      pattern: /^\d{12}$/,
      errorMessage: 'Aadhaar number must be a 12-digit numeric value.'
    },
    qualification: {
      required: true,
      allowed: ['B.Tech', 'B.E.', 'B.Sc', 'BCA', 'M.Tech', 'M.Sc', 'MCA', 'MBA'],
      errorMessage: 'Select a highest qualification from the list.'
    },
    interviewStatus: {
      allowedValues: ['Cleared', 'Waitlisted', 'Rejected'],
      blockedValue: 'Rejected',
      errorMessage: 'Candidates marked as Rejected are not eligible to proceed further.'
    },
    offerSent: {
      blockingValue: 'Yes',
      allowedInterviewStatuses: ['Cleared', 'Waitlisted'],
      errorMessage: 'Offer letter can only be sent after interview clearance or waitlisting.'
    }
  },
  soft_rules: {
    age: {
      min: 18,
      max: 35,
      errorMessage: 'Candidate falls outside the standard age eligibility range. Exception may be required.'
    },
    graduationYear: {
      min: 2015,
      max: 2025,
      errorMessage: 'Graduation year is outside the standard eligibility window. Exception may be required.'
    },
    percentage: {
      min: 60,
      errorMessage: 'Academic score is below the standard cutoff. Exception may be required.'
    },
    cgpa: {
      min: 6.0,
      max: 10.0,
      errorMessage: 'Academic score is below the standard cutoff. Exception may be required.'
    },
    screeningScore: {
      min: 40,
      max: 100,
      errorMessage: 'Screening score is below the standard cutoff. Exception may be required.'
    }
  },
  exception_policy: {
    maxExceptions: 2,
    rationaleMinLength: 30,
    rationaleKeywords: [
      'experience', 'background', 'referral', 'recommendation', 'work', 
      'academic', 'profile', 'institution', 'performance', 'exception'
    ],
    managerReviewMessage: 'Manager review required due to multiple eligibility exceptions.'
  }
};
