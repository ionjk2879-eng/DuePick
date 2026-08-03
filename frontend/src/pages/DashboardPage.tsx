import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { createSubscription, deleteSubscription, fetchSubscriptions } from '../api/subscriptions';
import { downloadCsvReport, downloadPdfReport } from '../api/reports';
import { suggestCategory } from '../api/suggestion';
import { fetchMyPlan, upgradeToPro, type Plan } from '../api/plan';
import { useAuth } from '../context/AuthContext';
import type { BillingCycle, Subscription, UsageType } from '../types';
import ChartsSection from '../components/ChartsSection';
import DashboardHeader from '../components/dashboard/DashboardHeader';
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
  const { nickname, logout } = useAuth();
  const navigate = useNavigate();

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
    <main style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <DashboardHeader nickname={nickname} onLogout={() => { logout(); navigate('/login'); }} />
      {plan && <PlanCard plan={plan} upgrading={upgrading} onUpgrade={handleUpgrade} />}
      <p style={{ color: '#555' }}>업무용 구독료 합계 (월 환산 기준): {businessTotal.toLocaleString()}원</p>
      {errorMessage && <p style={{ color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6 }}>{errorMessage}</p>}
      <ChartsSection key={chartsRefreshKey} />
      <SubscriptionForm
        serviceName={serviceName} amount={amount} billingCycle={billingCycle} usageType={usageType}
        accountingCategory={accountingCategory} suggestionNote={suggestionNote} suggestionMatched={suggestionMatched}
        onServiceNameChange={setServiceName} onAmountChange={setAmount} onBillingCycleChange={setBillingCycle}
        onUsageTypeChange={setUsageType} onAccountingCategoryChange={setAccountingCategory} onSubmit={handleAdd}
      />
      <ReportPanel usageType={reportUsageType} from={reportFrom} to={reportTo} downloading={downloading}
        onUsageTypeChange={setReportUsageType} onFromChange={setReportFrom} onToChange={setReportTo} onDownload={handleDownload} />
      <SubscriptionTable subscriptions={subscriptions} onDelete={handleDelete} />
    </main>
  );
}
