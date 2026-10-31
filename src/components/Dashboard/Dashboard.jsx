import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../Icon'
import Header from '../shared/Header'
import { MenuSelect } from '../shared/Menu'
import { useDemo } from '../../data/DemoContext'
import { MONTHS, currentMonthIndex, schoolYearStart } from '../../data/calendar'
import { debtorsList, financeAt, formatDH, niceScale, rollingSeries, shortBranch, sum } from '../../data/selectors'

const ALL_BRANCHES = 'Toutes les succursales'

/** Graduation compacte des axes : 45000 → « 45k ». */
const compact = (value) => (value === 0 ? '0' : `${(value / 1000).toLocaleString('fr-FR')}k`)

function StatCard({ title, value, note, tone, icon }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card__header">
        <span>{title}</span>
        <span className="stat-card__badge" aria-hidden="true"><Icon name={icon} /></span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  )
}

/** Courbe lissée (Catmull-Rom convertie en courbes de Bézier). */
function buildCurve(pts) {
  let d = ''
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

function LineChart({ series }) {
  const LEFT = 62
  const RIGHT = 746
  const TOP = 12
  const BOTTOM = 256
  const { max: MAX, ticks: TICKS } = niceScale(series.map((entry) => entry.revenue))

  const n = series.length
  const yFor = (value) => BOTTOM - (value / MAX) * (BOTTOM - TOP)
  const xFor = (index) => (n === 1 ? (LEFT + RIGHT) / 2 : LEFT + (index / (n - 1)) * (RIGHT - LEFT))

  const pts = series.map((entry, index) => ({
    x: xFor(index),
    y: yFor(entry.revenue),
    entry,
  }))
  const lineD = `M ${pts[0].x},${pts[0].y}${buildCurve(pts)}`

  return (
    <svg
      className="chart-svg"
      viewBox="0 0 760 300"
      role="img"
      aria-label="Évolution du chiffre d'affaires"
    >
      {TICKS.map((tick) => (
        <g key={tick}>
          <line className="chart-grid" x1={LEFT} x2={RIGHT} y1={yFor(tick)} y2={yFor(tick)} />
          <text className="chart-tick" x={LEFT - 12} y={yFor(tick)} textAnchor="end" dominantBaseline="middle">
            {compact(tick)}
          </text>
        </g>
      ))}

      <line className="chart-axis" x1={LEFT} x2={LEFT} y1={TOP} y2={BOTTOM} />
      <line className="chart-axis" x1={LEFT} x2={RIGHT} y1={BOTTOM} y2={BOTTOM} />

      <path className="chart-line" d={lineD} />

      {pts.map((point) => (
        <circle key={point.entry.month} className="chart-hit" cx={point.x} cy={point.y} r="12">
          <title>{`${point.entry.month} — ${formatDH(point.entry.revenue)}`}</title>
        </circle>
      ))}

      {pts.map((point) => (
        <text
          key={point.entry.month}
          className="chart-label"
          x={point.x}
          y={BOTTOM + 24}
          textAnchor="middle"
        >
          {point.entry.label}
        </text>
      ))}
    </svg>
  )
}

function BranchChart({ branches }) {
  const LEFT = 56
  const RIGHT = 412
  const TOP = 14
  const BOTTOM = 254
  const { min: MIN, max: MAX, ticks: TICKS } = niceScale(branches.flatMap((branch) => [branch.revenue, branch.profit]))
  const BAR_W = 26
  const GAP = 6

  const yFor = (value) => BOTTOM - ((value - MIN) / (MAX - MIN)) * (BOTTOM - TOP)
  const zeroY = yFor(0)
  const groupW = (RIGHT - LEFT) / Math.max(branches.length, 1)

  const bar = (value, x) => ({
    x,
    width: BAR_W,
    y: value >= 0 ? yFor(value) : zeroY,
    height: Math.abs(yFor(value) - zeroY),
  })

  return (
    <svg
      className="chart-svg"
      viewBox="0 0 420 300"
      role="img"
      aria-label="Rentabilité par succursale"
    >
      {TICKS.map((tick) => (
        <g key={tick}>
          <line className="chart-grid" x1={LEFT} x2={RIGHT} y1={yFor(tick)} y2={yFor(tick)} />
          <text className="chart-tick" x={LEFT - 10} y={yFor(tick)} textAnchor="end" dominantBaseline="middle">
            {compact(tick)}
          </text>
        </g>
      ))}

      {branches.map((branch, index) => {
        const center = LEFT + groupW * (index + 0.5)
        const revenue = bar(branch.revenue, center - BAR_W - GAP / 2)
        const profit = bar(branch.profit, center + GAP / 2)

        return (
          <g key={branch.name}>
            <rect className="chart-bar chart-bar--revenue" rx="3" {...revenue}>
              <title>{`${branch.name} — CA ${formatDH(branch.revenue)}`}</title>
            </rect>
            <rect className="chart-bar chart-bar--profit" rx="3" {...profit}>
              <title>{`${branch.name} — Bénéfice ${formatDH(branch.profit)}`}</title>
            </rect>
            <text className="chart-label" x={center} y={BOTTOM + 24} textAnchor="middle">
              {branch.name}
            </text>
          </g>
        )
      })}

      <line className="chart-zero" x1={LEFT} x2={RIGHT} y1={zeroY} y2={zeroY} />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const state = useDemo()
  const { branches, students, teachers, salaries } = state

  const currentYear = `${schoolYearStart}-${schoolYearStart + 1}`
  const schoolYears = [`${schoolYearStart - 1}-${schoolYearStart}`, currentYear]
  const [month, setMonth] = useState(MONTHS[currentMonthIndex])
  const [year, setYear] = useState(currentYear)
  const [branch, setBranch] = useState(ALL_BRANCHES)

  const yearStart = year === currentYear ? schoolYearStart : schoolYearStart - 1
  // Année en cours : on ne propose que les mois écoulés.
  const monthNames = yearStart === schoolYearStart ? MONTHS.slice(0, currentMonthIndex + 1) : MONTHS
  const monthIndex = Math.max(0, MONTHS.indexOf(month))
  const branchFilter = branch === ALL_BRANCHES ? null : branch
  const branchOptions = [ALL_BRANCHES, ...branches.filter((item) => item.active).map((item) => item.name)]
  const endYear = monthIndex >= 4 ? yearStart + 1 : yearStart

  const changeYear = (next) => {
    setYear(next)
    if (next === currentYear && MONTHS.indexOf(month) > currentMonthIndex) setMonth(MONTHS[currentMonthIndex])
  }

  // Courbe sur 12 mois glissants se terminant au mois choisi.
  const shownSeries = useMemo(
    () => rollingSeries(state, salaries, yearStart, monthIndex, branchFilter).map((entry) => ({ ...entry, revenue: entry.billed })),
    [state, salaries, yearStart, monthIndex, branchFilter]
  )

  const shownBranches = useMemo(
    () =>
      branches
        .filter((item) => item.active && (!branchFilter || item.name === branchFilter))
        .map((item) => {
          const finance = financeAt(state, salaries, yearStart, monthIndex, item.name)
          return { name: shortBranch(item.name), revenue: finance.billed, profit: finance.profit }
        }),
    [state, salaries, branches, yearStart, monthIndex, branchFilter]
  )

  // Les cartes « CA » et « Bénéfice » suivent le mois choisi, les autres reflètent la situation actuelle.
  const shownMetrics = useMemo(() => {
    const finance = shownSeries[shownSeries.length - 1]
    const scoped = students.filter((student) => !branchFilter || student.branch === branchFilter)
    const debtors = debtorsList(state, branchFilter)
    const activeTeachers = teachers.filter((teacher) => teacher.active && (!branchFilter || teacher.branches.includes(branchFilter)))
    const margin = finance.collected ? Math.round((finance.profit / finance.collected) * 100) : 0
    return [
      { id: 'revenue', title: 'CA du mois', value: formatDH(finance.billed), note: `${formatDH(finance.collected)} encaissé · ${formatDH(finance.due)} dû`, tone: 'blue', icon: 'trending-up' },
      { title: 'Élèves en retard', value: String(debtors.length), note: `${formatDH(sum(debtors, (row) => row.debt))} d'impayés`, tone: 'red', icon: 'alert' },
      { title: 'Total élèves', value: String(scoped.length), note: `${scoped.filter((student) => student.active).length} actifs`, tone: 'slate', icon: 'users' },
      { title: 'Professeurs', value: String(activeTeachers.length), note: `${teachers.length} au total`, tone: 'slate', icon: 'cap' },
      { title: 'Bénéfice net', value: formatDH(finance.profit), note: `marge ${margin} %`, tone: finance.profit < 0 ? 'danger' : 'green', icon: 'wallet' },
    ]
  }, [state, students, teachers, shownSeries, branchFilter])

  return (
    <div className="dashboard-main">
      <Header branch={branch} onBranchChange={setBranch} branchOptions={branchOptions} />

      <main className="content">
        <section className="hero-card">
          <div>
            <h1>Bonjour, Directeur 👋</h1>
            <p>Vue globale — {branch.toLowerCase()} · Période : {month} {endYear}</p>
          </div>

          <div className="controls">
            <div className="period-group">
              <MenuSelect
                className="pill"
                icon="calendar"
                label="Choisir le mois"
                value={month}
                options={monthNames}
                onChange={setMonth}
              />
              <MenuSelect
                className="pill pill--light"
                label="Choisir l'année scolaire"
                value={year}
                options={schoolYears}
                onChange={changeYear}
              />
            </div>
            <button
              type="button"
              className="primary"
              onClick={() => navigate('/students', { state: { enroll: true } })}
            >
              <Icon name="user-plus" />
              Nouvelle inscription
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => navigate('/accounting/delinquencies')}
            >
              <Icon name="eye" />
              Voir les impayés
            </button>
          </div>
        </section>

        <section className="metrics-grid" aria-label="Indicateurs clés">
          {shownMetrics.map((metric) => (
            <StatCard key={metric.title} {...metric} />
          ))}
        </section>

        <section className="analytics-grid">
          <article className="panel panel--wide">
            <div className="panel__head">
              <div>
                <h2>Évolution du chiffre d'affaires — 12 mois jusqu'à {month} {endYear}</h2>
              </div>
            </div>
            <LineChart series={shownSeries} />
          </article>

          <article className="panel">
            <div className="panel__head">
              <div>
                <h2>Rentabilité par succursale — {month}</h2>
              </div>
            </div>
            <BranchChart branches={shownBranches} />
            <div className="chart__legend">
              <span><i className="legend legend--revenue" />CA</span>
              <span><i className="legend legend--profit" />Bénéfice</span>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
