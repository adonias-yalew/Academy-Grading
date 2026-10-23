// Mock academic data service. Each function maps to a future REST endpoint.
// Reads: hooks over the mock store. Writes: async functions that simulate latency.
import { useSyncExternalStore } from "react";
import { getDb, mutate, useMockDb } from "@/mocks/store";
import { CURRENT_YEAR_ID } from "@/mocks/seed";
import { consolidateSection, sheetKey } from "@/lib/grading";
import { NEXT_STATUS, type ReportAction } from "@/lib/permissions";
import { sectionLabel } from "@/lib/format";
import type {
  AcademicReport,
  AppNotification,
  MarkSheet,
  MarkValue,
  SchoolSettings,
  Section,
  Student,
  Subject,
  TeacherAssignment,
  User,
} from "@/types";
import { delay, ServiceError } from "./config";
import { authService } from "./auth";

export { useMockDb as useAcademicData };

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const now = () => new Date().toISOString();
const actorId = () => authService.getSession()?.userId ?? "system";

function log(d: ReturnType<typeof getDb>, action: string, module: string, record: string, details: string) {
  d.logs.unshift({ id: uid("l"), userId: actorId(), action, module, record, details, at: now() });
}
function notify(d: ReturnType<typeof getDb>, n: Omit<AppNotification, "id" | "at" | "read">) {
  d.notifications.unshift({ ...n, id: uid("n"), at: now(), read: false });
}

/* ---------- Selected academic year (UI preference) ---------- */
let selectedYear = CURRENT_YEAR_ID;
const yl = new Set<() => void>();
export function setSelectedYear(id: string) {
  selectedYear = id;
  yl.forEach((l) => l());
}
export function useSelectedYear() {
  return useSyncExternalStore(
    (l) => {
      yl.add(l);
      return () => yl.delete(l);
    },
    () => selectedYear,
    () => CURRENT_YEAR_ID,
  );
}

/* ---------- Students ---------- */
export type StudentInput = Omit<Student, "id">;
export async function saveStudent(input: StudentInput, id?: string): Promise<Student> {
  await delay();
  const db = getDb();
  if (db.students.some((s) => s.studentCode === input.studentCode && s.id !== id))
    throw new ServiceError("Validation failed", { studentCode: "This student ID is already in use" });
  const student: Student = { ...input, id: id ?? uid("st") };
  mutate((d) => {
    if (id) d.students = d.students.map((s) => (s.id === id ? student : s));
    else d.students.push(student);
    log(d, id ? "Updated" : "Created", "Students", student.studentCode, `${student.fullName} · ${sectionLabel(d.sections.find((x) => x.id === student.sectionId))}`);
  });
  return student;
}

/* ---------- Sections ---------- */
export type SectionInput = Omit<Section, "id">;
export async function saveSection(input: SectionInput, id?: string): Promise<Section> {
  await delay();
  const db = getDb();
  if (db.sections.some((s) => s.grade === input.grade && s.name.toUpperCase() === input.name.toUpperCase() && s.id !== id))
    throw new ServiceError("Validation failed", { name: `Grade ${input.grade}${input.name} already exists` });
  const section: Section = { ...input, name: input.name.toUpperCase(), id: id ?? `sec-${input.grade}${input.name.toLowerCase()}` };
  mutate((d) => {
    if (id) d.sections = d.sections.map((s) => (s.id === id ? section : s));
    else {
      d.sections.push(section);
      d.sections.sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));
      for (const y of d.years) for (const t of d.terms) {
        if (y.id === CURRENT_YEAR_ID) d.reports.push({ id: `rep-${y.id}-${t.id}-${section.id}`, yearId: y.id, termId: t.id, sectionId: section.id, status: "draft", submittedBy: null, submittedAt: null, history: [{ at: now(), byUserId: actorId(), action: "Report created" }] });
      }
    }
    log(d, id ? "Updated" : "Created", "Classes & Sections", sectionLabel(section), `Room ${section.room}, capacity ${section.capacity}`);
  });
  return section;
}

export async function setHomeroom(sectionId: string, teacherId: string | null) {
  await delay();
  mutate((d) => {
    const s = d.sections.find((x) => x.id === sectionId);
    if (!s) return;
    s.homeroomTeacherId = teacherId;
    const t = d.users.find((u) => u.id === teacherId);
    if (t && !t.roles.includes("homeroom_teacher")) t.roles.push("homeroom_teacher");
    log(d, teacherId ? "Assigned" : "Removed", "Teacher Assignments", `${sectionLabel(s)} homeroom`, t ? `${t.fullName} assigned as homeroom teacher` : "Homeroom teacher removed");
    if (t) notify(d, { userId: t.id, category: "task", title: `You are homeroom teacher of ${sectionLabel(s)}`, body: "You can now review and submit this class report.", link: "/reports" });
  });
}

/* ---------- Subjects ---------- */
export type SubjectInput = Omit<Subject, "id">;
export async function saveSubject(input: SubjectInput, id?: string): Promise<Subject> {
  await delay();
  const db = getDb();
  if (db.subjects.some((s) => s.code.toUpperCase() === input.code.toUpperCase() && s.id !== id))
    throw new ServiceError("Validation failed", { code: "Subject code already exists" });
  const subject: Subject = { ...input, code: input.code.toUpperCase(), id: id ?? uid("sub") };
  mutate((d) => {
    if (id) d.subjects = d.subjects.map((s) => (s.id === id ? subject : s));
    else d.subjects.push(subject);
    log(d, id ? "Updated" : "Created", "Subjects", subject.code, `${subject.name} · ${subject.assessments.length} assessments`);
  });
  return subject;
}

/* ---------- Teacher assignments ---------- */
export async function saveAssignment(input: Omit<TeacherAssignment, "id">, id?: string) {
  await delay();
  const db = getDb();
  const clash = db.assignments.find((a) => a.sectionId === input.sectionId && a.subjectId === input.subjectId && a.id !== id);
  if (clash) {
    const t = db.users.find((u) => u.id === clash.teacherId);
    throw new ServiceError("Validation failed", { subjectId: `Already assigned to ${t?.fullName ?? "another teacher"}` });
  }
  mutate((d) => {
    const a: TeacherAssignment = { ...input, id: id ?? uid("as") };
    if (id) d.assignments = d.assignments.map((x) => (x.id === id ? a : x));
    else d.assignments.push(a);
    const t = d.users.find((u) => u.id === a.teacherId);
    if (t && !t.roles.includes("subject_teacher")) t.roles.push("subject_teacher");
    const sub = d.subjects.find((s) => s.id === a.subjectId);
    const sec = d.sections.find((s) => s.id === a.sectionId);
    log(d, id ? "Updated" : "Assigned", "Teacher Assignments", `${sectionLabel(sec)} · ${sub?.name}`, `${t?.fullName} assigned`);
  });
}
export async function removeAssignment(id: string) {
  await delay();
  mutate((d) => {
    const a = d.assignments.find((x) => x.id === id);
    d.assignments = d.assignments.filter((x) => x.id !== id);
    if (a) log(d, "Removed", "Teacher Assignments", `${sectionLabel(d.sections.find((s) => s.id === a.sectionId))} · ${d.subjects.find((s) => s.id === a.subjectId)?.name}`, "Assignment removed");
  });
}

/* ---------- Users ---------- */
export async function saveUser(input: Omit<User, "id">, id?: string) {
  await delay();
  const db = getDb();
  if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase() && u.id !== id))
    throw new ServiceError("Validation failed", { email: "Email already in use" });
  mutate((d) => {
    const u: User = { ...input, id: id ?? uid("u") };
    if (id) d.users = d.users.map((x) => (x.id === id ? u : x));
    else {
      d.users.push(u);
      d.passwords[u.id] = "Password123";
    }
    log(d, id ? "Updated" : "Created", "Users", u.email, u.roles.join(", "));
  });
}

/* ---------- Marks ---------- */
export async function saveMarkSheet(args: { yearId: string; termId: string; sectionId: string; subjectId: string; marks: MarkSheet["marks"]; submit: boolean }) {
  await delay();
  const db = getDb();
  const key = sheetKey(args.yearId, args.termId, args.sectionId, args.subjectId);
  const existing = db.markSheets[key];
  if (existing?.status === "submitted") throw new ServiceError("These marks were already submitted and are locked.");
  const subject = db.subjects.find((s) => s.id === args.subjectId);
  const section = db.sections.find((s) => s.id === args.sectionId);
  if (args.submit) {
    const students = db.students.filter((s) => s.sectionId === args.sectionId && s.status === "active");
    const missing = students.some((st) => subject?.assessments.some((a) => args.marks[st.id]?.[a.id] === null || args.marks[st.id]?.[a.id] === undefined));
    if (missing) throw new ServiceError("All marks must be entered before submitting.");
  }
  mutate((d) => {
    d.markSheets[key] = { key, status: args.submit ? "submitted" : "draft", marks: args.marks, updatedAt: now(), updatedBy: actorId() };
    const label = `${sectionLabel(section)} · ${subject?.name}`;
    log(d, args.submit ? "Submitted" : "Saved draft", "Grade Entry", label, args.submit ? "Subject results submitted to homeroom teacher" : "Draft marks saved");
    const report = d.reports.find((r) => r.yearId === args.yearId && r.termId === args.termId && r.sectionId === args.sectionId);
    if (report && report.status === "draft") report.status = "in_progress";
    if (args.submit && section?.homeroomTeacherId)
      notify(d, { userId: section.homeroomTeacherId, category: "submission", title: `${label} results submitted`, body: "Subject teacher submitted marks for your class.", link: report ? `/reports/${report.id}` : "/reports" });
  });
}

export async function reopenMarkSheet(key: string) {
  await delay();
  mutate((d) => {
    const s = d.markSheets[key];
    if (s) s.status = "draft";
    log(d, "Reopened", "Grade Entry", key.split("|").slice(2).join(" · "), "Marks unlocked for correction");
  });
}

/* ---------- Reports ---------- */
export async function transitionReport(reportId: string, action: ReportAction, comment?: string) {
  await delay();
  const db = getDb();
  const report = db.reports.find((r) => r.id === reportId);
  if (!report) throw new ServiceError("Report not found");
  const section = db.sections.find((s) => s.id === report.sectionId);
  if (section && (action === "submit" || action === "approve")) {
    const c = consolidateSection({ section, students: db.students, subjects: db.subjects, sheets: db.markSheets, yearId: report.yearId, termId: report.termId });
    if (!c.complete) throw new ServiceError("Report is incomplete: missing or unsubmitted marks.");
  }
  if (action === "return" && !comment?.trim()) throw new ServiceError("A comment is required when returning a report.");
  const labels: Record<ReportAction, string> = { submit: "Submitted to director", start_review: "Review started", approve: "Approved", return: "Returned for correction", finalize: "Finalized" };
  mutate((d) => {
    const r = d.reports.find((x) => x.id === reportId) as AcademicReport;
    r.status = NEXT_STATUS[action];
    if (action === "submit") {
      r.submittedBy = actorId();
      r.submittedAt = now();
    }
    if (action === "return") {
      // Unlock subject sheets so teachers can correct marks.
      Object.values(d.markSheets).forEach((s) => {
        if (s.key.startsWith(`${r.yearId}|${r.termId}|${r.sectionId}|`)) s.status = "draft";
      });
    }
    r.history.push({ at: now(), byUserId: actorId(), action: labels[action], comment: comment?.trim() || undefined });
    const label = sectionLabel(d.sections.find((s) => s.id === r.sectionId));
    log(d, labels[action].split(" ")[0], "Academic Reports", `${label} · ${d.terms.find((t) => t.id === r.termId)?.name}`, comment ? `${labels[action]}: ${comment}` : labels[action]);
    const link = `/reports/${r.id}`;
    if (action === "submit") d.users.filter((u) => u.roles.includes("director")).forEach((u) => notify(d, { userId: u.id, category: "submission", title: `${label} report submitted`, body: "A class report is waiting for your review.", link }));
    if ((action === "approve" || action === "return" || action === "finalize") && r.submittedBy)
      notify(d, { userId: r.submittedBy, category: action === "return" ? "returned" : "approved", title: `${label} report ${action === "return" ? "returned for correction" : action === "approve" ? "approved" : "finalized"}`, body: comment || "Open the report for details.", link });
  });
}

/* ---------- Notifications ---------- */
export function useNotificationsFor(userId: string | undefined) {
  const db = useMockDb();
  return db.notifications.filter((n) => n.userId === userId || n.userId === "all");
}
export async function markNotificationsRead(ids: string[]) {
  mutate((d) => {
    d.notifications.forEach((n) => {
      if (ids.includes(n.id)) n.read = true;
    });
  });
}

/* ---------- Settings ---------- */
export async function saveSettings(s: SchoolSettings) {
  await delay();
  mutate((d) => {
    d.settings = s;
    log(d, "Updated", "Settings", "School settings", "School information or grading policy updated");
  });
}
export async function saveAcademicYear(label: string, startDate: string, endDate: string, makeCurrent: boolean) {
  await delay();
  if (!/^\d{4}\/\d{4}$/.test(label)) throw new ServiceError("Validation failed", { label: "Use the format 2027/2028" });
  if (getDb().years.some((y) => y.label === label)) throw new ServiceError("Validation failed", { label: "Year already exists" });
  if (endDate <= startDate) throw new ServiceError("Validation failed", { endDate: "End date must be after start date" });
  mutate((d) => {
    if (makeCurrent) d.years.forEach((y) => (y.current = false));
    d.years.push({ id: uid("y"), label, startDate, endDate, current: makeCurrent });
    log(d, "Created", "Academic Years", label, makeCurrent ? "Created and set as current" : "Created");
  });
}
export function setCurrentYear(id: string) {
  mutate((d) => {
    d.years.forEach((y) => (y.current = y.id === id));
    log(d, "Updated", "Academic Years", d.years.find((y) => y.id === id)?.label ?? id, "Set as current year");
  });
}

export const markValue = (raw: string): MarkValue => (raw.trim() === "" ? null : Number(raw));
