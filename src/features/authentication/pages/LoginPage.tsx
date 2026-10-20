import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { User } from '../authStore';
import { useAuth } from '../useAuth';
import { canAccess } from '../guards';
import styles from './LoginPage.module.css';

function homeForRole(role: User['role']): string {
  if (role === 'admin') return '/admin';        // <-- Added Admin redirect
  if (role === 'organizer') return '/organizer/dashboard';
  if (role === 'staff') return '/scan';
  return '/events';
}

type Mode = 'login' | 'register';

function validate(mode: Mode, name: string, email: string, password: string): string | null {
  if (mode === 'register' && !name.trim()) return 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

// Only allow redirects to pages inside this app
function safePath(path: string | undefined): string {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/events';
}

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const organizerArea = !!redirect && redirect.startsWith('/organizer');
  const [accountType, setAccountType] = useState<'customer' | 'organizer'>(organizerArea ? 'organizer' : 'customer');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const goAfterLogin = (user: User) =>
    navigate({ to: redirect && canAccess(user.role, safePath(redirect)) ? safePath(redirect) : homeForRole(user.role) });

  const submit = useMutation({
    mutationFn: () => (mode === 'login' ? login(email, password) : register(name, email, password, accountType)),
    onSuccess: goAfterLogin,
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const error = validate(mode, name, email, password);
    setFormError(error);
    if (!error) submit.mutate();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setFormError(null);
    submit.reset();
  };

  const errorMessage =
    formError ?? (submit.error?.message || null);

  return (
    <main className={styles.page}>
      <aside className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.logoMark}></span>
          Ticket Master
        </div>

        <div>
          <h1 className={styles.headline}>Your next great night starts here.</h1>
          <p className={styles.tagline}>Discover events, buy tickets in minutes and walk in with a simple scan.</p>
          <ul className={styles.perks}>
            <li><span className={styles.perkIcon}>✓</span>Find events that match your taste</li>
            <li><span className={styles.perkIcon}>✓</span>Pay once and get your ticket instantly</li>
            <li><span className={styles.perkIcon}>✓</span>Show your QR code at the door</li>
          </ul>
        </div>
      </aside>

      <section className={styles.formSide}>
        <div className={styles.card}>
          <h2 className={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className={styles.subtitle}>
            {mode === 'login' ? 'Log in to buy tickets and see your bookings.' : 'It only takes a minute to get started.'}
          </p>

          <div className={styles.tabs}>
            <button type="button" onClick={() => switchMode('login')} className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}>
              Log in
            </button>
            <button type="button" onClick={() => switchMode('register')} className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}>
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} noValidate>
            {mode === 'register' && (
              <>
                <div className={styles.tabs}>
                  <button type="button" onClick={() => setAccountType('customer')} className={`${styles.tab} ${accountType === 'customer' ? styles.active : ''}`}>
                    I want to buy tickets
                  </button>
                  <button type="button" onClick={() => setAccountType('organizer')} className={`${styles.tab} ${accountType === 'organizer' ? styles.active : ''}`}>
                    I'm an organizer
                  </button>
                </div>
                <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={styles.field} />
              </>
            )}
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.field} />
            <div className={styles.passwordRow}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.field}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className={styles.toggle}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {errorMessage && <p role="alert" className={styles.error}>{errorMessage}</p>}

            <button type="submit" disabled={submit.isPending} className={styles.submit}>
              {submit.isPending ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

        </div>
      </section>
    </main>
  );
}
