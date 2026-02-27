import { useState, useEffect } from 'react';
import { 
  User, 
  GraduationCap, 
  ClipboardCheck, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Calendar, 
  Hash,
  CheckCircle2,
  Clock,
  ChevronDown,
  Info,
  AlertCircle,
  FileText,
  XCircle,
  History,
  ArrowLeft,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  FileJson,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ELIGIBILITY_RULES } from './rulesConfig';

interface AuditRecord {
  id: string;
  timestamp: string;
  candidateName: string;
  candidateEmail: string;
  phone?: string;
  aadhaar?: string;
  dob?: string;
  age?: number;
  qualification?: string;
  gradYear?: string;
  scoreType?: 'Percentage' | 'CGPA';
  score?: string;
  testScore?: string;
  interviewStatus: string;
  offerSent?: string;
  outcome: 'Eligible' | 'Exception Approved' | 'Blocked';
  strictRuleResults: Record<string, string>;
  softRuleViolations: Record<string, string>;
  exceptionsUsed: number;
  overrides: Record<string, boolean>;
  rationale: string;
  managerReviewRequired: boolean;
}

export default function App() {
  const [view, setView] = useState<'form' | 'success' | 'logs' | 'config'>('form');
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [rules, setRules] = useState(ELIGIBILITY_RULES);
  const [configRules, setConfigRules] = useState(ELIGIBILITY_RULES);
  const [configErrors, setConfigErrors] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [currentEvaluation, setCurrentEvaluation] = useState<AuditRecord | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [scoreType, setScoreType] = useState<'Percentage' | 'CGPA'>('Percentage');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    aadhaar: '',
    qualification: '',
    gradYear: '',
    score: '',
    testScore: '',
    interviewStatus: '',
    offerSent: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [softErrors, setSoftErrors] = useState<Record<string, string>>({});
  const [rationaleError, setRationaleError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [rationale, setRationale] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validate = (data: typeof formData, currentOverrides: Record<string, boolean>, currentRationale: string) => {
    const newErrors: Record<string, string> = {};
    const newSoftErrors: Record<string, string> = {};
    const { strict_rules, soft_rules, exception_policy } = rules;

    // --- STRICT RULES ---
    if (data.fullName !== undefined) {
      const rule = strict_rules.fullName;
      if (!data.fullName || data.fullName.trim().length < rule.minLength || !rule.pattern.test(data.fullName)) {
        newErrors.fullName = rule.errorMessage;
      }
    }

    if (data.email !== undefined) {
      const rule = strict_rules.email;
      if (!data.email || !rule.pattern.test(data.email)) {
        newErrors.email = rule.errorMessage;
      }
    }

    if (data.phone !== undefined) {
      const rule = strict_rules.phone;
      if (!data.phone || !rule.pattern.test(data.phone)) {
        newErrors.phone = rule.errorMessage;
      }
    }

    if (data.aadhaar !== undefined) {
      const rule = strict_rules.aadhaar;
      if (!data.aadhaar || !rule.pattern.test(data.aadhaar)) {
        newErrors.aadhaar = rule.errorMessage;
      }
    }

    if (data.qualification !== undefined) {
      const rule = strict_rules.qualification;
      if (!data.qualification) {
        newErrors.qualification = rule.errorMessage;
      }
    }

    if (data.interviewStatus === strict_rules.interviewStatus.blockedValue) {
      newErrors.interviewStatus = strict_rules.interviewStatus.errorMessage;
    }

    if (data.offerSent === strict_rules.offerSent.blockingValue) {
      if (!strict_rules.offerSent.allowedInterviewStatuses.includes(data.interviewStatus)) {
        newErrors.offerSent = strict_rules.offerSent.errorMessage;
      }
    }

    // --- SOFT RULES ---
    if (data.dob) {
      const age = calculateAge(data.dob);
      const rule = soft_rules.age;
      if (age < rule.min || age > rule.max) {
        newSoftErrors.dob = rule.errorMessage;
      }
    }

    if (data.gradYear) {
      const year = parseInt(data.gradYear);
      const rule = soft_rules.graduationYear;
      if (year < rule.min || year > rule.max) {
        newSoftErrors.gradYear = rule.errorMessage;
      }
    }

    if (data.score) {
      const score = parseFloat(data.score);
      if (scoreType === 'Percentage') {
        if (score < soft_rules.percentage.min) {
          newSoftErrors.score = soft_rules.percentage.errorMessage;
        }
      } else if (scoreType === 'CGPA') {
        if (score < soft_rules.cgpa.min) {
          newSoftErrors.score = soft_rules.cgpa.errorMessage;
        }
      }
    }

    if (data.testScore) {
      const score = parseFloat(data.testScore);
      const rule = soft_rules.screeningScore;
      if (score < rule.min) {
        newSoftErrors.testScore = rule.errorMessage;
      }
    }

    setErrors(newErrors);
    setSoftErrors(newSoftErrors);

    // --- RATIONALE VALIDATION ---
    let currentRationaleError: string | null = null;
    const anyExceptionEnabled = Object.values(currentOverrides).some(v => v);
    
    if (anyExceptionEnabled) {
      const trimmedRationale = currentRationale.trim();
      if (trimmedRationale.length < exception_policy.rationaleMinLength) {
        currentRationaleError = `Rationale must be at least ${exception_policy.rationaleMinLength} characters long.`;
      } else {
        const hasKeyword = exception_policy.rationaleKeywords.some(keyword => 
          trimmedRationale.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasKeyword) {
          currentRationaleError = 'Rationale must include a clear professional justification (e.g., experience, academic background, referral).';
        }
      }
    }
    setRationaleError(currentRationaleError);

    // --- ELIGIBILITY GATE LOGIC ---
    const hasStrictErrors = Object.keys(newErrors).length > 0;
    const allRequiredFilled = data.fullName && data.email && data.phone && data.aadhaar && data.qualification;
    
    // Check if all soft rule violations have an enabled exception toggle
    const softRuleFields = Object.keys(newSoftErrors);
    const allSoftRulesOverridden = softRuleFields.every(field => currentOverrides[field]);
    
    const rationaleValid = !anyExceptionEnabled || !currentRationaleError;

    setIsFormValid(!hasStrictErrors && !!allRequiredFilled && allSoftRulesOverridden && rationaleValid);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    validate(newData, overrides, rationale);
  };

  const handleToggleOverride = (field: string) => {
    const newOverrides = { ...overrides, [field]: !overrides[field] };
    setOverrides(newOverrides);
    validate(formData, newOverrides, rationale);
  };

  const handleRationaleChange = (value: string) => {
    setRationale(value);
    validate(formData, overrides, value);
  };

  // Initial validation
  useEffect(() => {
    validate(formData, overrides, rationale);
  }, [scoreType, rules]);

  const exceptionsUsed = Object.values(overrides).filter(v => v).length;
  const anyExceptionEnabled = Object.values(overrides).some(v => v);

  useEffect(() => {
    const savedLogs = localStorage.getItem('admitguard_audit_logs');
    if (savedLogs) {
      try {
        setAuditLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error('Failed to parse audit logs', e);
      }
    }

    const savedRules = localStorage.getItem('admitguard_rules_config');
    if (savedRules) {
      try {
        const parsed = JSON.parse(savedRules);
        // Merge with default ELIGIBILITY_RULES to preserve RegExp objects in strict_rules
        const merged = {
          ...ELIGIBILITY_RULES,
          soft_rules: parsed.soft_rules || ELIGIBILITY_RULES.soft_rules,
          exception_policy: parsed.exception_policy || ELIGIBILITY_RULES.exception_policy
        };
        setRules(merged);
        setConfigRules(merged);
      } catch (e) {
        console.error('Failed to parse rules config', e);
      }
    }
  }, []);

  const handleSaveConfig = () => {
    const errors: Record<string, string> = {};
    
    if (configRules.soft_rules.percentage.min < 0 || configRules.soft_rules.percentage.min > 100) {
      errors.percentage = 'Percentage must be between 0 and 100.';
    }
    if (configRules.soft_rules.cgpa.min < 0 || configRules.soft_rules.cgpa.min > configRules.soft_rules.cgpa.max) {
      errors.cgpa = 'Min CGPA must be between 0 and Max CGPA.';
    }
    if (configRules.soft_rules.screeningScore.min < 0 || configRules.soft_rules.screeningScore.min > configRules.soft_rules.screeningScore.max) {
      errors.screeningScore = 'Min Screening Score must be between 0 and Max Screening Score.';
    }
    if (configRules.soft_rules.age.min < 0 || configRules.soft_rules.age.min > configRules.soft_rules.age.max) {
      errors.age = 'Min Age must be between 0 and Max Age.';
    }
    if (configRules.soft_rules.graduationYear.min > configRules.soft_rules.graduationYear.max) {
      errors.graduationYear = 'Start Year cannot be after End Year.';
    }

    if (Object.keys(errors).length > 0) {
      setConfigErrors(errors);
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    setTimeout(() => {
      localStorage.setItem('admitguard_rules_config', JSON.stringify(configRules));
      setRules(configRules);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const handleEvaluate = () => {
    if (!isFormValid) return;

    const outcome: 'Eligible' | 'Exception Approved' | 'Blocked' = 
      Object.keys(errors).length > 0 ? 'Blocked' : 
      exceptionsUsed > 0 ? 'Exception Approved' : 'Eligible';

    const newRecord: AuditRecord = {
      id: `AG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      }),
      candidateName: formData.fullName,
      candidateEmail: formData.email,
      phone: formData.phone,
      aadhaar: formData.aadhaar,
      dob: formData.dob,
      age: calculateAge(formData.dob),
      qualification: formData.qualification,
      gradYear: formData.gradYear,
      scoreType: scoreType,
      score: formData.score,
      testScore: formData.testScore,
      interviewStatus: formData.interviewStatus,
      offerSent: formData.offerSent,
      outcome,
      strictRuleResults: { ...errors },
      softRuleViolations: { ...softErrors },
      exceptionsUsed,
      overrides: { ...overrides },
      rationale,
      managerReviewRequired: exceptionsUsed > rules.exception_policy.maxExceptions
    };

    const updatedLogs = [newRecord, ...auditLogs];
    setAuditLogs(updatedLogs);
    localStorage.setItem('admitguard_audit_logs', JSON.stringify(updatedLogs));
    setCurrentEvaluation(newRecord);
    setView('success');
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      aadhaar: '',
      qualification: '',
      gradYear: '',
      score: '',
      testScore: '',
      interviewStatus: '',
      offerSent: '',
    });
    setErrors({});
    setSoftErrors({});
    setRationaleError(null);
    setOverrides({});
    setRationale('');
    setIsFormValid(false);
    setView('form');
  };

  const clearAuditHistory = () => {
    localStorage.removeItem('admitguard_audit_logs');
    setAuditLogs([]);
    setIsConfirmingClear(false);
    console.log('Audit history cleared successfully.');
  };

  const exportToCSV = () => {
    if (auditLogs.length === 0) return;
    
    const headers = [
      'Evaluation ID',
      'Timestamp',
      'Full Name',
      'Email',
      'Phone Number',
      'Aadhaar Number',
      'Date of Birth',
      'Age at Evaluation',
      'Highest Qualification',
      'Graduation Year',
      'Score Type',
      'Percentage Value',
      'CGPA Value',
      'Screening Test Score',
      'Interview Status',
      'Offer Letter Sent',
      'Final Eligibility Status',
      'Exception Count',
      'Manager Review Required',
      'Exception Rules Triggered',
      'Exception Rationales'
    ];

    const rows = auditLogs.map(log => {
      const exceptionRules = Object.entries(log.overrides || {})
        .filter(([_, value]) => value)
        .map(([key]) => {
          switch(key) {
            case 'dob': return 'Age Eligibility';
            case 'gradYear': return 'Graduation Year';
            case 'score': return 'Academic Score';
            case 'testScore': return 'Screening Score';
            default: return key;
          }
        })
        .join(', ');

      return [
        log.id || '',
        log.timestamp,
        log.candidateName,
        log.candidateEmail,
        log.phone || '',
        log.aadhaar || '',
        log.dob || '',
        (log.age !== undefined ? log.age : '').toString(),
        log.qualification || '',
        log.gradYear || '',
        log.scoreType || '',
        (log.scoreType === 'Percentage' ? log.score || '' : ''),
        (log.scoreType === 'CGPA' ? log.score || '' : ''),
        log.testScore || '',
        log.interviewStatus,
        log.offerSent || '',
        log.outcome === 'Exception Approved' ? 'Eligible with Exceptions' : log.outcome,
        log.exceptionsUsed.toString(),
        log.managerReviewRequired ? 'Yes' : 'No',
        exceptionRules,
        log.rationale || ''
      ];
    });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admitguard_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (auditLogs.length === 0) return;
    
    const exportData = auditLogs.map(log => ({
      timestamp: log.timestamp,
      candidateName: log.candidateName,
      email: log.candidateEmail,
      eligibilityOutcome: log.outcome === 'Exception Approved' ? 'Eligible with Exceptions' : log.outcome,
      exceptionsUsed: log.exceptionsUsed,
      managerReviewRequired: log.managerReviewRequired ? 'Yes' : 'No'
    }));
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `admitguard_audit_log_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Audit Dashboard Metrics
  const totalEvaluations = auditLogs.length;
  const eligibleCount = auditLogs.filter(log => log.outcome === 'Eligible').length;
  const exceptionCount = auditLogs.filter(log => log.outcome === 'Exception Approved').length;
  const blockedCount = auditLogs.filter(log => log.outcome === 'Blocked').length;
  const managerReviewCount = auditLogs.filter(log => log.managerReviewRequired).length;
  const exceptionRate = totalEvaluations > 0 
    ? ((auditLogs.filter(log => log.exceptionsUsed > 0).length / totalEvaluations) * 100).toFixed(1) 
    : '0.0';

  return (
    <div className="min-h-screen bg-page-bg text-slate-900 font-sans selection:bg-indigo-100">
      {/* Top Header Bar */}
      <div className="bg-header-bg text-white py-4 px-8 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Candidate Eligibility Evaluation</h1>
            <p className="text-xs text-white/60 font-medium">Systematic validation for IIT/IIM Admissions</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">Operations Portal</p>
              <p className="text-xs font-bold text-white/90">Session Active</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
              OP
            </div>
          </div>
        </div>
      </div>

      {/* Sub Header / Navigation */}
      <header className="bg-white border-b border-border-cool sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-primary">AdmitGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView(view === 'config' ? 'form' : 'config')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${view === 'config' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-border-cool text-primary hover:bg-slate-50'}`}
              title="Rules Configuration"
            >
              <Settings className="w-3 h-3" />
              {view === 'config' ? 'Close Config' : 'Rules Config'}
            </button>
            <button 
              onClick={() => view === 'logs' ? resetForm() : setView('logs')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-cool text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-slate-50 transition-all"
            >
              {view === 'logs' ? <ArrowLeft className="w-3 h-3" /> : <History className="w-3 h-3" />}
              {view === 'logs' ? 'Back to Form' : 'View Audit Log'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        {view === 'config' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Rules Configuration</h1>
                <p className="text-slate-500 mt-1">Adjust eligibility thresholds and exception policies.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveConfig}
                  disabled={saveStatus === 'saving'}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all ${saveStatus === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-primary shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                >
                  {saveStatus === 'saving' ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : saveStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Operational Warning</p>
                <p className="text-xs text-amber-700/80 mt-0.5">Changes affect all future eligibility evaluations. Existing audit records will remain unchanged for compliance integrity.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
              {/* Academic Rules */}
              <div className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">Academic Thresholds</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Minimum Percentage (%)</label>
                    <input 
                      type="number" 
                      value={configRules.soft_rules.percentage.min}
                      onChange={(e) => setConfigRules({
                        ...configRules,
                        soft_rules: {
                          ...configRules.soft_rules,
                          percentage: { ...configRules.soft_rules.percentage, min: Number(e.target.value) }
                        }
                      })}
                      className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all ${configErrors.percentage ? 'border-red-500' : 'border-border-cool'}`}
                    />
                    {configErrors.percentage && <p className="text-[10px] text-red-600 font-bold">{configErrors.percentage}</p>}
                    <p className="text-[10px] text-slate-400 italic">Standard cutoff for academic eligibility.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Min CGPA</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={configRules.soft_rules.cgpa.min}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            cgpa: { ...configRules.soft_rules.cgpa, min: Number(e.target.value) }
                          }
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all ${configErrors.cgpa ? 'border-red-500' : 'border-border-cool'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Max CGPA</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={configRules.soft_rules.cgpa.max}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            cgpa: { ...configRules.soft_rules.cgpa, max: Number(e.target.value) }
                          }
                        })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border-cool bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  {configErrors.cgpa && <p className="text-[10px] text-red-600 font-bold">{configErrors.cgpa}</p>}
                </div>
              </div>

              {/* Assessment Rules */}
              <div className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">Assessment Cutoffs</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Min Test Score</label>
                      <input 
                        type="number" 
                        value={configRules.soft_rules.screeningScore.min}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            screeningScore: { ...configRules.soft_rules.screeningScore, min: Number(e.target.value) }
                          }
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all ${configErrors.screeningScore ? 'border-red-500' : 'border-border-cool'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Max Test Score</label>
                      <input 
                        type="number" 
                        value={configRules.soft_rules.screeningScore.max}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            screeningScore: { ...configRules.soft_rules.screeningScore, max: Number(e.target.value) }
                          }
                        })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border-cool bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  {configErrors.screeningScore && <p className="text-[10px] text-red-600 font-bold">{configErrors.screeningScore}</p>}
                  <p className="text-[10px] text-slate-400 italic">Screening test performance requirements.</p>
                </div>
              </div>

              {/* Age & Graduation Rules */}
              <div className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                  <Calendar className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">Demographic & Timeline</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Min Age</label>
                      <input 
                        type="number" 
                        value={configRules.soft_rules.age.min}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            age: { ...configRules.soft_rules.age, min: Number(e.target.value) }
                          }
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all ${configErrors.age ? 'border-red-500' : 'border-border-cool'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Max Age</label>
                      <input 
                        type="number" 
                        value={configRules.soft_rules.age.max}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            age: { ...configRules.soft_rules.age, max: Number(e.target.value) }
                          }
                        })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border-cool bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  {configErrors.age && <p className="text-[10px] text-red-600 font-bold">{configErrors.age}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Start Year</label>
                      <input 
                        type="number" 
                        value={configRules.soft_rules.graduationYear.min}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            graduationYear: { ...configRules.soft_rules.graduationYear, min: Number(e.target.value) }
                          }
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all ${configErrors.graduationYear ? 'border-red-500' : 'border-border-cool'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">End Year</label>
                      <input 
                        type="number" 
                        value={configRules.soft_rules.graduationYear.max}
                        onChange={(e) => setConfigRules({
                          ...configRules,
                          soft_rules: {
                            ...configRules.soft_rules,
                            graduationYear: { ...configRules.soft_rules.graduationYear, max: Number(e.target.value) }
                          }
                        })}
                        className="w-full px-4 py-2.5 rounded-lg border border-border-cool bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                  {configErrors.graduationYear && <p className="text-[10px] text-red-600 font-bold">{configErrors.graduationYear}</p>}
                </div>
              </div>

              {/* Exception Policy */}
              <div className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">Exception Policy</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Max Exceptions Allowed</label>
                    <input 
                      type="number" 
                      value={configRules.exception_policy.maxExceptions}
                      onChange={(e) => setConfigRules({
                        ...configRules,
                        exception_policy: { ...configRules.exception_policy, maxExceptions: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-border-cool bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                    />
                    <p className="text-[10px] text-slate-400 italic">Maximum number of soft rule violations a candidate can override.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Min Rationale Length</label>
                    <input 
                      type="number" 
                      value={configRules.exception_policy.rationaleMinLength}
                      onChange={(e) => setConfigRules({
                        ...configRules,
                        exception_policy: { ...configRules.exception_policy, rationaleMinLength: Number(e.target.value) }
                      })}
                      className="w-full px-4 py-2.5 rounded-lg border border-border-cool bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
                    />
                    <p className="text-[10px] text-slate-400 italic">Minimum characters required for justification text.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : view === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Form Sections */}
            <div className="lg:col-span-8 space-y-10">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Hard Stop Banner for Rejected Status */}
              <AnimatePresence>
                {formData.interviewStatus === rules.strict_rules.interviewStatus.blockedValue && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl shadow-sm overflow-hidden"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-red-900 font-bold text-lg">Evaluation Blocked</h3>
                        <p className="text-red-700 mt-1 font-medium">
                          {rules.strict_rules.interviewStatus.errorMessage}
                        </p>
                        <p className="text-red-600/80 text-sm mt-2">
                          This is a system-enforced policy. Please contact the admissions committee if you believe this is an error.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-10">
                {/* Section 1: Candidate Identity Verification */}
                <section className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                    <User className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">1. Candidate Identity Verification</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Full Name</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${errors.fullName ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border-cool'}`}
                      />
                      {errors.fullName ? (
                        <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.fullName}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">As per official identification documents.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="email" 
                          id="email" 
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="rahul.s@example.com"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${errors.email ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border-cool'}`}
                        />
                      </div>
                      {errors.email ? (
                        <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Primary contact for all admission correspondence.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="text" 
                          id="phone" 
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${errors.phone ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border-cool'}`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="dob" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Date of Birth</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="date" 
                          id="dob" 
                          value={formData.dob}
                          onChange={(e) => handleChange('dob', e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all ${softErrors.dob ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-border-cool'}`}
                        />
                      </div>
                      {softErrors.dob && (
                        <div className="space-y-3 mt-2">
                          <p className="text-[11px] text-amber-700/80 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> {softErrors.dob}
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <input 
                              type="checkbox" 
                              checked={!!overrides.dob}
                              onChange={() => handleToggleOverride('dob')}
                              className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide group-hover:text-amber-800 transition-colors">Override with exception</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2 max-w-md">
                      <label htmlFor="aadhaar" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Aadhaar Number</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input 
                          type="text" 
                          id="aadhaar" 
                          value={formData.aadhaar}
                          onChange={(e) => handleChange('aadhaar', e.target.value)}
                          placeholder="XXXX XXXX XXXX"
                          className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${errors.aadhaar ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border-cool'}`}
                        />
                      </div>
                      {errors.aadhaar ? (
                        <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.aadhaar}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">12-digit unique identification number.</p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Section 2: Academic & Screening Performance */}
                <section className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">2. Academic & Screening Performance</h2>
                  </div>
                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label htmlFor="qualification" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Highest Qualification</label>
                      <div className="relative">
                        <select 
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => handleChange('qualification', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-lg border bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all text-slate-700 ${errors.qualification ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border-cool'}`}
                        >
                          <option value="">Select Qualification</option>
                          {rules.strict_rules.qualification.allowed.map(q => (
                            <option key={q} value={q}>{q}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      </div>
                      {errors.qualification && (
                        <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.qualification}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="gradYear" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Graduation Year</label>
                      <input 
                        type="number" 
                        id="gradYear" 
                        value={formData.gradYear}
                        onChange={(e) => handleChange('gradYear', e.target.value)}
                        placeholder="YYYY"
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${softErrors.gradYear ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-border-cool'}`}
                      />
                      {softErrors.gradYear && (
                        <div className="space-y-3 mt-2">
                          <p className="text-[11px] text-amber-700/80 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> {softErrors.gradYear}
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <input 
                              type="checkbox" 
                              checked={!!overrides.gradYear}
                              onChange={() => handleToggleOverride('gradYear')}
                              className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide group-hover:text-amber-800 transition-colors">Override with exception</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Percentage / CGPA</label>
                      <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                          <button 
                            onClick={() => setScoreType('Percentage')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${scoreType === 'Percentage' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                          >
                            Percentage
                          </button>
                          <button 
                            onClick={() => setScoreType('CGPA')}
                            className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${scoreType === 'CGPA' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-primary'}`}
                          >
                            CGPA
                          </button>
                        </div>
                        <div className="flex-1 max-w-[200px]">
                          <input 
                            type="number" 
                            step="0.01"
                            value={formData.score}
                            onChange={(e) => handleChange('score', e.target.value)}
                            placeholder={scoreType === 'Percentage' ? "e.g. 85.5" : "e.g. 9.2"}
                            className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${softErrors.score ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-border-cool'}`}
                          />
                        </div>
                      </div>
                      {softErrors.score ? (
                        <div className="space-y-3 mt-2">
                          <p className="text-[11px] text-amber-700/80 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> {softErrors.score}
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <input 
                              type="checkbox" 
                              checked={!!overrides.score}
                              onChange={() => handleToggleOverride('score')}
                              className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide group-hover:text-amber-800 transition-colors">Override with exception</span>
                          </label>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Enter the final score as mentioned in the degree certificate.</p>
                      )}
                    </div>
                  </div>
                </div>
                </section>

                {/* Section 3: Interview & Final Status */}
                <section className="bg-card-bg rounded-xl border border-border-cool shadow-sm overflow-hidden">
                  <div className="px-6 py-3.5 border-b border-slate-50 bg-white flex items-center gap-3 border-l-[5px] border-l-primary">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    <h2 className="font-bold text-primary uppercase tracking-wider text-[11px]">3. Interview & Final Status</h2>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-2">
                      <label htmlFor="testScore" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Screening Test Score</label>
                      <input 
                        type="number" 
                        id="testScore" 
                        value={formData.testScore}
                        onChange={(e) => handleChange('testScore', e.target.value)}
                        placeholder="Out of 100"
                        className={`w-full px-4 py-2.5 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all placeholder:text-slate-300 ${softErrors.testScore ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-border-cool'}`}
                      />
                      {softErrors.testScore ? (
                        <div className="space-y-3 mt-2">
                          <p className="text-[11px] text-amber-700/80 font-semibold flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> {softErrors.testScore}
                          </p>
                          <label className="flex items-center gap-2 cursor-pointer group w-fit">
                            <input 
                              type="checkbox" 
                              checked={!!overrides.testScore}
                              onChange={() => handleToggleOverride('testScore')}
                              className="w-3.5 h-3.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide group-hover:text-amber-800 transition-colors">Override with exception</span>
                          </label>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Consolidated score from the preliminary screening round.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="interviewStatus" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Interview Status</label>
                      <div className="relative">
                        <select 
                          id="interviewStatus"
                          value={formData.interviewStatus}
                          onChange={(e) => handleChange('interviewStatus', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-lg border bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all text-slate-700 ${errors.interviewStatus ? 'border-red-500 ring-1 ring-red-500/20' : 'border-border-cool'}`}
                        >
                          <option value="">Select Status</option>
                          {rules.strict_rules.interviewStatus.allowedValues.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      </div>
                      {errors.interviewStatus && (
                        <p className="text-[11px] text-red-700 font-bold flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {errors.interviewStatus}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4 md:col-span-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Offer Letter Sent</label>
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-8">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="radio" 
                                name="offerSent" 
                                value="Yes"
                                checked={formData.offerSent === 'Yes'}
                                onChange={(e) => handleChange('offerSent', e.target.value)}
                                className="peer sr-only" 
                              />
                              <div className="w-5 h-5 border-2 border-border-cool rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all"></div>
                              <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">Yes, dispatched</span>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                              <input 
                                type="radio" 
                                name="offerSent" 
                                value="No"
                                checked={formData.offerSent === 'No'}
                                onChange={(e) => handleChange('offerSent', e.target.value)}
                                className="peer sr-only" 
                              />
                              <div className="w-5 h-5 border-2 border-border-cool rounded-full peer-checked:border-primary peer-checked:bg-primary transition-all"></div>
                              <div className="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-all"></div>
                            </div>
                            <span className="text-sm font-medium text-slate-600 group-hover:text-primary transition-colors">No, pending</span>
                          </label>
                        </div>
                        {errors.offerSent && (
                          <div className="bg-red-50/50 border border-red-100 p-3 rounded-lg flex items-start gap-2 max-w-xl">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-700 font-semibold leading-relaxed">
                              {rules.strict_rules.offerSent.errorMessage}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Exception & Rationale Documentation */}
                <AnimatePresence>
                  {anyExceptionEnabled && (
                    <motion.section 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="bg-card-bg rounded-xl border border-amber-100 shadow-sm overflow-hidden"
                    >
                      <div className="px-6 py-3.5 border-b border-amber-50 bg-amber-50/30 flex items-center gap-3 border-l-[5px] border-l-amber-500">
                        <FileText className="w-4 h-4 text-amber-600" />
                        <h2 className="font-bold text-amber-800 uppercase tracking-wider text-[11px]">4. Exception & Rationale Documentation</h2>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="rationale" className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center justify-between">
                            <span>Justification for Overrides</span>
                            <span className={`text-[10px] ${rationale.trim().length >= rules.exception_policy.rationaleMinLength ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {rationale.trim().length} / {rules.exception_policy.rationaleMinLength} characters
                            </span>
                          </label>
                          <textarea 
                            id="rationale"
                            rows={4}
                            value={rationale}
                            onChange={(e) => handleRationaleChange(e.target.value)}
                            placeholder="Provide a clear justification for overriding the eligibility rule. This will be recorded for audit purposes."
                            className={`w-full px-4 py-3 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all placeholder:text-slate-300 text-sm leading-relaxed ${rationaleError ? 'border-red-500 ring-1 ring-red-500/20' : rationale.trim().length > 0 ? 'border-emerald-500' : 'border-amber-200'}`}
                          />
                          {rationaleError && (
                            <p className="text-[11px] text-red-700 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3" /> {rationaleError}
                            </p>
                          )}
                          <p className="text-[11px] text-amber-700/70 italic">
                            Provide a clear justification for overriding the eligibility rule. This will be recorded for audit purposes.
                          </p>
                        </div>
                      </div>
                    </motion.section>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Eligibility Summary Panel */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              <section className="bg-card-bg rounded-xl border border-border-cool shadow-md overflow-hidden">
                <div className="px-6 py-3.5 bg-primary flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <h2 className="font-bold text-white uppercase tracking-widest text-[10px]">Eligibility Summary</h2>
                </div>
                <div className="p-6 space-y-6 bg-primary/5">
                  <div className="bg-white rounded-lg p-4 border border-primary/10 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isFormValid ? (Object.keys(softErrors).length > 0 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-slate-300 animate-pulse'}`}></div>
                      <span className="text-sm font-bold text-primary">
                        {!isFormValid ? 'Incomplete' : Object.keys(softErrors).length > 0 ? 'Exception Required' : 'Ready for Evaluation'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-primary/5">
                      <div className="flex items-center gap-2">
                        {Object.keys(errors).length > 0 ? (
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                        ) : (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isFormValid ? 'text-emerald-600' : 'text-slate-300'}`} />
                        )}
                        <span className="text-xs font-semibold text-slate-700">Strict Rules</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${Object.keys(errors).length > 0 ? 'text-red-600' : isFormValid ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {Object.keys(errors).length > 0 ? 'Failed' : isFormValid ? 'Passed' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-primary/5">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-3.5 h-3.5 ${Object.keys(softErrors).length > 0 ? 'text-amber-600' : 'text-slate-300'}`} />
                        <span className="text-xs font-semibold text-slate-700">Soft Rules</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${Object.keys(softErrors).length > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {Object.keys(softErrors).length > 0 ? 'Alert' : 'Clear'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-3.5 h-3.5 ${exceptionsUsed > 0 ? 'text-primary' : 'text-slate-300'}`} />
                        <span className="text-xs font-semibold text-slate-700">Exceptions</span>
                      </div>
                      <span className={`text-xs font-bold ${exceptionsUsed > rules.exception_policy.maxExceptions ? 'text-amber-600' : 'text-primary'}`}>
                        {exceptionsUsed} / {rules.exception_policy.maxExceptions}
                      </span>
                    </div>
                  </div>

                  {exceptionsUsed > rules.exception_policy.maxExceptions && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-amber-800 font-bold leading-tight">
                        {rules.exception_policy.managerReviewMessage}
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={handleEvaluate}
                    disabled={!isFormValid}
                    className={`w-full py-3 rounded-lg text-white text-sm font-bold shadow-lg transition-all ${isFormValid ? 'bg-accent shadow-accent/20 hover:scale-[1.02] active:scale-[0.98]' : 'bg-slate-200 opacity-50 cursor-not-allowed'}`}
                  >
                    Evaluate Eligibility
                  </button>
                  
                  <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                    {!isFormValid && anyExceptionEnabled && rationale.trim().length < rules.exception_policy.rationaleMinLength
                      ? `Rationale must be at least ${rules.exception_policy.rationaleMinLength} characters long.`
                      : !isFormValid && Object.keys(softErrors).some(field => !overrides[field])
                      ? "All soft rule violations must be overridden with an exception."
                      : isFormValid 
                      ? "All strict rules have passed and exceptions are documented. You can now proceed."
                      : "Final evaluation requires all mandatory fields to be populated and verified."}
                  </p>
                </div>
              </section>

              <div className="bg-white/50 border border-border-cool rounded-xl p-5 flex items-start gap-3">
                <Info className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  System uses <span className="font-bold text-primary">v2.4.0-Enterprise</span> ruleset for eligibility calculation. All decisions are logged for audit purposes.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : view === 'success' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center space-y-8 py-12"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">Eligibility evaluation completed successfully.</h1>
              <p className="text-slate-500 max-w-md mx-auto">
                The candidate's eligibility has been verified and recorded in the audit log.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-border-cool shadow-sm p-8 space-y-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reference ID</p>
                  <p className="text-lg font-mono font-bold text-primary">{currentEvaluation?.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</p>
                  <p className="text-sm font-medium text-slate-600">{currentEvaluation?.timestamp}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Candidate</p>
                  <p className="font-bold text-primary">{currentEvaluation?.candidateName}</p>
                  <p className="text-xs text-slate-500">{currentEvaluation?.candidateEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Outcome</p>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    currentEvaluation?.outcome === 'Eligible' ? 'bg-emerald-100 text-emerald-700' :
                    currentEvaluation?.outcome === 'Exception Approved' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {currentEvaluation?.outcome === 'Exception Approved' ? 'Eligible with Exceptions' : currentEvaluation?.outcome}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-50">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager Review Required</p>
                  <p className={`text-sm font-bold ${currentEvaluation?.managerReviewRequired ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {currentEvaluation?.managerReviewRequired ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exception Count</p>
                  <p className="text-sm font-bold text-primary">{currentEvaluation?.exceptionsUsed || 0}</p>
                </div>
              </div>

              {currentEvaluation && Object.keys(currentEvaluation.overrides).filter(k => currentEvaluation.overrides[k]).length > 0 && (
                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Exceptions Applied</p>
                  <div className="space-y-3">
                    {Object.keys(currentEvaluation.overrides)
                      .filter(key => currentEvaluation.overrides[key])
                      .map(key => (
                        <div key={key} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                          <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                            {key === 'dob' ? 'Age Eligibility' : 
                             key === 'gradYear' ? 'Graduation Year' : 
                             key === 'score' ? 'Academic Score' : 
                             key === 'testScore' ? 'Screening Score' : key}
                          </p>
                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            "{currentEvaluation.rationale}"
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {currentEvaluation?.managerReviewRequired && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">Manager Review Required</p>
                    <p className="text-xs text-amber-700/80 mt-0.5">This evaluation contains multiple exceptions and requires final approval from an admissions manager.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button 
                onClick={resetForm}
                className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Back to Form
              </button>
              <button 
                onClick={() => setView('logs')}
                className="w-full sm:w-auto px-8 py-3 rounded-lg border border-border-cool text-sm font-bold text-slate-600 hover:bg-white transition-all"
              >
                View in Audit Log
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Audit Log</h1>
                <p className="text-slate-500 mt-1">Traceable history of all eligibility decisions.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search candidates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-border-cool bg-white text-sm focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all w-64"
                  />
                </div>
                <button 
                  type="button"
                  className="p-2 rounded-lg border border-border-cool bg-white text-slate-400 hover:text-primary transition-all"
                >
                  <Filter className="w-4 h-4" />
                </button>

                <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportToCSV}
                    disabled={auditLogs.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-cool bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Export as CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={exportToJSON}
                    disabled={auditLogs.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-cool bg-white text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="Export as JSON"
                  >
                    <FileJson className="w-3.5 h-3.5" />
                    JSON
                  </button>
                </div>
                
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {!isConfirmingClear ? (
                      <motion.button 
                        key="clear-btn"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        type="button"
                        onClick={() => setIsConfirmingClear(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-100 bg-red-50 text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Clear History
                      </motion.button>
                    ) : (
                      <motion.div 
                        key="confirm-box"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight mr-2">Confirm Clear?</span>
                        <button 
                          type="button"
                          onClick={clearAuditHistory}
                          className="px-3 py-1.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 transition-all"
                        >
                          Yes
                        </button>
                        <button 
                          type="button"
                          onClick={() => setIsConfirmingClear(false)}
                          className="px-3 py-1.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-slate-200 transition-all"
                        >
                          No
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Audit Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-card-bg p-4 rounded-xl border border-border-cool shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Evaluations</p>
                <p className="text-2xl font-extrabold text-primary">{totalEvaluations}</p>
              </div>
              <div className="bg-card-bg p-4 rounded-xl border border-border-cool shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Eligible</p>
                <p className="text-2xl font-extrabold text-emerald-600">{eligibleCount}</p>
              </div>
              <div className="bg-card-bg p-4 rounded-xl border border-border-cool shadow-sm border-l-4 border-l-amber-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">With Exceptions</p>
                <p className="text-2xl font-extrabold text-amber-600">{exceptionCount}</p>
              </div>
              <div className="bg-card-bg p-4 rounded-xl border border-border-cool shadow-sm border-l-4 border-l-red-500">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Blocked</p>
                <p className="text-2xl font-extrabold text-red-600">{blockedCount}</p>
              </div>
              <div className="bg-card-bg p-4 rounded-xl border border-border-cool shadow-sm border-l-4 border-l-amber-400">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Manager Review</p>
                <p className="text-2xl font-extrabold text-amber-700">{managerReviewCount}</p>
              </div>
              <div className="bg-card-bg p-4 rounded-xl border border-border-cool shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Exception Rate</p>
                <p className="text-2xl font-extrabold text-primary">{exceptionRate}%</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border-cool shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border-cool">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Candidate</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Exceptions</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Manager Review</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {auditLogs.filter(log => 
                    log.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    log.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.id.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                        {searchQuery ? 'No records match your search.' : 'No audit records available.'}
                      </td>
                    </tr>
                  ) : (
                    auditLogs
                      .filter(log => 
                        log.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        log.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.id.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="text-xs font-medium text-slate-600">{log.timestamp}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-primary">{log.candidateName}</p>
                          <p className="text-xs text-slate-400">{log.candidateEmail}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            log.outcome === 'Eligible' ? 'bg-emerald-100 text-emerald-700' :
                            log.outcome === 'Exception Approved' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {log.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-bold ${log.exceptionsUsed > 0 ? 'text-primary' : 'text-slate-300'}`}>
                            {log.exceptionsUsed}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {log.managerReviewRequired ? (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Required</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setSelectedLog(log)}
                            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-white transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Audit Detail Modal */}
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLog(null)}
                className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full"
              >
                <div className="px-8 py-6 border-b border-border-cool bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-primary tracking-tight">Evaluation Record Details</h2>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{selectedLog.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-white transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Candidate</p>
                      <p className="font-bold text-primary">{selectedLog.candidateName}</p>
                      <p className="text-xs text-slate-500">{selectedLog.candidateEmail}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</p>
                      <p className="text-sm font-medium text-slate-600">{selectedLog.timestamp}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outcome</p>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedLog.outcome === 'Eligible' ? 'bg-emerald-100 text-emerald-700' :
                          selectedLog.outcome === 'Exception Approved' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {selectedLog.outcome}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      <ClipboardCheck className="w-3.5 h-3.5 text-primary" /> Rule Verification Results
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Strict Rules</p>
                        {Object.keys(selectedLog.strictRuleResults).length === 0 ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">All strict rules passed</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(selectedLog.strictRuleResults).map(([field, error]) => (
                              <div key={field} className="flex items-start gap-2 text-red-600">
                                <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                <span className="text-xs font-medium leading-tight">{error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Soft Rules</p>
                        {Object.keys(selectedLog.softRuleViolations).length === 0 ? (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-bold">No soft rule violations</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(selectedLog.softRuleViolations).map(([field, warning]) => (
                              <div key={field} className="space-y-1.5">
                                <div className="flex items-start gap-2 text-amber-600">
                                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                  <span className="text-xs font-medium leading-tight">{warning}</span>
                                </div>
                                <div className="ml-5.5 flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${selectedLog.overrides[field] ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    {selectedLog.overrides[field] ? 'Overridden with exception' : 'No exception recorded'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedLog.exceptionsUsed > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-primary" /> Exception Documentation
                      </h3>
                      <div className="bg-amber-50/50 rounded-xl p-6 border border-amber-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Exceptions Count:</span>
                            <span className="text-xs font-bold text-amber-700">{selectedLog.exceptionsUsed}</span>
                          </div>
                          {selectedLog.managerReviewRequired && (
                            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-100 px-2 py-0.5 rounded border border-amber-200">Manager Review Required</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Rationale</p>
                          <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-amber-100 shadow-sm italic">
                            "{selectedLog.rationale}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-8 py-6 border-t border-border-cool bg-slate-50 flex justify-end">
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Close Record
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* Status Bar */}
      <footer className="bg-primary text-slate-400 py-2.5 px-8 fixed bottom-0 w-full z-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[9px] uppercase font-bold tracking-[0.2em]">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] ${isFormValid ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              System: Online
            </span>
            <span className="text-white/10">|</span>
            <span>Region: Asia-East-1</span>
            <span className="text-white/10">|</span>
            <span>Latency: 24ms</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/40">Secure Session: 0x8F2...A1C</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
