import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { createSubscription, deleteSubscription, fetchSubscriptions } from '../api/subscriptions';
import { downloadCsvReport, downloadPdfReport } from '../api/reports';
import { suggestCategory } from '../api/suggestion';
import { fetchMyPlan, upgradeToPro, type Plan } from '../api/plan';
import type { BillingCycle, Subscription, UsageType } from '../types';
import ChartsSection from '../components/ChartsSection';
import PlanCard from '../components/dashboard/PlanCard';
import ReportPanel from '../components/dashboard/ReportPanel';
import SubscriptionForm from '../components/dashboard/SubscriptionForm';
import SubscriptionTable from '../components/dashboard/SubscriptionTable';

function getErrorMessage(error: unknown, fallback: string): string {
  return isAxiosError(error) ? error.response?.data?.message ?? fallback : fallback;
}

export default function DashboardPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [serviceName, setServiceName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('MONTHLY');
  const [usageType, setUsageType] = useState<UsageType>('BUSINESS');
  const [accountingCategory, setAccountingCategory] = useState('');
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [suggestionMatched, setSuggestionMatched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportUsageType, setReportUsageType] = useState<UsageType | ''>('BUSINESS');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [downloading, setDownloading] = useState<'csv' | 'pdf' | null>(null);
  const [chartsRefreshKey, setChartsRefreshKey] = useState(0);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  const loadSubscriptions = async () => {
    setSubscriptions(await fetchSubscriptions());
    setChartsRefreshKey((key) => key + 1);
  };

  useEffect(() => {
    loadSubscriptions();
    fetchMyPlan().then(setPlan).catch(() => setPlan(null));
  }, []);

  useEffect(() => {
    if (!serviceName.trim()) {
      setSuggestionNote(null);
      setSuggestionMatched(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const result = await suggestCategory(serviceName.trim());
        setSuggestionMatched(result.matched);
        setSuggestionNote(result.note);
        if (result.matched) {
          if (result.suggestedUsageType) setUsageType(result.suggestedUsageType);
          setAccountingCategory(result.suggestedAccountingCategory ?? '');
        }
      } catch {
        setSuggestionNote(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [serviceName]);

  const handleUpgrade = async () => {
    setErrorMessage(null);
    setUpgrading(true);
    try {
      setPlan(await upgradeToPro());
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'PRO 업그레이드에 실패했습니다.'));
    } finally {
      setUpgrading(false);
    }
  };

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    try {
      await createSubscription({ serviceName, amount: Number(amount), billingCycle, usageType, accountingCategory: accountingCategory || undefined });
      setServiceName('');
      setAmount('');
      setAccountingCategory('');
      setSuggestionNote(null);
      await loadSubscriptions();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '구독 등록에 실패했습니다.'));
    }
  };

  const handleDelete = async (id: number) => {
    setErrorMessage(null);
    try {
      await deleteSubscription(id);
      await loadSubscriptions();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '구독 삭제에 실패했습니다.'));
    }
  };

  const handleDownload = async (format: 'csv' | 'pdf') => {
    setDownloading(format);
    try {
      const params = { usageType: reportUsageType || undefined, from: reportFrom || undefined, to: reportTo || undefined };
      await (format === 'csv' ? downloadCsvReport(params) : downloadPdfReport(params));
    } finally {
      setDownloading(null);
    }
  };

  const businessTotal = subscriptions.filter((item) => item.usageType === 'BUSINESS').reduce((sum, item) => sum + item.amount, 0);

  return (
    <>
      <header className="page-header"><div><p className="eyebrow">COST WORKSPACE</p><h1 className="page-title">비용 관리</h1><p className="page-description">업무에 쓰는 구독 비용을 정리하고 월 지출 흐름을 확인하세요.</p></div></header>
      <section className="grid-3" style={{ marginBottom: 20 }}><div className="card metric-card"><div className="metric-label">업무용 구독</div><div className="metric-value">{businessTotal.toLocaleString()}원</div><div className="metric-note">현재 등록 금액 합계</div></div><div className="card metric-card"><div className="metric-label">등록 서비스</div><div className="metric-value">{subscriptions.length}개</div><div className="metric-note">업무용·개인용 포함</div></div>{plan && <PlanCard plan={plan} upgrading={upgrading} onUpgrade={handleUpgrade} />}</section>
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
      <ChartsSection key={chartsRefreshKey} />
      <section className="card card-body" style={{ marginTop: 20 }}><div className="card-header" style={{ padding: 0, marginBottom: 18 }}><div><h2 className="card-title">구독 추가</h2><p className="card-copy">서비스명에 따라 일반적인 비용 분류를 추천합니다.</p></div></div><SubscriptionForm
        serviceName={serviceName} amount={amount} billingCycle={billingCycle} usageType={usageType}
        accountingCategory={accountingCategory} suggestionNote={suggestionNote} suggestionMatched={suggestionMatched}
        onServiceNameChange={setServiceName} onAmountChange={setAmount} onBillingCycleChange={setBillingCycle}
        onUsageTypeChange={setUsageType} onAccountingCategoryChange={setAccountingCategory} onSubmit={handleAdd}
      /></section>
      <ReportPanel usageType={reportUsageType} from={reportFrom} to={reportTo} downloading={downloading}
        onUsageTypeChange={setReportUsageType} onFromChange={setReportFrom} onToChange={setReportTo} onDownload={handleDownload} />
      <section className="card" style={{ marginTop: 20 }}><div className="card-header"><div><h2 className="card-title">구독 목록</h2><p className="card-copy">현재 등록된 반복 비용입니다.</p></div></div><div className="card-body"><SubscriptionTable subscriptions={subscriptions} onDelete={handleDelete} /></div></section>
    </>
  );
}
