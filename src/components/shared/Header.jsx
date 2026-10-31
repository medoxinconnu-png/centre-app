import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import { MenuSelect, Popover } from './Menu'
import { useDemo } from '../../data/DemoContext'
import { currentMonthIndex } from '../../data/calendar'
import { debtorsList, formatDH, monthFinance } from '../../data/selectors'

const ALL_BRANCHES = 'Toutes les succursales'

/**
 * Bandeau supérieur commun à toutes les pages.
 * Le filtre succursale est autonome par défaut ; une page peut le piloter
 * en passant `branch` + `onBranchChange` (cf. le dashboard).
 */
export default function Header({ branch, onBranchChange, branchOptions: customOptions }) {
  const navigate = useNavigate()
  const state = useDemo()
  const branchOptions = customOptions || [ALL_BRANCHES, ...state.branches.filter((item) => item.active).map((item) => item.name)]
  const debtors = debtorsList(state)
  const profit = monthFinance(state, state.salaries, currentMonthIndex).profit
  const admin = state.users[0]
  const [search, setSearch] = useState('')
  const [ownBranch, setOwnBranch] = useState(branchOptions[0])
  const selectedBranch = branch ?? ownBranch

  const changeBranch = (next) => {
    setOwnBranch(next)
    onBranchChange?.(next)
  }

  const submitSearch = (event) => {
    event.preventDefault()
    if (search.trim()) navigate('/students', { state: { query: search.trim() } })
  }

  return (
    <header className="topbar">
      <form className="searchbar" role="search" onSubmit={submitSearch}>
        <span className="searchbar__icon">
          <Icon name="search" />
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Rechercher un élève ou un professeur"
          placeholder="Rechercher un élève, professeur..."
        />
      </form>

      <MenuSelect
        className="branch-select"
        label="Filtrer par succursale"
        value={selectedBranch}
        options={branchOptions}
        onChange={changeBranch}
      />

      <Popover
        className="notifications"
        label="Notifications"
        trigger={
          <>
            <Icon name="bell" />
            {debtors.length > 0 && <span className="notifications__badge">{debtors.length}</span>}
          </>
        }
      >
        {(close) => (
          <>
            <p className="menu__title">Notifications</p>
            <button type="button" onClick={() => { close(); navigate('/accounting/delinquencies') }}>
              <strong>{debtors.length} élève{debtors.length > 1 ? 's' : ''} avec des impayés</strong>
              <span>{formatDH(debtors.reduce((total, row) => total + row.debt, 0))} à recouvrer</span>
            </button>
            <button type="button" onClick={() => { close(); navigate('/accounting/salaries') }}>
              <strong>Salaires professeurs à valider</strong>
              <span>Ouvrir la paie du mois</span>
            </button>
            <button type="button" onClick={() => { close(); navigate('/accounting/profit') }}>
              <strong>Bénéfice net du mois : {formatDH(profit)}</strong>
              <span>{profit < 0 ? 'Analyser la rentabilité' : 'Voir le détail par succursale'}</span>
            </button>
          </>
        )}
      </Popover>

      <Popover
        className="profile"
        label="Menu du compte"
        trigger={
          <>
            <div className="profile__avatar">{admin.firstName[0]}{admin.lastName[0]}</div>
            <div>
              <strong>{admin.firstName} {admin.lastName}</strong>
              <span>Administrateur</span>
            </div>
          </>
        }
      >
        {(close) => (
          <>
            <button type="button" onClick={() => { close(); navigate('/settings') }}>
              <strong>Paramètres</strong>
            </button>
            <button type="button" onClick={() => { close(); if (window.confirm('Réinitialiser la démo ? Toutes les modifications seront perdues.')) state.resetDemo() }}>
              <strong>Réinitialiser la démo</strong>
              <span>Revenir aux données d'origine</span>
            </button>
            <button type="button" onClick={() => { close(); navigate('/login') }}>
              <strong>Se déconnecter</strong>
            </button>
          </>
        )}
      </Popover>
    </header>
  )
}
