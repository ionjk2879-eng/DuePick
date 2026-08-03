import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  nickname: string | null;
  onLogout: () => void;
}

export default function DashboardHeader({ nickname, onLogout }: DashboardHeaderProps) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>{nickname}님의 구독 목록</h1>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/deals">협찬·외주 거래</Link>
        <Link to="/proposals">외주 제안 분석</Link>
        <button onClick={onLogout}>로그아웃</button>
      </nav>
    </header>
  );
}
