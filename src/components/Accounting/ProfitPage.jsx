import { Link } from 'react-router-dom'
import Header from '../shared/Header'
import Icon from '../Icon'
import { useDemo } from '../../data/DemoContext'
import { currentMonthIndex, monthLabel, schoolYearStart } from '../../data/calendar'
import { monthFinance, niceScale, rollingSeries } from '../../data/selectors'
import './ProfitPage.css'

const format = (value) => `${Math.abs(Math.round(value)).toLocaleString('fr-FR')} DH`

function ProfitChart({ series }) {
  const width = 1040
  const height = 300
  const { min, max, ticks: grid } = niceScale(series.map((entry) => entry.profit))
  const x = (index) => 48 + index * ((width - 80) / (series.length - 1))
  const y = (value) => 20 + ((max - value) / (max - min)) * (height - 44)
  const path = series.map((entry, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(entry.profit)}`).join(' ')

  return <section className="profit-chart-card">
    <h2>Évolution du bénéfice net — 12 derniers mois</h2>
    <div className="profit-chart-scroll">
      <svg className="profit-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Évolution mensuelle du bénéfice net">
        {grid.map(value => <g key={value}><line x1="48" x2={width - 18} y1={y(value)} y2={y(value)} className="profit-grid" /><text x="0" y={y(value) + 5}>{value.toLocaleString('fr-FR')}</text></g>)}
        {series.map((entry, index) => <g key={entry.month}><line x1={x(index)} x2={x(index)} y1="20" y2={height - 24} className="profit-grid" /><text x={x(index)} y={height - 4} textAnchor="middle">{entry.label}</text><circle cx={x(index)} cy={y(entry.profit)} r="10" fill="transparent"><title>{`${entry.month} — ${entry.profit < 0 ? '-' : ''}${format(entry.profit)}`}</title></circle></g>)}
        <path d={path} className="profit-line" />
      </svg>
    </div>
  </section>
}

export default function ProfitPage() {
  const state = useDemo()
  const { branches, salaries } = state
  const current = monthFinance(state, salaries, currentMonthIndex)
  const revenue = current.collected
  const costs = current.charges + current.salaries
  const profit = revenue - costs
  const series = rollingSeries(state, salaries, schoolYearStart, currentMonthIndex)
  const branchRows = branches.map((branch) => ({ name: branch.name, ...monthFinance(state, salaries, currentMonthIndex, branch.name) }))

  return <div className="profit-page">
    <Header />
    <main className="profit-content">
      <div className="fees-heading"><h1>Comptabilité</h1><p>Gestion financière du centre — {monthLabel(currentMonthIndex)}.</p></div>
      <nav className="accounting-tabs">
        <Link to="/accounting/fees">Frais de scolarité</Link>
        <Link to="/accounting/delinquencies">Retards & Impayés</Link>
        <Link to="/accounting/salaries">Salaires Profs</Link>
        <Link to="/accounting/expenses">Charges</Link>
        <Link className="active" to="/accounting/profit">Bénéfice net</Link>
      </nav>

      <section className="profit-formula"><span>FORMULE</span><p><b>CA encaissé</b> − <em>Charges</em> − <em>Salaires Profs</em> = <strong>Bénéfice net</strong></p></section>
      <section className="profit-stats">
        <article><span>CA encaissé du mois</span><strong className="positive">{format(revenue)}</strong><i><Icon name="trending-up" /></i></article>
        <article><span>Total charges + salaires</span><strong className="negative">{format(costs)}</strong><i><Icon name="coins" /></i></article>
        <article><span>Bénéfice net</span><strong className={profit < 0 ? 'negative' : 'positive'}>{profit < 0 ? '-' : ''}{format(profit)}</strong><i><Icon name="wallet" /></i></article>
      </section>
      <ProfitChart series={series} />
      <section className="profit-comparison">
        <h2>Comparatif par succursale</h2>
        <div className="profit-table-scroll"><table><thead><tr><th>Succursale</th><th>CA encaissé</th><th>Charges</th><th>Salaires</th><th>Bénéfice net</th><th>Marge</th></tr></thead><tbody>
          {branchRows.map(branch => {
            const net = branch.profit
            const margin = branch.collected ? Math.round((net / branch.collected) * 100) : 0
            return <tr key={branch.name}><td><b>{branch.name}</b></td><td>{format(branch.collected)}</td><td>{format(branch.charges)}</td><td>{format(branch.salaries)}</td><td className={net < 0 ? 'negative' : 'positive'}><b>{net < 0 ? '-' : ''}{format(net)}</b></td><td className={margin < 0 ? 'negative' : 'positive'}><b>{margin} %</b></td></tr>
          })}
        </tbody></table></div>
      </section>
    </main>
  </div>
}
