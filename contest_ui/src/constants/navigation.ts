import { LayoutDashboard, Users, Scale, Camera, User, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  path: string;
  label: string;
  Icon: LucideIcon;
}

export const MENU_ITEMS: MenuItem[] = [
  { path: '/dashboard', label: '대시보드', Icon: LayoutDashboard },
  { path: '/pre-registrations', label: '2027 사전접수 관리', Icon: ClipboardList },
  { path: '/registrations', label: '접수명단 관리', Icon: Users },
  { path: '/photos', label: '선수 사진 관리', Icon: Camera },
  { path: '/pre-measurements', label: '사전계측 관리', Icon: Scale },
  { path: '/mypage', label: '마이페이지', Icon: User }
];
