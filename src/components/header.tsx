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
          <HeaderUser />
        </div>
      </div>
    </header>
  )
}
