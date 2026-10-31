import { useMemo, useState } from 'react'
import Header from '../shared/Header'
import TeacherForm from './TeacherForm'
import TeachersToolbar from './TeachersToolbar'
import TeachersFilters from './TeachersFilters'
import TeachersTable from './TeachersTable'
import TeacherProfile from './TeacherProfile'
import { useDemo } from '../../data/DemoContext'
import { groupsOfTeacher } from '../../data/selectors'
import './Teachers.css'

export default function TeachersPage() {
  const { teachers, groups, setTeachers, saveTeacher } = useDemo()
  const [query, setQuery] = useState('')
  const [formTeacher, setFormTeacher] = useState(undefined) // undefined: list, null: new, object: edit
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const selectedTeacher = teachers.find((teacher) => teacher.id === selectedTeacherId)

  const filteredTeachers = useMemo(
    () =>
      teachers.filter((teacher) =>
        `${teacher.firstName} ${teacher.lastName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [teachers, query]
  )

  const handleSave = (teacher) => {
    saveTeacher(teacher, teacher.groups)
    setFormTeacher(undefined)
  }

  const handleToggleStatus = (teacherId) => {
    setTeachers((items) =>
      items.map((item) =>
        item.id === teacherId ? { ...item, active: !item.active } : item
      )
    )
  }

  if (formTeacher !== undefined) {
    return (
      <TeacherForm
        teacher={formTeacher ? { ...formTeacher, groups: groupsOfTeacher(groups, formTeacher.id).map((group) => group.id) } : null}
        onClose={() => setFormTeacher(undefined)}
        onSave={handleSave}
      />
    )
  }

  if (selectedTeacher) {
    return <TeacherProfile teacher={selectedTeacher} onBack={() => setSelectedTeacherId(null)} />
  }

  return (
    <div className="teachers-page">
      <Header />
      <main className="teachers-content">
        <TeachersToolbar
          count={teachers.length}
          onAdd={() => setFormTeacher(null)}
        />
        <TeachersFilters query={query} onQueryChange={setQuery} />
        <TeachersTable
          teachers={filteredTeachers}
          onEdit={setFormTeacher}
          onToggleStatus={handleToggleStatus}
          onView={(teacher) => setSelectedTeacherId(teacher.id)}
        />
      </main>
    </div>
  )
}
