import { Link } from '@tanstack/react-router'
import type { NavLink } from '../routes/links'

interface SiteLinkProps {
  item: NavLink
  className?: string
  onClick?: () => void
}

export default function SiteLink({ item, className, onClick }: SiteLinkProps) {
  if (item.slug) {
    return (
      <a href={`#${item.slug}`} className={className} onClick={onClick}>
        {item.label}
      </a>
    )
  }
  if (item.to) {
    return (
      <Link to={item.to} className={className} onClick={onClick}>
        {item.label}
      </Link>
    )
  }
  return (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  )
}
