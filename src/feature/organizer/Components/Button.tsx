import type { ButtonHTMLAttributes, ReactNode } from 'react';
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary'; children: ReactNode };
export default function Button({ variant='primary', className='', children, ...props }: Props) { return <button className={`button button--${variant} ${className}`} {...props}>{children}</button>; }
