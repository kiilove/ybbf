import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, ShieldAlert, Menu } from 'lucide-react';
import { MENU_ITEMS } from '../../constants/navigation';

export default function Layout() {
  const { staff, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activePath = location.pathname;

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button className="btn-hamburger" onClick={() => setIsSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="mobile-brand">
          <img src="/logo.png" alt="YBBF 로고" />
          <span>YBBF 임원시스템</span>
        </div>
        <div style={{ width: '24px' }} />
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '4px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
            }}>
              <img
                src="/logo.png"
                alt="YBBF 로고"
                style={{
                  height: '24px',
                  objectFit: 'contain'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--color-text-primary)', lineHeight: '1.2' }}>
                YBBF 임원시스템
              </div>
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                용인특례시보디빌딩협회
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto' }}>
          <ul className="sidebar-menu">
            {MENU_ITEMS.map((item) => {
              const Icon = item.Icon;
              const isActive = activePath === item.path || (item.path === '/dashboard' && activePath === '/');
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer - User info and Logout */}
        <div className="sidebar-footer">
          <div className="user-info-box">
            <div className="name">{staff?.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <ShieldAlert size={12} style={{ color: 'var(--color-accent)' }} />
              <span>{staff?.position || '스태프'}</span>
            </div>
          </div>

          <button onClick={logout} className="btn-logout">
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            {activePath === '/dashboard' || activePath === '/' ? '대회 접수 현황 대시보드' : 
             activePath.startsWith('/registrations') ? '대회 참가 신청 명단 관리' : 
             activePath.startsWith('/pre-measurements') ? '사전 계측 자료 검토 및 관리' : 
             activePath.startsWith('/mypage') ? '마이페이지 · 계정 설정' : '어드민 포탈'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            용인특례시보디빌딩협회 · 임원시스템
          </div>
        </header>

        <section className="page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
