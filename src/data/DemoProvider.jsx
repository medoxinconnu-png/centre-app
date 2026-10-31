import { useEffect, useMemo, useState } from 'react'
import { DemoContext } from './DemoContext'
import { createSeed } from './seed'
import { currentMonthIndex, currentMonthKey } from './calendar'
import { cycleOfLevel } from './catalog'
import { indexById, payroll, sameId } from './selectors'

// La clé contient le mois : au changement de mois, la démo repart d'un jeu de données daté du jour.
const STORAGE_KEY = `centre-app-demo:v1:${currentMonthKey}`

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // Stockage indisponible (navigation privée…) : on repart du jeu de démo.
  }
  return createSeed()
}

const upsert = (list, item) => (list.some((entry) => entry.id === item.id) ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item])

const cleanDetails = (chosen, details = {}) =>
  Object.fromEntries(chosen.map((subject) => {
    const { priceType = 'standard', manualPrice = '' } = details[subject] || {}
    return [subject, { priceType, manualPrice }]
  }))

/** Inscrit l'élève exactement dans les groupes choisis (un par matière) et le retire des autres. */
function withMemberships(groups, studentId, groupIds) {
  const wanted = new Set(groupIds.filter((id) => id !== '' && id != null).map(String))
  return groups.map((group) => {
    const member = group.studentIds.includes(studentId)
    const want = wanted.has(String(group.id))
    if (member === want) return group
    return { ...group, studentIds: want ? [...group.studentIds, studentId] : group.studentIds.filter((id) => id !== studentId) }
  })
}

function applySubjects(data, student, chosen, details) {
  const next = { ...student, chosen, subjectDetails: cleanDetails(chosen, details) }
  const groupIds = chosen.map((subject) => details?.[subject]?.groupId)
  return { ...data, students: upsert(data.students, next), groups: withMemberships(data.groups, next.id, groupIds) }
}

function applyStudentForm(data, form, id) {
  const existing = data.students.find((student) => student.id === id)
  const firstGroup = data.groups.find((group) => form.chosen.some((subject) => sameId(form.subjectDetails?.[subject]?.groupId, group.id)))
  const student = {
    active: true,
    enrolledAt: currentMonthIndex,
    ...existing,
    id: existing?.id || crypto.randomUUID(),
    name: `${form.firstName} ${form.lastName}`.trim(),
    code: form.code,
    cycle: form.cycle,
    level: form.level,
    track: form.track,
    branch: form.branch || existing?.branch || firstGroup?.branch || data.branches[0].name,
    phone: form.phone,
    phone2: form.phone2,
    birthDate: form.birthDate,
    address: form.address,
    school: form.school,
    schoolClass: form.schoolClass,
    alerts: form.alerts,
  }
  const next = applySubjects(data, student, form.chosen, form.subjectDetails)
  if (existing) return next
  // Nouvel élève : le mois en cours est à régler, les suivants sont à venir.
  const months = Array.from({ length: 12 }, (_, m) => (m < currentMonthIndex ? 'inactive' : m === currentMonthIndex ? 'due' : 'upcoming'))
  return { ...next, payments: { ...next.payments, [student.id]: months } }
}

/** Enregistre un groupe et tient à jour les matières des élèves ajoutés ou retirés. */
function applyGroup(data, group) {
  const previous = data.groups.find((item) => item.id === group.id)
  const next = { ...group, cycle: cycleOfLevel(group.level) }
  const groups = upsert(data.groups, next)
  const oldSubject = previous?.subject
  const leaving = (previous?.studentIds || []).filter((id) => !next.studentIds.includes(id) || oldSubject !== next.subject)

  const students = data.students.map((student) => {
    let result = student
    if (leaving.includes(student.id) && !groups.some((item) => item.subject === oldSubject && item.studentIds.includes(student.id))) {
      const subjectDetails = { ...result.subjectDetails }
      delete subjectDetails[oldSubject]
      result = { ...result, chosen: result.chosen.filter((subject) => subject !== oldSubject), subjectDetails }
    }
    if (next.studentIds.includes(student.id) && !result.chosen.includes(next.subject)) {
      result = { ...result, chosen: [...result.chosen, next.subject], subjectDetails: { ...result.subjectDetails, [next.subject]: { priceType: 'standard', manualPrice: '' } } }
    }
    return result
  })
  return { ...data, groups, students }
}

export default function DemoProvider({ children }) {
  const [data, setData] = useState(loadData)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Quota ou stockage bloqué : la démo continue sans persistance.
    }
  }, [data])

  const actions = useMemo(() => {
    // Setter par collection, avec la même signature que celui de useState.
    const setter = (key) => (value) => setData((current) => ({ ...current, [key]: typeof value === 'function' ? value(current[key]) : value }))

    return {
      setStudents: setter('students'),
      setGroups: setter('groups'),
      setTeachers: setter('teachers'),
      setExpenses: setter('expenses'),
      setBranches: setter('branches'),
      setUsers: setter('users'),
      saveStudent: (form, id) => setData((current) => applyStudentForm(current, form, id)),
      saveStudentSubjects: (id, chosen, details) =>
        setData((current) => applySubjects(current, current.students.find((student) => student.id === id), chosen, details)),
      saveGroup: (group) => setData((current) => applyGroup(current, group)),
      saveTeacher: (teacher, groupIds = []) =>
        setData((current) => {
          const clean = { ...teacher }
          delete clean.groups
          const wanted = new Set(groupIds.map(String))
          const groups = current.groups.map((group) => {
            if (wanted.has(String(group.id))) return { ...group, teacherId: clean.id }
            return sameId(group.teacherId, clean.id) ? { ...group, teacherId: '' } : group
          })
          return { ...current, teachers: upsert(current.teachers, clean), groups }
        }),
      setPayments: (studentId, monthIndexes, status = 'paid') =>
        setData((current) => ({
          ...current,
          payments: {
            ...current.payments,
            [studentId]: current.payments[studentId].map((value, index) => (monthIndexes.includes(index) ? status : value)),
          },
        })),
      addAttendance: (event) =>
        setData((current) => ({ ...current, attendance: [...current.attendance, { ...event, id: crypto.randomUUID() }] })),
      addGrade: (studentId, grade) =>
        setData((current) => ({ ...current, grades: { ...current.grades, [studentId]: [...(current.grades[studentId] || []), grade] } })),
      resetDemo: () => setData(createSeed()),
    }
  }, [])

  const value = useMemo(() => {
    const studentsById = indexById(data.students)
    const salaries = payroll(data, studentsById)
    const lastCode = Math.max(999, ...data.students.map((student) => Number(student.code?.split('-').pop()) || 0))
    const codePrefix = data.students[0]?.code?.split('-').slice(0, 2).join('-') || 'REG'
    return {
      ...data,
      ...actions,
      studentsById,
      teachersById: indexById(data.teachers),
      salaries,
      nextStudentCode: `${codePrefix}-${lastCode + 1}`,
    }
  }, [data, actions])

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}
