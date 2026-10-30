import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { requestPasswordReset, resetPasswordRequest, type User } from '../authStore';
import { useAuth } from '../useAuth';
import { canAccess } from '../guards';
import { useToast } from '../../toast';
import styles from './LoginPage.module.css';

function homeForRole(role: User['role']): string {
  if (role === 'admin') return '/admin';
  if (role === 'organizer') return '/organizer/dashboard';
  if (role === 'staff') return '/scan';
  return '/events';
}

type Mode = 'login' | 'register' | 'forgot';
type ForgotStep = 'request' | 'reset';
type Field = 'name' | 'email' | 'password' | 'confirm';
type FieldErrors = Partial<Record<Field, string>>;

// Order used to decide which invalid field receives focus first
const FIELD_ORDER: Field[] = ['name', 'email', 'password', 'confirm'];

interface Values {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

function validate(mode: Mode, step: ForgotStep, v: Values): FieldErrors {
  const errors: FieldErrors = {};
  const needsEmail = mode !== 'forgot' || step === 'request';
  const needsPassword = mode !== 'forgot' || step === 'reset';

  if (mode === 'register' && !v.name.trim()) errors.name = 'Enter your full name';
  if (needsEmail && !/^\S+@\S+\.\S+$/.test(v.email)) errors.email = 'Enter a valid email address';
  if (needsPassword && v.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (mode === 'forgot' && step === 'reset' && v.password.length >= 8 && v.confirm !== v.password) {
    errors.confirm = 'Passwords do not match';
  }
  return errors;
}

// Only allow redirects to pages inside this app
function safePath(path: string | undefined): string {
  return path && path.startsWith('/') && !path.startsWith('//') ? path : '/events';
}

export function LoginPage() {
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { redirect } = useSearch({ strict: false }) as { redirect?: string };

  const [mode, setMode] = useState<Mode>('login');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('request');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const organizerArea = !!redirect && redirect.startsWith('/organizer');
  const [accountType, setAccountType] = useState<'customer' | 'organizer'>(organizerArea ? 'organizer' : 'customer');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Record<Field, RefObject<HTMLInputElement | null>> = {
    name: nameRef,
    email: emailRef,
    password: passwordRef,
    confirm: confirmRef,
  };

  const goAfterLogin = (user: User) =>
    navigate({ to: redirect && canAccess(user.role, safePath(redirect)) ? safePath(redirect) : homeForRole(user.role) });

  const submit = useMutation({
    mutationFn: () => (mode === 'login' ? login(email, password) : register(name, email, password, accountType)),
    onSuccess: (user) => {
      if (mode === 'register') {
        showToast(`Account created — welcome, ${user.name}!`, 'success');
      }
      goAfterLogin(user);
    },
    onError: (error) => {
      if (mode === 'register') {
        showToast(error.message, 'error');
      }
    },
  });

  // Demo flow, step 1: "request" a reset (nothing is emailed).
  const requestReset = useMutation({
    mutationFn: () => requestPasswordReset(email),
    onSuccess: () => {
      showToast(`Demo only: reset requested for ${email.trim()}. No email is sent.`, 'info');
      setForgotStep('reset');
      setPassword('');
      setConfirm('');
    },
    onError: (error) => {
      setErrors({ email: error.message });
      emailRef.current?.focus();
    },
  });

  // Demo flow, step 2: save the new password in the local mock store.
  const reset = useMutation({
    mutationFn: () => resetPasswordRequest(email, password),
    onSuccess: () => {
      showToast('Password updated (demo). Log in with your new password.', 'success');
      setMode('login');
      setForgotStep('request');
      setPassword('');
      setConfirm('');
      setErrors({});
    },
  });

  // Move focus to the new-password field when the reset step appears
  useEffect(() => {
    if (mode === 'forgot' && forgotStep === 'reset') passwordRef.current?.focus();
  }, [mode, forgotStep]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(mode, forgotStep, { name, email, password, confirm });
    setErrors(found);

    const firstInvalid = FIELD_ORDER.find((field) => found[field]);
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    if (mode === 'forgot') {
      if (forgotStep === 'request') requestReset.mutate();
      else reset.mutate();
    } else {
      submit.mutate();
    }
  };

  const clearAll = () => {
    setErrors({});
    setPassword('');
    setConfirm('');
    setForgotStep('request');
    submit.reset();
    requestReset.reset();
    reset.reset();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    clearAll();
  };

  // Update a field and clear that field's error as the user corrects it
  const change = (field: Field, value: string) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirm') setConfirm(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // aria attributes linking an input to its own error message
  const a11y = (field: Field, id: string) => ({
    'aria-invalid': errors[field] ? (true as const) : undefined,
    'aria-describedby': errors[field] ? `${id}-error` : undefined,
  });
  const fieldError = (field: Field, id: string) =>
    errors[field] ? (
      <p id={`${id}-error`} className={styles.fieldError}>
        {errors[field]}
      </p>
    ) : null;

  // Server-side problems (e.g. wrong password) are announced as an alert
  const alertMessage = submit.error?.message ?? reset.error?.message ?? null;
  const isPending = submit.isPending || requestReset.isPending || reset.isPending;
  const showEmailField = mode !== 'forgot' || forgotStep === 'request';
  const showPasswordField = mode !== 'forgot' || forgotStep === 'reset';

  const title =
    mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset your password';
  const subtitle =
    mode === 'login'
      ? 'Log in to buy tickets and see your bookings.'
      : mode === 'register'
        ? 'It only takes a minute to get started.'
        : forgotStep === 'request'
          ? 'Enter the email address of your account.'
          : 'Choose a new password for your account.';
  const submitLabel = isPending
    ? 'Please wait…'
    : mode === 'login'
      ? 'Log in'
      : mode === 'register'
        ? 'Create account'
        : forgotStep === 'request'
          ? 'Request reset'
          : 'Reset password';

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
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>

          {mode !== 'forgot' && (
            <div className={styles.tabs}>
              <button type="button" aria-pressed={mode === 'login'} onClick={() => switchMode('login')} className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}>
                Log in
              </button>
              <button type="button" aria-pressed={mode === 'register'} onClick={() => switchMode('register')} className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}>
                Register
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <p className={styles.demoNote}>
              <strong>Demo flow:</strong> there is no backend, so no email is sent. This only changes the password
              stored in this browser's mock account list.
            </p>
          )}

          <form onSubmit={onSubmit} noValidate>
            {mode === 'register' && (
              <>
                <div role="group" aria-label="Account type" className={styles.tabs}>
                  <button type="button" aria-pressed={accountType === 'customer'} onClick={() => setAccountType('customer')} className={`${styles.tab} ${accountType === 'customer' ? styles.active : ''}`}>
                    I want to buy tickets
                  </button>
                  <button type="button" aria-pressed={accountType === 'organizer'} onClick={() => setAccountType('organizer')} className={`${styles.tab} ${accountType === 'organizer' ? styles.active : ''}`}>
                    I'm an organizer
                  </button>
                </div>

                <label htmlFor="auth-name" className={styles.srOnly}>Full name</label>
                <input
                  id="auth-name"
                  ref={nameRef}
                  type="text"
                  name="name"
                  autoComplete="name"
                  aria-required="true"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => change('name', e.target.value)}
                  className={styles.field}
                  {...a11y('name', 'auth-name')}
                />
                {fieldError('name', 'auth-name')}
              </>
            )}

            {showEmailField && (
              <>
                <label htmlFor="auth-email" className={styles.srOnly}>Email address</label>
                <input
                  id="auth-email"
                  ref={emailRef}
                  type="email"
                  name="email"
                  autoComplete="email"
                  aria-required="true"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => change('email', e.target.value)}
                  className={styles.field}
                  {...a11y('email', 'auth-email')}
                />
                {fieldError('email', 'auth-email')}
              </>
            )}

            {mode === 'forgot' && forgotStep === 'reset' && (
              <p className={styles.resetFor}>Resetting the password for <strong>{email.trim()}</strong></p>
            )}

            {showPasswordField && (
              <>
                <label htmlFor="auth-password" className={styles.srOnly}>
                  {mode === 'forgot' ? 'New password' : 'Password'}
                </label>
                <div className={styles.passwordRow}>
                  <input
                    id="auth-password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    aria-required="true"
                    placeholder={mode === 'forgot' ? 'New password' : 'Password'}
                    value={password}
                    onChange={(e) => change('password', e.target.value)}
                    className={styles.field}
                    {...a11y('password', 'auth-password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className={styles.toggle}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {fieldError('password', 'auth-password')}
              </>
            )}

            {mode === 'forgot' && forgotStep === 'reset' && (
              <>
                <label htmlFor="auth-confirm" className={styles.srOnly}>Confirm new password</label>
                <input
                  id="auth-confirm"
                  ref={confirmRef}
                  type={showPassword ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  aria-required="true"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => change('confirm', e.target.value)}
                  className={styles.field}
                  {...a11y('confirm', 'auth-confirm')}
                />
                {fieldError('confirm', 'auth-confirm')}
              </>
            )}

            {mode === 'login' && (
              <div className={styles.linkRow}>
                <button type="button" onClick={() => switchMode('forgot')} className={styles.linkButton}>
                  Forgot password?
                </button>
              </div>
            )}

            {alertMessage && <p role="alert" className={styles.error}>{alertMessage}</p>}

            <button type="submit" disabled={isPending} className={styles.submit}>
              {submitLabel}
            </button>

            {mode === 'forgot' && (
              <div className={styles.linkRow} style={{ justifyContent: 'center', margin: '16px 0 0' }}>
                <button type="button" onClick={() => switchMode('login')} className={styles.linkButton}>
                  Back to log in
                </button>
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
