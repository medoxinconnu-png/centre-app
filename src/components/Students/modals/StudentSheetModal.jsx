import { useMemo, useState } from 'react'
import Icon from '../../Icon'
import { initials } from '../utils/studentHelpers'
import AddGradeModal from './AddGradeModal'
import { useDemo } from '../../../data/DemoContext'
import { currentMonthIndex, monthKey, monthLabel } from '../../../data/calendar'
import { fullName, groupsOfStudent, paymentSummary, subjectPrice } from '../../../data/selectors'

const STAT_TYPES = [
  ['ABSENCES', 'absence'],
  ['CAHIERS', 'cahier'],
  ['EXERCICES', 'exercice'],
  ['BÊTISES', 'betise'],
  ['RETARDS', 'retard'],
]

export default function StudentSheetModal({ student, close }) {
  const { groups, teachersById, payments, attendance, grades: allGrades, addGrade } = useDemo()
  const grades = allGrades[student.id] || []
  const [gradeOpen, setGradeOpen] = useState(false)
  const [month, setMonth] = useState(currentMonthIndex)

  const summary = paymentSummary(student, payments)
  const studentGroups = groupsOfStudent(groups, student.id)
  const monthOptions = Array.from({ length: currentMonthIndex - Math.min(student.enrolledAt ?? 0, currentMonthIndex) + 1 }, (_, i) => currentMonthIndex - i)

  // Pointages du mois choisi et cumul depuis la rentrée.
  const stats = useMemo(() => {
    const events = attendance.filter((event) => event.studentId === student.id)
    const key = monthKey(month)
    return STAT_TYPES.map(([label, type]) => {
      const ofType = events.filter((event) => event.items.includes(type))
      return [label, ofType.filter((event) => event.date.startsWith(key)).length, ofType.length]
    })
  }, [attendance, student.id, month])

  const stopPropagation = (e) => e.stopPropagation()

  return (
    <>
      <div className="student-overlay sheet-overlay" onMouseDown={close}>
        <section className="student-sheet" onMouseDown={stopPropagation}>
          <button className="student-close" onClick={close}>
            <Icon name="close" />
          </button>
          <aside>
            <div className="sheet-profile">
              <span>{initials(student.name)}</span>
              <h2>{student.name}</h2>
              <small>{student.code}</small>
              <b>{[student.level, student.track].filter(Boolean).join(' · ')}</b>
            </div>
            <p>♟ &nbsp; {student.birthDate || '—'}</p>
            <p>⌖ &nbsp; {student.address || '—'} · {student.branch}</p>
            <p>♧ &nbsp; {student.phone}</p>
            {student.phone2 && <p>☎ &nbsp; {student.phone2} <small>(2)</small></p>}
            <p>♜ &nbsp; {[student.school, student.schoolClass].filter(Boolean).join(' · ') || '—'}</p>
            <section className="sheet-alerts">
              <h3>Alertes médicales / comportementales</h3>
              <p>{student.alerts || 'Aucune alerte enregistrée.'}</p>
            </section>
            <div className="sheet-contact">
              <button>⌕ &nbsp; Appeler</button>
              <button>◯ &nbsp; WhatsApp</button>
            </div>
          </aside>
          <main>
            <div className="paid-card">
              <small>MOIS PAYÉS</small>
              <strong>{summary.paidCount}/{summary.billedCount}</strong>
            </div>
            <section className="monthly">
              <header>
                <h3>⌁ &nbsp; Suivi mensuel</h3>
                <div>
                  <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
                    {monthOptions.map((index) => <option key={index} value={index}>{monthLabel(index)}</option>)}
                  </select>
                  <button onClick={() => window.print()}>▣ &nbsp; Imprimer</button>
                </div>
              </header>
              <div className="monthly-stats">
                {stats.map(([label, count, total]) => (
                  <div key={label}>
                    <small>{label}</small>
                    <b>{count}</b>
                    <span>Cumul : {total}</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="grades">
              <header>
                <h3>Notes scolaires</h3>
                <button onClick={() => setGradeOpen(true)}>＋ Ajouter une note</button>
              </header>
              <table>
                <thead>
                  <tr>
                    <th>Matière</th>
                    <th>Note</th>
                    <th>N° examen</th>
                    <th>Session</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.length === 0 && <tr><td colSpan="5">Aucune note pour le moment.</td></tr>}
                  {grades.map((grade, i) => (
                    <tr key={`${grade.subject}-${i}`}>
                      <td><b>{grade.subject}</b></td>
                      <td><span>{grade.value} / 20</span></td>
                      <td>{grade.exam}</td>
                      <td>{grade.session}</td>
                      <td>{grade.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="enrolled-subjects">
              <h3>Matières inscrites</h3>
              <div>
                {student.chosen.length === 0 && <p>Aucune matière inscrite.</p>}
                {student.chosen.map((subject) => {
                  const group = studentGroups.find((item) => item.subject === subject)
                  return (
                    <article key={subject}>
                      <b>{subject}</b>
                      <small>{group ? `${group.name} · ${fullName(teachersById[group.teacherId])}` : 'Sans groupe'}</small>
                      <span>{subjectPrice(student, subject)} DH</span>
                    </article>
                  )
                })}
              </div>
            </section>
          </main>
        </section>
      </div>
      {gradeOpen && <AddGradeModal subjects={student.chosen.length ? student.chosen : undefined} add={(grade) => addGrade(student.id, grade)} close={() => setGradeOpen(false)} />}
    </>
  )
}
