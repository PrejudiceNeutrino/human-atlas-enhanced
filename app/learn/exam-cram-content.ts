import respiratoryQuickScan from '../../data/learn/respiratory-system-exam-cram-quick-scan.json';
import lymphoidQuickScan from '../../data/learn/lymphoid-system-exam-cram-quick-scan.json';
import digestiveDetailedReview from '../../data/learn/digestive-system-exam-cram-detailed-review.json';
import type { EducationalArticleData } from './subjects';

export type ExamCramMode = 'quick-scan' | 'detailed-review';
export interface ExamCramVariant extends EducationalArticleData {
  variantOf: string;
  readingMode: ExamCramMode;
}

// Variants have separate content identities, but never become top-level Learn tabs.
export const examCramVariants: Record<string, ExamCramVariant | undefined> = {
  'digestive-system-exam-cram': { ...digestiveDetailedReview, variantOf: 'digestive-system-exam-cram', readingMode: 'detailed-review' },
  [respiratoryQuickScan.variantOf]: respiratoryQuickScan as ExamCramVariant,
  [lymphoidQuickScan.variantOf]: lymphoidQuickScan as ExamCramVariant,
};

// Existing source links must show the text of the canonical article: Digestive's
// original Quick Scan, and Respiratory/Lymphoid's original Detailed Review.
export const canonicalExamCramMode = (articleId: string): ExamCramMode =>
  examCramVariants[articleId]?.readingMode === 'detailed-review' ? 'quick-scan' : 'detailed-review';
