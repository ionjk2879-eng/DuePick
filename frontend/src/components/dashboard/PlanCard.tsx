import type { Plan } from '../../api/plan';

interface PlanCardProps {
  plan: Plan;
  upgrading: boolean;
  onUpgrade: () => void;
}

export default function PlanCard({ plan, upgrading, onUpgrade }: PlanCardProps) {
  return (
    <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ddd', borderRadius: 8, padding: '10px 16px', margin: '12px 0', background: plan.isPro ? '#eff6ff' : '#fafafa' }}>
      <div>
        <strong style={{ color: plan.isPro ? '#2563eb' : '#555' }}>{plan.isPro ? 'PRO 플랜' : 'FREE 플랜'}</strong>
        {plan.isPro && plan.expiresAt && <span style={{ marginLeft: 8, fontSize: 13, color: '#777' }}>{new Date(plan.expiresAt).toLocaleDateString()}까지</span>}
      </div>
      {!plan.isPro && <button onClick={onUpgrade} disabled={upgrading}>{upgrading ? '업그레이드 중...' : 'PRO로 업그레이드'}</button>}
    </section>
  );
}
