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
  const paid = deals.filter((deal) => deal.status === 'PAID').reduce((sum, deal) => sum + (deal.amount ?? 0), 0);

  return (
    <>
      <header className="page-header"><div><p className="eyebrow">DEAL PIPELINE</p><h1 className="page-title">거래 관리</h1><p className="page-description">제안부터 입금까지 거래의 현재 위치와 중요한 조건을 한눈에 확인하세요.</p></div><div className="page-actions"><Link className="btn btn-primary" to="/proposals">＋ 새 제안 분석</Link></div></header>
      <section className="grid-3" style={{ marginBottom: 24 }}><div className="card metric-card"><div className="metric-label">전체 거래</div><div className="metric-value">{deals.length}건</div><div className="metric-note">확인 대기 포함</div></div><div className="card metric-card"><div className="metric-label">확정 거래 금액</div><div className="metric-value">{total.toLocaleString()}원</div><div className="metric-note">확인 완료된 거래</div></div><div className="card metric-card"><div className="metric-label">입금 완료</div><div className="metric-value">{paid.toLocaleString()}원</div><div className="metric-note">실제 수령 기준</div></div></section>
      {error && <div className="alert alert-error">{error}</div>}
      {!deals.length && <div className="empty-state"><div className="empty-icon">▦</div><h3>아직 저장된 거래가 없어요</h3><p>받은 메일을 확인하거나 제안 원문을 직접 분석해 첫 거래를 만들어보세요.</p><Link className="btn btn-primary" style={{ marginTop: 18 }} to="/inbox">받은 제안 보기</Link></div>}
      <div className="stack">
        {deals.map((deal) => <article key={deal.id} className="card deal-card">
          <div className="deal-top"><div><div className="deal-client">{deal.client ?? '거래처 확인 필요'}</div><div className="deal-type">{deal.dealType ?? '거래 유형 미정'}</div></div><div className="deal-amount">{deal.amount == null ? '금액 확인 필요' : `${deal.amount.toLocaleString()}원`}</div></div>
          <div className="deal-deliverables">{deal.deliverables.length ? deal.deliverables.map((item) => <span className="tag" key={item}>{item}</span>) : <span className="tag">작업 범위 확인 필요</span>}</div>
          <div className="deal-meta"><div><span className="meta-label">초안 기한</span><span className="meta-value">{deal.draftDueDate ?? '-'}</span></div><div><span className="meta-label">게시 기한</span><span className="meta-value">{deal.publishDueDate ?? '-'}</span></div><div><span className="meta-label">지급 조건</span><span className="meta-value">{deal.paymentCondition ?? '-'}</span></div></div>
          <div className="deal-footer"><select aria-label="거래 상태" value={deal.status} onChange={(event) => changeStatus(deal.id, event.target.value as DealStatus)} style={{ width: 'auto' }}>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select><div className="action-row"><span className={`badge badge-${deal.status.toLowerCase().replace('_', '-')}`}>{statusLabels[deal.status]}</span><button className="btn btn-danger btn-sm" onClick={() => remove(deal.id)}>삭제</button></div></div>
        </article>)}
      </div>
    </>
  );
}
