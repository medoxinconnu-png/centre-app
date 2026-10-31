// Calculs dérivés des données de la démo : aucune page ne stocke de chiffre en dur,
// tout part des élèves, groupes, paiements et charges du store.
import { price } from '../components/Students/utils/studentHelpers'
import { MONTHS, SHORT_MONTHS, currentMonthIndex, currentMonthKey, monthDate, monthKey, schoolYearStart, today } from './calendar'

const DAY = 24 * 60 * 60 * 1000

export const sum = (list, pick = (item) => item) => list.reduce((total, item) => total + pick(item), 0)
export const sameId = (a, b) => a !== '' && a != null && String(a) === String(b)
export const formatDH = (value) => `${Math.round(value).toLocaleString('fr-FR')} DH`
export const shortBranch = (branch) => (branch || '').replace('Succursale ', '')

export const fullName = (teacher) => (teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Non assigné')

export function indexById(list) {
  return Object.fromEntries(list.map((item) => [item.id, item]))
}

export function subjectPrice(student, subject) {
  const details = student.subjectDetails?.[subject]
  return details?.priceType === 'manual' ? Number(details.manualPrice || 0) : price(subject)
}

export function monthlyFee(student) {
  return sum(student.chosen || [], (subject) => subjectPrice(student, subject))
}

export const groupsOfStudent = (groups, studentId) => groups.filter((group) => group.studentIds.includes(studentId))
export const groupsOfTeacher = (groups, teacherId) => groups.filter((group) => sameId(group.teacherId, teacherId))

/** Détails par matière pour le formulaire d'édition : prix + groupe et professeur actuels. */
export function studentFormDetails(student, groups) {
  return Object.fromEntries((student.chosen || []).map((subject) => {
    const group = groups.find((item) => item.subject === subject && item.studentIds.includes(student.id))
    return [subject, { ...student.subjectDetails?.[subject], groupId: group?.id ?? '', teacherId: group?.teacherId ?? '' }]
  }))
}

/** Professeurs et groupes proposables pour une matière (même niveau, même succursale en priorité). */
export function assignmentOptions({ groups, teachers }, subject, { level, branch, teacherId } = {}) {
  const forSubject = groups.filter((group) => group.active && group.subject === subject)
  const sameLevel = forSubject.filter((group) => group.level === level)
  const pool = (sameLevel.length ? sameLevel : forSubject)
    .slice()
    .sort((a, b) => Number(b.branch === branch) - Number(a.branch === branch))
  const teacherOptions = teachers.filter((teacher) => teacher.active && (teacher.subjects.includes(subject) || pool.some((group) => sameId(group.teacherId, teacher.id))))
  const groupOptions = teacherId ? pool.filter((group) => sameId(group.teacherId, teacherId)) : pool
  return { teacherOptions, groupOptions }
}

export function paymentSummary(student, payments) {
  const months = payments[student.id] || Array(12).fill('inactive')
  const dueMonths = []
  let paidCount = 0
  let billedCount = 0
  months.forEach((status, index) => {
    if (index > currentMonthIndex) return
    if (status !== 'inactive') billedCount += 1
    if (status === 'paid') paidCount += 1
    if (status === 'due') dueMonths.push(index)
  })
  const fee = monthlyFee(student)
  const days = dueMonths.length ? Math.max(1, Math.floor((today - monthDate(dueMonths[0])) / DAY)) : 0
  const status = dueMonths.length ? 'Impayé' : billedCount ? 'Payé' : 'N/A'
  return { months, fee, dueMonths, paidCount, billedCount, debt: dueMonths.length * fee, days, status }
}

export function debtorsList({ students, groups, payments }, branch) {
  return students
    .filter((student) => !branch || student.branch === branch)
    .map((student) => ({ student, ...paymentSummary(student, payments), groups: groupsOfStudent(groups, student.id) }))
    .filter((row) => row.debt > 0)
    .sort((a, b) => b.debt - a.debt)
}

/** Salaire d'un professeur : fixe, ou pourcentage du prix payé par chaque élève de ses groupes. */
export function salaryBreakdown(teacher, groups, studentsById) {
  const rows = groupsOfTeacher(groups, teacher.id)
    .filter((group) => group.active)
    .map((group) => {
      const lines = group.studentIds
        .map((id) => studentsById[id])
        .filter((student) => student?.active)
        .map((student) => ({ student, amount: subjectPrice(student, group.subject) }))
      const total = sum(lines, (line) => line.amount)
      const rate = teacher.paymentType === 'pourcentage' ? Number(teacher.rates?.[group.cycle] || 0) : 0
      return { group, lines, total, rate, due: Math.round((total * rate) / 100) }
    })
  const amount = !teacher.active ? 0 : teacher.paymentType === 'fixe' ? Number(teacher.salary) || 0 : sum(rows, (row) => row.due)
  return { rows, amount }
}

/** Part du salaire imputée à chaque succursale (au prorata des groupes pour un salaire fixe). */
function salaryShares(teacher, breakdown) {
  if (!breakdown.amount) return {}
  if (teacher.paymentType === 'pourcentage') {
    return breakdown.rows.reduce((shares, row) => ({ ...shares, [row.group.branch]: (shares[row.group.branch] || 0) + row.due }), {})
  }
  const branches = breakdown.rows.length ? breakdown.rows.map((row) => row.group.branch) : teacher.branches.slice(0, 1)
  return branches.reduce((shares, branch) => ({ ...shares, [branch]: (shares[branch] || 0) + breakdown.amount / branches.length }), {})
}

export function payroll({ teachers, groups }, studentsById) {
  return teachers.map((teacher) => {
    const breakdown = salaryBreakdown(teacher, groups, studentsById)
    return { teacher, ...breakdown, shares: salaryShares(teacher, breakdown) }
  })
}

/** Charges du mois : les salaires fixes des profs sont ajoutés automatiquement. */
export function expenseLines({ expenses }, salaries) {
  const auto = salaries
    .filter(({ teacher, amount }) => teacher.paymentType === 'fixe' && amount)
    .map(({ teacher, amount, shares }) => ({
      id: `auto-${teacher.id}`,
      title: `Salaire fixe – ${teacher.firstName[0]}. ${teacher.lastName}`,
      amount,
      month: currentMonthKey,
      branch: Object.keys(shares).join(' · ') || '—',
      type: 'Auto',
    }))
  return [...auto, ...expenses]
}

/** Charges manuelles d'un mois : celles saisies pour ce mois, plus les charges récurrentes pour les mois passés. */
export function chargesFor(expenses, monthIndex, branch) {
  const key = monthKey(monthIndex)
  return sum(
    expenses.filter((item) => (!branch || item.branch === branch) && (item.month === key || (monthIndex < currentMonthIndex && item.recurring))),
    (item) => item.amount
  )
}

/** Bilan d'un mois de l'année scolaire en cours. */
export function monthFinance(state, salaries, monthIndex, branch) {
  let billed = 0
  let collected = 0
  state.students.forEach((student) => {
    if (branch && student.branch !== branch) return
    const status = state.payments[student.id]?.[monthIndex]
    const fee = monthlyFee(student)
    if (status === 'paid') collected += fee
    if (status === 'paid' || (student.active && (status === 'due' || status === 'upcoming'))) billed += fee
  })
  const salaryTotal = sum(salaries, (item) => (branch ? item.shares[branch] || 0 : item.amount))
  const charges = chargesFor(state.expenses, monthIndex, branch)
  return { billed, collected, due: billed - collected, charges, salaries: salaryTotal, profit: collected - charges - salaryTotal }
}

// Saisonnalité utilisée pour reconstituer l'historique des années précédentes.
const SEASON = [0.86, 0.95, 1, 0.97, 1.02, 1.03, 1.05, 1.04, 1.06, 0.92, 0.78, 0.66]

/** Bilan d'un mois quelconque : réel pour l'année en cours, reconstitué (~12 %/an de croissance) avant. */
export function financeAt(state, salaries, yearStart, monthIndex, branch) {
  if (yearStart >= schoolYearStart) return monthFinance(state, salaries, monthIndex, branch)
  const reference = monthFinance(state, salaries, currentMonthIndex, branch)
  const factor = SEASON[monthIndex] * 0.88 ** (schoolYearStart - yearStart) * (1 + (((monthIndex * 37) % 7) - 3) / 100)
  const billed = Math.round((reference.billed * factor) / 10) * 10
  const collected = Math.round((billed * (0.95 + ((monthIndex * 13) % 4) / 100)) / 10) * 10
  const charges = Math.round(reference.charges * (0.8 + 0.2 * factor))
  const salaryTotal = Math.round(reference.salaries * (0.55 + 0.45 * factor))
  return { billed, collected, due: billed - collected, charges, salaries: salaryTotal, profit: collected - charges - salaryTotal }
}

/** Les 12 mois glissants qui se terminent au mois donné. */
export function rollingSeries(state, salaries, endYearStart, endIndex, branch) {
  return Array.from({ length: 12 }, (_, step) => {
    let index = endIndex - 11 + step
    let yearStart = endYearStart
    if (index < 0) {
      index += 12
      yearStart -= 1
    }
    return {
      label: SHORT_MONTHS[index],
      month: `${MONTHS[index]} ${monthDate(index, 1, yearStart).getFullYear()}`,
      ...financeAt(state, salaries, yearStart, index, branch),
    }
  })
}

/** Graduations « rondes » pour les axes des graphiques. */
export function niceScale(values, ticks = 4) {
  const max = Math.max(0, ...values)
  const min = Math.min(0, ...values)
  const raw = (max - min || 1) / ticks
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((n) => n * magnitude).find((n) => n >= raw)
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const marks = []
  for (let value = hi; value >= lo - step / 2; value -= step) marks.push(Math.round(value))
  return { min: lo, max: hi, ticks: marks }
}
