import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../shared/Header'
import Icon from '../Icon'
import { MenuSelect } from '../shared/Menu'
import { initials } from '../Students/utils/studentHelpers'
import { useDemo } from '../../data/DemoContext'
import { debtorsList } from '../../data/selectors'
import './DelinquenciesPage.css'

const ALL_GROUPS = 'Tous les groupes'
const ALL_LEVELS = 'Tous les niveaux'

export default function DelinquenciesPage() {
  const state = useDemo()
  // Une ligne par élève ayant au moins un mois impayé, triée par dette décroissante.
  const debtors = useMemo(() => debtorsList(state).map(({ student, dueMonths, days, debt, groups }) => ({
    id: student.id, name: student.name, code: student.code, level: student.level, groups: groups.map((group) => group.name), months: dueMonths.length, days, debt,
  })), [state])
  const [reminded, setReminded] = useState([])
  const [groupFilter, setGroupFilter] = useState(ALL_GROUPS)
  const [levelFilter, setLevelFilter] = useState(ALL_LEVELS)

  const groupOptions = useMemo(() => [ALL_GROUPS, ...new Set(debtors.flatMap((d) => d.groups))], [debtors])
  const levelOptions = useMemo(() => [ALL_LEVELS, ...new Set(debtors.map((d) => d.level))], [debtors])

  const list = useMemo(
    () =>
      debtors
        .filter((d) => groupFilter === ALL_GROUPS || d.groups.includes(groupFilter))
        .filter((d) => levelFilter === ALL_LEVELS || d.level === levelFilter)
        .sort((a, b) => b.debt - a.debt),
    [debtors, groupFilter, levelFilter]
  )
  const sendReminder = (id) => setReminded((items) => items.includes(id) ? items : [...items, id])

  return <div className="delinquencies-page"><Header /><main className="delinquencies-content">
    <div className="fees-heading"><h1>Comptabilité</h1><p>Gestion financière du centre.</p></div>
    <nav className="accounting-tabs">
      <Link to="/accounting/fees">Frais de scolarité</Link><Link className="active" to="/accounting/delinquencies">Retards & Impayés</Link><Link to="/accounting/salaries">Salaires Profs</Link><Link to="/accounting/expenses">Charges</Link><Link to="/accounting/profit">Bénéfice net</Link>
    </nav>
    <section className="delinquency-stats">
      <article><div><span>Élèves en retard</span><strong>{debtors.length}</strong></div><i className="danger"><Icon name="alert" /></i></article>
      <article><div><span>Dette totale accumulée</span><strong>{debtors.reduce((sum, d) => sum + d.debt, 0).toLocaleString('fr-FR')} DH</strong></div><i className="danger"><Icon name="wallet" /></i></article>
      <article><div><span>Retard moyen</span><strong>{debtors.length ? Math.round(debtors.reduce((sum, d) => sum + d.days, 0) / debtors.length) : 0} jours</strong></div><i className="warning"><Icon name="clock" /></i></article>
    </section>
    <section className="delinquency-radar"><header><div><h2>Radar des défaillants</h2><p>Trié par dette décroissante</p></div><div className="delinquency-filters"><MenuSelect className="delinquency-filter" label="Filtrer par groupe" value={groupFilter} options={groupOptions} onChange={setGroupFilter} /><MenuSelect className="delinquency-filter" label="Filtrer par niveau" value={levelFilter} options={levelOptions} onChange={setLevelFilter} /></div></header><div className="radar-scroll"><table><thead><tr><th>Élève</th><th>Niveau</th><th>Mois impayés</th><th>Durée</th><th>Dette</th><th>Action</th></tr></thead><tbody>{list.map(student => <tr key={student.id}><td><div className="debtor"><i>{initials(student.name)}</i><span><b>{student.name}</b><small>{student.code}</small></span></div></td><td><span className="level-pill">{student.level}</span></td><td>{student.months}</td><td><span className="delay-pill">{student.days} j</span></td><td><strong className="debt">{student.debt.toLocaleString('fr-FR')} DH</strong></td><td><button className={reminded.includes(student.id) ? 'reminder sent' : 'reminder'} onClick={() => sendReminder(student.id)}>{reminded.includes(student.id) ? <><Icon name="check" /> Rappel envoyé</> : <><Icon name="whatsapp" /> Rappel</>}</button></td></tr>)}</tbody></table></div></section>
  </main></div>
}
