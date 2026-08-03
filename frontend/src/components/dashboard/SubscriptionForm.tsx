import type { FormEvent } from 'react';
import type { BillingCycle, UsageType } from '../../types';

interface SubscriptionFormProps {
  serviceName: string; amount: string; billingCycle: BillingCycle; usageType: UsageType;
  accountingCategory: string; suggestionNote: string | null; suggestionMatched: boolean;
  onServiceNameChange: (value: string) => void; onAmountChange: (value: string) => void;
  onBillingCycleChange: (value: BillingCycle) => void; onUsageTypeChange: (value: UsageType) => void;
  onAccountingCategoryChange: (value: string) => void; onSubmit: (event: FormEvent) => void;
}

export default function SubscriptionForm(props: SubscriptionFormProps) {
  return (
    <form onSubmit={props.onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '20px 0' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input placeholder="서비스명 (예: Canva)" value={props.serviceName} onChange={(e) => props.onServiceNameChange(e.target.value)} required />
        <input type="number" placeholder="금액" value={props.amount} onChange={(e) => props.onAmountChange(e.target.value)} required />
        <select value={props.billingCycle} onChange={(e) => props.onBillingCycleChange(e.target.value as BillingCycle)}><option value="MONTHLY">월간</option><option value="YEARLY">연간</option></select>
        <select value={props.usageType} onChange={(e) => props.onUsageTypeChange(e.target.value as UsageType)}><option value="BUSINESS">업무용</option><option value="PERSONAL">개인용</option></select>
        <input placeholder="참고 계정과목 (예: 지급수수료)" value={props.accountingCategory} onChange={(e) => props.onAccountingCategoryChange(e.target.value)} />
        <button type="submit">추가</button>
      </div>
      {props.suggestionNote && <p style={{ fontSize: 13, color: props.suggestionMatched ? '#2563eb' : '#999', margin: 0 }}>{props.suggestionMatched ? '💡 추천: ' : ''}{props.suggestionNote}</p>}
    </form>
  );
}
