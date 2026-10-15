import { Link } from '@tanstack/react-router'

// One link component used by the header and footer.
// It checks which kind of link it got (see routes/links.js)
export default function SiteLink({ item, className, onClick }) {
  if (item.slug) {
    return <Link to="/page/$slug" params={{ slug: item.slug }} className={className} onClick={onClick}>{item.label}</Link>
  }
  if (item.to) {
    return <Link to={item.to} className={className} onClick={onClick}>{item.label}</Link>
  }
  return <a href={item.href} className={className} onClick={onClick}>{item.label}</a>
}
