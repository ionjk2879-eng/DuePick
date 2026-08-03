import type { Subscription } from '../../types';

export default function SubscriptionTable({ subscriptions, onDelete }: { subscriptions: Subscription[]; onDelete: (id: number) => void }) {
  return (
    <div className="table-wrap"><table className="data-table">
      <thead><tr><th>서비스</th><th>금액</th><th>주기</th><th>분류</th><th>계정과목</th><th></th></tr></thead>
      <tbody>{subscriptions.map((subscription) => (
        <tr key={subscription.id}>
          <td>{subscription.serviceName}</td><td>{subscription.amount.toLocaleString()}원</td>
          <td>{subscription.billingCycle === 'MONTHLY' ? '월간' : '연간'}</td><td>{subscription.usageType === 'BUSINESS' ? '업무용' : '개인용'}</td>
          <td>{subscription.accountingCategory ?? '-'}</td><td><button className="btn btn-danger btn-sm" onClick={() => onDelete(subscription.id)}>삭제</button></td>
        </tr>
      ))}</tbody></table></div>
  );
}
