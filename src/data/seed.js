// Jeu de données fictif de la démo. Tout est relié par identifiants :
// succursales → professeurs → groupes (10 élèves chacun) → élèves → paiements / notes / pointages.
// La génération est déterministe (PRNG à graine fixe) : la démo est identique à chaque réinitialisation.
import { APP } from './config'
import { currentMonthIndex, currentMonthKey, elapsedDays, isoDate, monthDate, schoolYearStart, today } from './calendar'
import { cycleOfLevel } from './catalog'
import { price } from '../components/Students/utils/studentHelpers'

export const GROUP_SIZE = 10

function createRandom(seed) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const branches = [
  { id: 1, name: 'Succursale Nord', address: '12 Bd Zerktouni, Maârif, Casablanca', phone: '0522334455', active: true },
  { id: 2, name: 'Succursale Sud', address: '45 Bd Oued Daoura, Hay Hassani, Casablanca', phone: '0522889977', active: true },
  { id: 3, name: 'Succursale Centre', address: '8 Bd Mohammed V, Casablanca', phone: '0522221100', active: true },
]

const teachers = [
  { id: 1, firstName: 'Karim', lastName: 'El Amrani', phone: '0612345678', cin: 'BE123456', address: 'Maârif, Casablanca', hiredAt: '2023-09-01', cycles: ['Lycée'], levels: ['Tronc commun', '2ème Bac'], subjects: ['Mathématiques'], branches: ['Succursale Nord', 'Succursale Centre'], paymentType: 'fixe', salary: '4500', rates: {}, active: true },
  { id: 2, firstName: 'Salma', lastName: 'Bennani', phone: '0623456789', cin: 'BK234567', address: 'Gauthier, Casablanca', hiredAt: '2023-09-01', cycles: ['Lycée'], levels: ['Tronc commun', '2ème Bac'], subjects: ['Physique-Chimie'], branches: ['Succursale Nord'], paymentType: 'pourcentage', salary: '', rates: { Lycée: '40' }, active: true },
  { id: 3, firstName: 'Youssef', lastName: 'Tazi', phone: '0634567890', cin: 'BH345678', address: 'Hay Hassani, Casablanca', hiredAt: '2024-09-15', cycles: ['Collège', 'Lycée'], levels: ['9ème (3AC)', '1ère Bac'], subjects: ['Français', 'Philosophie'], branches: ['Succursale Sud'], paymentType: 'fixe', salary: '3500', rates: {}, active: true },
  { id: 4, firstName: 'Nadia', lastName: 'Idrissi', phone: '0645678901', cin: 'BJ456789', address: 'Oasis, Casablanca', hiredAt: '2024-10-01', cycles: ['Lycée'], levels: ['1ère Bac', '2ème Bac'], subjects: ['Anglais'], branches: ['Succursale Sud', 'Succursale Centre'], paymentType: 'pourcentage', salary: '', rates: { Lycée: '40' }, active: true },
  { id: 5, firstName: 'Omar', lastName: 'Fassi', phone: '0656789012', cin: 'BE567890', address: 'Bourgogne, Casablanca', hiredAt: '2022-10-01', cycles: ['Primaire', 'Collège'], levels: ['5ème année', '6ème année'], subjects: ['Arabe'], branches: ['Succursale Nord'], paymentType: 'fixe', salary: '3500', rates: {}, active: false },
  { id: 6, firstName: 'Hanane', lastName: 'Berrada', phone: '0667890123', cin: 'BL678901', address: 'Hay Hassani, Casablanca', hiredAt: '2024-09-01', cycles: ['Collège'], levels: ['7ème (1AC)', '9ème (3AC)'], subjects: ['Mathématiques'], branches: ['Succursale Sud', 'Succursale Centre'], paymentType: 'pourcentage', salary: '', rates: { Collège: '35' }, active: true },
  { id: 7, firstName: 'Mehdi', lastName: 'Chraibi', phone: '0678901234', cin: 'BK789012', address: 'Centre-ville, Casablanca', hiredAt: '2025-09-01', cycles: ['Collège', 'Lycée'], levels: ['7ème (1AC)', '2ème Bac'], subjects: ['SVT'], branches: ['Succursale Centre'], paymentType: 'pourcentage', salary: '', rates: { Collège: '35', Lycée: '40' }, active: true },
  { id: 8, firstName: 'Imane', lastName: 'Lahlou', phone: '0689012345', cin: 'BE890123', address: 'Maârif, Casablanca', hiredAt: '2025-09-01', cycles: ['Primaire'], levels: ['6ème année'], subjects: ['Arabe', 'Français'], branches: ['Succursale Nord'], paymentType: 'fixe', salary: '3000', rates: {}, active: true },
]

// Une « promotion » = élèves d'un même niveau dans une même succursale.
// Les groupes d'une promotion se partagent ses élèves (un élève suit 1 à 3 matières).
const cohorts = {
  'nord-2bac': { branch: 'Succursale Nord', level: '2ème Bac', track: 'Sciences Mathématiques', size: 13 },
  'nord-tc': { branch: 'Succursale Nord', level: 'Tronc commun', track: 'Sciences', size: 12 },
  'nord-6ap': { branch: 'Succursale Nord', level: '6ème année', track: '', size: 11 },
  'sud-3ac': { branch: 'Succursale Sud', level: '9ème (3AC)', track: '', size: 13 },
  'sud-1bac': { branch: 'Succursale Sud', level: '1ère Bac', track: 'Sciences Physiques', size: 12 },
  'centre-1ac': { branch: 'Succursale Centre', level: '7ème (1AC)', track: '', size: 12 },
  'centre-2bac': { branch: 'Succursale Centre', level: '2ème Bac', track: 'Sciences Physiques', size: 13 },
}

// `offset` : premier élève de la promotion pris dans le groupe (10 élèves consécutifs).
const groupPlan = [
  { id: 1, cohort: 'nord-2bac', offset: 0, subject: 'Mathématiques', teacherId: 1, name: 'Maths — 2Bac SM · G1', schedule: 'Lun/Mer 18:00-20:00 · Salle A1' },
  { id: 2, cohort: 'nord-2bac', offset: 3, subject: 'Physique-Chimie', teacherId: 2, name: 'Physique-Chimie — 2Bac SM · G1', schedule: 'Mar/Jeu 18:00-20:00 · Salle A2' },
  { id: 3, cohort: 'nord-tc', offset: 0, subject: 'Mathématiques', teacherId: 1, name: 'Maths — Tronc commun · G1', schedule: 'Sam 09:00-11:00 · Salle A1' },
  { id: 4, cohort: 'nord-tc', offset: 2, subject: 'Physique-Chimie', teacherId: 2, name: 'Physique-Chimie — Tronc commun · G1', schedule: 'Sam 11:00-13:00 · Salle A2' },
  { id: 5, cohort: 'nord-6ap', offset: 0, subject: 'Arabe', teacherId: 8, name: 'Arabe — 6ème année · G1', schedule: 'Mer 14:00-16:00 · Salle B1' },
  { id: 6, cohort: 'nord-6ap', offset: 1, subject: 'Français', teacherId: 8, name: 'Français — 6ème année · G1', schedule: 'Sam 14:00-16:00 · Salle B1' },
  { id: 7, cohort: 'sud-3ac', offset: 0, subject: 'Mathématiques', teacherId: 6, name: 'Maths — 3AC · G1', schedule: 'Lun/Jeu 17:00-19:00 · Salle C1' },
  { id: 8, cohort: 'sud-3ac', offset: 3, subject: 'Français', teacherId: 3, name: 'Français — 3AC · G1', schedule: 'Sam 09:00-11:00 · Salle C2' },
  { id: 9, cohort: 'sud-1bac', offset: 0, subject: 'Philosophie', teacherId: 3, name: 'Philosophie — 1Bac · G1', schedule: 'Mer 16:00-18:00 · Salle C2' },
  { id: 10, cohort: 'sud-1bac', offset: 2, subject: 'Anglais', teacherId: 4, name: 'Anglais — 1Bac · G1', schedule: 'Ven 17:00-19:00 · Salle C1' },
  { id: 11, cohort: 'centre-1ac', offset: 0, subject: 'Mathématiques', teacherId: 6, name: 'Maths — 1AC · G1', schedule: 'Mar/Ven 17:00-19:00 · Salle D1' },
  { id: 12, cohort: 'centre-1ac', offset: 2, subject: 'SVT', teacherId: 7, name: 'SVT — 1AC · G1', schedule: 'Mer 15:00-17:00 · Salle D2' },
  { id: 13, cohort: 'centre-2bac', offset: 0, subject: 'SVT', teacherId: 7, name: 'SVT — 2Bac PC · G1', schedule: 'Lun 18:00-20:00 · Salle D2' },
  { id: 14, cohort: 'centre-2bac', offset: 3, subject: 'Anglais', teacherId: 4, name: 'Anglais — 2Bac · G1', schedule: 'Sam 10:00-12:00 · Salle D1' },
  { id: 15, cohort: 'centre-2bac', offset: 1, subject: 'Mathématiques', teacherId: 1, name: 'Maths — 2Bac PC · G1', schedule: 'Jeu 18:00-20:00 · Salle D1' },
]

const firstNames = ['Yasmine', 'Adam', 'Lina', 'Zakaria', 'Sara', 'Ilyas', 'Aya', 'Rayan', 'Salma', 'Anas', 'Malak', 'Hamza', 'Kenza', 'Bilal', 'Rim', 'Amine', 'Nour', 'Mehdi', 'Ines', 'Yassine', 'Hiba', 'Othmane', 'Douae', 'Ayoub', 'Meryem', 'Saad', 'Chaimae', 'Reda', 'Ghita', 'Ismail', 'Zineb', 'Younes', 'Hajar', 'Taha', 'Oumaima', 'Badr', 'Rania', 'Soufiane', 'Wiam', 'Marouane', 'Asmae', 'Walid', 'Nada', 'Ali', 'Khadija', 'Yahya', 'Safae', 'Nabil', 'Basma', 'Idriss']
const lastNames = ['Alaoui', 'Drissi', 'Ghazi', 'Jaidi', 'Mansouri', 'Saidi', 'Hakim', 'Kabbaj', 'Naciri', 'Qadiri', 'Benjelloun', 'Bennis', 'Cherkaoui', 'Filali', 'Guessous', 'Hajji', 'Iraqi', 'Kettani', 'Lamrani', 'Mernissi', 'Ouazzani', 'Rachidi', 'Sebti', 'Tahiri', 'Zniber', 'Bouzid', 'El Khatib', 'Benali', 'Sqalli', 'Belhaj', 'Ziani', 'Amrani', 'Skalli', 'Bennani-Smires', 'Lazrak', 'Chami', 'Ennaji', 'Fikri', 'Moussaoui', 'Rifai']
const streets = ['Rue Ibn Battouta', 'Rue Al Moutanabi', 'Rue Abou Bakr Seddik', 'Rue Ibn Khaldoun', 'Rue Al Fourat', 'Rue Tarik Ibn Ziad', 'Rue Moulay Youssef', 'Rue Ibnou Sina']
const districtByBranch = { 'Succursale Nord': 'Maârif', 'Succursale Sud': 'Hay Hassani', 'Succursale Centre': 'Centre-ville' }
const schoolsByCycle = {
  Primaire: ['École Al Massira', 'GS La Résidence', 'École Ibn Zaydoun'],
  Collège: ['Collège Anfa', 'Collège Ibn Rochd', 'GS Al Jabr'],
  Lycée: ['Lycée Al Khansaa', 'Lycée Mohammed V', 'Lycée Ibn Toumert', 'Lycée Moulay Idriss'],
}
const classPrefix = { '6ème année': '6AP', '7ème (1AC)': '1AC', '9ème (3AC)': '3AC', 'Tronc commun': 'TCS', '1ère Bac': '1BAC', '2ème Bac': '2BAC' }
const ageByLevel = { '6ème année': 11, '7ème (1AC)': 12, '9ème (3AC)': 14, 'Tronc commun': 15, '1ère Bac': 16, '2ème Bac': 17 }
const alertsPool = [
  'Asthme léger — ventoline dans le cartable.',
  'Allergie aux arachides.',
  'Porte des lunettes, à placer au premier rang.',
  'Dyslexie légère — prévoir du temps supplémentaire aux contrôles.',
  'Sort à 19h45 le jeudi (transport scolaire).',
]

const pick = (random, list) => list[Math.floor(random() * list.length)]
const phone = (random, prefix) => `${prefix}${String(Math.floor(random() * 1e8)).padStart(8, '0')}`

function buildStudents(random) {
  const students = []
  const membership = {}
  const usedNames = new Set()
  let index = 0

  Object.entries(cohorts).forEach(([key, cohort]) => {
    membership[key] = []
    const cycle = cycleOfLevel(cohort.level)
    for (let i = 0; i < cohort.size; i += 1) {
      let name
      do {
        name = `${pick(random, firstNames)} ${pick(random, lastNames)}`
      } while (usedNames.has(name))
      usedNames.add(name)

      const id = `s${index + 1}`
      const birth = new Date(schoolYearStart - ageByLevel[cohort.level], Math.floor(random() * 12), 1 + Math.floor(random() * 28))
      students.push({
        id,
        name,
        code: `REG-${schoolYearStart}-${1000 + index}`,
        cycle,
        level: cohort.level,
        track: cohort.track,
        branch: cohort.branch,
        phone: phone(random, '06'),
        phone2: phone(random, random() < 0.5 ? '06' : '07'),
        birthDate: isoDate(birth),
        address: `${3 + Math.floor(random() * 120)} ${pick(random, streets)}, ${districtByBranch[cohort.branch]}, Casablanca`,
        school: pick(random, schoolsByCycle[cycle]),
        schoolClass: `${classPrefix[cohort.level]} ${1 + Math.floor(random() * 4)}`,
        alerts: random() < 0.08 ? pick(random, alertsPool) : '',
        active: true,
        chosen: [],
        subjectDetails: {},
        // Mois d'inscription dans l'année scolaire (0 = septembre).
        enrolledAt: Math.min(currentMonthIndex, random() < 0.8 ? 0 : random() < 0.75 ? 1 : 2),
      })
      membership[key].push(id)
      index += 1
    }
  })

  return { students, membership }
}

function buildGroups(students, membership) {
  const byId = Object.fromEntries(students.map((student) => [student.id, student]))
  return groupPlan.map(({ cohort: key, offset, ...group }) => {
    const cohort = cohorts[key]
    const pool = membership[key]
    const studentIds = Array.from({ length: GROUP_SIZE }, (_, i) => pool[(offset + i) % pool.length])
    studentIds.forEach((id) => {
      const student = byId[id]
      if (!student.chosen.includes(group.subject)) student.chosen.push(group.subject)
      student.subjectDetails[group.subject] = { priceType: 'standard', manualPrice: '' }
    })
    return { ...group, level: cohort.level, cycle: cycleOfLevel(cohort.level), branch: cohort.branch, studentIds, active: true }
  })
}

// Quelques remises « fratrie » saisies en prix manuel.
function applyDiscounts(random, students) {
  students.forEach((student) => {
    if (student.chosen.length > 1 && random() < 0.12) {
      const subject = student.chosen[0]
      student.subjectDetails[subject] = { priceType: 'manual', manualPrice: String(price(subject) - 50) }
    }
  })
}

// Statuts par mois scolaire : paid / due (impayé) / upcoming (à venir) / inactive (pas encore inscrit).
function buildPayments(random, students) {
  return Object.fromEntries(students.map((student) => {
    const pastMonths = currentMonthIndex - student.enrolledAt
    const lateMonths = random() < 0.08 ? Math.min(pastMonths, random() < 0.6 ? 1 : 2) : 0
    const paysCurrent = lateMonths === 0 && random() < 0.9
    const advance = lateMonths === 0 && paysCurrent && random() < 0.08 ? 1 + Math.floor(random() * 2) : 0
    const months = Array.from({ length: 12 }, (_, m) => {
      if (m < student.enrolledAt) return 'inactive'
      if (m < currentMonthIndex) return m >= currentMonthIndex - lateMonths ? 'due' : 'paid'
      if (m === currentMonthIndex) return paysCurrent ? 'paid' : 'due'
      return m <= currentMonthIndex + advance ? 'paid' : 'upcoming'
    })
    return [student.id, months]
  }))
}

function randomDay(random, monthIndex) {
  return isoDate(monthDate(monthIndex, 1 + Math.floor(random() * elapsedDays(monthIndex))))
}

function weighted(random, weights) {
  let roll = random()
  for (let value = 0; value < weights.length; value += 1) {
    roll -= weights[value]
    if (roll < 0) return value
  }
  return 0
}

// Pointages (absences, retards…) déjà saisis depuis la rentrée.
function buildAttendance(random, students) {
  const distribution = { absence: [0.6, 0.28, 0.12], cahier: [0.75, 0.2, 0.05], exercice: [0.65, 0.25, 0.1], betise: [0.92, 0.08], retard: [0.7, 0.22, 0.08] }
  const events = []
  students.forEach((student) => {
    for (let m = student.enrolledAt; m <= currentMonthIndex; m += 1) {
      Object.entries(distribution).forEach(([type, weights]) => {
        const count = weighted(random, weights)
        for (let n = 0; n < count; n += 1) {
          events.push({
            id: `a${events.length + 1}`,
            studentId: student.id,
            date: randomDay(random, m),
            items: [type],
            minutes: type === 'retard' ? 5 + Math.floor(random() * 4) * 5 : undefined,
          })
        }
      })
    }
  })
  return events
}

function buildGrades(random, students) {
  const exams = ['Contrôle 1', 'Contrôle 2', 'Examen S1', 'Contrôle 3', 'Contrôle 4']
  return Object.fromEntries(students.map((student) => {
    const level = 9 + random() * 8
    const grades = []
    student.chosen.forEach((subject) => {
      exams.forEach((exam, index) => {
        const date = monthDate(Math.max(student.enrolledAt, index * 2), 12 + Math.floor(random() * 14))
        if (date > today) return
        const value = Math.max(4, Math.min(20, Math.round((level + (random() - 0.5) * 6) * 2) / 2))
        grades.push({ subject, value: String(value), exam, session: index < 3 ? 'S1' : 'S2', date: isoDate(date) })
      })
    })
    return [student.id, grades.sort((a, b) => a.date.localeCompare(b.date))]
  }))
}

// Charges mensuelles récurrentes (les salaires fixes des profs sont ajoutés automatiquement).
const recurringExpenses = [
  { title: 'Loyer', amount: 4500, branch: 'Succursale Nord' },
  { title: 'Loyer', amount: 3000, branch: 'Succursale Sud' },
  { title: 'Loyer', amount: 3500, branch: 'Succursale Centre' },
  { title: 'Électricité & eau', amount: 650, branch: 'Succursale Nord' },
  { title: 'Électricité & eau', amount: 480, branch: 'Succursale Sud' },
  { title: 'Électricité & eau', amount: 540, branch: 'Succursale Centre' },
  { title: 'Internet & téléphone', amount: 450, branch: 'Succursale Nord' },
  { title: 'Fournitures & photocopies', amount: 900, branch: 'Succursale Nord' },
  { title: 'Salaire secrétaire', amount: 3000, branch: 'Succursale Nord' },
  { title: 'Salaire secrétaire', amount: 2800, branch: 'Succursale Sud' },
  { title: 'Publicité réseaux sociaux', amount: 600, branch: 'Succursale Centre' },
]

const users = [
  { firstName: 'Yassine', lastName: 'El Idrissi', role: 'Super Admin', assigned: ['Toutes'], permissions: 11, active: true },
  { firstName: 'Sofia', lastName: 'Benali', role: 'Secrétaire', assigned: ['Succursale Nord'], permissions: 5, active: true },
  { firstName: 'Karim', lastName: 'Mansouri', role: 'Secrétaire', assigned: ['Succursale Sud', 'Succursale Centre'], permissions: 6, active: true },
  { firstName: 'Laila', lastName: 'Alaoui', role: 'Secrétaire', assigned: ['Succursale Centre'], permissions: 2, active: false },
]

export const allPermissions = ['Dashboard', 'Étudiants', 'Groupes', 'Professeurs', 'Frais de scolarité', 'Retards & Impayés', 'Salaires Profs', 'Charges', 'Bénéfice net', 'Paramètres', 'Administration (Utilisateurs & Succursales)']

export function createSeed() {
  const random = createRandom(2026)
  const { students, membership } = buildStudents(random)
  const groups = buildGroups(students, membership)
  applyDiscounts(random, students)

  return {
    branches,
    teachers,
    groups,
    students,
    payments: buildPayments(random, students),
    attendance: buildAttendance(random, students),
    grades: buildGrades(random, students),
    expenses: recurringExpenses.map((item, index) => ({ ...item, id: `e${index + 1}`, month: currentMonthKey, type: 'Manuel', recurring: true })),
    users: users.map((user, index) => ({
      ...user,
      id: index + 1,
      email: index === 0 ? `admin@${APP.domain}` : `${user.firstName}.${user.lastName}@${APP.domain}`.toLowerCase().replace(/\s+/g, ''),
      permissions: allPermissions.slice(0, user.permissions),
    })),
  }
}
