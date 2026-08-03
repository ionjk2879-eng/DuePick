import type { Plan } from '../../api/plan';

interface PlanCardProps {
  plan: Plan;
  upgrading: boolean;
  onUpgrade: () => void;
}

export default function PlanCard({ plan, upgrading, onUpgrade }: PlanCardProps) {
  return (
    <div className="card metric-card"><div className="metric-label">현재 플랜</div><div className="metric-value" style={{ fontSize: 20 }}><span className={`badge ${plan.isPro ? 'badge-pro' : 'badge-free'}`}>{plan.isPro ? 'PRO' : 'FREE'}</span></div>{plan.isPro && plan.expiresAt ? <div className="metric-note">{new Date(plan.expiresAt).toLocaleDateString()}까지</div> : <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={onUpgrade} disabled={upgrading}>{upgrading ? '처리 중…' : 'PRO 살펴보기'}</button>}</div>
  );
}
