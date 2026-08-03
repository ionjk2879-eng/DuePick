import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navigation = [
  { to: '/inbox', icon: '✉', label: '받은 제안' },
  { to: '/deals', icon: '▦', label: '거래 관리' },
  { to: '/proposals', icon: '✦', label: '직접 분석' },
  { to: '/dashboard', icon: '◫', label: '비용 관리' },
];

const pageNames: Record<string, string> = { '/inbox': '받은 제안', '/deals': '거래 관리', '/proposals': '직접 분석', '/dashboard': '비용 관리' };

export default function AppShell() {
  const { nickname, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink className="brand" to="/inbox"><span className="brand-mark" />Duepick</NavLink>
        <p className="sidebar-caption">WORKSPACE</p>
        <nav className="sidebar-nav" aria-label="주요 메뉴">
          {navigation.map((item) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span className="nav-icon">{item.icon}</span>{item.label}</NavLink>)}
        </nav>
        <div className="sidebar-user">
          <div className="user-name">{nickname || 'Duepick 사용자'}</div><div className="user-plan">FREE workspace</div>
          <button className="logout-button" onClick={() => { logout(); navigate('/login'); }}>로그아웃</button>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar"><span className="topbar-title">{pageNames[location.pathname] || 'Duepick'}</span><span className="topbar-date">{today}</span></header>
        <div className="content"><Outlet /></div>
      </div>
    </div>
  );
}
