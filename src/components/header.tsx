import { Link } from '@tanstack/react-router'

import HeaderUser from '#/integrations/clerk/header-user'

export default function Header() {
  return (
    <header className="site-header">
      <div className="page-wrap site-header-inner">
        <Link to="/" className="brand-mark">
          Grok Bot Marketplace
        </Link>
        <div className="site-header-actions">
          <Link to="/submit" className="nav-text">
            Submit
          </Link>
          <HeaderUser />
        </div>
      </div>
    </header>
  )
}
