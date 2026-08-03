import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  nickname: string | null;
  onLogout: () => void;
}

export default function DashboardHeader({ nickname, onLogout }: DashboardHeaderProps) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong style={{ display: 'block', marginBottom: 4 }}>Duepick</strong>
        <h1 style={{ margin: 0 }}>{nickname}님의 업무 대시보드</h1>
      </div>
      <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/inbox">메일로 제안 받기</Link>
        <Link to="/deals">협찬·외주 거래</Link>
        <Link to="/proposals">외주 제안 분석</Link>
        <button onClick={onLogout}>로그아웃</button>
      </nav>
    </header>
  );
}
