import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Instagram, Youtube, Twitter, User, LogIn, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { useAuthStore } from '../../store/useAuthStore';

const menuItems = [
  { name: '홈', path: '/', image: 'https://picsum.photos/1000/1200?random=11' },
  { name: '협회 소개', path: '/about', image: 'https://picsum.photos/1000/1200?random=20' },
  { name: '대회', path: '/competition', image: 'https://picsum.photos/1000/1200?random=16' },
  { name: '레전드', path: '/legends', image: 'https://picsum.photos/1000/1200?random=12' },
  { name: '미디어', path: '/media', image: 'https://picsum.photos/1000/1200?random=13' },
  { name: 'YBBF 유스', path: '/youth', image: 'https://picsum.photos/1000/1200?random=14' },
  { name: '스토어', path: '/store', image: 'https://picsum.photos/1000/1200?random=15' },
];

export default function Nav() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [activeImage, setActiveImage] = useState(menuItems[0].image);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const isNotHome = location.pathname !== '/';
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      if (isNotHome) {
        setIsDarkTheme(true);
      } else {
        setIsDarkTheme(window.scrollY > window.innerHeight * 0.4);
      }
    };

    handleScroll(); // 초기 진입 시 바로 적용
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (isOpen) {
      setIsUserMenuOpen(false);
      document.body.style.overflow = 'hidden';
      gsap.fromTo(
        '.menu-item',
        { y: '100%' },
        { y: '0%', duration: 0.6, stagger: 0.06, ease: 'power4.out', delay: 0.2 }
      );
      gsap.fromTo(
        '.menu-overlay',
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' }
      );
    } else {
      document.body.style.overflow = '';
      gsap.to('.menu-overlay', { opacity: 0, duration: 0.4, ease: 'power2.out' });
    }
  }, [isOpen]);

  const handleMenuHover = (img: string) => {
    setActiveImage(img);
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 h-20 flex items-center px-6 md:px-16 ${
          scrolled && !isOpen ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="flex-1 flex items-center">
          <a 
            href="/" 
            onClick={() => setIsOpen(false)}
            className={`text-display text-[3.5rem] md:text-[6rem] leading-none font-black uppercase tracking-tighter cursor-grow italic transition-colors duration-500 ${
              isDarkTheme || isOpen ? 'text-accent drop-shadow-[0_0_20px_rgba(204,255,0,0.3)]' : 'text-black'
            }`}
          >
            YBBF
          </a>
        </div>
        <div className={`flex items-center gap-4 sm:gap-6 mt-2 md:mt-0 transition-colors duration-500 ${isDarkTheme || isOpen || scrolled ? 'text-white' : 'text-black'}`}>
          <div className="hidden lg:block text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-right opacity-60 leading-relaxed font-mono">
            용인시 보디빌딩협회<br/>공식 웹사이트
          </div>
          <a href="/store" className="hidden md:block text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 hover:text-accent transition-colors">스토어</a>
          
          {/* USER INCENTIVE / AUTHENTICATION GATEWAY (Desktop & Mobile Adaptive) */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={`cursor-grow flex items-center gap-1.5 text-[10px] font-black tracking-widest border px-4 py-1.5 rounded-full transition-all duration-200 select-none ${
                  isDarkTheme || isOpen || scrolled
                    ? 'border-white/25 hover:bg-white/10 text-white' 
                    : 'border-black/25 hover:bg-black/5 text-black'
                }`}
              >
                <span>{user?.profile?.name || user?.email.split('@')[0]} 님</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 bg-[#121412]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 font-sans text-xs">
                    <Link
                      to="/mypage"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-4 py-3 text-white/80 hover:text-accent hover:bg-white/[0.03] transition-colors flex items-center gap-2"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>마이페이지</span>
                    </Link>
                    <Link
                      to="/pre-measurement"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full text-left px-4 py-3 text-white/80 hover:text-accent hover:bg-white/[0.03] border-t border-white/5 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span>사전계측 제출</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-red-400 hover:text-white hover:bg-red-500/10 border-t border-white/5 transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <a 
              href="/login"
              className={`cursor-grow flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-all duration-200 ${
                isDarkTheme || isOpen || scrolled
                  ? 'border-white/25 hover:bg-accent hover:text-black hover:border-accent text-white' 
                  : 'border-black/25 hover:bg-accent hover:text-black hover:border-accent text-black'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인</span>
            </a>
          )}

          <button 
            onClick={() => setIsOpen(true)}
            className={`cursor-grow group border px-6 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              isDarkTheme || isOpen || scrolled
                ? 'border-white/20 hover:bg-white hover:text-black' 
                : 'border-black/20 hover:bg-black hover:text-white'
            }`}
            aria-label="Open Menu"
          >
            메뉴
          </button>
        </div>
      </nav>

      {/* Menu Overlay */}
      <div 
        className={`fixed inset-0 z-[60] bg-bg-primary menu-overlay flex flex-col md:flex-row ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ opacity: 0 }}
      >
        <div className="flex-1 flex flex-col justify-between p-6 md:p-16 pt-24 md:pt-32">
          {/* Header */}
          <div className="flex justify-between items-center w-full absolute top-0 left-0 px-6 md:px-16 h-20">
            <span className="text-display text-2xl font-black uppercase tracking-tighter text-text-primary">YBBF</span>
            <div className="flex items-center gap-6">
              <a href="/store" onClick={() => setIsOpen(false)} className="hidden md:block text-[11px] font-bold uppercase tracking-[0.2em] opacity-80 hover:text-accent transition-colors">스토어</a>
              
              {/* OBLIGATORY SIGN IN AT OVERLAY MENU */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/mypage"
                    onClick={() => setIsOpen(false)}
                    className="cursor-grow flex items-center gap-1.5 border border-white/25 hover:bg-accent hover:text-black hover:border-accent text-white px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest transition-all duration-200"
                  >
                    <span>마이페이지</span>
                  </Link>
                  <Link
                    to="/pre-measurement"
                    onClick={() => setIsOpen(false)}
                    className="cursor-grow flex items-center gap-1.5 border border-accent hover:bg-accent hover:text-black text-accent px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest transition-all duration-200"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>사전계측</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="cursor-grow flex items-center gap-1.5 border border-white/25 hover:bg-red-500 hover:border-red-500 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-black tracking-widest transition-all duration-200"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="cursor-grow flex items-center gap-1.5 border border-accent hover:bg-accent hover:text-black px-4 py-1.5 rounded-full text-xs font-black tracking-widest text-accent transition-all duration-200"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>로그인 / 가입</span>
                </a>
              )}

              <button 
                onClick={() => setIsOpen(false)}
                className="cursor-grow group p-2 mx-[-8px]"
              >
                <X className="w-8 h-8 group-hover:text-accent transition-colors" />
              </button>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex flex-col gap-2 md:gap-4 mt-12 md:mt-0">
            {menuItems.map((item, i) => (
              <div key={i} className="overflow-hidden">
                <a
                  href={item.path}
                  onClick={() => setIsOpen(false)}
                  className="menu-item block text-display text-[clamp(32px,4vw,64px)] leading-none font-black text-text-primary hover:text-accent hover:translate-x-4 transition-all duration-300"
                  onMouseEnter={() => handleMenuHover(item.image)}
                >
                  {item.name}
                </a>
              </div>
            ))}
          </div>

          {/* Footer of Menu */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 gap-6">
            <div className="font-sans text-xs md:text-sm tracking-[0.2em] text-text-muted uppercase font-bold">
              <p>용인시 보디빌딩협회</p>
              <p className="mb-2">since 1990</p>
              <a href="mailto:contact@ybbf.or.kr" className="hover:text-accent transition-colors">contact@ybbf.or.kr</a>
            </div>
            <div className="flex gap-4">
              <a href="#" className="p-2 hover:bg-accent hover:text-bg-primary rounded-full transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-2 hover:bg-accent hover:text-bg-primary rounded-full transition-colors"><Youtube className="w-5 h-5" /></a>
              <a href="#" className="p-2 hover:bg-accent hover:text-bg-primary rounded-full transition-colors"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        {/* Right side image preview (Desktop only) */}
        <div className="hidden md:block flex-1 relative bg-bg-secondary overflow-hidden">
          {menuItems.map((item, i) => (
            <img
              key={i}
              src={item.image}
              alt={item.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
                activeImage === item.image ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
        </div>
      </div>
    </>
  );
}
