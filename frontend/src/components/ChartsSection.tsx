import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { fetchSummary, type Summary } from '../api/summary';

const PIE_COLORS = ['#5b5ce2', '#dfe2ea'];
const BAR_COLOR = '#5b5ce2';

export default function ChartsSection() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card card-body helper">차트를 불러오는 중입니다…</div>;
  if (!summary) return null;

  const pieData = [
    { name: '업무용', value: summary.businessMonthlyTotal },
    { name: '개인용', value: summary.personalMonthlyTotal },
  ];
  const hasPieData = summary.businessMonthlyTotal + summary.personalMonthlyTotal > 0;

  return (
    <section><div className="page-header" style={{ margin: '26px 0 14px' }}><div><h2 className="card-title">월 지출 요약</h2><p className="card-copy">월 환산 기준의 참고용 집계입니다.</p></div></div>
      <div className="chart-grid">
        {/* 업무용 vs 개인용 비율 */}
        <div className="card chart-card"><p className="chart-title">업무용 / 개인용</p>
          {hasPieData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="helper">등록된 구독이 없습니다.</p>
          )}
        </div>

        {/* 계정과목별 합계 */}
        <div className="card chart-card"><p className="chart-title">업무용 계정과목별 합계</p>
          {summary.byAccountingCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.byAccountingCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()}원`} />
                <Bar dataKey="monthlyTotal" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="helper">업무용으로 분류된 구독이 없습니다.</p>
          )}
        </div>

        {/* 최근 6개월 등록 추이 */}
        <div className="card chart-card chart-card-wide"><p className="chart-title">최근 6개월 등록 추이</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => `${v}건`} />
              <Bar dataKey="count" fill="#a4a5ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
