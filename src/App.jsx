import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/SideBar/Sidebar'
import Dashboard from './components/Dashboard/Dashboard'
import Login from './components/login/Login'
import Branches from './components/Branches/Branches'
import Users from './components/Users/Users'
import Settings from './components/Settings/Settings'
import Teachers from './components/Teachers/TeachersPage'
import Groups from './components/Groups/GroupsPage'
import Students from './components/Students/StudentsPage'
import FeesPage from './components/Accounting/FeesPage'
import DelinquenciesPage from './components/Accounting/DelinquenciesPage'
import SalariesPage from './components/Accounting/SalariesPage'
import ExpensesPage from './components/Accounting/ExpensesPage'
import ProfitPage from './components/Accounting/ProfitPage'
import DemoProvider from './data/DemoProvider'

const sidebarSections = [
  {
    title: 'Navigation',
    items: [
      { label: 'Dashboard', icon: 'grid', path: '/dashboard' },
      { label: 'Étudiants', icon: 'users', path: '/students' },
      { label: 'Groupes', icon: 'layers', path: '/groups' },
      { label: 'Professeurs', icon: 'cap', path: '/teachers' },
      {
        label: 'Comptabilité',
        icon: 'calculator',
        path: '/accounting',
        children: [
          { label: 'Frais de scolarité', path: '/accounting/fees' },
          { label: 'Retards & Impayés', path: '/accounting/delinquencies' },
          { label: 'Salaires Profs', path: '/accounting/salaries' },
          { label: 'Charges', path: '/accounting/expenses' },
          { label: 'Bénéfice net', path: '/accounting/profit' },
        ],
      },
      { label: 'Paramètres', icon: 'settings', path: '/settings' },
    ],
  },
  {
    title: 'Administration',
    separated: true,
    items: [
      { label: 'Utilisateurs', icon: 'users', path: '/users' },
      { label: 'Succursales', icon: 'building', path: '/branches' },
    ],
  },
]

function DashboardLayout() {
  const dashboard = <Dashboard />

  return (
    <div className="dashboard-shell">
      <Sidebar sections={sidebarSections} />
      <Routes>
        <Route path="/dashboard" element={dashboard} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/users" element={<Users />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/students" element={<Students />} />
        <Route path="/accounting/fees" element={<FeesPage />} />
        <Route path="/accounting/delinquencies" element={<DelinquenciesPage />} />
        <Route path="/accounting/salaries" element={<SalariesPage />} />
        <Route path="/accounting/expenses" element={<ExpensesPage />} />
        <Route path="/accounting/profit" element={<ProfitPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={dashboard} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <DemoProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </BrowserRouter>
    </DemoProvider>
  )
}

export default App
