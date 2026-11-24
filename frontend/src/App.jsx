import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChartNoAxesCombined,
  ClipboardCheck,
  Clock3,
  ContactRound,
  GraduationCap,
  House,
  ImagePlus,
  Layers3,
  LogOut,
  Medal,
  MessageSquareText,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  School,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  TriangleAlert,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import "./App.css";

const navigationGroups = [
  {
    label: "Pilotage",
    items: [
      { label: "Tableau de bord", icon: House },
      { label: "Résultats", icon: ChartNoAxesCombined },
      { label: "Notes", icon: ClipboardCheck },
    ],
  },
  {
    label: "Vie scolaire",
    items: [
      { label: "Élèves", icon: UsersRound },
      { label: "Inscriptions et Paiement", icon: ClipboardCheck },
      { label: "Classes", icon: School },
      { label: "Enseignantes", icon: UserRound },
      { label: "Matières", icon: BookOpen },
    ],
  },
];

const initialSchoolClasses = ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"];
const resultSubjects = ["Français", "Mathématiques", "Lecture", "Sciences", "Écriture"];
const resultTerms = ["Trimestre 1", "Trimestre 2", "Trimestre 3"];
const demoResults = [
  { name: "Amina Nguema", className: "CP", grades: [15, 14, 16, 13, 15], attendance: 98 },
  { name: "David Mba", className: "CP", grades: [11, 12, 10, 13, 11], attendance: 93 },
  { name: "Sarah Ondo", className: "CE1", grades: [17, 16, 18, 15, 17], attendance: 100 },
  { name: "Yannick Obame", className: "CE1", grades: [9, 11, 10, 12, 9], attendance: 87 },
  { name: "Léa Essono", className: "CM1", grades: [14, 15, 13, 16, 14], attendance: 96 },
  { name: "Noah Mba", className: "CM1", grades: [12, 10, 11, 13, 12], attendance: 91 },
  { name: "Inès Nguema", className: "CM2", grades: [18, 17, 16, 18, 17], attendance: 98 },
  { name: "Pauline Eya", className: "CM2", grades: [8, 10, 9, 11, 10], attendance: 84 },
];
const termAdjustments = [0, 0.6, 1.1];
const pageThemes = {
  "Tableau de bord": ["#347fe0", "#68a5f5", "#eaf3ff"],
  "Élèves": ["#0d9488", "#34c6ae", "#e4f8f4"],
  "Inscriptions et Paiement": ["#e8753d", "#f5a04d", "#fff0e5"],
  "Classes": ["#7655d9", "#a27bee", "#f0eaff"],
  "Enseignantes": ["#d94f8b", "#f17ca8", "#ffedf4"],
  "Matières": ["#188caf", "#38b9d2", "#e5f7fb"],
  "Résultats": ["#c58616", "#e9b43f", "#fff5d9"],
  "Notes": ["#c58616", "#e9b43f", "#fff5d9"],
};

function getRecentMonths() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    return {
      month: date.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      monthIndex: date.getMonth(),
      year: date.getFullYear(),
    };
  });
}

function parseFrenchDate(value) {
  const parts = value.split("/").map((part) => part.trim());
  if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) return null;
  const [dayText, monthText, yearText] = parts;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${yearText}-${monthText}-${dayText}`;
}

function formatFrenchDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function getSubjectCoefficients(subject, classNames) {
  const coefficients = { ...subject.coefficients };
  if (subject.coefficient !== undefined && !subject.coefficients) {
    const legacyClassName = subject.className || classNames[0];
    if (legacyClassName && coefficients[legacyClassName] === undefined) {
      coefficients[legacyClassName] = subject.coefficient;
    }
  }
  return coefficients;
}

function getSubjectRequirement(subject, className) {
  return subject.requirements?.[className] || subject.requirement || "required";
}

const STORAGE_KEY = "gestwatara:data:v1";

function readStoredSnapshot() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

function getDefaultClassStudents() {
  return Object.fromEntries(initialSchoolClasses.map((className) => [className, []]));
}

function getDefaultClassFees() {
  return Object.fromEntries(initialSchoolClasses.map((className) => [className, { inscription: 0, tranche1: 0, tranche2: 0, tranche3: 0 }]));
}

function App() {
  const [storedSnapshot] = useState(readStoredSnapshot);
  const [authStatus, setAuthStatus] = useState("checking");
  const [authUser, setAuthUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [page, setPage] = useState("Tableau de bord");
  const [schoolClasses, setSchoolClasses] = useState(() => (Array.isArray(storedSnapshot.schoolClasses) ? storedSnapshot.schoolClasses : initialSchoolClasses));
  const [selectedResultTerm, setSelectedResultTerm] = useState(0);
  const [selectedResultClass, setSelectedResultClass] = useState("Toutes les classes");
  const [selectedGradeTerm, setSelectedGradeTerm] = useState(0);
  const [selectedGradeClass, setSelectedGradeClass] = useState(initialSchoolClasses[0]);
  const [selectedGradeSubject, setSelectedGradeSubject] = useState("");
  const [gradeAssessments, setGradeAssessments] = useState(() => (Array.isArray(storedSnapshot.gradeAssessments) ? storedSnapshot.gradeAssessments : []));
  const [selectedGradeAssessmentId, setSelectedGradeAssessmentId] = useState("");
  const [showCreateAssessmentForm, setShowCreateAssessmentForm] = useState(false);
  const [gradeAssessmentName, setGradeAssessmentName] = useState("");
  const [gradeAssessmentDateParts, setGradeAssessmentDateParts] = useState(["", "", ""]);
  const assessmentDateDayRef = useRef(null);
  const assessmentDateMonthRef = useRef(null);
  const assessmentDateYearRef = useRef(null);
  const [gradeAssessmentMax, setGradeAssessmentMax] = useState("20");
  const [gradeDrafts, setGradeDrafts] = useState({});
  const [gradeEntryLocked, setGradeEntryLocked] = useState(false);
  const [selectedGradeStudentKey, setSelectedGradeStudentKey] = useState("");
  const [gradeStudentQuery, setGradeStudentQuery] = useState("");
  const [gradeStudentSuggestionsOpen, setGradeStudentSuggestionsOpen] = useState(false);
  const [activeGradeStudentSuggestion, setActiveGradeStudentSuggestion] = useState(0);
  const [gradeStudentSearch, setGradeStudentSearch] = useState("");
  const [gradeStatusFilter, setGradeStatusFilter] = useState("all");
  const [demoResultEntries, setDemoResultEntries] = useState(() => (Array.isArray(storedSnapshot.demoResultEntries) ? storedSnapshot.demoResultEntries : demoResults));
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("Toutes les classes");
  const [studentStatusFilter, setStudentStatusFilter] = useState("Tous les statuts");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentClassFilter, setEnrollmentClassFilter] = useState("Toutes les classes");
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState("Tous");
  const [classStudents, setClassStudents] = useState(() => ({ ...getDefaultClassStudents(), ...(storedSnapshot.classStudents && typeof storedSnapshot.classStudents === "object" ? storedSnapshot.classStudents : {}) }));
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [editingClass, setEditingClass] = useState(null);
  const [classEditNotice, setClassEditNotice] = useState("");
  const [showClassAddForm, setShowClassAddForm] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [showStudentAddForm, setShowStudentAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudentNotice, setNewStudentNotice] = useState("");
  const [studentPhotoError, setStudentPhotoError] = useState("");
  const [newStudent, setNewStudent] = useState({ lastName: "", firstName: "", age: "", gender: "", className: "SIL", enrollmentStatus: "pending", responsible: "", responsiblePhone: "", profileImage: "" });
  const [showTeacherAddForm, setShowTeacherAddForm] = useState(false);
  const [teachers, setTeachers] = useState(() => (Array.isArray(storedSnapshot.teachers) ? storedSnapshot.teachers : []));
  const [editingTeacherIndex, setEditingTeacherIndex] = useState(null);
  const [teacherNotice, setTeacherNotice] = useState("");
  const [teacherPhotoError, setTeacherPhotoError] = useState("");
  const [newTeacher, setNewTeacher] = useState({ lastName: "", firstName: "", experience: "", diploma: "", phone: "", username: "", accessCode: "", className: "SIL", profileImage: "" });
  const [selectedTeacherMessage, setSelectedTeacherMessage] = useState(null);
  const [showSubjectAddForm, setShowSubjectAddForm] = useState(false);
  const [subjects, setSubjects] = useState(() => (Array.isArray(storedSnapshot.subjects) ? storedSnapshot.subjects : []));
  const [editingSubjectIndex, setEditingSubjectIndex] = useState(null);
  const [editingSubject, setEditingSubject] = useState({ name: "", requirement: "required", coefficient: "1" });
  const [editingSubjectCoefficientIndex, setEditingSubjectCoefficientIndex] = useState(null);
  const [subjectCoefficientDraft, setSubjectCoefficientDraft] = useState({ className: initialSchoolClasses[0], coefficient: "", requirement: "required" });
  const [subjectNotice, setSubjectNotice] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newSubjectClasses, setNewSubjectClasses] = useState([]);
  const [newSubjectRequirements, setNewSubjectRequirements] = useState({});
  const [newSubjectCoefficients, setNewSubjectCoefficients] = useState({});
  const [blinkingSubjectClass, setBlinkingSubjectClass] = useState("");
  const [selectedEnrollmentStudent, setSelectedEnrollmentStudent] = useState(null);
  const [selectedResponsibleStudent, setSelectedResponsibleStudent] = useState(null);
  const [selectedProfileImage, setSelectedProfileImage] = useState(null);
  const [studentTranches, setStudentTranches] = useState(() => (storedSnapshot.studentTranches && typeof storedSnapshot.studentTranches === "object" ? storedSnapshot.studentTranches : {}));
  const [classFees, setClassFees] = useState(() => ({ ...getDefaultClassFees(), ...(storedSnapshot.classFees && typeof storedSnapshot.classFees === "object" ? storedSnapshot.classFees : {}) }));
  const [studentPayments, setStudentPayments] = useState(() => (storedSnapshot.studentPayments && typeof storedSnapshot.studentPayments === "object" ? storedSnapshot.studentPayments : {}));
  const [paymentHistory, setPaymentHistory] = useState(() => (storedSnapshot.paymentHistory && typeof storedSnapshot.paymentHistory === "object" ? storedSnapshot.paymentHistory : {}));
  const [showClassFeesConfig, setShowClassFeesConfig] = useState(false);
  const [editingClassFee, setEditingClassFee] = useState(null);
  const [schoolingPaymentAmount, setSchoolingPaymentAmount] = useState("");
  const [schoolingPaymentMessage, setSchoolingPaymentMessage] = useState("");
  const [schoolingShowFeesConfig, setSchoolingShowFeesConfig] = useState(false);

  useEffect(() => {
    const snapshot = {
      schoolClasses,
      classStudents,
      teachers,
      subjects,
      gradeAssessments,
      demoResultEntries,
      studentTranches,
      classFees,
      studentPayments,
      paymentHistory,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Storage full or unavailable: keep the app usable without persistence.
    }
  }, [schoolClasses, classStudents, teachers, subjects, gradeAssessments, demoResultEntries, studentTranches, classFees, studentPayments, paymentHistory]);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me/", { credentials: "include" });
        if (response.status === 401) {
          if (active) setAuthStatus("unauthenticated");
          return;
        }
        if (!response.ok) throw new Error(`Impossible de vérifier la session (HTTP ${response.status}).`);
        const payload = await response.json();
        if (active) {
          setAuthUser(payload.user);
          setAuthStatus("authenticated");
        }
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : "Le serveur d’authentification est inaccessible.");
          setAuthStatus("error");
        }
      }
    }
    checkSession();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedProfileImage) return undefined;
    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedProfileImage(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedProfileImage]);

  useEffect(() => {
    if (!selectedClassDetails) return undefined;
    function closeClassDetailsOnEscape(event) {
      if (event.key === "Escape") setSelectedClassDetails(null);
    }
    window.addEventListener("keydown", closeClassDetailsOnEscape);
    return () => window.removeEventListener("keydown", closeClassDetailsOnEscape);
  }, [selectedClassDetails]);

  useEffect(() => {
    if (!selectedTeacherMessage) return undefined;
    function closeTeacherMessageOnEscape(event) {
      if (event.key === "Escape") setSelectedTeacherMessage(null);
    }
    window.addEventListener("keydown", closeTeacherMessageOnEscape);
    return () => window.removeEventListener("keydown", closeTeacherMessageOnEscape);
  }, [selectedTeacherMessage]);

  async function getCsrfToken() {
    const response = await fetch("/api/auth/csrf/", { credentials: "include" });
    if (!response.ok) throw new Error(`Impossible de préparer la connexion (HTTP ${response.status}).`);
    const payload = await response.json();
    if (typeof payload.csrfToken !== "string" || !payload.csrfToken) {
      throw new Error("Le serveur n’a pas fourni le jeton de sécurité requis.");
    }
    return payload.csrfToken;
  }

  async function submitLogin(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    setAuthError("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch("/api/auth/login/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || `Connexion refusée (HTTP ${response.status}).`);
      setAuthUser(payload.user);
      setAuthPassword("");
      setAuthStatus("authenticated");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "La connexion a échoué.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function submitLogout() {
    setAuthError("");
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch("/api/auth/logout/", {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRFToken": csrfToken },
      });
      if (!response.ok) throw new Error(`La déconnexion a échoué (HTTP ${response.status}).`);
      setAuthUser(null);
      setAuthPassword("");
      setAuthStatus("unauthenticated");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "La déconnexion a échoué.");
    }
  }
  function renameSchoolClass(oldName, requestedName) {
    const newName = requestedName.trim();
    if (!newName) {
      setClassEditNotice("Le nom de la classe ne peut pas être vide.");
      return;
    }
    if (schoolClasses.some((className) => className !== oldName && className.toLocaleLowerCase("fr-FR") === newName.toLocaleLowerCase("fr-FR"))) {
      setClassEditNotice("Une classe porte déjà ce nom.");
      return;
    }
    if (newName === oldName) {
      setEditingClass(null);
      setClassEditNotice("");
      return;
    }

    setSchoolClasses((current) => current.map((className) => className === oldName ? newName : className));
    setSelectedClassDetails((current) => current === oldName ? newName : current);
    setClassStudents((current) => {
      const { [oldName]: renamedStudents, ...otherClasses } = current;
      return { ...otherClasses, [newName]: renamedStudents };
    });
    setTeachers((current) => current.map((teacher) => (
      teacher.className === oldName ? { ...teacher, className: newName } : teacher
    )));
    setSubjects((current) => current.map((subject) => {
      const coefficients = getSubjectCoefficients(subject, schoolClasses);
      if (coefficients[oldName] === undefined) return subject;
      coefficients[newName] = coefficients[oldName];
      delete coefficients[oldName];
      const requirements = { ...(subject.requirements || {}) };
      if (requirements[oldName]) {
        requirements[newName] = requirements[oldName];
        delete requirements[oldName];
      }
      return { ...subject, coefficients, requirements };
    }));
    setDemoResultEntries((current) => current.map((student) => (
      student.className === oldName ? { ...student, className: newName } : student
    )));
    setGradeAssessments((current) => current.map((assessment) => {
      const grades = { ...assessment.grades };
      classStudents[oldName].forEach((student, studentIndex) => {
        const oldKey = getStudentKey({ className: oldName, student, studentIndex });
        const newKey = getStudentKey({ className: newName, student, studentIndex });
        if (Object.hasOwn(grades, oldKey)) {
          grades[newKey] = grades[oldKey];
          if (oldKey !== newKey) delete grades[oldKey];
        }
      });
      return {
        ...assessment,
        className: assessment.className === oldName ? newName : assessment.className,
        grades,
      };
    }));
    setStudentTranches((current) => {
      const next = { ...current };
      classStudents[oldName].forEach((student, studentIndex) => {
        const oldKey = getStudentKey({ className: oldName, student, studentIndex });
        const newKey = getStudentKey({ className: newName, student, studentIndex });
        if (current[oldKey]) next[newKey] = current[oldKey];
        if (oldKey !== newKey) delete next[oldKey];
      });
      return next;
    });
    setSelectedEnrollmentStudent((current) => (
      current?.className === oldName ? { ...current, className: newName } : current
    ));
    setSelectedResponsibleStudent((current) => {
      const selectedEntry = classStudents[oldName]
        .map((student, studentIndex) => ({ className: oldName, student, studentIndex }))
        .find((entry) => getStudentKey(entry) === current);
      return selectedEntry ? getStudentKey({ ...selectedEntry, className: newName }) : current;
    });
    setNewStudent((current) => current.className === oldName ? { ...current, className: newName } : current);
    setNewTeacher((current) => current.className === oldName ? { ...current, className: newName } : current);
    setNewSubjectClasses((current) => current.map((item) => item === oldName ? newName : item));
    setNewSubjectCoefficients((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key === oldName ? newName : key, value])));
    setNewSubjectRequirements((current) => Object.fromEntries(Object.entries(current).map(([key, value]) => [key === oldName ? newName : key, value])));
    setEditingSubject((current) => current.className === oldName ? { ...current, className: newName } : current);
    setSubjectCoefficientDraft((current) => current.className === oldName ? { ...current, className: newName } : current);
    setStudentClassFilter((current) => current === oldName ? newName : current);
    setEnrollmentClassFilter((current) => current === oldName ? newName : current);
    setSelectedResultClass((current) => current === oldName ? newName : current);
    setSelectedGradeClass((current) => current === oldName ? newName : current);
    setEditingStudent((current) => {
      if (current?.className !== oldName) return current;
      const entry = classStudents[oldName][current.studentIndex];
      return entry
        ? { ...current, className: newName, studentKey: getStudentKey({ className: newName, student: entry, studentIndex: current.studentIndex }) }
        : current;
    });
    setEditingClass(null);
    setClassEditNotice("");
  }

  function addSchoolClass(event) {
    event.preventDefault();
    const className = newClassName.trim();
    if (!className) {
      setClassEditNotice("Le nom de la classe ne peut pas être vide.");
      return;
    }
    if (schoolClasses.some((existingName) => existingName.toLocaleLowerCase("fr-FR") === className.toLocaleLowerCase("fr-FR"))) {
      setClassEditNotice("Une classe porte déjà ce nom.");
      return;
    }
    setSchoolClasses((current) => [...current, className]);
    setClassStudents((current) => ({ ...current, [className]: [] }));
    setNewClassName("");
    setShowClassAddForm(false);
    setClassEditNotice("");
  }

  function removeSchoolClass(className) {
    if (schoolClasses.length <= 1) {
      setClassEditNotice("L’établissement doit conserver au moins une classe.");
      return;
    }
    const students = classStudents[className] || [];
    const classAssessments = gradeAssessments.filter((assessment) => assessment.className === className);
    const teacher = teachers.find((item) => item.className === className);
    const confirmed = window.confirm(
      `Supprimer la classe « ${className} » ? Ses ${students.length} élève${students.length === 1 ? "" : "s"}, ${classAssessments.length} évaluation${classAssessments.length === 1 ? "" : "s"} et les notes associées seront supprimés. ${teacher ? `Le profil de ${teacher.firstName} ${teacher.lastName} sera conservé sans classe affectée.` : ""}`,
    );
    if (!confirmed) return;

    const remainingClasses = schoolClasses.filter((existingName) => existingName !== className);
    const fallbackClass = remainingClasses[0];
    const deletedAssessmentIds = new Set(classAssessments.map(({ id }) => id));
    const deletedStudentKeys = new Set(students.map((student, studentIndex) => getStudentKey({ className, student, studentIndex })));

    setSchoolClasses(remainingClasses);
    setClassStudents((current) => {
      const remainingStudents = { ...current };
      delete remainingStudents[className];
      return remainingStudents;
    });
    setTeachers((current) => current.map((item) => (
      item.className === className ? { ...item, className: "" } : item
    )));
    setSubjects((current) => current.map((subject) => {
      const coefficients = getSubjectCoefficients(subject, schoolClasses);
      delete coefficients[className];
      const requirements = { ...(subject.requirements || {}) };
      delete requirements[className];
      return { ...subject, coefficients, requirements };
    }));
    setDemoResultEntries((current) => current.filter((student) => student.className !== className));
    setGradeAssessments((current) => current.filter((assessment) => assessment.className !== className));
    setSelectedGradeAssessmentId((current) => deletedAssessmentIds.has(current) ? "" : current);
    if (deletedAssessmentIds.has(selectedGradeAssessmentId)) setSelectedGradeStudentKey("");
    setGradeDrafts((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => ![...deletedAssessmentIds].some((id) => key.startsWith(`${id}::`))),
    ));
    setStudentTranches((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => !deletedStudentKeys.has(key)),
    ));
    setSelectedClassDetails(null);
    setEditingClass(null);
    setClassEditNotice("");
    setStudentClassFilter((current) => current === className ? "Toutes les classes" : current);
    setEnrollmentClassFilter((current) => current === className ? "Toutes les classes" : current);
    setSelectedResultClass((current) => current === className ? "Toutes les classes" : current);
    setSelectedGradeClass((current) => current === className ? fallbackClass : current);
    setNewStudent((current) => current.className === className ? { ...current, className: fallbackClass } : current);
    setNewTeacher((current) => current.className === className ? { ...current, className: "" } : current);
    setNewSubjectClasses((current) => current.filter((item) => item !== className));
    setNewSubjectCoefficients((current) => {
      const next = { ...current };
      delete next[className];
      return next;
    });
    setNewSubjectRequirements((current) => {
      const next = { ...current };
      delete next[className];
      return next;
    });
    setEditingSubject((current) => current.className === className ? { ...current, className: fallbackClass } : current);
    setSubjectCoefficientDraft((current) => current.className === className ? { className: fallbackClass, coefficient: "" } : current);
    setSelectedEnrollmentStudent((current) => current?.className === className ? null : current);
    setSelectedResponsibleStudent((current) => {
      const removedStudent = students.find((student, studentIndex) =>
        getStudentKey({ className, student, studentIndex }) === current,
      );
      return removedStudent ? null : current;
    });
    if (editingStudent?.className === className) {
      setEditingStudent(null);
      setShowStudentAddForm(false);
    }
  }

  function removeStudent(className, studentIndex) {
    const removedStudent = classStudents[className][studentIndex];
    if (!removedStudent) return;
    const removedKey = getStudentKey({ className, student: removedStudent, studentIndex });
    if (newStudentNotice.includes(`${removedStudent.firstName} ${removedStudent.lastName}`)) {
      setNewStudentNotice("");
    }
    setClassStudents((current) => ({
      ...current,
      [className]: current[className].filter((_, index) => index !== studentIndex),
    }));
    setStudentTranches((current) => {
      const next = {};
      schoolClasses.forEach((currentClass) => {
        classStudents[currentClass].forEach((student, index) => {
          if (currentClass === className && index === studentIndex) return;
          const previousKey = getStudentKey({ className: currentClass, student, studentIndex: index });
          const nextIndex = currentClass === className && index > studentIndex ? index - 1 : index;
          const nextKey = getStudentKey({ className: currentClass, student, studentIndex: nextIndex });
          if (current[previousKey]) next[nextKey] = current[previousKey];
        });
      });
      return next;
    });
    setSelectedEnrollmentStudent((current) => {
      if (!current) return current;
      if (getStudentKey(current) === removedKey) return null;
      return current.className === className && current.studentIndex > studentIndex
        ? { ...current, studentIndex: current.studentIndex - 1 }
        : current;
    });
    setSelectedResponsibleStudent((current) => {
      if (current === removedKey) return null;
      for (const currentClass of schoolClasses) {
        for (const [index, student] of classStudents[currentClass].entries()) {
          if (currentClass === className && index === studentIndex) continue;
          const previousKey = getStudentKey({ className: currentClass, student, studentIndex: index });
          if (current !== previousKey) continue;
          const nextIndex = currentClass === className && index > studentIndex ? index - 1 : index;
          return getStudentKey({ className: currentClass, student, studentIndex: nextIndex });
        }
      }
      return current;
    });
  }

  function updateNewStudent(field, value) {
    setNewStudent((current) => ({ ...current, [field]: value }));
    setNewStudentNotice("");
    setStudentPhotoError("");
  }

  function handleStudentProfileImage(event) {
    const [file] = event.target.files || [];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStudentPhotoError("Choisissez une image au format JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStudentPhotoError("L’image ne doit pas dépasser 5 Mo.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setStudentPhotoError("Impossible de lire cette image. Choisissez un autre fichier.");
        return;
      }
      updateNewStudent("profileImage", reader.result);
    };
    reader.onerror = () => setStudentPhotoError("Impossible de lire cette image. Vérifiez le fichier et réessayez.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function cancelStudentForm() {
    if (editingStudent) {
      setNewStudent({ lastName: "", firstName: "", age: "", gender: "", className: editingStudent.className, enrollmentStatus: "pending", responsible: "", responsiblePhone: "", profileImage: "" });
    } else {
      setNewStudent({ lastName: "", firstName: "", age: "", gender: "", className: newStudent.className, enrollmentStatus: "pending", responsible: "", responsiblePhone: "", profileImage: "" });
    }
    setStudentPhotoError("");
    setShowStudentAddForm(false);
    setEditingStudent(null);
  }

  function startEditingStudent(entry) {
    setEditingStudent({
      className: entry.className,
      studentIndex: entry.studentIndex,
      studentKey: getStudentKey(entry),
    });
    setNewStudent({ ...entry.student, profileImage: entry.student.profileImage || "", className: entry.className });
    setNewStudentNotice("");
    setStudentPhotoError("");
    setSelectedResponsibleStudent(null);
    setShowStudentAddForm(true);
  }

  function submitNewTeacher(event) {
    event.preventDefault();
    if (!newTeacher.lastName.trim() || !newTeacher.firstName.trim() || newTeacher.experience === "" || !newTeacher.diploma.trim() || !newTeacher.phone.trim() || !newTeacher.className) return;
    const updatedTeacher = {
      ...newTeacher,
      lastName: newTeacher.lastName.trim(),
      firstName: newTeacher.firstName.trim(),
      diploma: newTeacher.diploma.trim(),
      phone: newTeacher.phone.trim(),
    };
    if (editingTeacherIndex !== null) {
      setTeachers((current) => current.map((teacher, index) => (
        index === editingTeacherIndex ? updatedTeacher : teacher
      )));
      setTeacherNotice(`${updatedTeacher.firstName} ${updatedTeacher.lastName} a été modifié.`);
      setEditingTeacherIndex(null);
      setShowTeacherAddForm(false);
      setNewTeacher({ lastName: "", firstName: "", experience: "", diploma: "", phone: "", username: "", accessCode: "", className: schoolClasses[0], profileImage: "" });
      return;
    }
    setTeachers((current) => [...current, updatedTeacher]);
    setTeacherNotice(`${updatedTeacher.firstName} ${updatedTeacher.lastName} a été ajouté à l’équipe.`);
    setNewTeacher({ lastName: "", firstName: "", experience: "", diploma: "", phone: "", username: "", accessCode: "", className: schoolClasses[0], profileImage: "" });
    setShowTeacherAddForm(false);
    setEditingTeacherIndex(null);
  }

  function startEditingTeacher(index) {
    setNewTeacher({ profileImage: "", ...teachers[index] });
    setEditingTeacherIndex(index);
    setTeacherNotice("");
    setTeacherPhotoError("");
    setShowTeacherAddForm(true);
  }

  function handleTeacherProfileImage(event) {
    const [file] = event.target.files || [];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setTeacherPhotoError("Choisissez une image au format JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setTeacherPhotoError("L’image ne doit pas dépasser 5 Mo.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setTeacherPhotoError("Impossible de lire cette image. Choisissez un autre fichier.");
        return;
      }
      setNewTeacher((current) => ({ ...current, profileImage: reader.result }));
      setTeacherPhotoError("");
    };
    reader.onerror = () => setTeacherPhotoError("Impossible de lire cette image. Vérifiez le fichier et réessayez.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function removeTeacher(teacherIndex) {
    setTeachers((current) => current.filter((_, index) => index !== teacherIndex));
    if (editingTeacherIndex === teacherIndex) {
      setEditingTeacherIndex(null);
      setShowTeacherAddForm(false);
      setNewTeacher({ lastName: "", firstName: "", experience: "", diploma: "", phone: "", username: "", accessCode: "", className: schoolClasses[0], profileImage: "" });
    } else if (editingTeacherIndex !== null && editingTeacherIndex > teacherIndex) {
      setEditingTeacherIndex((current) => current - 1);
    }
  }

  function toggleNewSubjectClass(className) {
    const isSelected = newSubjectClasses.includes(className);
    if (isSelected) {
      setNewSubjectClasses((current) => current.filter((item) => item !== className));
    } else {
      setNewSubjectClasses((current) => [...current, className]);
      setNewSubjectRequirements((current) => ({ ...current, [className]: current[className] || "required" }));
      setBlinkingSubjectClass(className);
      window.setTimeout(() => {
        setBlinkingSubjectClass((current) => (current === className ? "" : current));
      }, 1800);
    }
    setSubjectNotice("");
  }

  function submitNewSubject(event) {
    event.preventDefault();
    const subject = newSubject.trim();
    if (!subject) return;
    if (!newSubjectClasses.length) {
      setSubjectNotice("Sélectionnez au moins une classe pour cette matière.");
      return;
    }
    const coefficients = {};
    for (const className of newSubjectClasses) {
      const coefficient = Number(newSubjectCoefficients[className]);
      if (!Number.isFinite(coefficient) || coefficient <= 0) {
        setSubjectNotice(`Le coefficient de la classe ${className} doit être un nombre supérieur à zéro.`);
        setBlinkingSubjectClass(className);
        return;
      }
      coefficients[className] = coefficient;
    }
    if (subjects.some((item) => item.name.toLocaleLowerCase("fr-FR") === subject.toLocaleLowerCase("fr-FR"))) {
      setSubjectNotice("Cette matière existe déjà dans le programme.");
      return;
    }
    const requirements = {};
    for (const className of newSubjectClasses) {
      requirements[className] = newSubjectRequirements[className] || "required";
    }
    setSubjects((current) => [...current, {
      name: subject,
      coefficients,
      requirements,
      requirement: requirements[newSubjectClasses[0]] || "required",
    }]);
    setSelectedGradeSubject((current) => current || subject);
    setNewSubject("");
    setNewSubjectClasses([]);
    setNewSubjectCoefficients({});
    setNewSubjectRequirements({});
    setBlinkingSubjectClass("");
    setSubjectNotice("");
    setShowSubjectAddForm(false);
  }

  function saveSubjectEdit(event, index) {
    event.preventDefault();
    const name = editingSubject.name.trim();
    const currentSubject = subjects[index];
    if (!name || !currentSubject) return;
    if (subjects.some((subject, subjectIndex) => subjectIndex !== index && subject.name.toLocaleLowerCase("fr-FR") === name.toLocaleLowerCase("fr-FR"))) {
      setSubjectNotice("Une autre matière porte déjà ce nom.");
      return;
    }
    setSubjects((current) => current.map((subject, subjectIndex) => {
      if (subjectIndex !== index) return subject;
      return { ...subject, name };
    }));
    if (currentSubject.name !== name) {
      setGradeAssessments((current) => current.map((assessment) => (
        assessment.subject === currentSubject.name ? { ...assessment, subject: name } : assessment
      )));
      setSelectedGradeSubject((current) => current === currentSubject.name ? name : current);
    }
    setEditingSubjectIndex(null);
    setSubjectNotice("");
  }

  function saveSubjectCoefficient(event, index) {
    event.preventDefault();
    const coefficient = Number(subjectCoefficientDraft.coefficient);
    if (!Number.isFinite(coefficient) || coefficient <= 0) {
      setSubjectNotice("Le coefficient doit être un nombre supérieur à zéro.");
      return;
    }
    if (!schoolClasses.includes(subjectCoefficientDraft.className)) {
      setSubjectNotice("Sélectionnez une classe valide.");
      return;
    }
    setSubjects((current) => current.map((subject, subjectIndex) => {
      if (subjectIndex !== index) return subject;
      const coefficients = getSubjectCoefficients(subject, schoolClasses);
      coefficients[subjectCoefficientDraft.className] = coefficient;
      const requirements = { ...(subject.requirements || {}) };
      requirements[subjectCoefficientDraft.className] = subjectCoefficientDraft.requirement || "required";
      return { ...subject, coefficients, requirements };
    }));
    setEditingSubjectCoefficientIndex(null);
    setSubjectNotice("");
  }

  function removeSubject(index) {
    const subject = subjects[index];
    if (!subject) return;
    const hasAssessments = gradeAssessments.some((assessment) => assessment.subject === subject.name);
    const warning = hasAssessments
      ? `Supprimer la matière « ${subject.name} » du catalogue ? Les évaluations et notes déjà enregistrées seront conservées.`
      : `Supprimer la matière « ${subject.name} » du catalogue ?`;
    if (!window.confirm(warning)) return;

    setSubjects((current) => current.filter((_, subjectIndex) => subjectIndex !== index));
    setSelectedGradeSubject((current) => current === subject.name ? "" : current);
    if (editingSubjectIndex === index) setEditingSubjectIndex(null);
    else if (editingSubjectIndex !== null && editingSubjectIndex > index) {
      setEditingSubjectIndex((current) => current - 1);
    }
    setSubjectNotice("");
  }

  function submitNewStudent(event) {
    event.preventDefault();
    if (!newStudent.lastName.trim() || !newStudent.firstName.trim() || !newStudent.gender || !newStudent.age || !newStudent.responsible.trim() || !newStudent.responsiblePhone.trim()) return;

    const { className, ...student } = newStudent;
    if (editingStudent) {
      const { className: oldClassName, studentIndex, studentKey } = editingStudent;
      const originalStudent = classStudents[oldClassName][studentIndex];
      if (!originalStudent) {
        cancelStudentForm();
        setNewStudentNotice("Cet élève n’est plus disponible. Actualisez la liste et réessayez.");
        return;
      }

      const updatedStudent = { ...originalStudent, ...student };
      const updatedStudentIndex = className === oldClassName ? studentIndex : classStudents[className].length;
      setClassStudents((current) => {
        if (className === oldClassName) {
          return {
            ...current,
            [className]: current[className].map((currentStudent, index) => (
              index === studentIndex ? updatedStudent : currentStudent
            )),
          };
        }

        return {
          ...current,
          [oldClassName]: current[oldClassName].filter((_, index) => index !== studentIndex),
          [className]: [...current[className], updatedStudent],
        };
      });

      const updatedKey = getStudentKey({ className, student: updatedStudent, studentIndex: updatedStudentIndex });
      setStudentTranches((current) => {
        const next = { ...current };
        if (current[studentKey]) next[updatedKey] = current[studentKey];
        if (studentKey !== updatedKey) delete next[studentKey];
        return next;
      });
      setSelectedEnrollmentStudent(null);
      setEditingStudent(null);
      setShowStudentAddForm(false);
      setNewStudent({ lastName: "", firstName: "", age: "", gender: "", className, enrollmentStatus: "pending", responsible: "", responsiblePhone: "", profileImage: "" });
      setStudentPhotoError("");
      setNewStudentNotice(`${student.firstName} ${student.lastName} a été modifié${student.gender === "F" ? "e" : ""}.`);
      return;
    }

    setClassStudents((current) => ({ ...current, [className]: [...current[className], { ...student, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] }));
    setNewStudent({ lastName: "", firstName: "", age: "", gender: "", className, enrollmentStatus: "pending", responsible: "", responsiblePhone: "", profileImage: "" });
    setShowStudentAddForm(false);
    setNewStudentNotice(`${student.firstName} ${student.lastName} a été ajouté en ${className}.`);
  }

  const registeredStudents = schoolClasses.flatMap((className) =>
    classStudents[className].map((student, studentIndex) => ({ className, student, studentIndex })),
  );
  const enrollmentStudents = registeredStudents.filter(({ student }) => student.enrollmentStatus);
  const validStudents = enrollmentStudents.filter(({ student }) => student.enrollmentStatus === "valid");
  const waitingStudents = enrollmentStudents.filter(({ student }) => student.enrollmentStatus === "pending");
  const assignedStudents = validStudents.filter(({ className, student, studentIndex }) => {
    const payments = getStudentPayment(getStudentKey({ className, student, studentIndex }));
    return (payments.tranche1 || 0) > 0 || (payments.tranche2 || 0) > 0 || (payments.tranche3 || 0) > 0;
  });
  const filteredEnrollmentStudents = enrollmentStudents
    .filter(({ className, student }) => {
      const searchTerm = enrollmentSearch.trim().toLocaleLowerCase("fr-FR");
      const studentText = [
        student.firstName,
        student.lastName,
        student.responsible,
        student.responsiblePhone,
        className,
      ].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR");
      return (enrollmentClassFilter === "Toutes les classes" || className === enrollmentClassFilter)
        && (enrollmentStatusFilter === "Tous"
          || (enrollmentStatusFilter === "pending" && student.enrollmentStatus === "pending")
          || (enrollmentStatusFilter === "valid" && student.enrollmentStatus === "valid"))
        && (!searchTerm || studentText.includes(searchTerm));
    })
    .sort((left, right) => `${left.student.lastName} ${left.student.firstName}`.localeCompare(
      `${right.student.lastName} ${right.student.firstName}`,
      "fr-FR",
    ));
  const filteredStudents = registeredStudents
    .filter(({ className, student }) => {
      const searchTerm = studentSearch.trim().toLocaleLowerCase("fr-FR");
      const studentStatus = student.enrollmentStatus || "incomplete";
      const searchableText = [
        student.firstName,
        student.lastName,
        student.responsible,
        student.responsiblePhone,
        className,
      ].filter(Boolean).join(" ").toLocaleLowerCase("fr-FR");
      return (studentClassFilter === "Toutes les classes" || className === studentClassFilter)
        && (studentStatusFilter === "Tous les statuts" || studentStatus === studentStatusFilter)
        && (!searchTerm || searchableText.includes(searchTerm));
    })
    .sort((left, right) => `${left.student.lastName} ${left.student.firstName}`.localeCompare(
      `${right.student.lastName} ${right.student.firstName}`,
      "fr-FR",
    ));
  const selectedGradeAssessment = gradeAssessments.find(({ id }) => id === selectedGradeAssessmentId) || null;
  const gradeSubjectOptions = subjects.map(({ name }) => name);
  const gradeSubjectClassOptions = selectedGradeClass ? subjects
    .filter((subject) => {
      const coefficients = getSubjectCoefficients(subject, schoolClasses);
      return coefficients[selectedGradeClass] !== undefined;
    })
    .map(({ name }) => name)
    .sort()
    : [];
  const gradebookClassStudents = registeredStudents
    .filter(({ className }) => selectedGradeClass === "Toutes les classes" || className === selectedGradeClass)
    .filter(({ className }) => !selectedGradeAssessment || selectedGradeAssessment.className === "Toutes les classes" || className === selectedGradeAssessment.className)
    .sort((left, right) => `${left.student.lastName} ${left.student.firstName}`.localeCompare(
      `${right.student.lastName} ${right.student.firstName}`,
      "fr-FR",
    ));
  const gradebookStudents = gradebookClassStudents.filter((entry) => {
    const fullName = `${entry.student.firstName || ""} ${entry.student.lastName || ""}`.toLocaleLowerCase("fr-FR");
    const hasGrade = selectedGradeAssessment && Object.hasOwn(selectedGradeAssessment.grades, getStudentKey(entry));
    return (!gradeStudentSearch.trim() || fullName.includes(gradeStudentSearch.trim().toLocaleLowerCase("fr-FR")))
      && (gradeStatusFilter === "all" || (gradeStatusFilter === "entered" ? hasGrade : !hasGrade));
  });
  const gradebookStudentSuggestions = gradebookClassStudents
    .filter(({ student }) => {
      const fullName = `${student.lastName || ""} ${student.firstName || ""}`.trim();
      const normalizedName = fullName.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedQuery = gradeStudentQuery.trim().toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return !normalizedQuery || normalizedName.includes(normalizedQuery);
    })
    .slice(0, 8);
  const selectedGradeStudentEntry = gradebookClassStudents.find((entry) => getStudentKey(entry) === selectedGradeStudentKey) || null;
  const gradebookEnteredCount = gradebookClassStudents.filter((entry) =>
    selectedGradeAssessment && Object.hasOwn(selectedGradeAssessment.grades, getStudentKey(entry)),
  ).length;
  const gradebookScores = gradebookClassStudents
    .filter((entry) => selectedGradeAssessment && Object.hasOwn(selectedGradeAssessment.grades, getStudentKey(entry)))
    .map((entry) => Number(selectedGradeAssessment.grades[getStudentKey(entry)]) / selectedGradeAssessment.maxScore * 20);
  const gradebookAverage = gradebookScores.length ? gradebookScores.reduce((total, grade) => total + grade, 0) / gradebookScores.length : null;
  const gradeDraftKey = selectedGradeAssessment && selectedGradeStudentEntry ? `${selectedGradeAssessment.id}::${selectedGradeStudentKey}` : "";
  const gradeDraftValue = gradeDraftKey ? gradeDrafts[gradeDraftKey] : "";
  const gradeDraftOver20 = gradeDraftValue !== "" && gradeDraftValue !== undefined && Number.isFinite(Number(gradeDraftValue)) ? Number(gradeDraftValue) / selectedGradeAssessment.maxScore * 20 : null;
  const gradebookProgress = gradebookClassStudents.length ? Math.round((gradebookEnteredCount / gradebookClassStudents.length) * 100) : 0;
  const hasNewSubjectName = newSubject.trim().length > 0;
  const femaleStudentCount = registeredStudents.filter(({ student }) => student.gender === "F").length;
  const maleStudentCount = registeredStudents.filter(({ student }) => student.gender === "M").length;
  const assignedClassCount = new Set(teachers.map((teacher) => teacher.className).filter(Boolean)).size;
  const recentMonths = getRecentMonths();
  const monthlyEnrollments = recentMonths.map(({ monthIndex, year }) =>
    registeredStudents.filter(({ student }) => {
      if (!student.createdAt) return false;
      const createdAt = new Date(student.createdAt);
      return createdAt.getMonth() === monthIndex && createdAt.getFullYear() === year;
    }).length,
  );
  const classDistribution = schoolClasses.map((className) => ({
    className,
    count: classStudents[className].length,
  }));
  const selectedClassStudents = selectedClassDetails ? classStudents[selectedClassDetails] || [] : [];
  const selectedClassTeacher = selectedClassDetails
    ? teachers.find((teacher) => teacher.className === selectedClassDetails)
    : null;
  const selectedClassGirls = selectedClassStudents.filter((student) => student.gender === "F").length;
  const selectedClassBoys = selectedClassStudents.filter((student) => student.gender === "M").length;
  const maxClassCount = Math.max(1, ...classDistribution.map(({ count }) => count));
  const maxMonthlyCount = Math.max(1, ...monthlyEnrollments);
  const chartPoints = monthlyEnrollments
    .map((count, index) => `${40 + index * 100},${150 - (count / maxMonthlyCount) * 112}`)
    .join(" ");
  const latestStudents = [...registeredStudents]
    .sort((left, right) => new Date(right.student.createdAt || 0) - new Date(left.student.createdAt || 0))
    .slice(0, 5);
  const filteredDemoResults = demoResultEntries.filter(
    ({ className }) => selectedResultClass === "Toutes les classes" || className === selectedResultClass,
  );
  const resultStudents = filteredDemoResults.map((student) => {
      const adjustment = termAdjustments[selectedResultTerm];
      const grades = student.grades.map((grade) => Math.min(20, grade + adjustment));
      const average = grades.reduce((total, grade) => total + grade, 0) / grades.length;
      return { ...student, grades, average };
    })
    .sort((left, right) => right.average - left.average);
  const resultAverage = resultStudents.length
    ? resultStudents.reduce((total, student) => total + student.average, 0) / resultStudents.length
    : 0;
  const subjectAverages = resultSubjects.map((subject, subjectIndex) => ({
    subject,
    average: resultStudents.length
      ? resultStudents.reduce((total, student) => total + student.grades[subjectIndex], 0) / resultStudents.length
      : 0,
  }));
  const resultSuccessCount = resultStudents.filter(({ average }) => average >= 10).length;
  const studentsToSupport = resultStudents.filter(({ average }) => average < 10);
  const resultAttendance = resultStudents.length
    ? resultStudents.reduce((total, student) => total + student.attendance, 0) / resultStudents.length
    : 0;
  const termAverageValues = termAdjustments.map((adjustment) => (
    filteredDemoResults.length
      ? filteredDemoResults.reduce((total, student) => (
        total + student.grades.reduce((sum, grade) => sum + Math.min(20, grade + adjustment), 0) / student.grades.length
      ), 0) / filteredDemoResults.length
      : 0
  ));

  function validateEnrollment(entry) {
    setClassStudents((current) => ({
      ...current,
      [entry.className]: current[entry.className].map((student, index) => (
        index === entry.studentIndex ? { ...student, enrollmentStatus: "valid" } : student
      )),
    }));
  }

  function renderSchoolingInterface() {
    const selectedEntry = selectedEnrollmentStudent;
    if (!selectedEntry) return null;
    
    const studentKey = getStudentKey(selectedEntry);
    const fees = getClassFees(selectedEntry.className);
    const payments = getStudentPayment(studentKey);
    const paymentStatus = getPaymentStatus(selectedEntry);
    const totalFees = getTotalFees(selectedEntry.className);
    const totalPaid = getTotalPaid(studentKey);
    const remainingBalance = totalFees - totalPaid;
    const fullName = `${selectedEntry.student.firstName || ""} ${selectedEntry.student.lastName || ""}`.trim();
    const paymentAmount = schoolingPaymentAmount;
    const setPaymentAmount = setSchoolingPaymentAmount;
    const paymentMessage = schoolingPaymentMessage;
    const setPaymentMessage = setSchoolingPaymentMessage;
    
    function handleRecordPayment(event) {
      event.preventDefault();
      const amount = Number(paymentAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setPaymentMessage("Veuillez saisir un montant valide.");
        return;
      }
      
      const result = recordPayment(studentKey, amount, selectedEntry.className);

      if (fees.inscription > 0 && (result.newPayments.inscription || 0) >= fees.inscription) {
        validateEnrollment(selectedEntry);
      }

      if (result.remaining > 0) {
        setPaymentMessage(`Paiement de ${result.distributed.toLocaleString("fr-FR")} FCFA enregistré. Excédent de ${result.remaining.toLocaleString("fr-FR")} FCFA (remboursement ou report).`);
      } else {
        setPaymentMessage(`Paiement de ${result.distributed.toLocaleString("fr-FR")} FCFA enregistré avec succès.`);
      }
      
      setPaymentAmount("");
      
      // Clear message after 5 seconds
      setTimeout(() => setPaymentMessage(""), 5000);
    }
    
    function formatAmount(amount) {
      return amount.toLocaleString("fr-FR") + " FCFA";
    }

    return (
      <div className="schooling-interface">
        <div className="schooling-interface-header">
          <div>
            <h2>Suivi des paiements — {fullName}</h2>
            <p>Classe : {selectedEntry.className} · Total dû : <strong>{formatAmount(totalFees)}</strong> · Payé : <strong>{formatAmount(totalPaid)}</strong> · Restant : <strong style={{ color: remainingBalance > 0 ? "#dc5148" : "#13795c" }}>{formatAmount(Math.max(0, remainingBalance))}</strong>{remainingBalance < 0 ? ` · Excédent : <strong>{formatAmount(Math.abs(remainingBalance))}</strong>` : ""}</p>
          </div>
          <div className="schooling-header-actions">
            <button type="button" className="schooling-fees-button" onClick={() => setSchoolingShowFeesConfig(true)}>
              <SlidersHorizontal size={16} /> Tarifs de la classe
            </button>
            <button type="button" className="schooling-close-button" onClick={() => setSelectedEnrollmentStudent(null)}>Fermer</button>
          </div>
        </div>
        
        {paymentMessage && <div className={`payment-message ${paymentMessage.includes("Excédent") ? "warning" : "success"}`}>{paymentMessage}</div>}
        
        <section className="panel fees-overview-panel">
          <div className="panel-header"><h2>Détail des frais ({selectedEntry.className})</h2></div>
          <div className="fees-breakdown">
            {[
              { key: "inscription", label: "Inscription", icon: ClipboardCheck },
              { key: "tranche1", label: "Tranche 1", icon: CalendarDays },
              { key: "tranche2", label: "Tranche 2", icon: CalendarDays },
              { key: "tranche3", label: "Tranche 3", icon: CalendarDays },
            ].map(({ key, label, icon: Icon }) => {
              const status = paymentStatus[key];
              const isPaid = status.paid >= status.owed && status.owed > 0;
              const isPartial = status.paid > 0 && status.paid < status.owed;
              return (
                <div key={key} className={`fee-item ${isPaid ? "paid" : isPartial ? "partial" : ""}`}>
                  <div className="fee-item-header">
                    <span className="fee-icon"><Icon size={16} /></span>
                    <span className="fee-label">{label}{isPaid ? <CheckCircle2 size={11} className="fee-status-symbol" /> : isPartial ? "..." : ""}</span>
                    <span className="fee-amount">{formatAmount(status.owed)}</span>
                  </div>
                  <div className="fee-progress">
                    <div className="fee-progress-track">
                      <span style={{ width: status.owed > 0 ? `${Math.min(100, (status.paid / status.owed) * 100)}%` : "0%" }} />
                    </div>
                    <div className="fee-progress-labels">
                      <span>Payé : {formatAmount(status.paid)}</span>
                      <span>Restant : {formatAmount(status.remaining)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="fees-total">
            <span>Total</span>
            <strong>{formatAmount(totalFees)}</strong>
          </div>
        </section>
        
        <section className="panel payment-record-panel">
          <div className="panel-header"><h2>Enregistrer un paiement</h2></div>
          <form onSubmit={handleRecordPayment} className="payment-form">
            <label>
              Montant reçu (FCFA)
              <input
                type="number"
                min="1"
                step="1"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Ex: 50000"
                autoFocus
                required
              />
            </label>
            <div className="payment-preview">
              <span>Aperçu de la répartition :</span>
              {(() => {
                const fees = getClassFees(selectedEntry.className);
                const payments = getStudentPayment(studentKey);
                let remaining = Number(paymentAmount) || 0;
                const distribution = [];
                const feeOrder = [
                  { key: 'inscription', label: 'Inscription', amount: fees.inscription },
                  { key: 'tranche1', label: 'Tranche 1', amount: fees.tranche1 },
                  { key: 'tranche2', label: 'Tranche 2', amount: fees.tranche2 },
                  { key: 'tranche3', label: 'Tranche 3', amount: fees.tranche3 },
                ];
                for (const fee of feeOrder) {
                  if (remaining <= 0) break;
                  const remainingForFee = Math.max(0, fee.amount - payments[fee.key]);
                  const toApply = Math.min(remaining, remainingForFee);
                  if (toApply > 0) {
                    distribution.push({ label: fee.label, amount: toApply });
                    remaining -= toApply;
                  }
                }
                if (remaining > 0) {
                  distribution.push({ label: "Excédent / Remboursement", amount: remaining });
                }
                return distribution.length > 0 ? (
                  <div className="distribution-preview">
                    {distribution.map((d, i) => (
                      <span key={i} className={`distribution-item ${d.label.includes("Excédent") ? "excess" : ""}`}>
                        {d.label} : <strong>{formatAmount(d.amount)}</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="no-distribution">Configurez les tarifs de la classe pour voir la répartition.</span>
                );
              })()}
            </div>
            <button type="submit" className="payment-submit-button" disabled={!paymentAmount || Number(paymentAmount) <= 0}>
              <CheckCircle2 size={15} /> Enregistrer le paiement
            </button>
          </form>
        </section>
        
        <section className="panel payment-history-panel">
          <div className="panel-header"><h2>Historique des paiements</h2></div>
          <div className="payment-history">
            {(() => {
              const history = paymentHistory[studentKey] || [];
              const paymentNumbers = new Map();
              let paymentNumber = 0;
              let previousDate = null;
              [...history].reverse().forEach((entry) => {
                if (entry.paymentNumber) paymentNumber = entry.paymentNumber;
                else if (entry.date !== previousDate) paymentNumber += 1;
                previousDate = entry.date;
                paymentNumbers.set(entry, paymentNumber);
              });
              const paymentGroups = [];
              const paymentGroupMap = new Map();
              history.forEach((entry) => {
                const number = paymentNumbers.get(entry);
                if (!paymentGroupMap.has(number)) {
                  const group = { number, date: entry.date, total: 0, entries: [] };
                  paymentGroupMap.set(number, group);
                  paymentGroups.push(group);
                }
                const group = paymentGroupMap.get(number);
                group.entries.push(entry);
                group.total += entry.amount || 0;
              });
              paymentGroups.reverse();
              return history.length > 0 ? (
                <table className="payment-history-table">
                  <thead><tr><th>Paiement effectué</th><th>Montant</th><th>Statut</th><th>Date et heure</th></tr></thead>
                  <tbody>
                    {paymentGroups.map((group) => (
                      <Fragment key={group.number}>
                        <tr className="payment-history-group-row">
                          <td colSpan="4"><strong>Paiement {group.number}</strong><span>{group.date}</span><span>{formatAmount(group.total)} FCFA</span></td>
                        </tr>
                        {group.entries.map((entry, index) => (
                          <tr key={`${group.number}-${index}`}>
                            <td>{entry.label}</td>
                            <td>{formatAmount(entry.amount)}</td>
                            <td><span className={`payment-history-status ${entry.status}`}>{entry.status === "complet" ? "Complet" : "Partiel"}</span></td>
                            <td>{entry.date}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                    <tr className="total-row"><td colSpan="3">Total payé</td><td>{formatAmount(totalPaid)}</td></tr>
                  </tbody>
                </table>
              ) : (
                <p className="empty-table-message">Aucun paiement enregistré pour cet élève.</p>
              );
            })()}
          </div>
        </section>
        
        {schoolingShowFeesConfig && (
          <div className="class-fees-config-overlay" onClick={() => setSchoolingShowFeesConfig(false)}>
            <div className="class-fees-config-dialog" onClick={(e) => e.stopPropagation()}>
              <header className="class-fees-config-header">
                <h2>Configurer les tarifs — {selectedEntry.className}</h2>
                <button type="button" onClick={() => setSchoolingShowFeesConfig(false)}><X size={18} /></button>
              </header>
              <form onSubmit={(e) => { e.preventDefault(); setSchoolingShowFeesConfig(false); }} className="class-fees-config-form">
                <div className="fees-config-grid">
                  {[
                    { key: "inscription", label: "Frais d'inscription", icon: ClipboardCheck },
                    { key: "tranche1", label: "Tranche 1", icon: CalendarDays },
                    { key: "tranche2", label: "Tranche 2", icon: CalendarDays },
                    { key: "tranche3", label: "Tranche 3", icon: CalendarDays },
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="fee-config-item">
                      <label>
                        <span className="fee-config-icon"><Icon size={16} /></span>
                        <span>{label}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={fees[key]}
                          onChange={(e) => setClassFees((current) => ({
                            ...current,
                            [selectedEntry.className]: { ...current[selectedEntry.className], [key]: Number(e.target.value) || 0 }
                          }))}
                          onWheel={(e) => e.currentTarget.blur()}
                          placeholder="0"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="fees-config-total">
                  Total : <strong>{formatAmount(getTotalFees(selectedEntry.className))}</strong>
                </div>
                <div className="fees-config-actions">
                  <button type="button" className="schooling-close-button" onClick={() => setSchoolingShowFeesConfig(false)}>Fermer</button>
                  <button type="submit" className="payment-submit-button"><CheckCircle2 size={15} /> Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  function getStudentKey(entry) {
    return entry.student.id || `${entry.className}-${entry.studentIndex}-${entry.student.lastName}-${entry.student.firstName}`;
  }

  function getClassFees(className) {
    return classFees[className] || { inscription: 0, tranche1: 0, tranche2: 0, tranche3: 0 };
  }

  function getStudentPayment(studentKey) {
    return studentPayments[studentKey] || { inscription: 0, tranche1: 0, tranche2: 0, tranche3: 0 };
  }

  function getTotalFees(className) {
    const fees = getClassFees(className);
    return fees.inscription + fees.tranche1 + fees.tranche2 + fees.tranche3;
  }

  function getTotalPaid(studentKey) {
    const payments = getStudentPayment(studentKey);
    return payments.inscription + payments.tranche1 + payments.tranche2 + payments.tranche3;
  }

  function getRemainingBalance(entry) {
    const studentKey = getStudentKey(entry);
    const totalFees = getTotalFees(entry.className);
    const totalPaid = getTotalPaid(studentKey);
    return totalFees - totalPaid;
  }

  function getPaymentStatus(entry) {
    const studentKey = getStudentKey(entry);
    const fees = getClassFees(entry.className);
    const payments = getStudentPayment(studentKey);
    const trancheProgress = studentTranches[studentKey] || 0;
    
    const status = {
      inscription: { owed: fees.inscription, paid: payments.inscription, remaining: Math.max(0, fees.inscription - payments.inscription) },
      tranche1: { owed: fees.tranche1, paid: payments.tranche1, remaining: Math.max(0, fees.tranche1 - payments.tranche1) },
      tranche2: { owed: fees.tranche2, paid: payments.tranche2, remaining: Math.max(0, fees.tranche2 - payments.tranche2) },
      tranche3: { owed: fees.tranche3, paid: payments.tranche3, remaining: Math.max(0, fees.tranche3 - payments.tranche3) },
    };
    
    return status;
  }

  function renderPaymentStatus(entry) {
    const status = entry.student.enrollmentStatus || "incomplete";
    if (status === "pending") return "En attente";
    if (status !== "valid") return "À compléter";
    const fees = getClassFees(entry.className);
    const payments = getStudentPayment(getStudentKey(entry));
    const feeLabels = { inscription: "Inscription", tranche1: "Tranche 1", tranche2: "Tranche 2", tranche3: "Tranche 3" };
    const keys = ["inscription", "tranche1", "tranche2", "tranche3"];
    const totalOwed = keys.reduce((sum, key) => sum + (fees[key] || 0), 0);
    const totalPaid = keys.reduce((sum, key) => sum + (payments[key] || 0), 0);
    if (totalOwed > 0 && totalPaid >= totalOwed) return "Soldé";
    const hasActivity = keys.some((key) => (fees[key] || 0) > 0 || (payments[key] || 0) > 0);
    if (!hasActivity) return "À régler-- inscriptions ; payements";
    return (
      <>
        {keys.map((key, index) => {
          const owed = fees[key] || 0;
          const paid = payments[key] || 0;
          const isPaid = owed > 0 && paid >= owed;
          const isPartial = paid > 0 && !isPaid;
          return (
            <Fragment key={key}>
              {index > 0 && " · "}
              <span style={isPaid ? { color: "#158b78" } : undefined}>
                {feeLabels[key]} {isPaid ? "✓" : isPartial ? "..." : "—"}
              </span>
            </Fragment>
          );
        })}
      </>
    );
  }

  function recordPayment(studentKey, amount, className) {
    const fees = getClassFees(className);
    const currentPayments = getStudentPayment(studentKey);
    let remainingAmount = amount;
    const newPayments = { ...currentPayments };
    const now = new Date().toLocaleString("fr-FR");
    const newEntries = [];

    // Distribution order: inscription -> tranche1 -> tranche2 -> tranche3
    const feeOrder = [
      { key: 'inscription', label: "Inscription", amount: fees.inscription },
      { key: 'tranche1', label: "Tranche 1", amount: fees.tranche1 },
      { key: 'tranche2', label: "Tranche 2", amount: fees.tranche2 },
      { key: 'tranche3', label: "Tranche 3", amount: fees.tranche3 },
    ];
    
    for (const fee of feeOrder) {
      if (remainingAmount <= 0) break;
      const remainingForThisFee = Math.max(0, fee.amount - newPayments[fee.key]);
      const toApply = Math.min(remainingAmount, remainingForThisFee);
      if (toApply > 0) {
        newPayments[fee.key] += toApply;
        remainingAmount -= toApply;
        newEntries.push({
          date: now,
          label: fee.label,
          amount: toApply,
          status: newPayments[fee.key] >= fee.amount ? "complet" : "partiel",
        });
      }
    }
    
    setStudentPayments((current) => ({ ...current, [studentKey]: newPayments }));
    setPaymentHistory((current) => {
      const existing = current[studentKey] || [];
      const existingMax = existing.reduce((max, entry) => Math.max(max, entry.paymentNumber || 0), 0);
      const existingPayments = new Set(existing.map((entry) => entry.date)).size;
      const paymentNumber = Math.max(existingMax, existingPayments) + 1;
      return { ...current, [studentKey]: [...newEntries.map((entry) => ({ ...entry, paymentNumber })), ...existing] };
    });
    
    // Return info about the distribution
    return {
      distributed: amount - remainingAmount,
      remaining: remainingAmount,
      newPayments,
    };
  }

  function resetCreateAssessmentForm() {
    setShowCreateAssessmentForm(true);
    setGradeAssessmentName("");
    setGradeAssessmentMax("20");
    setGradeAssessmentDateParts(["", "", ""]);
    setSelectedGradeSubject("");
  }

  function createGradeAssessment(event) {
    event.preventDefault();
    const name = gradeAssessmentName.trim();
    const maxScore = Number(gradeAssessmentMax);
    const date = parseFrenchDate(gradeAssessmentDateParts.join("/"));
    if (!date) {
      const dateInput = event.currentTarget.elements.namedItem("assessment-date-day");
      dateInput.setCustomValidity("Saisissez une date valide au format JJ/MM/AAAA.");
      dateInput.reportValidity();
      return;
    }
    if (!name || !gradeSubjectOptions.includes(selectedGradeSubject) || !Number.isFinite(maxScore) || maxScore <= 0) return;
    const assessment = {
      id: crypto.randomUUID(),
      name,
      date,
      maxScore,
      className: selectedGradeClass,
      subject: selectedGradeSubject,
      term: selectedGradeTerm,
      grades: {},
    };
    setGradeAssessments((current) => [...current, assessment]);
    setSelectedGradeAssessmentId(assessment.id);
    setSelectedGradeStudentKey("");
    setGradeAssessmentName("");
    setShowCreateAssessmentForm(false);
  }

  function updateAssessmentDatePart(partIndex, value) {
    const digits = value.replace(/\D/g, "").slice(0, [2, 2, 4][partIndex]);
    setGradeAssessmentDateParts((current) => current.map((part, index) => index === partIndex ? digits : part));
    assessmentDateDayRef.current?.setCustomValidity("");
    if (digits.length === [2, 2, 4][partIndex] && partIndex < 2) {
      [assessmentDateDayRef, assessmentDateMonthRef, assessmentDateYearRef][partIndex + 1].current?.focus();
    }
  }

  function deleteSelectedGradeAssessment() {
    if (!selectedGradeAssessment) return;
    const confirmed = window.confirm(
      `Supprimer l’évaluation « ${selectedGradeAssessment.name} » et toutes les notes qui lui sont associées ?`,
    );
    if (!confirmed) return;
    setGradeAssessments((current) => current.filter(({ id }) => id !== selectedGradeAssessment.id));
    setSelectedGradeAssessmentId("");
    setSelectedGradeStudentKey("");
    setGradeStudentQuery("");
    setGradeEntryLocked(false);
    setGradeStudentSuggestionsOpen(false);
  }

  function saveStudentGrade(event, entry) {
    event.preventDefault();
    if (!selectedGradeAssessment) return;
    const gradeKey = `${selectedGradeAssessment.id}::${getStudentKey(entry)}`;
    const grade = Number(gradeDrafts[gradeKey]);
    if (!Number.isFinite(grade) || grade < 0 || grade > selectedGradeAssessment.maxScore) return;
    setGradeAssessments((current) => current.map((assessment) => assessment.id === selectedGradeAssessment.id
      ? { ...assessment, grades: { ...assessment.grades, [getStudentKey(entry)]: grade } }
      : assessment));
    setGradeEntryLocked(true);
    setGradeDrafts((current) => {
      const next = { ...current };
      delete next[gradeKey];
      return next;
    });
  }

  function selectGradeStudent(studentKey) {
    setSelectedGradeStudentKey(studentKey);
    setGradeEntryLocked(false);
    const entry = gradebookClassStudents.find((candidate) => getStudentKey(candidate) === studentKey);
    setGradeStudentQuery(entry ? `${entry.student.lastName || ""} ${entry.student.firstName || ""}`.trim() : "");
    setGradeStudentSuggestionsOpen(false);
    setActiveGradeStudentSuggestion(0);
    if (!selectedGradeAssessment || !studentKey) return;
    const gradeKey = `${selectedGradeAssessment.id}::${studentKey}`;
    const savedGrade = selectedGradeAssessment.grades[studentKey];
    setGradeDrafts((current) => ({
      ...current,
      [gradeKey]: savedGrade === undefined ? "" : String(savedGrade),
    }));
  }

  function renderTrancheTable(tranche, trancheIndex, selectedStudentKey, selectedTrancheProgress) {
    const trancheNumber = trancheIndex + 1;
    const entries = enrollmentStudents.filter((entry) => (studentTranches[getStudentKey(entry)] || 0) >= trancheNumber);
    const canAssignSelectedStudent = selectedStudentKey && (
      (trancheIndex === 0 && selectedTrancheProgress === null)
      || selectedTrancheProgress === trancheIndex
    );
    const selectedStudentAlreadyHasTranche = selectedStudentKey && selectedTrancheProgress !== null && selectedTrancheProgress >= trancheNumber;

    return (
      <section className="panel tranche-panel" key={tranche}>
        <div className="panel-header"><h2>{tranche}</h2></div>
        {entries.length > 0 ? <div className="tranche-student-list">{entries.map((entry) => (
          <div className="tranche-student" key={getStudentKey(entry)}>
            <div className="tranche-student-heading">
              <span className="tranche-student-identity">
                <span className="tranche-student-avatar">{entry.student.profileImage
                  ? <img src={entry.student.profileImage} alt="" />
                  : `${entry.student.firstName?.[0] || ""}${entry.student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}</span>
                <strong>{entry.student.lastName.toLocaleUpperCase("fr-FR")} {entry.student.firstName}</strong>
              </span>
              {selectedStudentKey === getStudentKey(entry) && <button
                type="button"
                className="remove-tranche-button"
                onClick={() => setStudentTranches((current) => {
                  const next = { ...current };
                  if (trancheIndex === 0) delete next[getStudentKey(entry)];
                  else next[getStudentKey(entry)] = trancheIndex;
                  return next;
                })}
              >
                Retirer cette tranche
              </button>}
            </div>
            <span>{entry.className} · {entry.student.age} ans</span>
          </div>
        ))}</div> : <p className="empty-table-message">Aucun élève dans cette tranche.</p>}
        {selectedStudentKey && (canAssignSelectedStudent
          ? <button
            type="button"
            className="tranche-action-button"
            onClick={() => setStudentTranches((current) => ({ ...current, [selectedStudentKey]: trancheNumber }))}
          >Attribuer cette tranche</button>
          : selectedStudentAlreadyHasTranche
            ? <p className="tranche-sequence-hint" role="status">Cette tranche est déjà attribuée.</p>
            : <p className="tranche-sequence-hint">Attribuez d’abord la tranche {trancheIndex}.</p>)}
      </section>
    );
  }

  if (authStatus === "checking") {
    return <main className="auth-screen"><section className="auth-panel"><span className="auth-brand-mark"><img src="/logo-les-baobabs.svg" alt="" /></span><h1>Vérification de la session</h1><p>Connexion sécurisée à l’espace scolaire…</p></section></main>;
  }

  if (authStatus !== "authenticated") {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <span className="auth-brand-mark"><img src="/logo-les-baobabs.svg" alt="" /></span>
          <p className="auth-eyebrow">ÉCOLE LES BAOBABS</p>
          <h1>Connexion à l’administration</h1>
          <p className="auth-description">Entrez vos identifiants pour accéder aux données de l’établissement.</p>
          {authError && <p className="auth-error" role="alert">{authError}</p>}
          {authStatus === "error" && <button type="button" className="auth-retry" onClick={() => { setAuthError(""); setAuthStatus("checking"); window.location.reload(); }}>Réessayer</button>}
          {authStatus !== "error" && <form className="auth-form" onSubmit={submitLogin}>
            <label>Nom d’utilisateur
              <input autoComplete="username" required value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} />
            </label>
            <label>Mot de passe
              <input type="password" autoComplete="current-password" required value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} />
            </label>
            <button type="submit" disabled={authSubmitting}>{authSubmitting ? "Connexion…" : "Se connecter"}</button>
          </form>}
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell" style={{ "--page-accent": pageThemes[page][0], "--page-accent-light": pageThemes[page][1], "--page-tint": pageThemes[page][2] }}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><img src="/logo-les-baobabs.svg" alt="Logo de l’École Les Baobabs" /></span>
          <div><strong>École Les Baobabs</strong><small>Gestion scolaire</small></div>
        </div>
        <nav className="nav-list" aria-label="Menu principal">
          {navigationGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-label">{group.label}</p>
              {group.items.map(({ label, icon: Icon }) => (
                <button key={label} className={`nav-item ${page === label ? "active" : ""}`} onClick={() => setPage(label)}>
                  <Icon className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{label}</span>
                  {label === "Inscriptions et Paiement" && waitingStudents.length > 0 && <span className="nav-count">{waitingStudents.length}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="sidebar-school-icon"><GraduationCap size={18} /></span>
          <div><strong>Établissement scolaire</strong><span>Année scolaire 2026–2027</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="page-title"><p className="eyebrow">ESPACE ADMINISTRATION</p><h1>{page}</h1></div>
          <div className="topbar-right"><span className="school-year"><CalendarDays size={16} />Année scolaire 2026–2027</span><span className="avatar" aria-label={`Administrateur ${authUser?.username || ""}`}>{authUser?.username?.slice(0, 2).toLocaleUpperCase("fr-FR") || "AD"}</span><button type="button" className="logout-button" onClick={submitLogout}><LogOut size={15} /><span>Déconnexion</span></button></div>
        </header>
        {authError && <p className="auth-error auth-inline-error" role="alert">{authError}</p>}
        <div className="content">
          {page === "Tableau de bord" ? <>
            <section className="welcome">
              <div><span className="welcome-kicker">L’essentiel de votre école, en un coup d’œil</span><h2>Bonjour et bienvenue</h2><p>Suivez les effectifs et les activités de votre établissement.</p></div>
              <span className="welcome-icon"><School size={29} strokeWidth={1.7} /></span>
            </section>
            <div className="section-heading dashboard-section-heading"><div><h2>Vue d’ensemble</h2><p>Les indicateurs se mettent à jour avec les dossiers saisis.</p></div><span className="live-indicator"><i /> Année scolaire 2026–2027</span></div>
            <section className="stats-grid">
              {[
                { label: "Élèves enregistrés", value: registeredStudents.length, note: `${validStudents.length} dossier${validStudents.length === 1 ? "" : "s"} confirmé${validStudents.length === 1 ? "" : "s"}`, icon: UsersRound, tone: "blue" },
                { label: "Classes", value: schoolClasses.length, note: "De la SIL au CM2", icon: School, tone: "green" },
                { label: "Enseignantes", value: teachers.length, note: "Membres de l’équipe", icon: UserRound, tone: "purple" },
                { label: "Dossiers à finaliser", value: waitingStudents.length, note: "Inscriptions en attente", icon: WalletCards, tone: "amber" },
              ].map(({ label, value, note, icon: Icon, tone }) => (
                <article className={`stat-card stat-${tone}`} key={label}>
                  <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={20} strokeWidth={1.8} /></span></div>
                  <strong className="stat-number">{value}</strong><small className="stat-note">{note}</small>
                  <span className="stat-card-accent" />
                </article>
              ))}
            </section>
            <section className="dashboard-charts">
              <article className="panel chart-panel enrollment-chart-panel">
                <div className="panel-header chart-header"><div><span className="panel-kicker">TENDANCE</span><h2>Évolution des inscriptions</h2><p>Élèves enregistrés par mois</p></div><span className="chart-icon chart-icon-blue"><ChartNoAxesCombined size={19} /></span></div>
                <div className="chart-plot">
                  <div className="chart-y-labels"><span>{maxMonthlyCount}</span><span>{Math.ceil(maxMonthlyCount / 2)}</span><span>0</span></div>
                  <svg className="enrollment-chart" viewBox="0 0 580 180" role="img" aria-label="Évolution mensuelle des inscriptions sur les six derniers mois">
                    <defs><linearGradient id="enrollmentFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#4285f4" stopOpacity=".22" /><stop offset="100%" stopColor="#4285f4" stopOpacity="0" /></linearGradient></defs>
                    {[38, 94, 150].map((y) => <line key={y} x1="40" x2="540" y1={y} y2={y} className="chart-grid-line" />)}
                    <polygon points={`40,150 ${chartPoints} 540,150`} fill="url(#enrollmentFill)" />
                    <polyline points={chartPoints} className="chart-line" />
                    {monthlyEnrollments.map((count, index) => {
                      const x = 40 + index * 100;
                      const y = 150 - (count / maxMonthlyCount) * 112;
                      return <circle key={`${recentMonths[index].year}-${recentMonths[index].month}`} cx={x} cy={y} r="4" className="chart-point"><title>{recentMonths[index].month} : {count} inscription{count > 1 ? "s" : ""}</title></circle>;
                    })}
                    {recentMonths.map((month, index) => <text key={`${month.year}-${month.month}`} x={40 + index * 100} y="174" className="chart-month-label">{month.month}</text>)}
                  </svg>
                </div>
                <p className="chart-footnote">L’historique démarre à la création des premiers dossiers.</p>
              </article>
              <article className="panel chart-panel distribution-panel">
                <div className="panel-header chart-header"><div><span className="panel-kicker">RÉPARTITION</span><h2>Effectifs par classe</h2><p>{registeredStudents.length} élève{registeredStudents.length === 1 ? "" : "s"} au total</p></div><span className="chart-icon chart-icon-green"><Layers3 size={19} /></span></div>
                <div className="class-distribution">
                  {classDistribution.map(({ className, count }, index) => (
                    <div className="distribution-row" key={className}>
                      <span className="distribution-name">{className}</span>
                      <div className="distribution-track"><span style={{ width: `${count === 0 ? 0 : Math.max(5, (count / maxClassCount) * 100)}%`, "--bar-color": ["#4285f4", "#1aa68a", "#f29b38", "#8663d2", "#db638b", "#d0a128"][index] }} /></div>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
                <button type="button" className="chart-action" onClick={() => setPage("Classes")}>Gérer les classes <ArrowUpRight size={15} /></button>
              </article>
            </section>
            <section className="panel recent-panel">
              <div className="panel-header"><div><span className="panel-kicker">SUIVI SCOLAIRE</span><h2>Élèves récemment enregistrés</h2></div><button className="link-button" onClick={() => setPage("Élèves")}>Tous les élèves <ArrowUpRight size={15} /></button></div>
              {latestStudents.length === 0 ? <div className="dashboard-empty"><span><UsersRound size={20} /></span><div><strong>Aucun élève pour le moment</strong><p>Ajoutez un dossier pour suivre les effectifs de votre établissement.</p></div><button type="button" className="empty-add-button" onClick={() => setPage("Élèves")}><Plus size={15} /> Ajouter</button></div> : <div className="table-wrap"><table>
                <thead><tr><th>Élève</th><th>Classe</th><th>Responsable</th><th>Suivi scolaire</th><th>Statut</th></tr></thead>
                <tbody>{latestStudents.map(({ className, student, studentIndex }) => {
                  const entry = { className, student, studentIndex };
                  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
                  const status = student.enrollmentStatus === "valid" ? renderPaymentStatus({ className, student, studentIndex }) : student.enrollmentStatus === "pending" ? "En attente" : "Enregistré";
                  return <tr key={getStudentKey(entry)}>
                    <td><span className="student"><span className={`student-avatar ${student.profileImage ? "has-profile-image" : ""}`}>{student.profileImage ? <img src={student.profileImage} alt="" /> : `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}</span>{fullName}</span></td>
                    <td><span className="registered-class-badge">{className}</span></td>
                    <td>{student.responsible || "—"}</td><td>{studentTranches[getStudentKey(entry)] ? `Tranche ${studentTranches[getStudentKey(entry)]}` : "À définir"}</td>
                    <td><span className={`badge ${student.enrollmentStatus === "pending" ? "pending" : ""}`}>{status}</span></td>
                  </tr>;
                })}</tbody>
              </table></div>}
            </section>
          </> : page === "Classes" ? <div className="classes-page">
            <section className="classes-hero">
              <div className="classes-hero-copy">
                <span className="classes-eyebrow"><School size={15} /> ORGANISATION PÉDAGOGIQUE</span>
                <h2>Une classe bien organisée,<br />une année qui commence bien.</h2>
                <p>Retrouvez les niveaux, leurs effectifs et les personnes qui les accompagnent.</p>
                <div className="classes-hero-tags"><span><Layers3 size={14} /> {schoolClasses.length} niveaux</span><i /><span>Année scolaire 2026–2027</span></div>
              </div>
              <div className="classes-hero-visual" aria-hidden="true">
                <span className="classes-visual-orbit orbit-one" /><span className="classes-visual-orbit orbit-two" />
                <span className="classes-visual-card"><School size={35} strokeWidth={1.5} /></span>
                <span className="classes-visual-students"><UsersRound size={17} /><i /><i /><i /></span>
                <span className="classes-visual-spark">✦</span>
              </div>
            </section>
            <section className="classes-overview">
              <article className="classes-overview-card">
                <span className="classes-overview-icon overview-teal"><UsersRound size={19} /></span><span className="classes-overview-label">Élèves répartis</span>
                <strong>{registeredStudents.length}</strong><small>sur l’ensemble des niveaux</small>
              </article>
              <article className="classes-overview-card">
                <span className="classes-overview-icon overview-blue"><Layers3 size={19} /></span><span className="classes-overview-label">Classes ouvertes</span>
                <strong>{schoolClasses.length}</strong><small>de {schoolClasses[0]} à {schoolClasses[schoolClasses.length - 1]}</small>
              </article>
              <article className="classes-overview-card">
                <span className="classes-overview-icon overview-purple"><UserRound size={19} /></span><span className="classes-overview-label">Équipe pédagogique</span>
                <strong>{teachers.length}</strong><small>membre{teachers.length === 1 ? "" : "s"} de l’équipe pédagogique</small>
              </article>
              <article className="classes-overview-card">
                <span className="classes-overview-icon overview-amber"><ClipboardCheck size={19} /></span><span className="classes-overview-label">Niveaux accompagnés</span>
                <strong>{new Set(teachers.map((teacher) => teacher.className)).size}</strong><small>avec un enseignant référent</small>
              </article>
            </section>
            <div className="classes-section-heading">
              <div><span className="classes-section-kicker">VOS NIVEAUX</span><h2>Les classes de l’établissement</h2><p>Consultez les élèves de chaque classe. Pour ajouter un élève, rendez-vous dans la rubrique Élèves.</p></div>
              <div className="classes-heading-actions">
                <span className="classes-count-badge"><School size={14} /> {schoolClasses.length} classes</span>
                <button type="button" className="class-add-button" onClick={() => {
                  setShowClassAddForm((current) => !current);
                  setNewClassName("");
                  setClassEditNotice("");
                }}>{showClassAddForm ? <X size={15} /> : <Plus size={15} />}{showClassAddForm ? "Annuler" : "Ajouter une classe"}</button>
              </div>
            </div>
            {showClassAddForm && <form className="class-add-form" onSubmit={addSchoolClass}>
              <label htmlFor="new-class-name">Nom de la classe</label>
              <input id="new-class-name" autoFocus maxLength={50} value={newClassName} onChange={(event) => { setNewClassName(event.target.value); setClassEditNotice(""); }} placeholder="Ex. CP" />
              <button type="submit"><Plus size={14} /> Ajouter</button>
            </form>}
            {classEditNotice && <p className="class-edit-notice" role="alert">{classEditNotice}</p>}
            <section className="class-grid" aria-label="Classes de l’école primaire">
              {schoolClasses.map((className, index) => {
                return (
                <article className="class-card" key={className} style={{ "--card-accent": ["#0d9488", "#347fe0", "#e8753d", "#7655d9", "#d94f8b", "#c58616"][index % 6] }}>
                  <div className="class-card-top"><span className="class-icon"><School size={18} /></span><span className="class-cycle">CYCLE PRIMAIRE · 0{index + 1}</span><span className="class-number">0{index + 1}</span></div>
                  <div className="class-card-heading">
                    <div><div className="class-name-row">
                      {editingClass?.originalName === className ? <form className="class-name-form" onSubmit={(event) => { event.preventDefault(); renameSchoolClass(className, editingClass.name); }}>
                        <input autoFocus aria-label={`Nom de la classe ${className}`} value={editingClass.name} onChange={(event) => { setEditingClass((current) => ({ ...current, name: event.target.value })); setClassEditNotice(""); }} />
                        <button type="submit" className="class-name-action save" aria-label={`Enregistrer le nom de ${className}`}><CheckCircle2 size={15} /></button>
                        <button type="button" className="class-name-action cancel" aria-label="Annuler le renommage" onClick={() => { setEditingClass(null); setClassEditNotice(""); }}><X size={15} /></button>
                      </form> : <><h3>{className}</h3><button type="button" className="class-name-edit" aria-label={`Modifier le nom de ${className}`} onClick={() => { setEditingClass({ originalName: className, name: className }); setClassEditNotice(""); }}><Pencil size={13} /></button></>}
                    </div></div>
                    <div className="class-card-heading-actions">
                      <span className="class-student-count"><strong>{classStudents[className].length}</strong> élève{classStudents[className].length === 1 ? "" : "s"}</span>
                      {editingClass?.originalName !== className && <button type="button" className="class-view-button" aria-haspopup="dialog" onClick={() => setSelectedClassDetails(className)}>Voir</button>}
                      <button type="button" className="class-delete-button" disabled={schoolClasses.length <= 1} aria-label={`Supprimer la classe ${className}`} title={schoolClasses.length <= 1 ? "L’établissement doit conserver au moins une classe" : `Supprimer ${className}`} onClick={() => removeSchoolClass(className)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </article>
              );})}
            </section>
            {selectedClassDetails && <div className="class-details-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedClassDetails(null);
            }}>
              <section className="class-details-dialog" role="dialog" aria-modal="true" aria-labelledby="class-details-title">
                <header className="class-details-header">
                  <div><span className="classes-section-kicker">INFORMATIONS DE LA CLASSE</span><h2 id="class-details-title">{selectedClassDetails}</h2><p>Année scolaire 2026–2027</p></div>
                  <button type="button" className="class-details-close" aria-label="Fermer les informations de la classe" onClick={() => setSelectedClassDetails(null)}><X size={18} /></button>
                </header>
                <div className="class-details-summary">
                  <article><UsersRound size={17} /><span>Élèves</span><strong>{selectedClassStudents.length}</strong></article>
                  <article><UserRound size={17} /><span>Filles</span><strong>{selectedClassGirls}</strong></article>
                  <article><UserRound size={17} /><span>Garçons</span><strong>{selectedClassBoys}</strong></article>
                </div>
                <section className="class-details-teacher">
                  <h3>Enseignant référent</h3>
                  {selectedClassTeacher ? <div className="class-details-teacher-info">
                    <span className={`teacher-avatar ${selectedClassTeacher.profileImage ? "has-profile-image" : ""}`}>
                      {selectedClassTeacher.profileImage
                        ? <img src={selectedClassTeacher.profileImage} alt="" />
                        : `${selectedClassTeacher.firstName?.[0] || ""}${selectedClassTeacher.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}
                    </span>
                    <div><strong>{selectedClassTeacher.firstName} {selectedClassTeacher.lastName}</strong><span>{selectedClassTeacher.diploma || "Diplôme non renseigné"} · {selectedClassTeacher.experience || "0"} an{Number(selectedClassTeacher.experience) === 1 ? "" : "s"} d’expérience</span><span>{selectedClassTeacher.phone || "Téléphone non renseigné"}</span></div>
                  </div> : <p className="class-details-empty">Aucun enseignant n’est encore affecté à cette classe.</p>}
                </section>
                <section className="class-details-roster">
                  <div className="class-details-roster-heading"><h3>Élèves de la classe</h3><span>{selectedClassStudents.length}</span></div>
                  {selectedClassStudents.length ? <div className="class-details-student-list">
                    {selectedClassStudents.map((student, studentIndex) => (
                      <article className="class-details-student" key={student.id || `${student.firstName}-${student.lastName}-${studentIndex}`}>
                        <span className={`class-details-student-avatar ${student.profileImage ? "has-profile-image" : student.gender === "F" ? "female" : ""}`}>
                          {student.profileImage ? <img src={student.profileImage} alt="" /> : `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}
                        </span>
                        <div className="class-details-student-main"><strong>{student.firstName} {student.lastName?.toLocaleUpperCase("fr-FR")}</strong><span>{student.age ? `${student.age} ans` : "Âge non renseigné"} · {student.gender === "F" ? "Fille" : student.gender === "M" ? "Garçon" : "Sexe non renseigné"}</span><small>Responsable : {student.responsible || "Non renseigné"} · {student.responsiblePhone || "Téléphone non renseigné"}</small></div>
                        <span className={`class-details-status ${student.enrollmentStatus || "incomplete"}`}>{renderPaymentStatus({ className: selectedClassDetails, student, studentIndex })}</span>
                      </article>
                    ))}
                  </div> : <p className="class-details-empty">Aucun élève dans cette classe pour le moment.</p>}
                </section>
              </section>
            </div>}
          </div> : page === "Notes" ? <div className="results-page gradebook-page">
            <section className="results-intro">
              <div>
                <span className="results-eyebrow"><ClipboardCheck size={15} /> CARNET DE NOTES</span>
                <h2>Suivi des évaluations et des notes.</h2>
                <p>Créez une évaluation, saisissez les notes et repérez rapidement les élèves à accompagner.</p>
              </div>
              <div className="results-filters">
                <label>Trimestre
                  <select value={selectedGradeTerm} onChange={(event) => setSelectedGradeTerm(Number(event.target.value))}>
                    {resultTerms.map((term, index) => <option key={term} value={index}>{term}</option>)}
                  </select>
                </label>
              </div>
            </section>
            <section className="gradebook-summary">
              <article>
                <span className="gradebook-summary-icon"><ClipboardCheck size={16} /></span>
                <span>Évaluations créées</span>
                <strong>{gradeAssessments.length}</strong>
              </article>
              <article>
                <span className="gradebook-summary-icon"><CheckCircle2 size={16} /></span>
                <span>Notes saisies</span>
                <strong>{gradebookEnteredCount}<small> / {gradebookClassStudents.length}</small></strong>
                <div className="gradebook-summary-progress"><i style={{ width: `${gradebookProgress}%` }} /></div>
              </article>
              <article>
                <span className="gradebook-summary-icon"><Award size={16} /></span>
                <span>Moyenne de l’évaluation</span>
                <strong>{gradebookAverage === null ? "—" : gradebookAverage.toFixed(1).replace(".", ",")}<small>{gradebookAverage === null ? "" : " / 20"}</small></strong>
              </article>
              <article>
                <span className="gradebook-summary-icon warning"><TriangleAlert size={16} /></span>
                <span>Sous la moyenne</span>
                <strong>{gradebookScores.filter((grade) => grade < 10).length}</strong>
              </article>
            </section>
            <section className="panel gradebook-panel">
              <div className="results-panel-heading gradebook-heading">
                <div><span className="results-panel-kicker">ÉVALUATIONS</span><h2>Créer ou sélectionner une évaluation</h2><p>Chaque évaluation conserve ses propres notes pour la classe, la matière et le trimestre choisis.</p></div>
                <span className="results-panel-icon result-orange"><ClipboardCheck size={19} /></span>
              </div>
              <div className="gradebook-assessment-tools">
                <div className="gradebook-assessment-select-row">
                  <label>Évaluation
                  <select value={selectedGradeAssessmentId} onChange={(event) => {
                    const assessment = gradeAssessments.find(({ id }) => id === event.target.value);
                    setSelectedGradeAssessmentId(event.target.value);
                    setSelectedGradeStudentKey("");
                    setGradeStudentQuery("");
                    setGradeEntryLocked(false);
                  }}>
                    <option value="">Choisir une évaluation</option>
                    {gradeAssessments.filter((assessment) => assessment.className === selectedGradeClass && assessment.subject === selectedGradeSubject && assessment.term === selectedGradeTerm).map((assessment) => <option key={assessment.id} value={assessment.id}>{assessment.name} · {assessment.className} · {assessment.subject}</option>)}
                  </select>
                  </label>
                  <button type="button" className="gradebook-delete-assessment-button" disabled={!selectedGradeAssessment} onClick={deleteSelectedGradeAssessment}>
                    <Trash2 size={14} /> Supprimer
                  </button>
                  <button type="button" className="gradebook-create-button" onClick={resetCreateAssessmentForm}><Plus size={15} /> Créer une évaluation</button>
                </div>
                <div className="gradebook-filters-row">
                  <label>Classe
                    <select value={selectedGradeClass} onChange={(event) => {
                      const value = event.target.value;
                      setSelectedGradeClass(value);
                      setSelectedGradeSubject("");
                      setSelectedGradeStudentKey("");
                      setSelectedGradeAssessmentId("");
                    }}>
                      <option value="">Choisir une classe</option>
                      {schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                    </select>
                  </label>
                  {selectedGradeClass && <label>Matière
                    <select value={selectedGradeSubject} onChange={(event) => {
                      setSelectedGradeSubject(event.target.value);
                      setSelectedGradeStudentKey("");
                      setSelectedGradeAssessmentId("");
                    }}>
                      <option value="">Choisir une matière</option>
                      {gradeSubjectClassOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                    </select>
                  </label>}
                  {selectedGradeSubject && <label>Élève
                    <span className="gradebook-student-picker">
                      <input
                        type="text"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={gradeStudentSuggestionsOpen && Boolean(gradeStudentQuery.trim())}
                        value={gradeStudentQuery}
                        onChange={(event) => {
                          setGradeStudentQuery(event.target.value);
                          setSelectedGradeStudentKey("");
                          setGradeEntryLocked(false);
                          setGradeStudentSuggestionsOpen(true);
                          setActiveGradeStudentSuggestion(0);
                        }}
                        onFocus={() => { setGradeStudentSuggestionsOpen(true); setActiveGradeStudentSuggestion(0); }}
                        onBlur={() => setGradeStudentSuggestionsOpen(false)}
                        placeholder="Saisir le nom de l’élève"
                        autoComplete="off"
                      />
                      {gradeStudentSuggestionsOpen && gradeStudentQuery.trim() && <div className="gradebook-student-suggestions" role="listbox" aria-label="Élèves correspondants">
                        {gradebookStudentSuggestions.length ? gradebookStudentSuggestions.map((entry, index) => {
                          const fullName = `${entry.student.lastName || ""} ${entry.student.firstName || ""}`.trim();
                          return <button
                            type="button"
                            role="option"
                            key={getStudentKey(entry)}
                            onClick={() => selectGradeStudent(getStudentKey(entry))}
                          >{fullName}<small>{entry.className}</small></button>;
                        }) : <p>Aucun élève correspondant.</p>}
                      </div>}
                    </span>
                    {selectedGradeStudentKey && selectedGradeStudentEntry && (
                      <span className="gradebook-student-selected-inline">
                        {selectedGradeStudentEntry.student.lastName} {selectedGradeStudentEntry.student.firstName}
                        <button type="button" className="gradebook-change-student" onClick={() => { setSelectedGradeStudentKey(""); setGradeStudentQuery(""); setGradeEntryLocked(false); }}>
                          X
                        </button>
                      </span>
                    )}
                  </label>}
                  {selectedGradeStudentKey && selectedGradeStudentEntry && <label>Note sur {selectedGradeAssessment.maxScore}
                    <input
                      type="number"
                      min="0"
                      max={selectedGradeAssessment.maxScore}
                      step="0.25"
                      required
                      disabled={gradeEntryLocked}
                      value={gradeDrafts[`${selectedGradeAssessment.id}::${selectedGradeStudentKey}`] ?? (gradeEntryLocked ? selectedGradeAssessment.grades[selectedGradeStudentKey] ?? "" : "")}
                      onChange={(event) => setGradeDrafts((current) => ({ ...current, [`${selectedGradeAssessment.id}::${selectedGradeStudentKey}`]: event.target.value }))}
                      onWheel={(event) => event.currentTarget.blur()}
                      placeholder="—"
                    />
                    {gradeDraftOver20 !== null && <small className={`gradebook-grade-preview ${gradeDraftOver20 >= 10 ? "success" : "warning"}`}>{gradeDraftOver20.toFixed(2).replace(".", ",")} / 20</small>}
                  </label>}
                  {selectedGradeStudentKey && selectedGradeStudentEntry && (
                    <button type="button" className="gradebook-create-button" onClick={() => saveStudentGrade({ preventDefault: () => {} }, selectedGradeStudentEntry)}>
                      {gradeEntryLocked ? <><Pencil size={15} /> Modifier la note</> : <><CheckCircle2 size={15} /> Enregistrer la note</>}
                    </button>
                  )}
                </div>
                {showCreateAssessmentForm && <form className="gradebook-create-form" onSubmit={createGradeAssessment}>
                    <label>Nom de l’évaluation
                      <input required maxLength={70} value={gradeAssessmentName} onChange={(event) => setGradeAssessmentName(event.target.value)} placeholder="Ex. Dictée n° 1" />
                    </label>
                    <label>Matière
                      <select required value={selectedGradeSubject} onChange={(event) => setSelectedGradeSubject(event.target.value)}>
                        <option value="" disabled>Choisir une matière</option>
                        {gradeSubjectOptions.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                      </select>
                    </label>
                    <label>Date
                      <span className="assessment-date-inputs">
                        {gradeAssessmentDateParts.map((part, index) => {
                          const refs = [assessmentDateDayRef, assessmentDateMonthRef, assessmentDateYearRef];
                          const labels = ["Jour", "Mois", "Année"];
                          const fieldNames = ["day", "month", "year"];
                          const widths = [2, 2, 4];
                          const placeholders = ["  ", "  ", "    "];
                          return <Fragment key={labels[index]}>
                            {index > 0 && <span aria-hidden="true">/</span>}
                            <input
                              ref={refs[index]}
                              required
                              type="text"
                              name={`assessment-date-${fieldNames[index]}`}
                              aria-label={labels[index]}
                              inputMode="numeric"
                              autoComplete="off"
                              maxLength={widths[index]}
                              placeholder={placeholders[index]}
                              value={part}
                              onChange={(event) => updateAssessmentDatePart(index, event.target.value)}
                            />
                          </Fragment>;
                        })}
                      </span>
                    </label>
                    <label>Barème
                      <input required type="number" min="1" max="1000" step="1" value={gradeAssessmentMax} onChange={(event) => setGradeAssessmentMax(event.target.value)} />
                    </label>
                    <button type="submit" className="gradebook-create-button" disabled={!gradeSubjectOptions.length}><Plus size={15} /> Créer une évaluation</button>
                  </form>
                }
              </div>
              {!gradeSubjectOptions.length && <div className="gradebook-no-subjects" role="status">
                <p>Aucune matière n’a encore été ajoutée au catalogue. Ajoutez-en une pour pouvoir créer une évaluation.</p>
                <button type="button" onClick={() => setPage("Matières")}><BookOpen size={14} /> Ouvrir Matières</button>
              </div>}
              {selectedGradeAssessment && <div className="gradebook-assessment-meta">
                <strong>{selectedGradeAssessment.name}</strong>
                <span>{selectedGradeAssessment.className}</span>
                <span>{selectedGradeAssessment.subject}</span>
                <span>{resultTerms[selectedGradeAssessment.term]}</span>
                <span>{formatFrenchDate(selectedGradeAssessment.date)}</span>
                <span>Sur {selectedGradeAssessment.maxScore}</span>
              </div>}
              <div className="gradebook-list-toolbar">
                <label className="gradebook-search"><Search size={15} /><span className="sr-only">Rechercher un élève</span>
                  <input value={gradeStudentSearch} onChange={(event) => setGradeStudentSearch(event.target.value)} placeholder="Rechercher un élève…" />
                </label>
                <label className="gradebook-status-filter"><span className="sr-only">Filtrer les élèves selon leur note</span>
                  <select value={gradeStatusFilter} onChange={(event) => setGradeStatusFilter(event.target.value)}>
                    <option value="all">Tous les élèves</option>
                    <option value="missing">Notes manquantes</option>
                    <option value="entered">Notes saisies</option>
                  </select>
                </label>
              </div>
              {selectedGradeAssessment && <div className="gradebook-progress">
                <div className="gradebook-progress-label"><span>Progression de la saisie</span><strong>{gradebookEnteredCount} / {gradebookClassStudents.length}</strong></div>
                <div className="gradebook-progress-track"><i style={{ width: `${gradebookProgress}%` }} /></div>
              </div>}
              {selectedGradeAssessment ? gradebookStudents.length ? <div className="gradebook-table-wrap"><table className="gradebook-table">
                <thead><tr><th>Élève</th><th>Classe</th><th>Note / {selectedGradeAssessment.maxScore}</th><th>Résultat / 20</th><th>État</th><th>Action</th></tr></thead>
                <tbody>{gradebookStudents.map((entry) => {
                  const { className, student } = entry;
                  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
                  const isSaved = Object.hasOwn(selectedGradeAssessment.grades, getStudentKey(entry));
                  const savedGrade = selectedGradeAssessment.grades[getStudentKey(entry)];
                  return <tr key={getStudentKey(entry)}>
                    <td><span className="student"><span className={`student-avatar ${student.profileImage ? "has-profile-image" : ""}`}>{student.profileImage ? <img src={student.profileImage} alt="" /> : `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}</span>{fullName}</span></td>
                    <td><span className="registered-class-badge">{className}</span></td>
                    <td>{isSaved ? `${savedGrade} / ${selectedGradeAssessment.maxScore}` : "—"}</td>
                    <td>{isSaved ? <span className={`gradebook-result-badge ${savedGrade / selectedGradeAssessment.maxScore * 20 >= 10 ? "success" : "warning"}`}>{(savedGrade / selectedGradeAssessment.maxScore * 20).toFixed(1).replace(".", ",")} / 20</span> : "—"}</td>
                    <td><span className={`gradebook-row-status ${isSaved ? "entered" : "missing"}`}>{isSaved ? "Saisie" : "À saisir"}</span></td>
                    <td><button type="button" className={`gradebook-save-button ${isSaved ? "saved" : ""}`} onClick={() => selectGradeStudent(getStudentKey(entry))}>
                      {isSaved ? <Pencil size={14} /> : <Plus size={14} />}
                      {isSaved ? "Modifier" : "Saisir"}
                    </button></td>
                  </tr>;
                })}</tbody>
              </table></div> : <div className="gradebook-empty"><span><UsersRound size={22} /></span><strong>{gradebookClassStudents.length ? "Aucun élève ne correspond à ce filtre" : "Aucun élève enregistré dans cette classe"}</strong><p>{gradebookClassStudents.length ? "Modifiez la recherche ou le filtre de saisie." : "Ajoutez d’abord un dossier dans la rubrique Élèves : son nom apparaîtra ici pour la saisie des notes."}</p>{!gradebookClassStudents.length && <button type="button" onClick={() => { setPage("Élèves"); setShowStudentAddForm(true); }}><Plus size={15} /> Ajouter un élève</button>}</div> : <div className="gradebook-empty"><span><ClipboardCheck size={22} /></span><strong>Créez une évaluation pour commencer</strong><p>Renseignez son nom, sa date et son barème. Les élèves de la classe apparaîtront ensuite dans le carnet.</p></div>}
            </section>
          </div> : page === "Résultats" ? <div className="results-page">
            <section className="results-intro">
              <div>
                <span className="results-eyebrow"><Award size={15} /> PILOTAGE PÉDAGOGIQUE</span>
                <h2>Les progrès de chaque élève comptent.</h2>
                <p>Suivez les moyennes, l’assiduité et les besoins d’accompagnement par classe.</p>
              </div>
              <div className="results-filters">
                <label>Trimestre
                  <select value={selectedResultTerm} onChange={(event) => setSelectedResultTerm(Number(event.target.value))}>
                    {resultTerms.map((term, index) => <option key={term} value={index}>{term}</option>)}
                  </select>
                </label>
                <label>Classe
                  <select value={selectedResultClass} onChange={(event) => setSelectedResultClass(event.target.value)}>
                    <option value="Toutes les classes">Toutes les classes</option>
                    {schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                  </select>
                </label>
              </div>
            </section>
            <div className="results-demo-notice"><TriangleAlert size={16} /><span><strong>Données d’exemple</strong> — ces résultats illustrent le suivi scolaire et ne correspondent pas à de vrais élèves.</span></div>
            <section className="results-stats-grid">
              <article className="results-stat"><span className="results-stat-icon result-blue"><ChartNoAxesCombined size={19} /></span><span className="results-stat-label">Moyenne générale</span><strong>{resultStudents.length ? resultAverage.toFixed(1).replace(".", ",") : "—"}<small>/ 20</small></strong><span className="results-stat-note">{resultStudents.length} élèves évalués</span></article>
              <article className="results-stat"><span className="results-stat-icon result-green"><Award size={19} /></span><span className="results-stat-label">Élèves au niveau attendu</span><strong>{resultStudents.length ? `${Math.round((resultSuccessCount / resultStudents.length) * 100)} %` : "—"}</strong><span className="results-stat-note">Moyenne égale ou supérieure à 10</span></article>
              <article className="results-stat"><span className="results-stat-icon result-amber"><TriangleAlert size={19} /></span><span className="results-stat-label">À accompagner</span><strong>{studentsToSupport.length}</strong><span className="results-stat-note">Moyenne inférieure à 10 / 20</span></article>
              <article className="results-stat"><span className="results-stat-icon result-purple"><CalendarCheck size={19} /></span><span className="results-stat-label">Assiduité moyenne</span><strong>{resultStudents.length ? `${Math.round(resultAttendance)} %` : "—"}</strong><span className="results-stat-note">Présences sur le trimestre</span></article>
            </section>
            <section className="results-charts">
              <article className="panel results-panel">
                <div className="results-panel-heading"><div><span className="results-panel-kicker">PROGRESSION</span><h2>Évolution de la moyenne</h2><p>Moyenne générale par trimestre · sur 20</p></div><span className="results-panel-icon result-blue"><TrendingUp size={19} /></span></div>
                {resultStudents.length ? <div className="results-trend">
                  <div className="results-chart-axis"><span>20</span><span>10</span><span>0</span></div>
                  <svg viewBox="0 0 520 180" role="img" aria-label="Évolution illustrative des moyennes sur les trois trimestres">
                    {[30, 85, 140].map((y) => <line key={y} x1="48" x2="472" y1={y} y2={y} className="results-grid-line" />)}
                    <polyline points={termAverageValues.map((average, index) => `${48 + index * 212},${140 - (average / 20) * 110}`).join(" ")} className="results-trend-line" />
                    {termAverageValues.map((average, index) => {
                      const x = 48 + index * 212;
                      const y = 140 - (average / 20) * 110;
                      return <g key={resultTerms[index]}><circle cx={x} cy={y} r="5" className="results-trend-point" /><text x={x} y={Math.max(18, y - 12)} className="results-value-label">{average.toFixed(1).replace(".", ",")}</text><text x={x} y="168" className="results-term-label">T{index + 1}</text></g>;
                    })}
                  </svg>
                </div> : <p className="results-no-data">Aucun résultat d’exemple pour cette classe.</p>}
              </article>
              <article className="panel results-panel">
                <div className="results-panel-heading"><div><span className="results-panel-kicker">POINTS FORTS & AXES DE PROGRÈS</span><h2>Moyenne par matière</h2><p>Résultats du {resultTerms[selectedResultTerm].toLocaleLowerCase("fr-FR")}</p></div><span className="results-panel-icon result-orange"><BookOpen size={19} /></span></div>
                {resultStudents.length ? <div className="subject-results">
                  {subjectAverages.map(({ subject, average }) => <div className="subject-result-row" key={subject}>
                    <span>{subject}</span><div className="subject-result-track"><i style={{ width: `${(average / 20) * 100}%` }} /></div><strong>{average.toFixed(1).replace(".", ",")}</strong>
                  </div>)}
                </div> : <p className="results-no-data">Aucune moyenne disponible.</p>}
              </article>
            </section>
            <section className="results-lower-grid">
              <article className="panel results-panel distribution-results">
                <div className="results-panel-heading"><div><span className="results-panel-kicker">NIVEAU DES ACQUIS</span><h2>Répartition des moyennes</h2></div><span className="results-panel-icon result-green"><Layers3 size={19} /></span></div>
                {[
                  { label: "À renforcer", count: resultStudents.filter(({ average }) => average < 10).length, color: "red" },
                  { label: "En progression", count: resultStudents.filter(({ average }) => average >= 10 && average < 14).length, color: "amber" },
                  { label: "Acquis satisfaisants", count: resultStudents.filter(({ average }) => average >= 14 && average < 16).length, color: "blue" },
                  { label: "Très bonne maîtrise", count: resultStudents.filter(({ average }) => average >= 16).length, color: "green" },
                ].map(({ label, count, color }) => <div className="level-result-row" key={label}>
                  <span className={`level-dot ${color}`} /><span className="level-result-label">{label}</span><div className="level-result-track"><i className={color} style={{ width: resultStudents.length ? `${(count / resultStudents.length) * 100}%` : "0%" }} /></div><strong>{count}</strong>
                </div>)}
              </article>
              <article className="panel results-panel support-results">
                <div className="results-panel-heading"><div><span className="results-panel-kicker">SUIVI INDIVIDUEL</span><h2>Élèves à accompagner</h2><p>Repérer tôt les besoins de soutien scolaire.</p></div><span className="results-panel-icon result-amber"><TriangleAlert size={19} /></span></div>
                {studentsToSupport.length ? <div className="support-student-list">{studentsToSupport.map((student) => <div className="support-student-row" key={student.name}>
                  <span className="support-avatar">{student.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span className="support-student-name"><strong>{student.name}</strong><small>{student.className} · {student.attendance}% de présence</small></span><strong className="support-average">{student.average.toFixed(1).replace(".", ",")}<small>/20</small></strong>
                </div>)}</div> : <p className="results-no-data">{resultStudents.length ? "Aucun élève sous la moyenne dans cette sélection." : "Aucun résultat disponible pour cette classe."}</p>}
              </article>
            </section>
            <section className="panel results-panel ranking-panel">
              <div className="results-panel-heading"><div><span className="results-panel-kicker">VUE PAR ÉLÈVE</span><h2>Résultats de la classe</h2><p>Classement indicatif par moyenne générale, {resultTerms[selectedResultTerm].toLocaleLowerCase("fr-FR")}.</p></div><span className="results-panel-icon result-purple"><Medal size={19} /></span></div>
              {resultStudents.length ? <div className="table-wrap"><table className="results-table">
                <thead><tr><th>Rang</th><th>Élève</th><th>Classe</th><th>Moyenne</th><th>Présence</th><th>Appréciation</th></tr></thead>
                <tbody>{resultStudents.map((student, index) => <tr key={student.name}>
                  <td><span className={`rank-badge ${index === 0 ? "top-rank" : ""}`}>{String(index + 1).padStart(2, "0")}</span></td>
                  <td><span className="student"><span className="student-avatar">{student.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>{student.name}</span></td>
                  <td><span className="registered-class-badge">{student.className}</span></td>
                  <td><strong className={student.average < 10 ? "grade-low" : "grade-good"}>{student.average.toFixed(1).replace(".", ",")} / 20</strong></td>
                  <td>{student.attendance}%</td>
                  <td><span className={`grade-status ${student.average < 10 ? "needs-support" : student.average >= 14 ? "strong-results" : ""}`}>{student.average < 10 ? "Soutien conseillé" : student.average >= 14 ? "Très bien" : "En bonne voie"}</span></td>
                </tr>)}</tbody>
              </table></div> : <p className="results-no-data">Aucun résultat pour cette classe. Choisissez une autre classe pour consulter les données d’exemple.</p>}
            </section>
          </div> : page === "Inscriptions et Paiement" ? <div className="enrollments-page">
            <section className="enrollment-hero">
              <div className="enrollment-hero-copy">
                <span className="enrollment-eyebrow"><ClipboardCheck size={15} /> GESTION DE LA RENTRÉE</span>
                <h2>Chaque dossier trouve sa place.</h2>
                <p>Suivez les validations et répartissez les élèves dans leurs tranches de paiement.</p>
                <div className="enrollment-hero-meta"><span><CalendarDays size={14} /> Année scolaire 2026–2027</span><i /> Données de l’établissement</div>
              </div>
              <div className="enrollment-hero-art" aria-hidden="true">
                <span className="enrollment-art-circle enrollment-art-circle-one" />
                <span className="enrollment-art-circle enrollment-art-circle-two" />
                <span className="enrollment-art-icon"><ClipboardCheck size={39} strokeWidth={1.5} /></span>
                <span className="enrollment-art-check"><CheckCircle2 size={19} /></span>
                <span className="enrollment-art-star">✦</span>
              </div>
              <button type="button" className="enrollment-new-button" onClick={() => { setPage("Élèves"); setShowStudentAddForm(true); }}>
                <Plus size={16} /> Nouveau dossier
              </button>
            </section>
            <section className="enrollment-stepper" aria-label="Étapes de suivi des inscriptions">
              <div className="enrollment-step"><span className="enrollment-step-icon step-orange"><Clock3 size={17} /></span><span><strong>À confirmer</strong><small>{waitingStudents.length} dossier{waitingStudents.length === 1 ? "" : "s"} en attente</small></span><i /></div>
              <div className="enrollment-step"><span className="enrollment-step-icon step-green"><CheckCircle2 size={17} /></span><span><strong>Inscription validée</strong><small>{validStudents.length} élève{validStudents.length === 1 ? "" : "s"} confirmé{validStudents.length === 1 ? "" : "s"}</small></span><i /></div>
              <div className="enrollment-step"><span className="enrollment-step-icon step-blue"><WalletCards size={17} /></span><span><strong>Suivi des paiements</strong><small>{assignedStudents.length} tranche{assignedStudents.length === 1 ? "" : "s"} attribuée{assignedStudents.length === 1 ? "" : "s"}</small></span></div>
            </section>
            <section className="enrollment-metrics">
              <article className="enrollment-metric-card">
                <span className="enrollment-metric-icon metric-violet"><UsersRound size={19} /></span><span className="enrollment-metric-label">Dossiers reçus</span>
                <strong>{enrollmentStudents.length}</strong><small>candidatures de l’année</small>
              </article>
              <article className="enrollment-metric-card">
                <span className="enrollment-metric-icon metric-orange"><Clock3 size={19} /></span><span className="enrollment-metric-label">En attente</span>
                <strong>{waitingStudents.length}</strong><small>à vérifier et confirmer</small>
              </article>
              <article className="enrollment-metric-card">
                <span className="enrollment-metric-icon metric-green"><CheckCircle2 size={19} /></span><span className="enrollment-metric-label">Validées</span>
                <strong>{validStudents.length}</strong><small>inscriptions confirmées</small>
              </article>
              <article className="enrollment-metric-card">
                <span className="enrollment-metric-icon metric-blue"><WalletCards size={19} /></span><span className="enrollment-metric-label">Tranches attribuées</span>
                <strong>{assignedStudents.length}<small> / {validStudents.length}</small></strong><small>élèves avec un suivi de paiement</small>
              </article>
            </section>
            <section className="enrollment-payment-overview">
              <div className="enrollment-payment-heading">
                <span className="enrollment-payment-mark"><WalletCards size={18} /></span>
                <div><h2>Répartition des tranches</h2><p>Suivez l’avancement des paiements par tranche.</p></div>
                <span className="payment-overview-caption">SUIVI DES FRAIS</span>
                <button type="button" className="schooling-fees-button" onClick={() => setShowClassFeesConfig(true)}>
                  <SlidersHorizontal size={16} /> Tarifs par classe
                </button>
              </div>
              <div className="enrollment-payment-cards">
                {["Tranche 1", "Tranche 2", "Tranche 3"].map((tranche, index) => {
                  const count = enrollmentStudents.filter((entry) => {
                    const payments = getStudentPayment(getStudentKey(entry));
                    return [1, 2, 3].slice(index).some((trancheNumber) => (payments[`tranche${trancheNumber}`] || 0) > 0);
                  }).length;
                  const percent = validStudents.length ? Math.round((count / validStudents.length) * 100) : 0;
                  return <div className={`enrollment-payment-card payment-tone-${index + 1}`} key={tranche}>
                    <div className="payment-card-top"><span className="payment-dot" /><span>{tranche}</span><strong>{count}</strong></div>
                    <div className="payment-progress-track"><i style={{ width: `${percent}%` }} /></div>
                    <small>{percent}% des dossiers validés</small>
                  </div>;
                })}
              </div>
            </section>
            <section className="panel enrollment-directory">
              <div className="enrollment-directory-heading">
                <div><span className="enrollment-section-kicker">CAMPAGNE 2026–2027</span><h2>Dossiers d’inscription</h2><p>Vérifiez les dossiers et suivez leur avancement.</p></div>
                <span className="enrollment-directory-count">{filteredEnrollmentStudents.length} dossier{filteredEnrollmentStudents.length === 1 ? "" : "s"}</span>
              </div>
              <div className="enrollment-toolbar">
                <div className="enrollment-status-tabs" role="group" aria-label="Filtrer par inscription">
                  {[
                    { label: "Tous", value: "Tous", count: enrollmentStudents.length },
                    { label: "À confirmer", value: "pending", count: waitingStudents.length },
                    { label: "Validés", value: "valid", count: validStudents.length },
                  ].map((tab) => <button type="button" key={tab.value} className={enrollmentStatusFilter === tab.value ? "selected" : ""} onClick={() => setEnrollmentStatusFilter(tab.value)}>
                    {tab.label}<span>{tab.count}</span>
                  </button>)}
                </div>
                <label className="enrollment-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Rechercher un dossier" placeholder="Nom, responsable..." value={enrollmentSearch} onChange={(event) => setEnrollmentSearch(event.target.value)} /></label>
                <label className="enrollment-class-filter"><span>Classe</span><select aria-label="Classe des inscriptions" value={enrollmentClassFilter} onChange={(event) => setEnrollmentClassFilter(event.target.value)}>
                  <option value="Toutes les classes">Toutes les classes</option>{schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                </select></label>
              </div>
              {filteredEnrollmentStudents.length ? <div className="enrollment-table-wrap"><table className="enrollment-table">
                <thead><tr><th>Élève</th><th>Classe</th><th>Responsable</th><th>Dossier reçu</th><th>Inscription</th><th>Paiement</th><th><span className="sr-only">Action</span></th></tr></thead>
                <tbody>{filteredEnrollmentStudents.map((entry) => {
                  const { className, student } = entry;
                  const studentKey = getStudentKey(entry);
                  const isSelected = selectedEnrollmentStudent && getStudentKey(selectedEnrollmentStudent) === studentKey;
                  const fees = getClassFees(className);
                  const payments = getStudentPayment(studentKey);
                  const trancheKeys = ["tranche1", "tranche2", "tranche3"];
                  let trancheLabel = "";
                  trancheKeys.forEach((key, index) => {
                    const owed = fees[key] || 0;
                    const paid = payments[key] || 0;
                    if (paid <= 0) return;
                    trancheLabel = `Tranche ${index + 1}${owed > 0 && paid >= owed ? " ✓" : "..."}`;
                  });
                  const totalOwed = fees.inscription + fees.tranche1 + fees.tranche2 + fees.tranche3;
                  const totalPaid = payments.inscription + payments.tranche1 + payments.tranche2 + payments.tranche3;
                  const isSettled = totalOwed > 0 && totalPaid >= totalOwed;
                  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
                  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR");
                  const receivedDate = student.createdAt
                    ? new Date(student.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                    : "À l’instant";
                  return <Fragment key={studentKey}>
                    <tr className={isSelected ? "enrollment-row-selected" : ""}>
                      <td><span className="enrollment-student"><span className={`enrollment-student-avatar ${student.gender === "F" ? "enrollment-avatar-pink" : ""} ${student.profileImage ? "has-profile-image" : ""}`}>{student.profileImage ? <img src={student.profileImage} alt="" /> : initials}</span><span><strong>{fullName}</strong><small>{student.age ? `${student.age} ans` : "Âge non renseigné"} · {student.gender || "—"}</small></span></span></td>
                      <td><span className="enrollment-class-chip">{className}</span></td>
                      <td><span className="enrollment-guardian"><ContactRound size={14} /><span><strong>{student.responsible || "Non renseigné"}</strong><small>{student.responsiblePhone || "Téléphone non renseigné"}</small></span></span></td>
                      <td><span className="enrollment-date">{receivedDate}</span></td>
                      <td><span className={`enrollment-status-badge ${student.enrollmentStatus}`} >{student.enrollmentStatus === "valid" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{student.enrollmentStatus === "valid" ? "Validé" : "À confirmer"}</span></td>
                      <td><span className={`enrollment-payment-badge ${isSettled ? "settled" : trancheLabel ? "assigned" : ""}`}><WalletCards size={13} />{isSettled ? "Soldé" : trancheLabel || "À répartir"}</span></td>
                      <td><button type="button" className={`enrollment-manage-button ${isSelected ? "active" : ""}`} onClick={() => setSelectedEnrollmentStudent(isSelected ? null : entry)}>{isSelected ? "Fermer" : "Affecter"}<ArrowUpRight size={13} /></button></td>
                    </tr>
                  </Fragment>;
                })}</tbody>
              </table></div> : <div className="enrollment-empty"><span><ClipboardCheck size={23} /></span><strong>{enrollmentStudents.length ? "Aucun dossier ne correspond à ces critères" : "Les inscriptions commenceront ici"}</strong><p>{enrollmentStudents.length ? "Modifiez les filtres pour afficher d’autres dossiers." : "Créez un dossier élève pour démarrer le suivi des inscriptions."}</p>{!enrollmentStudents.length && <button type="button" onClick={() => { setPage("Élèves"); setShowStudentAddForm(true); }}><Plus size={15} /> Créer un dossier</button>}</div>}
            </section>
            {showClassFeesConfig && (
              <div className="class-fees-config-overlay" onClick={() => setShowClassFeesConfig(false)}>
                <div className="class-fees-config-dialog" onClick={(e) => e.stopPropagation()}>
                  <header className="class-fees-config-header">
                    <h2>Configurer les tarifs par classe</h2>
                    <button type="button" onClick={() => setShowClassFeesConfig(false)}><X size={18} /></button>
                  </header>
                  <form onSubmit={(e) => { e.preventDefault(); setShowClassFeesConfig(false); }} className="class-fees-config-form">
                    <div className="fees-config-classes">
                      {schoolClasses.map((className) => (
                        <div key={className} className="fee-config-class-block">
                          <h3>{className}</h3>
                          <div className="fees-config-grid">
                            {[
                              { key: "inscription", label: "Inscription", icon: ClipboardCheck },
                              { key: "tranche1", label: "Tranche 1", icon: CalendarDays },
                              { key: "tranche2", label: "Tranche 2", icon: CalendarDays },
                              { key: "tranche3", label: "Tranche 3", icon: CalendarDays },
                            ].map(({ key, label, icon: Icon }) => (
                              <div key={key} className="fee-config-item">
                                <label>
                                  <span className="fee-config-icon"><Icon size={16} /></span>
                                  <span>{label}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={classFees[className]?.[key] || 0}
                                    onChange={(e) => setClassFees((current) => ({
                                      ...current,
                                      [className]: { ...current[className], [key]: Number(e.target.value) || 0 }
                                    }))}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    placeholder="0"
                                  />
                                </label>
                              </div>
                            ))}
                          </div>
                          <div className="fees-config-total">
                            Total : <strong>{(classFees[className] ? (classFees[className].inscription + classFees[className].tranche1 + classFees[className].tranche2 + classFees[className].tranche3) : 0).toLocaleString("fr-FR")} FCFA</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="fees-config-actions">
                      <button type="button" className="schooling-close-button" onClick={() => setShowClassFeesConfig(false)}>Fermer</button>
                      <button type="submit" className="payment-submit-button"><CheckCircle2 size={15} /> Enregistrer</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {selectedEnrollmentStudent && (
              <div className="schooling-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEnrollmentStudent(null); }}>
                <div className="schooling-modal" role="dialog" aria-modal="true" aria-label="Suivi des paiements">
                  {renderSchoolingInterface()}
                </div>
              </div>
            )}
          </div> : page === "Enseignantes" ? <div className="teachers-page">
            <section className="teachers-hero">
              <div className="teachers-hero-copy">
                <span className="teachers-eyebrow"><GraduationCap size={15} /> ÉQUIPE PÉDAGOGIQUE</span>
                <h2>Celles et ceux qui font<br />grandir chaque élève.</h2>
                <p>Retrouvez votre équipe, ses expériences et les classes accompagnées.</p>
                <div className="teachers-hero-meta"><span><UsersRound size={14} /> {teachers.length} membre{teachers.length === 1 ? "" : "s"} dans l’équipe</span><i /> Année scolaire 2026–2027</div>
              </div>
              <div className="teachers-hero-art" aria-hidden="true">
                <span className="teachers-orbit teachers-orbit-one" /><span className="teachers-orbit teachers-orbit-two" />
                <span className="teachers-hero-icon"><GraduationCap size={39} strokeWidth={1.5} /></span>
                <span className="teachers-hero-spark">✦</span>
              </div>
              <button type="button" className="teachers-add-button" onClick={() => {
                if (showTeacherAddForm) {
                  setShowTeacherAddForm(false);
                  setEditingTeacherIndex(null);
                } else {
                  setNewTeacher({ lastName: "", firstName: "", experience: "", diploma: "", phone: "", username: "", accessCode: "", className: schoolClasses[0], profileImage: "" });
                  setEditingTeacherIndex(null);
                  setTeacherNotice("");
                  setTeacherPhotoError("");
                  setShowTeacherAddForm(true);
                }
              }}>
                {showTeacherAddForm ? <X size={16} /> : <Plus size={17} />}{showTeacherAddForm ? "Fermer le formulaire" : "Ajouter un membre"}
              </button>
            </section>
            <section className="teachers-overview">
              <article className="teachers-overview-card"><span className="teachers-overview-icon teacher-blue"><UsersRound size={19} /></span><span className="teachers-overview-label">Membres de l’équipe</span><strong>{teachers.length}</strong><small>enseignant{teachers.length === 1 ? "" : "e"}{teachers.length === 1 ? "" : "s"} enregistré{teachers.length === 1 ? "" : "s"}</small></article>
              <article className="teachers-overview-card"><span className="teachers-overview-icon teacher-green"><School size={19} /></span><span className="teachers-overview-label">Classes accompagnées</span><strong>{assignedClassCount}<small> / {schoolClasses.length}</small></strong><small>avec un référent désigné</small></article>
              <article className="teachers-overview-card"><span className="teachers-overview-icon teacher-purple"><ClipboardCheck size={19} /></span><span className="teachers-overview-label">Classes à pourvoir</span><strong>{Math.max(0, schoolClasses.length - assignedClassCount)}</strong><small>sans enseignant référent</small></article>
            </section>
            {teacherNotice && <p className="teacher-notice" role="status">{teacherNotice}</p>}
            {showTeacherAddForm && <section className="panel teacher-form-panel">
              <div className="teacher-form-heading"><span className="teacher-form-icon">{editingTeacherIndex !== null ? <Pencil size={17} /> : <UserRound size={18} />}</span><div><h2>{editingTeacherIndex !== null ? "Modifier le profil enseignant" : "Nouveau profil enseignant"}</h2><p>Renseignez les informations professionnelles et la classe de référence.</p></div></div>
              <form className="student-add-form teacher-add-form" onSubmit={submitNewTeacher}>
                {teacherPhotoError && <p className="student-form-notice" role="alert">{teacherPhotoError}</p>}
                <div className="student-profile-upload teacher-profile-upload">
                  <span className="student-profile-preview">
                    {newTeacher.profileImage ? <img src={newTeacher.profileImage} alt={`Photo de ${newTeacher.firstName || "l’enseignant"}`} /> : <ImagePlus size={25} />}
                  </span>
                  <div className="student-profile-copy"><strong>Photo de profil</strong><span>JPG, PNG ou WEBP · 5 Mo maximum · facultative</span></div>
                  <label className="student-profile-choose teacher-profile-choose">
                    <ImagePlus size={15} /> {newTeacher.profileImage ? "Changer la photo" : "Choisir une photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleTeacherProfileImage} />
                  </label>
                  {newTeacher.profileImage && <button type="button" className="student-profile-remove" onClick={() => setNewTeacher((current) => ({ ...current, profileImage: "" }))}>Retirer</button>}
                </div>
                <div className="student-add-fields teacher-fields">
                  <label><span>Nom de famille <small>*</small></span>
                    <input autoFocus={editingTeacherIndex !== null} required type="text" value={newTeacher.lastName} onChange={(event) => setNewTeacher((current) => ({ ...current, lastName: event.target.value.toLocaleUpperCase("fr-FR") }))} placeholder="Ex. MBOLO" />
                  </label>
                  <label><span>Prénom <small>*</small></span>
                    <input required type="text" value={newTeacher.firstName} onChange={(event) => setNewTeacher((current) => ({ ...current, firstName: event.target.value }))} placeholder="Prénom" />
                  </label>
                  <label><span>Années d’expérience <small>*</small></span>
                    <input required type="number" min="0" value={newTeacher.experience} onChange={(event) => setNewTeacher((current) => ({ ...current, experience: event.target.value }))} placeholder="Ex. 5" />
                  </label>
                  <label><span>Diplôme <small>*</small></span>
                    <input required type="text" value={newTeacher.diploma} onChange={(event) => setNewTeacher((current) => ({ ...current, diploma: event.target.value }))} placeholder="Ex. Licence en éducation" />
                  </label>
                  <label><span>Téléphone <small>*</small></span>
                    <input required type="tel" value={newTeacher.phone} onChange={(event) => setNewTeacher((current) => ({ ...current, phone: event.target.value }))} placeholder="Numéro de téléphone" />
                  </label>
                  <label><span>Classe de référence <small>*</small></span>
                    <select required value={newTeacher.className} onChange={(event) => setNewTeacher((current) => ({ ...current, className: event.target.value }))}>
                      <option value="">À affecter</option>
                      {schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                    </select>
                  </label>
                </div>
                <div className="student-add-actions">
                  <button type="button" className="student-add-cancel" onClick={() => {
                    setShowTeacherAddForm(false);
                    setEditingTeacherIndex(null);
                    setNewTeacher({ lastName: "", firstName: "", experience: "", diploma: "", phone: "", username: "", accessCode: "", className: schoolClasses[0], profileImage: "" });
                    setTeacherPhotoError("");
                  }}>Annuler</button>
                  <button type="submit" className="student-add-submit">{editingTeacherIndex !== null ? <CheckCircle2 size={15} /> : <Plus size={15} />}{editingTeacherIndex !== null ? "Enregistrer les modifications" : "Enregistrer le profil"}</button>
                </div>
              </form>
            </section>}
            <section className="teachers-directory">
              <div className="teachers-directory-heading">
                <div><span className="teachers-section-kicker">LES PERSONNES QUI FONT L’ÉCOLE</span><h2>Notre équipe enseignante</h2><p>{teachers.length ? `${teachers.length} profil${teachers.length === 1 ? "" : "s"} · ${assignedClassCount} classe${assignedClassCount === 1 ? "" : "s"} avec référent` : "Les profils ajoutés apparaîtront ici."}</p></div>
                <span className="teachers-directory-icon"><UsersRound size={18} /></span>
              </div>
              {teachers.length ? <div className="teachers-grid">
                {teachers.map((teacher, index) => {
                  const initials = `${teacher.firstName?.[0] || ""}${teacher.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR");
                  const palette = ["teacher-card-teal", "teacher-card-blue", "teacher-card-violet", "teacher-card-amber", "teacher-card-rose"];
                  return <article className={`teacher-card ${palette[index % palette.length]}`} key={`${teacher.lastName}-${teacher.firstName}-${index}`}>
                    <div className="teacher-card-decoration" aria-hidden="true" />
                    <div className="teacher-card-top"><span className={`teacher-avatar ${teacher.profileImage ? "has-profile-image" : ""}`}>{teacher.profileImage ? <img src={teacher.profileImage} alt={`Photo de ${teacher.firstName} ${teacher.lastName}`} /> : initials}</span><span className="teacher-class-chip"><School size={12} />{teacher.className || "À affecter"}</span><div className="teacher-card-actions">
                      <button type="button" className="edit-teacher-button" onClick={() => startEditingTeacher(index)} aria-label={`Modifier ${teacher.firstName} ${teacher.lastName}`}><Pencil size={14} aria-hidden="true" /></button>
                      <button type="button" className="delete-teacher-button" onClick={() => removeTeacher(index)} aria-label={`Supprimer ${teacher.firstName} ${teacher.lastName}`}><Trash2 size={15} strokeWidth={2} aria-hidden="true" /></button>
                    </div></div>
                    <h3>{teacher.firstName} {teacher.lastName}</h3>
                    <p className="teacher-role"><GraduationCap size={14} /> Enseignant{teacher.gender === "F" ? "e" : ""} référent</p>
                    <div className="teacher-card-divider" />
                    <div className="teacher-detail-row"><Award size={14} /><span>{teacher.diploma}</span></div>
                    <div className="teacher-card-footer"><span><BriefcaseBusiness size={14} />{teacher.experience} an{Number(teacher.experience) > 1 ? "s" : ""} d’expérience</span><a href={`sms:${teacher.phone.replace(/[^\d+]/g, "")}`} aria-label={`Envoyer un message à ${teacher.firstName} ${teacher.lastName}`}><MessageSquareText size={14} /> Message</a></div>
                  </article>;
                })}
              </div> : <div className="teachers-empty-state"><span><GraduationCap size={25} /></span><strong>Votre équipe enseignante apparaîtra ici</strong><p>Ajoutez un profil pour associer un référent à chaque classe.</p><button type="button" className="teachers-empty-button" onClick={() => setShowTeacherAddForm(true)}><Plus size={15} /> Ajouter le premier profil</button></div>}
            </section>
          </div> : page === "Matières" ? <div className="subjects-page">
            <section className="subjects-hero">
              <div className="subjects-hero-copy">
                <span className="subjects-eyebrow"><BookOpen size={15} /> ORGANISATION PÉDAGOGIQUE</span>
                <h2>Chaque matière ouvre<br />une nouvelle découverte.</h2>
                <p>Composez un programme clair et retrouvez en un coup d’œil les disciplines de l’établissement.</p>
                <div className="subjects-hero-tags"><span><Layers3 size={14} /> {subjects.length} matière{subjects.length === 1 ? "" : "s"} au programme</span><i /><span>Année scolaire 2026–2027</span></div>
              </div>
              <div className="subjects-hero-visual" aria-hidden="true">
                <span className="subjects-visual-orbit subjects-orbit-one" /><span className="subjects-visual-orbit subjects-orbit-two" />
                <span className="subjects-visual-book"><BookOpen size={35} strokeWidth={1.5} /></span>
                <span className="subjects-visual-pages"><i /><i /><i /><i /></span>
                <span className="subjects-visual-spark">✦</span>
              </div>
              <button type="button" className="subjects-add-button" onClick={() => setShowSubjectAddForm((current) => !current)}>
                {showSubjectAddForm ? <X size={16} /> : <Plus size={17} />}
                {showSubjectAddForm ? "Fermer" : "Ajouter une matière"}
              </button>
            </section>
            {showSubjectAddForm && <section className="subjects-form-panel">
              <div className="subjects-form-heading"><span className="subjects-form-icon"><Plus size={18} /></span><div><h2>Ajouter au programme</h2><p>Indiquez le nom, les classes concernées, les coefficients et le caractère de la matière.</p></div></div>
              {subjectNotice && <p className="subject-notice" role="alert">{subjectNotice}</p>}
              <form className="subject-add-form" onSubmit={submitNewSubject}>
                <label className="subject-input-label">Nom de la matière
                  <input required autoFocus type="text" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder="Ex. Lecture" />
                </label>
                <fieldset className={`subject-class-picker-fieldset ${hasNewSubjectName ? "" : "locked"}`}>
                  <legend>Classes concernées</legend>
                  {!hasNewSubjectName && <p className="subject-locked-hint">Saisissez d’abord le nom de la matière.</p>}
                  <div className="subject-class-picker">
                    {schoolClasses.map((className) => {
                      const checked = newSubjectClasses.includes(className);
                      return <label key={className} className={`subject-class-chip ${checked ? "checked" : ""}`}>
                        <input type="checkbox" disabled={!hasNewSubjectName} checked={checked} onChange={() => toggleNewSubjectClass(className)} />
                        <span className="subject-class-check" aria-hidden="true">{checked ? <CheckCircle2 size={13} /> : <Plus size={12} />}</span>
                        <span>{className}</span>
                      </label>;
                    })}
                  </div>
                </fieldset>
                {newSubjectClasses.length > 0 && <fieldset className="subject-coefficient-picker-fieldset">
                  <legend>Coefficient par classe</legend>
                  <div className="subject-coefficient-list">
                    {newSubjectClasses.map((className) => <div key={className} className={`subject-coefficient-row ${blinkingSubjectClass === className ? "blink" : ""}`}>
                      <span>{className}</span>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        disabled={!hasNewSubjectName}
                        value={newSubjectCoefficients[className] ?? ""}
                        onChange={(event) => {
                          setNewSubjectCoefficients((current) => ({ ...current, [className]: event.target.value }));
                          setSubjectNotice("");
                          if (blinkingSubjectClass === className) setBlinkingSubjectClass("");
                        }}
                        onWheel={(event) => event.currentTarget.blur()}
                        placeholder="Ex. 2"
                      />
                      <select value={newSubjectRequirements[className] || "required"} onChange={(event) => { setNewSubjectRequirements((current) => ({ ...current, [className]: event.target.value })); setSubjectNotice(""); }} aria-label={`Caractère de la matière en ${className}`}>
                        <option value="required">Obligatoire</option>
                        <option value="optional">Facultative</option>
                      </select>
                    </div>)}
                  </div>
                </fieldset>}
                <div className="student-add-actions">
                  <button type="button" className="student-add-cancel" onClick={() => setShowSubjectAddForm(false)}>Annuler</button>
                  <button type="submit" className="student-add-submit" disabled={!hasNewSubjectName}><Plus size={15} /> Confirmer l’ajout</button>
                </div>
              </form>
            </section>}
            <section className="subjects-overview">
              <article className="subjects-overview-card">
                <span className="subjects-overview-icon subjects-icon-teal"><BookOpen size={19} /></span><span className="subjects-overview-label">Matières au programme</span>
                <strong>{subjects.length}</strong><small>discipline{subjects.length === 1 ? "" : "s"} enregistrée{subjects.length === 1 ? "" : "s"}</small>
              </article>
              <article className="subjects-overview-card">
                <span className="subjects-overview-icon subjects-icon-blue"><School size={19} /></span><span className="subjects-overview-label">Niveaux disponibles</span>
                <strong>{schoolClasses.length}</strong><small>de {schoolClasses[0]} à {schoolClasses[schoolClasses.length - 1]}</small>
              </article>
              <article className="subjects-overview-card subjects-year-card">
                <span className="subjects-overview-icon subjects-icon-amber"><CalendarDays size={19} /></span><span className="subjects-overview-label">Année scolaire</span>
                <strong>2026<span>–</span>2027</strong><small>préparez votre programme</small>
              </article>
            </section>
            <div className="subjects-section-heading">
              <div><span className="subjects-section-kicker">VOTRE PROGRAMME</span><h2>Les matières enseignées</h2><p>Le catalogue des disciplines de votre établissement.</p></div>
              <span className="subjects-count-badge"><BookOpen size={14} /> {subjects.length} matière{subjects.length === 1 ? "" : "s"}</span>
            </div>
            {subjectNotice && !showSubjectAddForm && <p className="subject-notice" role="alert">{subjectNotice}</p>}
            {subjects.length ? <section className="subjects-grid" aria-label="Matières de l’établissement">
              {subjects.map((subject, index) => {
                const subjectCoefficients = getSubjectCoefficients(subject, schoolClasses);
                return <article className={`subject-card subject-tone-${index % 4}`} key={`${subject.name}-${index}`} style={{ "--subject-order": index }}>
                <div className="subject-card-top"><span className="subject-card-icon"><BookOpen size={19} /></span><div className="subject-card-actions"><span className="subject-card-number">{String(index + 1).padStart(2, "0")}</span><button type="button" className="subject-edit-button" aria-label={`Modifier ${subject.name}`} onClick={() => { setEditingSubjectIndex(index); setEditingSubject({ name: subject.name, requirement: subject.requirement }); setEditingSubjectCoefficientIndex(null); setSubjectNotice(""); }}><Pencil size={14} /></button><button type="button" className="subject-delete-button" aria-label={`Supprimer ${subject.name}`} title={`Supprimer ${subject.name}`} onClick={() => removeSubject(index)}><Trash2 size={14} /></button></div></div>
                {editingSubjectIndex === index ? <form className="subject-edit-form" onSubmit={(event) => saveSubjectEdit(event, index)}>
                  <label>Nom de la matière
                    <input autoFocus required maxLength={70} value={editingSubject.name} onChange={(event) => { setEditingSubject((current) => ({ ...current, name: event.target.value })); setSubjectNotice(""); }} />
                  </label>
                  <div className="subject-edit-actions">
                    <button type="button" onClick={() => { setEditingSubjectIndex(null); setSubjectNotice(""); }}>Annuler</button>
                    <button type="submit"><CheckCircle2 size={14} /> Enregistrer</button>
                  </div>
                </form> : <>
                  <h3>{subject.name}</h3>
                  <button type="button" className="subject-coefficient-button" onClick={() => {
                    const className = subject.className || schoolClasses[0];
                    setEditingSubjectIndex(null);
                    setSubjectNotice("");
                    setSubjectCoefficientDraft({
                      className,
                      coefficient: String(subjectCoefficients[className] ?? ""),
                      requirement: getSubjectRequirement(subject, className),
                    });
                    setEditingSubjectCoefficientIndex((current) => current === index ? null : index);
                  }}>Ajouter ou changer un coefficient</button>
                  {editingSubjectCoefficientIndex === index && <form className="subject-coefficient-form" onSubmit={(event) => saveSubjectCoefficient(event, index)}>
                    <label>Classe
                      <select value={subjectCoefficientDraft.className} onChange={(event) => {
                        const className = event.target.value;
                        setSubjectCoefficientDraft({
                          className,
                          coefficient: String(subjectCoefficients[className] ?? ""),
                          requirement: getSubjectRequirement(subject, className),
                        });
                        setSubjectNotice("");
                      }}>
                        {schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                      </select>
                    </label>
                    <label>Coefficient
                      <input required type="number" min="0.01" step="any" value={subjectCoefficientDraft.coefficient} onChange={(event) => {
                        setSubjectCoefficientDraft((current) => ({ ...current, coefficient: event.target.value }));
                        setSubjectNotice("");
                      }} onWheel={(event) => event.currentTarget.blur()} />
                    </label>
                    <label>Caractère
                      <select value={subjectCoefficientDraft.requirement} onChange={(event) => {
                        setSubjectCoefficientDraft((current) => ({ ...current, requirement: event.target.value }));
                        setSubjectNotice("");
                      }}>
                        <option value="required">Obligatoire</option>
                        <option value="optional">Facultative</option>
                      </select>
                    </label>
                    <div className="subject-edit-actions">
                      <button type="button" onClick={() => { setEditingSubjectCoefficientIndex(null); setSubjectNotice(""); }}>Annuler</button>
                      <button type="submit"><CheckCircle2 size={14} /> Enregistrer</button>
                    </div>
                  </form>}
                  <div className="subject-card-divider" />
                  <div className="subject-card-classes">
                    {Object.entries(subjectCoefficients).length ? Object.entries(subjectCoefficients).map(([className, coefficient]) => {
                      const requirement = getSubjectRequirement(subject, className);
                      return <div key={className} className={`subject-card-class-item ${requirement === "optional" ? "optional" : ""}`}>
                        <span className="subject-card-class-name">{className}</span>
                        <span className="subject-card-class-meta">Coef. {coefficient} · {requirement === "optional" ? "Facultative" : "Obligatoire"}</span>
                      </div>;
                    }) : <div className="subject-card-class-item"><span className="subject-card-class-name">Aucune classe</span><span className="subject-card-class-meta">Ajoutez un coefficient</span></div>}
                  </div>
                  <div className="subject-card-footer"><span>Discipline enseignée</span><span className="subject-card-status">{Object.keys(subjectCoefficients).length} classe{Object.keys(subjectCoefficients).length === 1 ? "" : "s"}</span></div>
                </>}
              </article>;
              })}
            </section> : <section className="subjects-empty-state">
              <span className="subjects-empty-icon"><BookOpen size={23} /></span>
              <span className="subjects-section-kicker">VOTRE CATALOGUE COMMENCE ICI</span>
              <h3>Aucune matière pour le moment</h3>
              <p>Ajoutez les disciplines enseignées dans votre école pour composer votre programme.</p>
              <button type="button" className="subjects-empty-button" onClick={() => setShowSubjectAddForm(true)}><Plus size={15} /> Ajouter la première matière</button>
            </section>}
          </div> : page === "Élèves" ? <div className="students-page">
            <video
              className="students-background-video"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              tabIndex={-1}
              poster="https://i.pinimg.com/videos/thumbnails/originals/b5/84/79/b58479d6e3f1a6fd2cbe881ba1c4b331.0000000.jpg"
            >
              <source src="https://v1.pinimg.com/videos/iht/expMp4/b5/84/79/b58479d6e3f1a6fd2cbe881ba1c4b331_720w.mp4" type="video/mp4" />
            </video>
            <section className="students-page-heading">
              <div className="students-hero-copy">
                <span className="students-eyebrow"><UsersRound size={15} /> LE CŒUR DE VOTRE ÉCOLE</span>
                <h2>Chaque élève a<br />une histoire à faire grandir.</h2>
                <p>Un espace lumineux pour accompagner les élèves, suivre leurs dossiers et rester proches de leurs familles.</p>
                <div className="students-hero-tags"><span><GraduationCap size={14} /> Année scolaire 2026–2027</span><i /><span>{registeredStudents.length} élève{registeredStudents.length === 1 ? "" : "s"} suivi{registeredStudents.length === 1 ? "" : "s"}</span></div>
              </div>
              <div className="students-hero-art" aria-hidden="true">
                <span className="students-art-orbit students-art-orbit-one" /><span className="students-art-orbit students-art-orbit-two" />
                <span className="students-art-sun" />
                <span className="students-art-student"><GraduationCap size={38} strokeWidth={1.5} /></span>
                <span className="students-art-avatar students-art-avatar-one"><UsersRound size={16} /></span>
                <span className="students-art-avatar students-art-avatar-two"><Award size={15} /></span>
                <span className="students-art-spark">✦</span>
              </div>
              <button type="button" className="students-add-button" onClick={() => {
                if (showStudentAddForm) cancelStudentForm();
                else {
                  setEditingStudent(null);
                  setShowStudentAddForm(true);
                }
                setNewStudentNotice("");
              }}>
                {showStudentAddForm ? <X size={16} /> : <Plus size={17} />}
                {showStudentAddForm ? "Fermer le formulaire" : "Ajouter un élève"}
              </button>
            </section>
            {newStudentNotice && <div className="student-added-notice"><CheckCircle2 size={16} />{newStudentNotice}</div>}
            <section className="students-summary" aria-label="Résumé des effectifs">
              <article className="students-summary-card">
                <span className="students-summary-icon student-summary-blue"><UsersRound size={19} /></span>
                <span className="students-summary-label">Effectif total</span>
                <strong>{registeredStudents.length}</strong><small>élève{registeredStudents.length === 1 ? "" : "s"} dans l’établissement</small>
              </article>
              <article className="students-summary-card">
                <span className="students-summary-icon student-summary-green"><CheckCircle2 size={19} /></span>
                <span className="students-summary-label">Dossiers confirmés</span>
                <strong>{validStudents.length}</strong><small>inscriptions validées</small>
              </article>
              <article className="students-summary-card">
                <span className="students-summary-icon student-summary-amber"><Clock3 size={19} /></span>
                <span className="students-summary-label">À finaliser</span>
                <strong>{waitingStudents.length + registeredStudents.filter(({ student }) => !student.enrollmentStatus).length}</strong><small>à vérifier ou compléter</small>
              </article>
              <article className="students-summary-card">
                <span className="students-summary-icon student-summary-purple"><ContactRound size={19} /></span>
                <span className="students-summary-label">Répartition</span>
                <strong>{femaleStudentCount} <small>F</small><span className="summary-divider">·</span>{maleStudentCount} <small>M</small></strong><small>élèves par sexe</small>
              </article>
            </section>
            {showStudentAddForm && <section className="panel student-form-panel">
              <div className="student-form-heading"><span className="student-form-icon">{editingStudent ? <Pencil size={18} /> : <Plus size={19} />}</span><div><h2>{editingStudent ? "Modifier le dossier élève" : "Nouveau dossier élève"}</h2><p>Les champs marqués d’un astérisque sont obligatoires.</p></div></div>
              {newStudentNotice && <p className="student-form-notice" role="alert">{newStudentNotice}</p>}
              <form className="student-add-form" onSubmit={submitNewStudent}>
                {studentPhotoError && <p className="student-form-notice" role="alert">{studentPhotoError}</p>}
                <div className="student-profile-upload">
                  <span className="student-profile-preview">
                    {newStudent.profileImage ? <img src={newStudent.profileImage} alt={`Photo de ${newStudent.firstName || "l’élève"}`} /> : <ImagePlus size={25} />}
                  </span>
                  <div className="student-profile-copy"><strong>Photo de profil</strong><span>JPG, PNG ou WEBP · 5 Mo maximum · facultative</span></div>
                  <label className="student-profile-choose">
                    <ImagePlus size={15} /> {newStudent.profileImage ? "Changer la photo" : "Choisir une photo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleStudentProfileImage} />
                  </label>
                  {newStudent.profileImage && <button type="button" className="student-profile-remove" onClick={() => updateNewStudent("profileImage", "")}>Retirer</button>}
                </div>
                <div className="student-add-fields">
                  <label><span>Nom de famille <small>*</small></span>
                    <input autoFocus={Boolean(editingStudent)} required type="text" value={newStudent.lastName} onChange={(event) => updateNewStudent("lastName", event.target.value.toLocaleUpperCase("fr-FR"))} placeholder="Ex. NGUI" />
                  </label>
                  <label><span>Prénom <small>*</small></span>
                    <input required type="text" value={newStudent.firstName} onChange={(event) => updateNewStudent("firstName", event.target.value)} placeholder="Prénom de l’élève" />
                  </label>
                  <label><span>Âge <small>*</small></span>
                    <input required type="number" min="2" max="25" value={newStudent.age} onChange={(event) => updateNewStudent("age", event.target.value)} placeholder="Âge" />
                  </label>
                  <label><span>Sexe <small>*</small></span>
                    <select required value={newStudent.gender} onChange={(event) => updateNewStudent("gender", event.target.value)}>
                      <option value="" disabled>Choisir</option><option value="F">Féminin</option><option value="M">Masculin</option>
                    </select>
                  </label>
                  <label><span>Classe <small>*</small></span>
                    <select value={newStudent.className} onChange={(event) => updateNewStudent("className", event.target.value)}>
                      {schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                    </select>
                  </label>
                  <label><span>Nom du responsable <small>*</small></span>
                    <input required type="text" value={newStudent.responsible} onChange={(event) => updateNewStudent("responsible", event.target.value)} placeholder="Parent ou tuteur légal" />
                  </label>
                  <label><span>Téléphone du responsable <small>*</small></span>
                    <input required type="tel" value={newStudent.responsiblePhone} onChange={(event) => updateNewStudent("responsiblePhone", event.target.value)} placeholder="Numéro de téléphone" />
                  </label>
                </div>
                <div className="student-add-actions">
                  <button type="button" className="student-add-cancel" onClick={cancelStudentForm}>Annuler</button>
                  <button type="submit" className="student-add-submit">{editingStudent ? <CheckCircle2 size={15} /> : <Plus size={15} />}{editingStudent ? "Enregistrer les modifications" : "Enregistrer l’élève"}</button>
                </div>
              </form>
            </section>}
            <section className="panel students-directory">
              <div className="students-directory-heading">
                <div><span className="students-table-kicker">ANNUAIRE SCOLAIRE</span><h2>Liste des élèves</h2><p>{filteredStudents.length} résultat{filteredStudents.length === 1 ? "" : "s"} sur {registeredStudents.length}</p></div>
                <span className="directory-icon"><SlidersHorizontal size={17} /></span>
              </div>
              <div className="students-toolbar">
                <label className="student-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label="Rechercher un élève" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Rechercher par nom, responsable..." /></label>
                <label className="student-filter"><span>Classe</span><select aria-label="Filtrer par classe" value={studentClassFilter} onChange={(event) => setStudentClassFilter(event.target.value)}>
                  <option value="Toutes les classes">Toutes les classes</option>{schoolClasses.map((className) => <option key={className} value={className}>{className}</option>)}
                </select></label>
                <label className="student-filter"><span>Inscription</span><select aria-label="Filtrer par statut d’inscription" value={studentStatusFilter} onChange={(event) => setStudentStatusFilter(event.target.value)}>
                  <option value="Tous les statuts">Tous les statuts</option><option value="valid">Inscrit</option><option value="pending">En attente</option><option value="incomplete">Dossier à compléter</option>
                </select></label>
              </div>
              <div className="students-table-wrap"><table className="students-table">
                <thead><tr><th>Élève</th><th>Classe</th><th>Âge</th><th>Responsable légal</th><th>Inscription</th><th>Paiement</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{filteredStudents.map(({ className, student, studentIndex }) => {
                  const studentKey = getStudentKey({ className, student, studentIndex });
                  const isResponsibleVisible = selectedResponsibleStudent === studentKey;
                  const fees = getClassFees(className);
                  const payments = getStudentPayment(studentKey);
                  const trancheKeys = ["tranche1", "tranche2", "tranche3"];
                  let trancheLabel = "";
                  trancheKeys.forEach((key, index) => {
                    const owed = fees[key] || 0;
                    const paid = payments[key] || 0;
                    if (paid <= 0) return;
                    trancheLabel = `Tranche ${index + 1}${owed > 0 && paid >= owed ? " ✓" : "..."}`;
                  });
                  const totalOwed = fees.inscription + fees.tranche1 + fees.tranche2 + fees.tranche3;
                  const totalPaid = payments.inscription + payments.tranche1 + payments.tranche2 + payments.tranche3;
                  const isSettled = totalOwed > 0 && totalPaid >= totalOwed;
                  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
                  return <Fragment key={studentKey}>
                    <tr>
<td><span className="directory-student"><button type="button" className={`directory-avatar ${student.profileImage ? "has-profile-image profile-image-button" : student.gender === "F" ? "avatar-pink" : "avatar-blue"}`} aria-label={`Afficher le profil de ${fullName}`} onClick={() => setSelectedProfileImage({ src: student.profileImage || "", name: fullName, student, className })}>{student.profileImage ? <img src={student.profileImage} alt="" /> : `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}</button>
                        <span><strong>{fullName}</strong><small>{student.gender === "F" ? "Fille" : student.gender === "M" ? "Garçon" : "Sexe non renseigné"}</small></span></span></td>
                      <td><span className="registered-class-badge">{className}</span></td>
                      <td>{student.age ? `${student.age} ans` : "—"}</td>
                      <td><button type="button" className="directory-contact-button" onClick={() => setSelectedResponsibleStudent(isResponsibleVisible ? null : studentKey)}><ContactRound size={15} />{student.responsible || "Voir le contact"}<span>{isResponsibleVisible ? "Masquer" : "Détails"}</span></button></td>
                      <td><span className={`enrollment-status-badge ${student.enrollmentStatus}`}>{student.enrollmentStatus === "valid" ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}{student.enrollmentStatus === "valid" ? "Validé" : "À confirmer"}</span></td>
                      <td><span className={`enrollment-payment-badge ${isSettled ? "settled" : trancheLabel ? "assigned" : ""}`}><WalletCards size={13} />{isSettled ? "Soldé" : trancheLabel || "À répartir"}</span></td>
                      <td><div className="student-row-actions">
                        <button type="button" className="edit-student-button" title="Modifier l’élève" aria-label={`Modifier ${fullName}`} onClick={() => startEditingStudent({ className, student, studentIndex })}><Pencil size={14} aria-hidden="true" /></button>
                        <button type="button" className="delete-student-button" title="Supprimer l’élève" aria-label={`Supprimer ${fullName}`} onClick={() => removeStudent(className, studentIndex)}><Trash2 size={15} strokeWidth={2} aria-hidden="true" /></button>
                      </div></td>
                    </tr>
                    {isResponsibleVisible && <tr className="student-contact-detail"><td colSpan="7"><ContactRound size={15} /><strong>Responsable :</strong> {student.responsible || "Non renseigné"}<span className="contact-separator">·</span><strong>Téléphone :</strong> {student.responsiblePhone || "Non renseigné"}</td></tr>}
                  </Fragment>;
                })}</tbody>
              </table>
              {filteredStudents.length === 0 && <div className="students-empty-state"><span><UsersRound size={23} /></span><strong>{registeredStudents.length ? "Aucun élève ne correspond à ces filtres" : "Aucun dossier élève pour le moment"}</strong><p>{registeredStudents.length ? "Modifiez les critères ou réinitialisez les filtres." : "Ajoutez les premiers élèves pour commencer à suivre les effectifs."}</p>{registeredStudents.length > 0 ? <button type="button" className="students-reset-button" onClick={() => { setStudentSearch(""); setStudentClassFilter("Toutes les classes"); setStudentStatusFilter("Tous les statuts"); }}><RotateCcw size={14} /> Réinitialiser les filtres</button> : <button type="button" className="students-add-button" onClick={() => setShowStudentAddForm(true)}><Plus size={16} /> Ajouter le premier élève</button>}</div>}
              </div>
            </section>
            {selectedProfileImage && createPortal(<div className="class-details-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedProfileImage(null);
            }}>
              <section className="class-details-dialog profile-student-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-image-title">
                <header className="class-details-header">
                  <div><span className="classes-section-kicker">DOSSIER DE L’ÉLÈVE</span><h2 id="profile-image-title">{selectedProfileImage.name}</h2><p>Informations de l’élève</p></div>
                  <button type="button" className="class-details-close" aria-label="Fermer les informations de l’élève" onClick={() => setSelectedProfileImage(null)}><X size={18} /></button>
                </header>
                <div className="profile-image-content">
                  {selectedProfileImage.src ? <img className="profile-image-large" src={selectedProfileImage.src} alt={`Photo de profil de ${selectedProfileImage.name}`} /> : <span className={`profile-initials-large ${selectedProfileImage.student.gender === "F" ? "avatar-pink" : "avatar-blue"}`}>{`${selectedProfileImage.student.firstName?.[0] || ""}${selectedProfileImage.student.lastName?.[0] || ""}`.toLocaleUpperCase("fr-FR")}</span>}
                  <dl className="profile-image-details">
                    <div><dt>Classe</dt><dd>{selectedProfileImage.className}</dd></div>
                    <div><dt>Âge</dt><dd>{selectedProfileImage.student.age ? `${selectedProfileImage.student.age} ans` : "Non renseigné"}</dd></div>
                    <div><dt>Sexe</dt><dd>{selectedProfileImage.student.gender === "F" ? "Fille" : selectedProfileImage.student.gender === "M" ? "Garçon" : "Non renseigné"}</dd></div>
                    <div><dt>Statut d’inscription</dt><dd>{(() => { const entry = registeredStudents.find((e) => e.className === selectedProfileImage.className && e.student === selectedProfileImage.student); return entry ? renderPaymentStatus(entry) : (selectedProfileImage.student.enrollmentStatus === "valid" ? "À régler-- inscriptions ; payements" : selectedProfileImage.student.enrollmentStatus === "pending" ? "En attente" : "À compléter"); })()}</dd></div>
                    <div><dt>Responsable légal</dt><dd>{selectedProfileImage.student.responsible || "Non renseigné"}</dd></div>
                    <div><dt>Téléphone</dt><dd>{selectedProfileImage.student.responsiblePhone || "Non renseigné"}</dd></div>
                  </dl>
                </div>
              </section>
            </div>, document.body)}
          </div> : <section className="panel placeholder"><div className="placeholder-icon"><BookOpen size={28} /></div><h2>Section {page}</h2><p>Nous allons construire cette partie de l’application ensemble.</p></section>}
        </div>
      </main>
    </div>
  );
}

export default App;
