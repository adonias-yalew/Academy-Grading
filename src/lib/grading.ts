// Pure grading calculations. No UI, no storage — safe to reuse when a real API arrives.
import type { AssessmentDefinition, GradeBand, MarkSheet, MarkValue, Section, Student, Subject } from "@/types";

export const sheetKey = (yearId: string, termId: string, sectionId: string, subjectId: string) =>
  `${yearId}|${termId}|${sectionId}|${subjectId}`;

export interface SubjectResult {
  /** Weighted percentage 0–100; null when any required mark is missing. */
  percent: number | null;
  /** Weighted percentage counting only entered marks (for previews). */
  partialPercent: number;
  rawTotal: number;
  rawMax: number;
  missing: number;
}

export function computeSubjectResult(assessments: AssessmentDefinition[], marks: Record<string, MarkValue> | undefined): SubjectResult {
  let weighted = 0;
  let rawTotal = 0;
  let rawMax = 0;
  let missing = 0;
  for (const a of assessments) {
    rawMax += a.maxMark;
    const v = marks?.[a.id];
    if (v === null || v === undefined || Number.isNaN(v)) {
      missing++;
      continue;
    }
    rawTotal += v;
    weighted += (v / a.maxMark) * a.weight;
  }
  const rounded = Math.round(weighted * 10) / 10;
  return { percent: missing ? null : rounded, partialPercent: rounded, rawTotal, rawMax, missing };
}

/** Returns an error message, or null when the raw input is a valid mark. Empty input is allowed (= missing). */
export function validateMarkInput(raw: string, maxMark: number): string | null {
  const t = raw.trim();
  if (t === "") return null;
  if (!/^\d+(\.\d+)?$/.test(t)) return t.startsWith("-") ? "Marks cannot be negative" : "Enter a number";
  const n = Number(t);
  if (n < 0) return "Marks cannot be negative";
  if (n > maxMark) return `Maximum is ${maxMark}`;
  return null;
}

export interface WeightValidation {
  valid: boolean;
  errors: string[];
  totalWeight: number;
}

export function validateAssessments(assessments: AssessmentDefinition[]): WeightValidation {
  const errors: string[] = [];
  const totalWeight = assessments.reduce((s, a) => s + (Number.isFinite(a.weight) ? a.weight : 0), 0);
  if (Math.abs(totalWeight - 100) > 0.001) errors.push(`Weights must add up to 100% (currently ${totalWeight}%)`);
  if (!assessments.some((a) => a.category === "midterm")) errors.push("A midterm examination is required");
  if (!assessments.some((a) => a.category === "final")) errors.push("A final examination is required");
  assessments.forEach((a) => {
    if (!a.name.trim()) errors.push("Every assessment needs a name");
    if (!(a.maxMark > 0)) errors.push(`${a.name || "Assessment"}: maximum mark must be greater than 0`);
    if (!(a.weight > 0)) errors.push(`${a.name || "Assessment"}: weight must be greater than 0`);
  });
  return { valid: errors.length === 0, errors: Array.from(new Set(errors)), totalWeight };
}

export function gradeBandFor(percent: number | null, bands: GradeBand[]): GradeBand | null {
  if (percent === null) return null;
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return sorted.find((b) => percent >= b.min) ?? null;
}

/** Competition ranking (1,2,2,4). Students with null averages are unranked. */
export function rankAverages(entries: { id: string; average: number | null }[]): Record<string, number | null> {
  const ranked = entries.filter((e) => e.average !== null).sort((a, b) => (b.average as number) - (a.average as number));
  const out: Record<string, number | null> = Object.fromEntries(entries.map((e) => [e.id, null]));
  ranked.forEach((e, i) => {
    const prev = ranked[i - 1];
    out[e.id] = prev && prev.average === e.average ? (out[prev.id] as number) : i + 1;
  });
  return out;
}

export interface ConsolidatedRow {
  student: Student;
  results: Record<string, SubjectResult>;
  average: number | null;
  rank: number | null;
  missing: number;
}

export interface SubjectSheetSummary {
  subject: Subject;
  sheetStatus: MarkSheet["status"] | "not_started";
  missing: number;
}

export interface Consolidation {
  rows: ConsolidatedRow[];
  subjects: SubjectSheetSummary[];
  totalMissing: number;
  allSheetsSubmitted: boolean;
  complete: boolean;
  classAverage: number | null;
}

export function consolidateSection(args: {
  section: Section;
  students: Student[];
  subjects: Subject[];
  sheets: Record<string, MarkSheet>;
  yearId: string;
  termId: string;
}): Consolidation {
  const { section, yearId, termId, sheets } = args;
  const students = args.students.filter((s) => s.sectionId === section.id && s.status === "active");
  const subjects = args.subjects.filter((s) => s.grades.includes(section.grade));
  const rows: ConsolidatedRow[] = students.map((student) => {
    const results: Record<string, SubjectResult> = {};
    let missing = 0;
    for (const sub of subjects) {
      const sheet = sheets[sheetKey(yearId, termId, section.id, sub.id)];
      const res = computeSubjectResult(sub.assessments, sheet?.marks[student.id]);
      results[sub.id] = res;
      missing += res.missing;
    }
    const percents = subjects.map((s) => results[s.id].percent);
    const average = subjects.length && percents.every((p) => p !== null)
      ? Math.round(((percents as number[]).reduce((a, b) => a + b, 0) / subjects.length) * 10) / 10
      : null;
    return { student, results, average, rank: null, missing };
  });
  const ranks = rankAverages(rows.map((r) => ({ id: r.student.id, average: r.average })));
  rows.forEach((r) => (r.rank = ranks[r.student.id]));

  const subjectSummaries: SubjectSheetSummary[] = subjects.map((subject) => {
    const sheet = sheets[sheetKey(yearId, termId, section.id, subject.id)];
    const missing = rows.reduce((s, r) => s + r.results[subject.id].missing, 0);
    return { subject, sheetStatus: sheet ? sheet.status : "not_started", missing };
  });
  const totalMissing = rows.reduce((s, r) => s + r.missing, 0);
  const allSheetsSubmitted = subjectSummaries.every((s) => s.sheetStatus === "submitted");
  const avgs = rows.map((r) => r.average).filter((a): a is number => a !== null);
  return {
    rows,
    subjects: subjectSummaries,
    totalMissing,
    allSheetsSubmitted,
    complete: totalMissing === 0 && allSheetsSubmitted && rows.length > 0,
    classAverage: avgs.length ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) / 10 : null,
  };
}
