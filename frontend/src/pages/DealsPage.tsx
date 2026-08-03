import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteDeal, fetchDeals, updateDealStatus, type Deal, type DealStatus } from '../api/deals';

const statusLabels: Record<DealStatus, string> = {
  REVIEW: '확인 필요', CONFIRMED: '확정', IN_PROGRESS: '진행 중', COMPLETED: '작업 완료', PAID: '입금 완료',
};

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetchDeals().then(setDeals).catch(() => setError('거래 목록을 불러오지 못했습니다.'));
  useEffect(() => { load(); }, []);

  const changeStatus = async (id: number, status: DealStatus) => {
    try {
      const updated = await updateDealStatus(id, status);
      setDeals((items) => items.map((item) => item.id === id ? updated : item));
    } catch { setError('상태 변경에 실패했습니다.'); }
  };

  const remove = async (id: number) => {
    try { await deleteDeal(id); setDeals((items) => items.filter((item) => item.id !== id)); }
    catch { setError('거래 삭제에 실패했습니다.'); }
  };

  const total = deals.filter((deal) => deal.status !== 'REVIEW').reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

  return (
    <main style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 style={{ marginBottom: 4 }}>협찬·외주 거래</h1><p style={{ color: '#667085', marginTop: 0 }}>확정 거래 합계 {total.toLocaleString()}원</p></div>
        <nav style={{ display: 'flex', gap: 12 }}><Link to="/proposals">새 제안 분석</Link><Link to="/dashboard">비용 대시보드</Link></nav>
      </header>
      {error && <p style={{ color: '#b42318' }}>{error}</p>}
      {!deals.length && <div style={{ border: '1px dashed #ccd3df', borderRadius: 10, padding: 30, textAlign: 'center' }}>저장된 거래가 없습니다. <Link to="/proposals">첫 제안을 분석해 보세요.</Link></div>}
      <div style={{ display: 'grid', gap: 14 }}>
        {deals.map((deal) => <article key={deal.id} style={{ border: '1px solid #d8dee9', borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div><strong>{deal.client ?? '거래처 확인 필요'}</strong><span style={{ color: '#667085', marginLeft: 8 }}>{deal.dealType ?? '유형 미정'}</span></div>
            <strong>{deal.amount == null ? '금액 확인 필요' : `${deal.amount.toLocaleString()}원`}</strong>
          </div>
          <p>{deal.deliverables.join(' · ') || '작업 범위 확인 필요'}</p>
          <p style={{ fontSize: 14, color: '#667085' }}>초안 {deal.draftDueDate ?? '-'} · 게시 {deal.publishDueDate ?? '-'} · 지급 {deal.paymentCondition ?? '-'}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <select value={deal.status} onChange={(event) => changeStatus(deal.id, event.target.value as DealStatus)}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <button onClick={() => remove(deal.id)}>삭제</button>
          </div>
        </article>)}
      </div>
    </main>
  );
}
