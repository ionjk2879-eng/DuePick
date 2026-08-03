import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { fetchSummary, type Summary } from '../api/summary';

const PIE_COLORS = ['#2563eb', '#d1d5db']; // 업무용 / 개인용
const BAR_COLOR = '#2563eb';

export default function ChartsSection() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary()
      .then(setSummary)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#999' }}>차트 불러오는 중...</p>;
  if (!summary) return null;

  const pieData = [
    { name: '업무용', value: summary.businessMonthlyTotal },
    { name: '개인용', value: summary.personalMonthlyTotal },
  ];
  const hasPieData = summary.businessMonthlyTotal + summary.personalMonthlyTotal > 0;

  return (
    <div style={{ margin: '24px 0' }}>
      <h3 style={{ marginBottom: 4 }}>지출 요약 (월 환산 기준)</h3>
      <p style={{ fontSize: 13, color: '#777', marginTop: 0 }}>
        ※ 참고용 집계이며, 실제 필요경비 인정 범위는 세무사와 확인하세요.
      </p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* 업무용 vs 개인용 비율 */}
        <div style={{ flex: '1 1 260px', minWidth: 260, height: 240 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>업무용 / 개인용 비율</p>
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
            <p style={{ color: '#999', fontSize: 13 }}>등록된 구독이 없습니다.</p>
          )}
        </div>

        {/* 계정과목별 합계 */}
        <div style={{ flex: '1 1 320px', minWidth: 320, height: 240 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>업무용 계정과목별 합계</p>
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
            <p style={{ color: '#999', fontSize: 13 }}>업무용으로 분류된 구독이 없습니다.</p>
          )}
        </div>

        {/* 최근 6개월 등록 추이 */}
        <div style={{ flex: '1 1 320px', minWidth: 320, height: 240 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>최근 6개월 등록 추이</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => `${v}건`} />
              <Bar dataKey="count" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
