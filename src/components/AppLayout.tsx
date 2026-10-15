import { Outlet } from '@tanstack/react-router';
import Header from './Header';

export function AppLayout() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '4rem' }}>
        <Outlet />
      </main>
    </>
  );
}
