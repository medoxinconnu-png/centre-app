import { useState } from 'react'
import Icon from '../../Icon'
import { initials } from '../../Students/utils/studentHelpers'
import { blankGroup, levelsByCycle, subjects } from '../../../data/catalog'
import { useDemo } from '../../../data/DemoContext'
import { fullName } from '../../../data/selectors'

const levels = Object.values(levelsByCycle).flat()

export default function GroupModal({ group, close, save }) {
  const { students, teachers, branches } = useDemo()
  const [form, setForm] = useState(group || blankGroup)
  const [studentQuery, setStudentQuery] = useState('')

  const update = (key, value) => setForm((item) => ({ ...item, [key]: value }))

  const toggleStudent = (id) => {
    update(
      'studentIds',
      form.studentIds.includes(id)
        ? form.studentIds.filter((item) => item !== id)
        : [...form.studentIds, id]
    )
  }

  // Élèves de la succursale et du niveau du groupe ; les membres actuels restent toujours visibles.
  const results = students.filter((student) =>
    (form.studentIds.includes(student.id) || ((!form.branch || student.branch === form.branch) && (!form.level || student.level === form.level))) &&
    student.name.toLowerCase().includes(studentQuery.toLowerCase())
  )

  const handleSubmit = (event) => {
    event.preventDefault()
    save({ ...form, id: group?.id || crypto.randomUUID() })
  }

  return (
    <div className="group-modal-bg" onMouseDown={close}>
      <section
        className="group-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="group-close" onClick={close} type="button" aria-label="Fermer">
          <Icon name="close" />
        </button>
        <h2>{group ? 'Modifier le groupe' : 'Nouveau groupe'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="group-form-grid">
            <label>
              Nom du groupe *
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </label>
            <label>
              Matière *
              <select value={form.subject} onChange={(e) => update('subject', e.target.value)} required>
                <option value="">—</option>
                {subjects.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Niveau *
              <select value={form.level} onChange={(e) => update('level', e.target.value)} required>
                <option value="">—</option>
                {levels.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>
              Professeur *
              <select value={form.teacherId ?? ''} onChange={(e) => update('teacherId', e.target.value)} required>
                <option value="">—</option>
                {teachers.filter((item) => item.active || String(item.id) === String(form.teacherId)).map((item) => <option key={item.id} value={item.id}>{fullName(item)}</option>)}
              </select>
            </label>
            <label>
              Succursale *
              <select value={form.branch} onChange={(e) => update('branch', e.target.value)} required>
                <option value="">—</option>
                {branches.map((item) => <option key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>
              Horaire &amp; salle
              <input value={form.schedule || ''} onChange={(e) => update('schedule', e.target.value)} placeholder="ex : Lun/Mer 18:00-20:00 · Salle A1" />
            </label>
          </div>
          <div className="group-students-head">
            <strong>Élèves ({form.studentIds.length} sélectionné{form.studentIds.length > 1 ? 's' : ''})</strong>
            <span>{form.branch && form.level ? `${form.level} · ${form.branch}` : 'Choisir d\'abord une succursale et un niveau'}</span>
          </div>
          <label className="group-student-search">
            <Icon name="search" />
            <input value={studentQuery} onChange={(e) => setStudentQuery(e.target.value)} placeholder="Rechercher un élève..." />
          </label>
          <div className="group-students">
            {results.map((student) => (
              <label key={student.id}>
                <input type="checkbox" checked={form.studentIds.includes(student.id)} onChange={() => toggleStudent(student.id)} />
                <span className="student-avatar">{initials(student.name)}</span>
                <span className="student-details">
                  <b>{student.name}</b>
                  <small>{student.level} · {student.code}</small>
                </span>
              </label>
            ))}
          </div>
          <footer>
            <button type="button" onClick={close}>Annuler</button>
            <button type="submit">Enregistrer</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
