import respiratoryQuickScan from '../../data/learn/respiratory-exam-cram-quick-scan.json';
import lymphoidQuickScan from '../../data/learn/lymphoid-exam-cram-quick-scan.json';
import type { EducationalArticleData } from './subjects';

export type ExamCramMode = 'quick-scan' | 'detailed-review';
export interface ExamCramVariant extends EducationalArticleData {
  variantOf: string;
  readingMode: 'quick-scan';
}

// Variants have separate content identities, but never become top-level Learn tabs.
export const examCramVariants: Record<string, ExamCramVariant | undefined> = {
  [respiratoryQuickScan.variantOf]: respiratoryQuickScan as ExamCramVariant,
  [lymphoidQuickScan.variantOf]: lymphoidQuickScan as ExamCramVariant,
};
