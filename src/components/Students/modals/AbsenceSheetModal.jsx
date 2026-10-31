import { useRef, useState } from 'react'
import Icon from '../../Icon'
import { exportToPdf, safeFilename } from '../../../utils/exportToPdf'
import { useDemo } from '../../../data/DemoContext'
import { APP } from '../../../data/config'
import { schoolYearStart } from '../../../data/calendar'
import { fullName, groupsOfTeacher, sameId } from '../../../data/selectors'
import './AttendanceSheet.css'
import './AttendancePdf.css'

const sessions = Array.from({ length: 18 }, (_, index) => `S${index + 1}`)
const unique = (list) => [...new Set(list)]

function AttendanceSheet({ values, roster, close }) {
  const sheetRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const downloadPdf = async () => {
    setIsExporting(true)
    try { await exportToPdf(sheetRef.current, `fiche-absence-${safeFilename(values.teacher)}-${safeFilename(values.subject)}-${safeFilename(values.group)}.pdf`) } finally { setIsExporting(false) }
  }
  return <main className="absence-sheet-page"><div className="absence-sheet-actions"><button onClick={close}>← Retour aux étudiants</button><button className="absence-print" disabled={isExporting} onClick={downloadPdf}>{isExporting ? 'Génération du PDF…' : '▣  Télécharger le PDF'}</button></div><article ref={sheetRef} className="absence-sheet"><header className="absence-sheet-header"><div className="absence-brand"><img src={APP.logo} alt={APP.name} /><div><strong>{APP.name}</strong><span>Fiche de présence — {values.branch}</span></div></div><div><strong>Fiche d'absence</strong><span>Année scolaire {schoolYearStart} – {schoolYearStart + 1}</span></div></header><section className="absence-details"><div><small>PROFESSEUR</small><b>{values.teacher}</b></div><div><small>MATIÈRE</small><b>{values.subject}</b></div><div><small>NIVEAU</small><b>{values.level}</b></div><div><small>GROUPE</small><b>{values.group}</b></div></section><table className="absence-table"><thead><tr><th>#</th><th>Élève</th><th>Note°1</th><th>Note°2</th>{sessions.map(session => <th key={session}>{session}</th>)}</tr></thead><tbody>{roster.map((name, index) => <tr key={name}><td>{index + 1}</td><td>{name}</td><td /><td />{sessions.map(session => <td key={session} />)}</tr>)}</tbody></table><p className="absence-help">Cocher <b>P</b> pour présent, <b>A</b> pour absent, <b>R</b> pour retard.</p><footer className="absence-signatures"><span>Signature du professeur</span><span>Signature de l'administration</span></footer></article></main>
}

export default function AbsenceSheetModal({ close }) {
  const { teachers, groups, studentsById } = useDemo()
  const [values, setValues] = useState({ teacherId: '', subject: '', level: '', groupId: '' })
  const [generated, setGenerated] = useState(false)

  // Chaque liste ne propose que ce qui existe pour les choix précédents.
  const teacherOptions = teachers.filter((teacher) => teacher.active && groupsOfTeacher(groups, teacher.id).length)
  const teacherGroups = groupsOfTeacher(groups, values.teacherId)
  const subjectOptions = unique(teacherGroups.map((group) => group.subject))
  const levelOptions = unique(teacherGroups.filter((group) => group.subject === values.subject).map((group) => group.level))
  const groupOptions = teacherGroups.filter((group) => group.subject === values.subject && group.level === values.level)
  const group = groups.find((item) => sameId(item.id, values.groupId))

  const update = (field, reset = []) => (event) =>
    setValues((current) => ({ ...current, ...Object.fromEntries(reset.map((key) => [key, ''])), [field]: event.target.value }))

  if (generated && group) {
    const roster = group.studentIds.map((id) => studentsById[id]?.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'))
    const sheetValues = { teacher: fullName(teachers.find((teacher) => sameId(teacher.id, values.teacherId))), subject: values.subject, level: values.level, group: group.name, branch: group.branch }
    return <AttendanceSheet values={sheetValues} roster={roster} close={close} />
  }
  const ready = Object.values(values).every(Boolean)
  return <div className="student-overlay" onMouseDown={close}><section className="absence-modal" onMouseDown={(event) => event.stopPropagation()}><button className="student-close" onClick={close}><Icon name="close" /></button><h2>Fiche d'absence vierge</h2><p>Sélectionnez les paramètres pour générer la fiche imprimable.</p>
    <label>Professeur<select value={values.teacherId} onChange={update('teacherId', ['subject', 'level', 'groupId'])}><option value="">—</option>{teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{fullName(teacher)}</option>)}</select></label>
    <label>Matière<select value={values.subject} onChange={update('subject', ['level', 'groupId'])} disabled={!values.teacherId}><option value="">—</option>{subjectOptions.map((subject) => <option key={subject}>{subject}</option>)}</select></label>
    <label>Niveau<select value={values.level} onChange={update('level', ['groupId'])} disabled={!values.subject}><option value="">—</option>{levelOptions.map((level) => <option key={level}>{level}</option>)}</select></label>
    <label>Groupe<select value={values.groupId} onChange={update('groupId')} disabled={!values.level}><option value="">—</option>{groupOptions.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.studentIds.length} élèves)</option>)}</select></label>
    <footer><button onClick={close}>Annuler</button><button disabled={!ready} onClick={() => setGenerated(true)}>▣ &nbsp; Générer la fiche</button></footer></section></div>
}
