// Identité de la démo : changer ces valeurs suffit pour renommer toute l'application.
export const APP = {
  name: 'Centre-App',
  initials: 'CA',
  tagline: 'Centre de soutien scolaire',
  city: 'Casablanca',
  address: '12 Bd Zerktouni, Casablanca',
  phone: '0522 33 44 55',
  email: 'contact@centre-app.ma',
  domain: 'centre-app.ma',
  logo: '/logo.svg',
}

// Identifiants pré-remplis sur la page de connexion (la démo n'a pas de vraie authentification).
export const DEMO_LOGIN = { email: `admin@${APP.domain}`, password: 'demo2026' }
