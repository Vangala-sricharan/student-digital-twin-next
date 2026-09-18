export interface ResumeCertificationItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  issueYear?: string;
  credentialId?: string;
  credentialUrl?: string;
  source?: 'linkedin_pdf' | 'manual' | 'planned';
  sourceEvidence?: string;
  confidence?: number;
  status?: 'completed' | 'planned';
}
