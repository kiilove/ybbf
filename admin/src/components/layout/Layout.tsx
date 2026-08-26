import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, FileText, LogOut, ShieldAlert, Film, Settings, Megaphone, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
      navigate('/login');
    }
  };

  // 현재 라우트 경로에 따른 화면 타이틀 노출
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/hero/new')) return '신규 선수 등록';
    if (path.startsWith('/hero/edit')) return '선수 정보 수정';
    if (path.startsWith('/hero')) return '히어로 섹션 선수 관리';
    if (path.startsWith('/landing')) return '랜딩페이지 섹션 편집';
    if (path.startsWith('/media')) return '미디어 아카이브 관리';
    if (path.startsWith('/settings')) return '대회 접수 및 시스템 설정';
    if (path.startsWith('/notices')) return '필수 공지사항 관리';
    if (path.includes('/contest-staffs')) return '대회 관계자 계정 관리';
    return 'YBBF 관리자 모드';
  };

  return (
    <div className="admin-shell">
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          YBBF <span>ADMIN</span>
        </div>
        
        <nav className="sidebar-menu">
          <NavLink 
            to="/hero" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>히어로 선수 관리</span>
          </NavLink>

          <NavLink 
            to="/media" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Film size={18} />
            <span>미디어 아카이브 관리</span>
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>대회 및 시스템 설정</span>
          </NavLink>

          <NavLink 
            to="/notices" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Megaphone size={18} />
            <span>필수 공지사항 관리</span>
          </NavLink>

          <NavLink 
            to="/contest-staffs" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={18} />
            <span>관계자 계정 관리</span>
          </NavLink>

          <NavLink 
            to="/landing" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>랜딩페이지 섹션 편집</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn-logout" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={14} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="main-content">
        <header className="header">
          <div className="header-title">{getPageTitle()}</div>
          
          <div className="header-user">
            {/* 세션정보 */}
            <div className="user-info">
              <span className="user-name">{user?.profile?.name || user?.email || '관리자'}</span>
              <span className="user-role">
                {user?.roles?.includes('admin') ? '최고관리자 (Admin)' : '일반관리자'}
              </span>
            </div>
            
            {/* DB 연결 상태 또는 디버깅 뱃지 */}
            <div className="status-badge status-badge-primary" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <ShieldAlert size={12} />
              <span>D1 Worker Connected</span>
            </div>
          </div>
        </header>

        {/* 하위 페이지 렌더링 영역 */}
        <main className="view-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
