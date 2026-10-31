import { useState } from 'react'
import Icon from '../../Icon'
import { attendanceItems } from '../../../data/catalog'
import { todayIso } from '../../../data/calendar'
import { useDemo } from '../../../data/DemoContext'

export default function AttendanceModal({ student, close }) {
  const { addAttendance } = useDemo()
  const [selected, setSelected] = useState(['absence'])
  const [date, setDate] = useState(todayIso)
  const [minutes, setMinutes] = useState('10')
  const [note, setNote] = useState('')
  const toggle = (id) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  const save = () => {
    if (selected.length) addAttendance({ studentId: student.id, date, items: selected, minutes: selected.includes('retard') ? Number(minutes) : undefined, note })
    close()
  }

  return <div className="student-overlay" onMouseDown={close}>
    <section className="attendance-modal" onMouseDown={(event) => event.stopPropagation()}>
      <button className="student-close" onClick={close}><Icon name="close" /></button>
      <h2>Pointage — {student.name}</h2><p>Cochez tous les événements applicables (cumulables).</p>
      <label className="attendance-date">Date<input type="date" value={date} max={todayIso} onChange={(event) => setDate(event.target.value)} /></label>
      {attendanceItems.map((item) => <label className={`attendance-item ${selected.includes(item.id) ? 'checked' : ''}`} key={item.id}><span><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />{item.text}</span>{selected.includes(item.id) && item.detail && (item.id === 'retard' ? <label>Nombre de minutes<input type="number" min="1" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></label> : <textarea placeholder={item.detail} value={note} onChange={(event) => setNote(event.target.value)} />)}</label>)}
      <footer><button onClick={close}>Annuler</button><button onClick={save}>Enregistrer</button></footer>
    </section>
  </div>
}
