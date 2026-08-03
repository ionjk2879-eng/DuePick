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
    <form onSubmit={props.onSubmit} className="stack">
      <div className="form-grid-wide">
        <label className="field"><span className="field-label">서비스</span><input placeholder="예: Canva" value={props.serviceName} onChange={(e) => props.onServiceNameChange(e.target.value)} required /></label>
        <label className="field"><span className="field-label">금액</span><input type="number" min="0" placeholder="0" value={props.amount} onChange={(e) => props.onAmountChange(e.target.value)} required /></label>
        <label className="field"><span className="field-label">결제 주기</span><select value={props.billingCycle} onChange={(e) => props.onBillingCycleChange(e.target.value as BillingCycle)}><option value="MONTHLY">월간</option><option value="YEARLY">연간</option></select></label>
        <label className="field"><span className="field-label">사용 구분</span><select value={props.usageType} onChange={(e) => props.onUsageTypeChange(e.target.value as UsageType)}><option value="BUSINESS">업무용</option><option value="PERSONAL">개인용</option></select></label>
        <label className="field"><span className="field-label">계정과목</span><input placeholder="예: 지급수수료" value={props.accountingCategory} onChange={(e) => props.onAccountingCategoryChange(e.target.value)} /></label>
        <button className="btn btn-primary" type="submit">추가</button>
      </div>
      {props.suggestionNote && <p className={`helper${props.suggestionMatched ? ' helper-accent' : ''}`}>{props.suggestionMatched ? '✦ 추천: ' : ''}{props.suggestionNote}</p>}
    </form>
  );
}
