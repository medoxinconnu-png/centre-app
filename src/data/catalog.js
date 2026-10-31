// Référentiels partagés par tous les modules (cycles, niveaux, matières…).
export const cycles = ['Préscolaire', 'Primaire', 'Collège', 'Lycée', 'Formation']

export const levelsByCycle = {
  'Préscolaire': ['Petite section', 'Moyenne section', 'Grande section'],
  Primaire: ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année', '6ème année'],
  Collège: ['7ème (1AC)', '8ème (2AC)', '9ème (3AC)'],
  Lycée: ['Tronc commun', '1ère Bac', '2ème Bac'],
  Formation: ['Formation Pro', 'Informatique', 'Langues'],
}

export const cycleOfLevel = (level) => Object.keys(levelsByCycle).find((cycle) => levelsByCycle[cycle].includes(level)) || ''

export const branchesByLevel = {
  'Tronc commun': ['Sciences', 'Lettres', 'Technique'],
  '1ère Bac': ['Sciences Mathématiques', 'Sciences Physiques', 'Sciences SVT', 'Sciences Économiques'],
  '2ème Bac': ['Sciences Mathématiques', 'Sciences Physiques', 'Sciences SVT', 'Sciences Économiques'],
}

export const subjects = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais', 'Arabe', 'Philosophie']

export const attendanceItems = [
  { id: 'absence', text: 'Absence' },
  { id: 'cahier', text: 'Cahier non apporté' },
  { id: 'exercice', text: 'Exercice non fait / manquant' },
  { id: 'betise', text: 'Bêtise', detail: 'Détail (optionnel)...' },
  { id: 'retard', text: 'Retard', detail: 'Nombre de minutes' },
]

export const blankGroup = { name: '', schedule: '', subject: '', level: '', teacherId: '', branch: '', studentIds: [], active: true }

export const emptyTeacher = {
  firstName: '',
  lastName: '',
  phone: '',
  cin: '',
  address: '',
  hiredAt: '',
  cycles: [],
  levels: [],
  subjects: [],
  branches: [],
  paymentType: 'fixe',
  salary: '',
  rates: {},
  active: true,
  groups: [],
}
