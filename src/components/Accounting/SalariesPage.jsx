import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../shared/Header'
import Icon from '../Icon'
import { initials } from '../Students/utils/studentHelpers'
import { exportToPdf, safeFilename } from '../../utils/exportToPdf'
import { useDemo } from '../../data/DemoContext'
import { currentMonthIndex, monthLabel } from '../../data/calendar'
import { fullName, shortBranch } from '../../data/selectors'
import './SalariesPage.css'

function Journal({ teacher, month, close }) {
  const journalRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const percentage = teacher.type === 'Pourcentage'
  const groupsWithRates = teacher.rows

  const downloadPdf = async () => { setIsExporting(true); try { await exportToPdf(journalRef.current, `journal-salaire-${safeFilename(teacher.name)}.pdf`) } finally { setIsExporting(false) } }

  return (
    <div className="salary-overlay" onMouseDown={close}>
      <section ref={journalRef} className="salary-journal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="salary-close" onClick={close}>×</button>
        <h2>Journal de salaire</h2>
        <div className="journal-teacher">
          <i>{initials(teacher.name)}</i>
          <span>
            <b>{teacher.name}</b>
            <small>{month}</small>
          </span>
          <em className={percentage ? 'percentage' : 'fixed'}>{teacher.type}</em>
        </div>

        {groupsWithRates.length > 0 ? (
          groupsWithRates.map(({ group, lines, total, rate }) => (
            <article className="journal-group" key={group.id}>
              <header>
                <div>
                  <b>{group.name}</b>
                  <small>{group.subject} · {group.level} · {shortBranch(group.branch)} · {lines.length} élèves</small>
                </div>
                {rate > 0 && <span>Taux : {rate}%</span>}
              </header>
              <table>
                <thead>
                  <tr>
                    <th>Élève</th>
                    <th>Prix matière</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map(({ student, amount }) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{amount} DH</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total du groupe</th>
                    <th>{total.toLocaleString('fr-FR')} DH</th>
                  </tr>
                </tfoot>
              </table>
            </article>
          ))
        ) : (
          <p>Aucun groupe assigné à ce professeur</p>
        )}

        <section className="journal-summary">
          <h3>Récapitulatif</h3>
          <div className="summary-head">
            <span>Groupe / Matière</span>
            <span>Total groupe</span>
            <span>Taux</span>
            <span>Montant dû</span>
          </div>
          {groupsWithRates.map(({ group, total, rate, due }) => (
            <div className="summary-row" key={group.id}>
              <span>{group.name}</span>
              <span>{total.toLocaleString('fr-FR')} DH</span>
              <span>{percentage ? `${rate}%` : 'Fixe'}</span>
              <span>{percentage ? `${due.toLocaleString('fr-FR')} DH` : '—'}</span>
            </div>
          ))}
          <div className="summary-total">
            <b>Salaire total à verser</b>
            <strong>{teacher.amount.toLocaleString('fr-FR')} DH</strong>
          </div>
        </section>
        <footer>
          <button disabled={isExporting} onClick={downloadPdf}>
            {isExporting ? 'Génération du PDF…' : '▣  Télécharger le PDF'}
          </button>
          <button onClick={close}>Fermer</button>
        </footer>
      </section>
    </div>
  )
}

export default function SalariesPage() {
  const { salaries } = useDemo()
  const monthOptions = [currentMonthIndex, currentMonthIndex - 1, currentMonthIndex - 2].filter((index) => index >= 0).map((index) => monthLabel(index))
  const [month, setMonth] = useState(monthOptions[0])
  // Les mois passés sont déjà validés ; seul le mois en cours reste à valider.
  const [validated, setValidated] = useState({})
  const [selectedId, setSelectedId] = useState(null)

  const teachers = salaries
    .filter(({ teacher }) => teacher.active)
    .map(({ teacher, rows, amount }) => ({
      ...teacher,
      rows,
      amount,
      type: teacher.paymentType === 'fixe' ? 'Fixe' : 'Pourcentage',
      subjects: teacher.subjects.join(', '),
      name: fullName(teacher),
    }))
  const selected = teachers.find((teacher) => teacher.id === selectedId)
  const isCurrentMonth = month === monthOptions[0]
  const isValidated = (teacher) => !isCurrentMonth || validated[teacher.id]

  const openJournal = (teacher, validate) => {
    if (validate) setValidated((items) => ({ ...items, [teacher.id]: true }))
    setSelectedId(teacher.id)
  }

  return (
    <div className="salaries-page">
      <Header />
      <main className="salaries-content">
        <div className="fees-heading">
          <h1>Comptabilité</h1>
          <p>Gestion financière du centre.</p>
        </div>
        <nav className="accounting-tabs">
          <Link to="/accounting/fees">Frais de scolarité</Link>
          <Link to="/accounting/delinquencies">Retards & Impayés</Link>
          <Link className="active" to="/accounting/salaries">Salaires Profs</Link>
          <Link to="/accounting/expenses">Charges</Link>
          <Link to="/accounting/profit">Bénéfice net</Link>
        </nav>
        <section className="salary-stats">
          <article>
            <span>Masse salariale du mois</span>
            <strong>{teachers.reduce((sum, t) => sum + t.amount, 0).toLocaleString('fr-FR')} DH</strong>
            <i><Icon name="wallet" /></i>
          </article>
          <article>
            <span>Profs — salaire fixe</span>
            <strong>{teachers.filter(t => t.paymentType === 'fixe').length}</strong>
            <i><Icon name="trending-up" /></i>
          </article>
          <article>
            <span>Profs — pourcentage</span>
            <strong>{teachers.filter(t => t.paymentType === 'pourcentage').length}</strong>
            <i><Icon name="percent" /></i>
          </article>
        </section>
        <label className="salary-month">
          Mois : <select value={month} onChange={(event) => setMonth(event.target.value)}>
            {monthOptions.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <section className="salary-table-wrap">
          <table className="salary-table">
            <thead>
              <tr>
                <th>Professeur</th>
                <th>Type</th>
                <th>Matière(s)</th>
                <th>Montant calculé</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => {
                const done = isValidated(teacher)
                return (
                  <tr key={teacher.id}>
                    <td>
                      <div className="salary-person">
                        <i>{initials(teacher.name)}</i>
                        <b>{teacher.name}</b>
                      </div>
                    </td>
                    <td>
                      <span className={teacher.paymentType === 'fixe' ? 'type-fixed' : 'type-percent'}>
                        {teacher.type}
                      </span>
                    </td>
                    <td>{teacher.subjects}</td>
                    <td>
                      <b>{teacher.amount.toLocaleString('fr-FR')} DH</b>
                    </td>
                    <td>
                      <span className={done ? 'salary-status paid' : 'salary-status'}>
                        {done ? 'Validé' : 'En attente'}
                      </span>
                    </td>
                    <td>
                      <div className="salary-actions">
                        {teacher.paymentType === 'pourcentage' && (
                          <button className="journal-button" onClick={() => openJournal(teacher, false)}>
                            <Icon name="printer" /> Imprimer journal
                          </button>
                        )}
                        <button
                          className={done ? 'validate-salary done' : 'validate-salary'}
                          onClick={() => openJournal(teacher, true)}
                        >
                          <Icon name="check" /> {done ? 'Validé' : 'Valider'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
        {selected && <Journal teacher={selected} month={month} close={() => setSelectedId(null)} />}
      </main>
    </div>
  )
}
