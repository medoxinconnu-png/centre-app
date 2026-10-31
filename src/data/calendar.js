// Calendrier de l'année scolaire (septembre → août), calé sur la date du jour
// pour que la démo paraisse toujours « à jour ».
export const MONTHS = ['Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août']
export const SHORT_MONTHS = ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août']

export const today = new Date()
export const schoolYearStart = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1
export const schoolYearLabel = `${schoolYearStart}-${schoolYearStart + 1}`
// Index du mois courant dans l'année scolaire (0 = septembre).
export const currentMonthIndex = (today.getMonth() + 4) % 12

/** Date réelle d'un mois de l'année scolaire (index 0 = septembre de `yearStart`). */
export function monthDate(index, day = 1, yearStart = schoolYearStart) {
  return new Date(yearStart + (index >= 4 ? 1 : 0), (index + 8) % 12, day)
}

export function monthLabel(index, yearStart = schoolYearStart) {
  return `${MONTHS[index]} ${monthDate(index, 1, yearStart).getFullYear()}`
}

/** Clé « AAAA-MM » utilisée par les charges. */
export function monthKey(index, yearStart = schoolYearStart) {
  const date = monthDate(index, 1, yearStart)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export const todayIso = isoDate(today)
export const currentMonthKey = monthKey(currentMonthIndex)

/** Nombre de jours d'un mois de l'année scolaire, borné à aujourd'hui pour le mois courant. */
export function elapsedDays(index) {
  const start = monthDate(index)
  const end = index === currentMonthIndex ? today.getDate() : new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  return Math.max(1, end)
}
