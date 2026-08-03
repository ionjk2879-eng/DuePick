import type { UsageType } from '../../types';

interface ReportPanelProps {
  usageType: UsageType | ''; from: string; to: string; downloading: 'csv' | 'pdf' | null;
  onUsageTypeChange: (value: UsageType | '') => void; onFromChange: (value: string) => void;
  onToChange: (value: string) => void; onDownload: (format: 'csv' | 'pdf') => void;
}

export default function ReportPanel(props: ReportPanelProps) {
  return (
    <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, margin: '20px 0' }}>
      <h3 style={{ marginTop: 0 }}>리포트 다운로드</h3>
      <p style={{ fontSize: 13, color: '#777', marginTop: -8 }}>※ 일반 정보 제공용 리포트입니다. 필요경비 인정 여부는 세무사와 최종 확인하세요.</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={props.usageType} onChange={(e) => props.onUsageTypeChange(e.target.value as UsageType | '')}><option value="">전체</option><option value="BUSINESS">업무용만</option><option value="PERSONAL">개인용만</option></select>
        <input type="date" value={props.from} onChange={(e) => props.onFromChange(e.target.value)} /><span>~</span>
        <input type="date" value={props.to} onChange={(e) => props.onToChange(e.target.value)} />
        <button onClick={() => props.onDownload('csv')} disabled={props.downloading !== null}>{props.downloading === 'csv' ? '생성 중...' : 'CSV 다운로드'}</button>
        <button onClick={() => props.onDownload('pdf')} disabled={props.downloading !== null}>{props.downloading === 'pdf' ? '생성 중...' : 'PDF 다운로드'}</button>
      </div>
    </section>
  );
}
