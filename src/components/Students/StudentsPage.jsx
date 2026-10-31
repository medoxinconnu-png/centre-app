import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../shared/Header'
import StudentsToolbar from './StudentsToolbar'
import StudentsFilters from './StudentsFilters'
import StudentsTable from './StudentsTable'
import AttendanceModal from './modals/AttendanceModal'
import AbsenceSheetModal from './modals/AbsenceSheetModal'
import StudentSheetModal from './modals/StudentSheetModal'
import EnrollmentPage from './enrollment/EnrollmentPage'

import { useDemo } from '../../data/DemoContext'
import { levelsByCycle, subjects } from '../../data/catalog'
import { paymentSummary, studentFormDetails } from '../../data/selectors'
import './Students.css'

export default function StudentsPage() {
  // Le dashboard peut arriver ici avec une recherche pré-remplie ou le formulaire d'inscription ouvert.
  const { state } = useLocation()
  const { students, groups, payments, setStudents, saveStudent } = useDemo()
  const [query, setQuery] = useState(state?.query || '')
  const [activeCycle, setActiveCycle] = useState('Tous')
  const [activeLevel, setActiveLevel] = useState('Tous')
  const [activeSubject, setActiveSubject] = useState('Tous')
  const [groupFilter, setGroupFilter] = useState('')
  const [attendanceStudentId, setAttendanceStudentId] = useState(null)
  const [absenceSheetOpen, setAbsenceSheetOpen] = useState(false)
  const [sheetStudentId, setSheetStudentId] = useState(null)
  const [editingStudentId, setEditingStudentId] = useState(null)
  const [isEnrolling, setIsEnrolling] = useState(Boolean(state?.enroll))

  // Nombre de matières et statut de paiement calculés à partir des données partagées.
  const items = useMemo(
    () => students.map((student) => ({ ...student, subjects: student.chosen.length, payment: paymentSummary(student, payments).status })),
    [students, payments]
  )
  const findStudent = (id) => items.find((student) => student.id === id)

  const shownStudents = useMemo(() => {
    const group = groups.find((item) => String(item.id) === groupFilter)
    return items.filter(
      (student) =>
        (activeCycle === 'Tous' || student.cycle === activeCycle) &&
        (activeLevel === 'Tous' || student.level === activeLevel) &&
        (activeSubject === 'Tous' || student.chosen?.includes(activeSubject)) &&
        (!group || group.studentIds.includes(student.id)) &&
        `${student.name} ${student.code} ${student.phone}`
          .toLowerCase()
          .includes(query.toLowerCase())
    )
  }, [items, groups, query, activeCycle, activeLevel, activeSubject, groupFilter])

  const cycleTabs = useMemo(() => {
    const all = [{ name: 'Tous', count: items.length }]
    const cycles = [...new Set(items.map(item => item.cycle))]
    const cycleCounts = cycles.map(cycle => ({
        name: cycle,
        count: items.filter(student => student.cycle === cycle).length
    }))
    return [...all, ...cycleCounts];
  }, [items])

  const handleDeactivateAll = () => {
    setStudents((list) => list.map((student) => ({ ...student, active: false })))
  }

  const handleToggleStatus = (studentId) => {
    setStudents((list) =>
      list.map((student) =>
        student.id === studentId
          ? { ...student, active: !student.active }
          : student
      )
    )
  }

  const handleCycleChange = (cycle) => {
    setActiveCycle(cycle)
    setActiveLevel('Tous')
    setActiveSubject('Tous')
  }

  const handleFinishEnrollment = (newStudentForm) => {
    saveStudent(newStudentForm)
    setIsEnrolling(false)
  }

  const handleFinishEdit = (updatedStudentForm) => {
    saveStudent(updatedStudentForm, editingStudentId)
    setEditingStudentId(null)
  }

  const handleOpenEdit = (student) => {
    setSheetStudentId(null)
    setAttendanceStudentId(null)
    setEditingStudentId(student.id)
  }

  if (isEnrolling) {
    return (
      <EnrollmentPage
        close={() => setIsEnrolling(false)}
        finish={handleFinishEnrollment}
      />
    )
  }

  const editingStudent = findStudent(editingStudentId)
  if (editingStudent) {
    return (
      <EnrollmentPage
        close={() => setEditingStudentId(null)}
        finish={handleFinishEdit}
        student={{ ...editingStudent, subjectDetails: studentFormDetails(editingStudent, groups) }}
        mode="edit"
      />
    )
  }

  if (absenceSheetOpen) {
    return <AbsenceSheetModal close={() => setAbsenceSheetOpen(false)} />
  }

  const attendanceStudent = findStudent(attendanceStudentId)
  const sheetStudent = findStudent(sheetStudentId)

  return (
    <div className="students-page">
      <Header />
      <main className="students-content">
        <StudentsToolbar
          onAddStudent={() => setIsEnrolling(true)}
          onDeactivateAll={handleDeactivateAll}
          onOpenAbsenceSheet={() => setAbsenceSheetOpen(true)}
        />
        <StudentsFilters
            cycles={cycleTabs}
            activeCycle={activeCycle}
            onCycleChange={handleCycleChange}
            levels={activeCycle === 'Tous' ? [] : levelsByCycle[activeCycle] || []}
            activeLevel={activeLevel}
            onLevelChange={setActiveLevel}
            showSubjectFilter={['Collège', 'Lycée', 'Formation'].includes(activeCycle)}
            subjects={subjects}
            activeSubject={activeSubject}
            onSubjectChange={setActiveSubject}
            studentsCount={shownStudents.length}
            searchQuery={query}
            onSearchChange={setQuery}
            groupFilter={groupFilter}
            onGroupFilterChange={setGroupFilter}
            groups={groups}
        />
        <StudentsTable
          students={shownStudents}
          onOpenSheet={(student) => setSheetStudentId(student.id)}
          onEditStudent={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
          onOpenAttendance={(student) => setAttendanceStudentId(student.id)}
        />
      </main>
      {attendanceStudent && (
        <AttendanceModal
          student={attendanceStudent}
          close={() => setAttendanceStudentId(null)}
        />
      )}
      {sheetStudent && (
        <StudentSheetModal
          student={sheetStudent}
          close={() => setSheetStudentId(null)}
        />
      )}
    </div>
  )
}
