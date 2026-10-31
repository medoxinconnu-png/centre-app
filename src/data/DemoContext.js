import { createContext, useContext } from 'react'

export const DemoContext = createContext(null)

/** Accès aux données partagées de la démo (élèves, groupes, profs, paiements…) et à leurs actions. */
export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemo doit être utilisé à l’intérieur de <DemoProvider>')
  return context
}
