// Deterministic sample data for development. Replace by API calls via src/services.
import type {
  AcademicReport,
  AcademicYear,
  ActivityLog,
  AppNotification,
  AssessmentDefinition,
  MarkSheet,
  ReportStatus,
  SchoolSettings,
  Section,
  Student,
  Subject,
  TeacherAssignment,
  Term,
  User,
} from "@/types";

export interface MockDatabase {
  version: number;
  users: User[];
  passwords: Record<string, string>; // mock only — never do this with a real backend
  years: AcademicYear[];
  terms: Term[];
  sections: Section[];
  students: Student[];
  subjects: Subject[];
  assignments: TeacherAssignment[];
  markSheets: Record<string, MarkSheet>;
  reports: AcademicReport[];
  notifications: AppNotification[];
  logs: ActivityLog[];
  settings: SchoolSettings;
}

export const SEED_VERSION = 1;
export const CURRENT_YEAR_ID = "y2026";

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MALE = ["Abel", "Biniyam", "Dawit", "Ermias", "Fitsum", "Henok", "Kaleb", "Kirubel", "Mikiyas", "Nahom", "Robel", "Samuel", "Yonas", "Yared", "Natnael", "Eyob", "Bereket", "Amanuel", "Tewodros", "Leul"];
const FEMALE = ["Bethlehem", "Eden", "Hanna", "Helen", "Hiwot", "Liya", "Meron", "Mahlet", "Rahel", "Ruth", "Saron", "Selam", "Tsion", "Yordanos", "Bezawit", "Feven", "Kidist", "Lidya", "Mekdes", "Sara"];
const FATHERS = ["Tesfaye", "Girma", "Bekele", "Alemu", "Haile", "Kebede", "Tadesse", "Mekonnen", "Wolde", "Assefa", "Gebre", "Negash", "Desta", "Abebe", "Mulugeta", "Lemma", "Ayele", "Fikru", "Teshome", "Getachew"];

const iso = (d: string) => new Date(d).toISOString();

function subjectAssessments(prefix: string, lower: boolean): AssessmentDefinition[] {
  if (lower) {
    return [
      { id: `${prefix}-cw`, name: "Classwork", category: "assignment", maxMark: 10, weight: 20 },
      { id: `${prefix}-mid`, name: "Midterm Exam", category: "midterm", maxMark: 30, weight: 30 },
      { id: `${prefix}-fin`, name: "Final Exam", category: "final", maxMark: 50, weight: 50 },
    ];
  }
  return [
    { id: `${prefix}-q`, name: "Quiz", category: "quiz", maxMark: 10, weight: 10 },
    { id: `${prefix}-as`, name: "Assignment", category: "assignment", maxMark: 20, weight: 15 },
    { id: `${prefix}-mid`, name: "Midterm Exam", category: "midterm", maxMark: 25, weight: 25 },
    { id: `${prefix}-fin`, name: "Final Exam", category: "final", maxMark: 50, weight: 50 },
  ];
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export function createSeed(): MockDatabase {
  const r = rng(42);

  const users: User[] = [
    { id: "u-admin", fullName: "Selam Haile", email: "admin@scholar.edu.et", phone: "+251 911 000 001", roles: ["admin"], active: true },
    { id: "u-director", fullName: "Dr. Mulugeta Tesfaye", email: "director@scholar.edu.et", phone: "+251 911 000 002", roles: ["director"], active: true },
    { id: "u-abebe", fullName: "Abebe Kebede", email: "teacher@scholar.edu.et", phone: "+251 911 000 003", roles: ["subject_teacher"], active: true },
    { id: "u-tigist", fullName: "Tigist Alemu", email: "homeroom@scholar.edu.et", phone: "+251 911 000 004", roles: ["homeroom_teacher", "subject_teacher"], active: true },
    { id: "u-yohannes", fullName: "Yohannes Bekele", email: "yohannes.b@scholar.edu.et", phone: "+251 911 000 005", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-meseret", fullName: "Meseret Gebre", email: "meseret.g@scholar.edu.et", phone: "+251 911 000 006", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-solomon", fullName: "Solomon Tadesse", email: "solomon.t@scholar.edu.et", phone: "+251 911 000 007", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-almaz", fullName: "Almaz Wolde", email: "almaz.w@scholar.edu.et", phone: "+251 911 000 008", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-getnet", fullName: "Getnet Assefa", email: "getnet.a@scholar.edu.et", phone: "+251 911 000 009", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-workitu", fullName: "Workitu Negash", email: "workitu.n@scholar.edu.et", phone: "+251 911 000 010", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-dereje", fullName: "Dereje Lemma", email: "dereje.l@scholar.edu.et", phone: "+251 911 000 011", roles: ["subject_teacher", "homeroom_teacher"], active: true },
    { id: "u-frehiwot", fullName: "Frehiwot Desta", email: "frehiwot.d@scholar.edu.et", phone: "+251 911 000 012", roles: ["subject_teacher", "homeroom_teacher"], active: true },
  ];
  const passwords: Record<string, string> = Object.fromEntries(users.map((u) => [u.id, "Password123"]));

  const years: AcademicYear[] = [
    { id: "y2025", label: "2025/2026", startDate: "2025-09-11", endDate: "2026-07-07", current: false },
    { id: CURRENT_YEAR_ID, label: "2026/2027", startDate: "2026-09-11", endDate: "2027-07-07", current: true },
  ];
  const terms: Term[] = [
    { id: "t1", name: "Semester 1" },
    { id: "t2", name: "Semester 2" },
  ];

  const subjectDefs: Array<[string, string, string, number[]]> = [
    ["sub-amh", "AMH", "Amharic", range(1, 12)],
    ["sub-eng", "ENG", "English", range(1, 12)],
    ["sub-mat", "MAT", "Mathematics", range(1, 12)],
    ["sub-env", "ENV", "Environmental Science", range(1, 4)],
    ["sub-gsc", "GSC", "General Science", range(5, 8)],
    ["sub-sst", "SST", "Social Studies", range(5, 8)],
    ["sub-civ", "CIV", "Citizenship Education", range(5, 12)],
    ["sub-bio", "BIO", "Biology", range(9, 12)],
    ["sub-che", "CHE", "Chemistry", range(9, 12)],
    ["sub-phy", "PHY", "Physics", range(9, 12)],
    ["sub-ict", "ICT", "Information Technology", range(7, 12)],
    ["sub-hpe", "HPE", "Health & Physical Education", range(1, 12)],
  ];
  const subjects: Subject[] = subjectDefs.map(([id, code, name, grades]) => ({
    id,
    code,
    name,
    grades,
    assessments: subjectAssessments(id, grades[grades.length - 1] <= 4 || id === "sub-hpe"),
  }));

  // Sections: A & B for every grade, C for grades 6, 8, 10.
  const teacherPool = users.filter((u) => u.id !== "u-admin" && u.id !== "u-director" && u.id !== "u-abebe");
  const sections: Section[] = [];
  let hIdx = 0;
  for (const g of range(1, 12)) {
    const names = [6, 8, 10].includes(g) ? ["A", "B", "C"] : ["A", "B"];
    for (const n of names) {
      const id = `sec-${g}${n.toLowerCase()}`;
      let homeroom: string | null = teacherPool[hIdx % teacherPool.length].id;
      if (id === "sec-8a") homeroom = "u-tigist";
      else if (homeroom === "u-tigist") homeroom = teacherPool[(hIdx + 1) % teacherPool.length].id;
      if (id === "sec-11b") homeroom = null; // intentionally unassigned
      hIdx++;
      sections.push({ id, grade: g, name: n, room: `${g < 10 ? "0" : ""}${g}${n}`, capacity: 40, homeroomTeacherId: homeroom });
    }
  }

  const students: Student[] = [];
  let code = 1;
  for (const s of sections) {
    const count = 8 + Math.floor(r() * 4);
    for (let i = 0; i < count; i++) {
      const female = r() > 0.5;
      const first = (female ? FEMALE : MALE)[Math.floor(r() * 20)];
      const father = FATHERS[Math.floor(r() * 20)];
      const gf = FATHERS[Math.floor(r() * 20)];
      const birthYear = 2026 - (s.grade + 6);
      const statusRoll = r();
      students.push({
        id: `st-${code}`,
        studentCode: `SCH-${String(code).padStart(4, "0")}`,
        fullName: `${first} ${father} ${gf}`,
        gender: female ? "F" : "M",
        dateOfBirth: `${birthYear}-${String(1 + Math.floor(r() * 12)).padStart(2, "0")}-${String(1 + Math.floor(r() * 27)).padStart(2, "0")}`,
        sectionId: s.id,
        status: statusRoll > 0.97 ? "transferred" : statusRoll > 0.94 ? "inactive" : "active",
        guardianName: `${father} ${gf}`,
        guardianPhone: `+251 9${Math.floor(10 + r() * 89)} ${Math.floor(100 + r() * 899)} ${Math.floor(100 + r() * 899)}`,
      });
      code++;
    }
  }

  // Subject teacher assignments.
  const assignments: TeacherAssignment[] = [];
  const teachers = users.filter((u) => u.roles.includes("subject_teacher"));
  let aIdx = 0;
  for (const s of sections) {
    for (const sub of subjects.filter((x) => x.grades.includes(s.grade))) {
      let teacherId = teachers[aIdx % teachers.length].id;
      if (sub.id === "sub-mat" && s.grade >= 7 && s.grade <= 10) teacherId = "u-abebe";
      else if (sub.id === "sub-gsc" && s.grade === 6) teacherId = "u-abebe";
      else if (sub.id === "sub-eng" && (s.grade === 8 || s.grade === 7)) teacherId = "u-tigist";
      else if (teacherId === "u-abebe" || teacherId === "u-tigist") teacherId = teachers[(aIdx + 3) % teachers.length].id;
      assignments.push({ id: `as-${s.id}-${sub.id}`, teacherId, subjectId: sub.id, sectionId: s.id });
      aIdx++;
    }
  }

  // Mark sheets for current year, semester 1. Completeness varies by grade to make workflow interesting.
  const markSheets: Record<string, MarkSheet> = {};
  const reportStatusFor = (sec: Section): ReportStatus => {
    const map: Record<string, ReportStatus> = {
      "sec-1a": "finalized", "sec-1b": "approved", "sec-2a": "approved", "sec-2b": "under_review",
      "sec-3a": "submitted", "sec-3b": "submitted", "sec-4a": "returned", "sec-4b": "approved",
      "sec-5a": "submitted", "sec-5b": "in_progress", "sec-6a": "in_progress", "sec-6b": "under_review",
      "sec-6c": "in_progress", "sec-7a": "in_progress", "sec-7b": "draft", "sec-8a": "in_progress",
      "sec-8b": "in_progress", "sec-8c": "draft", "sec-9a": "submitted", "sec-9b": "in_progress",
      "sec-10a": "approved", "sec-10b": "submitted", "sec-10c": "in_progress", "sec-11a": "in_progress",
      "sec-11b": "draft", "sec-12a": "submitted", "sec-12b": "in_progress",
    };
    return map[sec.id] ?? "draft";
  };

  const reports: AcademicReport[] = [];
  for (const sec of sections) {
    const status = reportStatusFor(sec);
    const complete = ["submitted", "under_review", "approved", "finalized", "returned"].includes(status);
    const secStudents = students.filter((s) => s.sectionId === sec.id);
    const secSubjects = subjects.filter((x) => x.grades.includes(sec.grade));
    secSubjects.forEach((sub, subIdx) => {
      if (status === "draft" && subIdx > 1) return;
      const key = `${CURRENT_YEAR_ID}|t1|${sec.id}|${sub.id}`;
      const marks: MarkSheet["marks"] = {};
      // For in-progress sections, leave some subjects partially filled.
      const partial = !complete && subIdx % 3 === 0;
      const noFinal = !complete && subIdx % 3 === 1;
      // Keep Abebe's Grade 8A math and Tigist's 8A English open for the demo.
      const demoOpen = (sec.id === "sec-8a" && (sub.id === "sub-mat" || sub.id === "sub-eng")) || (sec.id === "sec-6c" && sub.id === "sub-gsc");
      for (const st of secStudents) {
        const ability = 0.45 + r() * 0.5;
        marks[st.id] = {};
        sub.assessments.forEach((a) => {
          let v: number | null = Math.round(Math.min(a.maxMark, Math.max(0, a.maxMark * (ability + (r() - 0.5) * 0.2))) * 2) / 2;
          if (partial && r() > 0.7) v = null;
          if ((noFinal || demoOpen) && a.category === "final") v = null;
          if (demoOpen && a.category === "midterm" && r() > 0.6) v = null;
          marks[st.id][a.id] = v;
        });
      }
      markSheets[key] = {
        key,
        status: complete || (!partial && !noFinal && !demoOpen && status !== "draft") ? "submitted" : "draft",
        marks,
        updatedAt: iso("2026-10-15T10:00:00Z"),
        updatedBy: assignments.find((a) => a.sectionId === sec.id && a.subjectId === sub.id)?.teacherId ?? null,
      };
    });

    const hr = sec.homeroomTeacherId ?? "u-admin";
    const history: AcademicReport["history"] = [{ at: iso("2026-10-01T08:00:00Z"), byUserId: hr, action: "Report created" }];
    let submittedAt: string | null = null;
    if (["submitted", "under_review", "approved", "finalized", "returned"].includes(status)) {
      submittedAt = iso(`2026-10-${10 + (sec.grade % 9)}T09:30:00Z`);
      history.push({ at: submittedAt, byUserId: hr, action: "Submitted to director" });
    }
    if (["under_review", "approved", "finalized"].includes(status)) history.push({ at: iso("2026-10-20T11:00:00Z"), byUserId: "u-director", action: "Review started" });
    if (status === "returned") history.push({ at: iso("2026-10-21T14:10:00Z"), byUserId: "u-director", action: "Returned for correction", comment: "Please verify Mathematics final exam marks for three students before resubmitting." });
    if (["approved", "finalized"].includes(status)) history.push({ at: iso("2026-10-21T15:00:00Z"), byUserId: "u-director", action: "Approved", comment: "Results verified." });
    if (status === "finalized") history.push({ at: iso("2026-10-22T09:00:00Z"), byUserId: "u-director", action: "Finalized" });

    reports.push({ id: `rep-${CURRENT_YEAR_ID}-t1-${sec.id}`, yearId: CURRENT_YEAR_ID, termId: "t1", sectionId: sec.id, status, submittedBy: submittedAt ? hr : null, submittedAt, history });
  }

  const notifications: AppNotification[] = [
    { id: "n1", userId: "u-director", category: "submission", title: "Grade 12A report submitted", body: "Frehiwot Desta submitted the Semester 1 class report for review.", at: iso("2026-10-22T08:40:00Z"), read: false, link: "/reports/rep-y2026-t1-sec-12a" },
    { id: "n2", userId: "u-director", category: "submission", title: "Grade 10B report submitted", body: "Class report is waiting for your review.", at: iso("2026-10-21T16:10:00Z"), read: false, link: "/reports/rep-y2026-t1-sec-10b" },
    { id: "n3", userId: "u-director", category: "missing_marks", title: "Missing examination marks detected", body: "6 class sections have incomplete final exam marks.", at: iso("2026-10-20T09:00:00Z"), read: true, link: "/reports" },
    { id: "n4", userId: "u-abebe", category: "task", title: "Grade 8A Mathematics marks due", body: "Midterm and final exam marks are due on Oct 30.", at: iso("2026-10-22T07:30:00Z"), read: false, link: "/grade-entry?sectionId=sec-8a&subjectId=sub-mat&termId=t1" },
    { id: "n5", userId: "u-abebe", category: "missing_marks", title: "Missing Grade 6C Science marks", body: "Final examination marks are missing for General Science.", at: iso("2026-10-21T12:00:00Z"), read: false, link: "/grade-entry?sectionId=sec-6c&subjectId=sub-gsc&termId=t1" },
    { id: "n6", userId: "u-abebe", category: "approved", title: "Grade 10A report approved", body: "The class report including your Mathematics results was approved.", at: iso("2026-10-21T15:05:00Z"), read: true, link: "/grade-entry" },
    { id: "n7", userId: "u-tigist", category: "missing_marks", title: "Grade 8A has missing marks", body: "Mathematics and English still have missing exam marks.", at: iso("2026-10-22T08:00:00Z"), read: false, link: "/reports/rep-y2026-t1-sec-8a" },
    { id: "n8", userId: "u-tigist", category: "task", title: "Enter Grade 8A English marks", body: "Final exam marks are pending.", at: iso("2026-10-21T10:00:00Z"), read: false, link: "/grade-entry?sectionId=sec-8a&subjectId=sub-eng&termId=t1" },
    { id: "n9", userId: "all", category: "system", title: "Semester 1 grading window open", body: "Mark entry closes on November 5, 2026.", at: iso("2026-10-01T06:00:00Z"), read: true },
    { id: "n10", userId: "u-admin", category: "system", title: "Section 11B has no homeroom teacher", body: "Assign a homeroom teacher so the class report can be prepared.", at: iso("2026-10-19T09:00:00Z"), read: false, link: "/assignments" },
    { id: "n11", userId: "u-director", category: "returned", title: "Report returned: Grade 4A", body: "You returned Grade 4A for correction.", at: iso("2026-10-21T14:10:00Z"), read: true, link: "/reports/rep-y2026-t1-sec-4a" },
  ];
  const homeroom4a = sections.find((s) => s.id === "sec-4a")?.homeroomTeacherId;
  if (homeroom4a) notifications.push({ id: "n12", userId: homeroom4a, category: "returned", title: "Report returned for correction", body: "Grade 4A: Please verify Mathematics final exam marks.", at: iso("2026-10-21T14:10:00Z"), read: false, link: "/reports/rep-y2026-t1-sec-4a" });

  const logs: ActivityLog[] = [
    { id: "l1", userId: "u-admin", action: "Created", module: "Academic Years", record: "2026/2027", details: "Academic year created and set as current", at: iso("2026-09-01T07:00:00Z") },
    { id: "l2", userId: "u-admin", action: "Updated", module: "Grading Policy", record: "Pass mark", details: "Pass mark set to 50%", at: iso("2026-09-02T08:30:00Z") },
    { id: "l3", userId: "u-director", action: "Assigned", module: "Teacher Assignments", record: "Grade 8A homeroom", details: "Tigist Alemu assigned as homeroom teacher", at: iso("2026-09-05T09:00:00Z") },
    { id: "l4", userId: "u-abebe", action: "Saved draft", module: "Grade Entry", record: "Grade 8A · Mathematics", details: "Midterm marks saved for 9 students", at: iso("2026-10-15T10:00:00Z") },
    { id: "l5", userId: "u-frehiwot", action: "Submitted", module: "Academic Reports", record: "Grade 12A · Semester 1", details: "Class report submitted to director", at: iso("2026-10-22T08:40:00Z") },
    { id: "l6", userId: "u-director", action: "Returned", module: "Academic Reports", record: "Grade 4A · Semester 1", details: "Returned for correction with comment", at: iso("2026-10-21T14:10:00Z") },
    { id: "l7", userId: "u-director", action: "Approved", module: "Academic Reports", record: "Grade 10A · Semester 1", details: "Report approved", at: iso("2026-10-21T15:00:00Z") },
    { id: "l8", userId: "u-director", action: "Finalized", module: "Academic Reports", record: "Grade 1A · Semester 1", details: "Report finalized for printing", at: iso("2026-10-22T09:00:00Z") },
    { id: "l9", userId: "u-admin", action: "Created", module: "Students", record: "SCH-0102", details: "New student enrolled in Grade 5B", at: iso("2026-09-12T11:20:00Z") },
  ];

  const settings: SchoolSettings = {
    name: "Scholar Academy",
    code: "SA-AA-0417",
    address: "Bole Sub-city, Woreda 03, Addis Ababa",
    phone: "+251 11 661 0000",
    email: "info@scholar.edu.et",
    passMark: 50,
    rankingEnabled: true,
    gradeBands: [
      { min: 90, letter: "A+", remark: "Excellent" },
      { min: 80, letter: "A", remark: "Very Good" },
      { min: 70, letter: "B", remark: "Good" },
      { min: 60, letter: "C", remark: "Satisfactory" },
      { min: 50, letter: "D", remark: "Pass" },
      { min: 0, letter: "F", remark: "Fail" },
    ],
  };

  return { version: SEED_VERSION, users, passwords, years, terms, sections, students, subjects, assignments, markSheets, reports, notifications, logs, settings };
}
