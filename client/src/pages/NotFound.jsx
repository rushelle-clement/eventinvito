import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-margin-mobile text-center">
      <div>
        <Logo />
        <h1 className="mt-10 font-serif text-headline-lg text-espresso">Page not found</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link to="/" className="btn-primary mt-8">
          Go home
        </Link>
      </div>
    </main>
  )
}
