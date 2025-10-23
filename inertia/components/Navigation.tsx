import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Button } from '~/components/ui/Button';

interface User {
  id: number;
  email: string;
  fullName?: string;
}

interface PageProps {
  auth?: {
    user?: User;
  };
}

interface NavigationProps {
  isLandingPage?: boolean;
}

export function Navigation({ isLandingPage }: NavigationProps) {
  const { auth } = usePage<PageProps>().props;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/' },
  ];

  if (isLandingPage) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start h-16">
          {/* Logo */}
          <div className="flex items-center md:mr-5">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-brand">#StayConnect</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-brand px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center ml-auto space-x-4">
            {/*{auth?.user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {auth.user.fullName || auth.user.email}
                </span>
                <Link href="/profile">
                  <Button variant="outline" size="sm">
                    Profile
                  </Button>
                </Link>
                <Link href="/logout" method="post">
                  <Button variant="ghost" size="sm">
                    Logout
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}*/}
            <div className="flex items-center space-x-2">

              <Link href="/#newsletter-section">
                <Button size="sm">
                  S'inscrire à la newsletter
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex ml-auto items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-brand focus:outline-none focus:text-brand"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-brand block px-3 py-2 text-center rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link href="/#newsletter-section" className='items-center w-full'>
              <Button size="lg" className='w-full'>
                S'inscrire à la newsletter
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
