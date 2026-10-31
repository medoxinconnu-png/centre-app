import { subjects } from '../../../../data/catalog'
import { useDemo } from '../../../../data/DemoContext'
import { assignmentOptions, fullName, sameId, shortBranch } from '../../../../data/selectors'
import { price } from '../../utils/studentHelpers'

export default function Step3SubjectsGroups({ form, toggleSubject, setSubjectDetails }) {
  const demo = useDemo()

  return (
    <>
      <h2>Matières &amp; groupes</h2>
      <p>Cochez les matières souhaitées, puis affectez le professeur, le groupe et le tarif.</p>
      <div className="enrollment-subjects">
        {subjects.map((subject) => {
          const selected = form.chosen.includes(subject)
          const details = form.subjectDetails[subject] || {}
          const standardPrice = price(subject)
          const { teacherOptions, groupOptions } = assignmentOptions(demo, subject, { level: form.level, branch: form.branch, teacherId: details.teacherId })

          // Choisir un groupe fixe aussi son professeur.
          const chooseGroup = (groupId) => {
            const group = demo.groups.find((item) => sameId(item.id, groupId))
            setSubjectDetails(subject, { groupId, teacherId: group?.teacherId ?? details.teacherId ?? '' })
          }

          return (
            <article key={subject} className={selected ? 'checked' : ''}>
              <label className="subject-toggle">
                <input type="checkbox" checked={selected} onChange={() => toggleSubject(subject)} />
                <span><b>{subject}</b><small>{standardPrice} DH/mois</small></span>
              </label>
              {selected && (
                <div className="subject-configuration">
                  <label>Professeur
                    <select value={details.teacherId ?? ''} onChange={(e) => setSubjectDetails(subject, { teacherId: e.target.value, groupId: '' })}>
                      <option value="">Choisir un professeur</option>
                      {teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{fullName(teacher)}</option>)}
                    </select>
                  </label>
                  <label>Groupe
                    <select value={details.groupId ?? ''} onChange={(e) => chooseGroup(e.target.value)}>
                      <option value="">{groupOptions.length ? 'Choisir un groupe' : 'Aucun groupe pour cette matière'}</option>
                      {groupOptions.map((group) => <option key={group.id} value={group.id}>{group.name} · {shortBranch(group.branch)} · {group.studentIds.length} élèves</option>)}
                    </select>
                  </label>
                  <fieldset><legend>Tarification</legend>
                    <label className={details.priceType !== 'manual' ? 'pricing-option active' : 'pricing-option'}>
                      <input type="radio" name={`${subject}-pricing`} checked={details.priceType !== 'manual'} onChange={() => setSubjectDetails(subject, { priceType: 'standard' })} />
                      <span><b>Prix standard</b><small>{standardPrice} DH/mois</small></span>
                    </label>
                    <label className={details.priceType === 'manual' ? 'pricing-option active' : 'pricing-option'}>
                      <input type="radio" name={`${subject}-pricing`} checked={details.priceType === 'manual'} onChange={() => setSubjectDetails(subject, { priceType: 'manual' })} />
                      <span><b>Prix manuel</b><input type="number" min="0" placeholder="Montant DH" disabled={details.priceType !== 'manual'} value={details.manualPrice || ''} onChange={(e) => setSubjectDetails(subject, { manualPrice: e.target.value })} /></span>
                    </label>
                  </fieldset>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}
