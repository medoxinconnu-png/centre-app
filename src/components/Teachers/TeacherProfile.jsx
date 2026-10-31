import { useMemo } from 'react'
import Header from '../shared/Header'
import Icon from '../Icon'
import { initials } from '../Students/utils/studentHelpers'
import { useDemo } from '../../data/DemoContext'
import { currentMonthIndex, monthLabel } from '../../data/calendar'
import { groupsOfTeacher, salaryBreakdown, shortBranch } from '../../data/selectors'

const formatAmount = (value) => `${Number(value || 0).toLocaleString('fr-FR')} DH`

export default function TeacherProfile({ teacher, onBack }) {
  const { groups, studentsById } = useDemo()
  const fullName = `${teacher.firstName} ${teacher.lastName}`
  const fixedSalary = teacher.paymentType === 'fixe'

  const assignedGroups = useMemo(() => groupsOfTeacher(groups, teacher.id), [groups, teacher.id])
  const { amount: totalSalary } = useMemo(() => salaryBreakdown(teacher, groups, studentsById), [teacher, groups, studentsById])

  // Les mois passés sont validés, le mois en cours reste à valider.
  const salaryHistory = Array.from({ length: Math.min(4, currentMonthIndex + 1) }, (_, i) => currentMonthIndex - i)
    .reverse()
    .map((index) => ({ month: monthLabel(index), status: index < currentMonthIndex ? 'Validé' : 'En attente' }))

  return (
    <div className="teacher-profile-page">
      <Header />
      <main className="teacher-profile-content">
        <button className="teacher-profile-back" onClick={onBack}>← Retour aux professeurs</button>
        <div className="teacher-profile-layout">
          <aside className="teacher-profile-summary">
            <div className="teacher-profile-avatar">{initials(fullName)}</div>
            <h1>{fullName}</h1>
            <span className={`teacher-status ${teacher.active ? 'active' : ''}`}>{teacher.active ? 'Actif' : 'Inactif'}</span>
            <div className="teacher-contact-list">
              <p><Icon name="id" /> {teacher.cin}</p>
              <p><Icon name="phone" /> {teacher.phone}</p>
              <p><Icon name="pin" /> {teacher.address || '—'}</p>
              <p><Icon name="calendar" /> Embauché le {teacher.hiredAt || '—'}</p>
            </div>
          </aside>
          <section className="teacher-profile-details">
            <article className="teacher-profile-card teacher-remuneration">
              <div>
                <h2>Rémunération</h2>
                <p>{fixedSalary ? 'Salaire mensuel' : `Taux par cycle : ${Object.entries(teacher.rates || {}).map(([cycle, rate]) => `${cycle} ${rate} %`).join(' · ') || '—'}`}</p>
                <strong>{formatAmount(totalSalary)}</strong>
              </div>
              <span className={`pay-tag ${fixedSalary ? 'fixe' : 'pourcentage'}`}>
                {fixedSalary ? 'Fixe' : 'Pourcentage'}
              </span>
            </article>

            <article className="teacher-profile-card">
              <h2>Cycles et niveaux</h2>
              <div className="teacher-profile-remuneration">
                <div>
                  <strong>Cycles:</strong>
                  <p>{teacher.cycles.length > 0 ? teacher.cycles.join(', ') : 'Aucun'}</p>
                </div>
                <div>
                  <strong>Niveaux:</strong>
                  <p>{teacher.levels.length > 0 ? teacher.levels.join(', ') : 'Aucun'}</p>
                </div>
                <div>
                  <strong>Matières:</strong>
                  <p>{teacher.subjects.length > 0 ? teacher.subjects.join(', ') : 'Aucune'}</p>
                </div>
                <div>
                  <strong>Succursales:</strong>
                  <p>{teacher.branches.length > 0 ? teacher.branches.join(', ') : 'Aucune'}</p>
                </div>
              </div>
            </article>

            <article className="teacher-profile-card">
              <h2>Groupes assignés ({assignedGroups.length})</h2>
              {assignedGroups.length > 0 ? (
                <div className="teacher-groups-grid">
                  {assignedGroups.map((group) => (
                    <div className="teacher-group-card" key={group.id}>
                      <strong>{group.name}</strong>
                      <span>{group.level} · {shortBranch(group.branch)} · {group.schedule}</span>
                      <small>{group.studentIds.length} élèves</small>
                      <p className="teacher-group-students">
                        {group.studentIds.map((id) => studentsById[id]?.name).filter(Boolean).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucun groupe assigné</p>
              )}
            </article>

            <article className="teacher-profile-card teacher-salary-history">
              <h2>Historique des salaires</h2>
              <table>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.map((item) => (
                    <tr key={item.month}>
                      <td>{item.month}</td>
                      <td>{formatAmount(totalSalary)}</td>
                      <td>
                        <span className={`salary-status ${item.status === 'Validé' ? 'valid' : 'pending'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        </div>
      </main>
    </div>
  )
}
