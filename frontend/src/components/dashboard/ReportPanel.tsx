import type { UsageType } from '../../types';

interface ReportPanelProps {
  usageType: UsageType | ''; from: string; to: string; downloading: 'csv' | 'pdf' | null;
  onUsageTypeChange: (value: UsageType | '') => void; onFromChange: (value: string) => void;
  onToChange: (value: string) => void; onDownload: (format: 'csv' | 'pdf') => void;
}

export default function ReportPanel(props: ReportPanelProps) {
  return (
    <section className="card card-body" style={{ marginTop: 20 }}>
      <div className="card-header" style={{ padding: 0, marginBottom: 16 }}><div><h3 className="card-title">리포트 다운로드</h3><p className="card-copy">기간과 용도를 선택해 비용 데이터를 내려받으세요.</p></div></div>
      <div className="report-grid">
        <label className="field"><span className="field-label">구분</span><select value={props.usageType} onChange={(e) => props.onUsageTypeChange(e.target.value as UsageType | '')}><option value="">전체</option><option value="BUSINESS">업무용만</option><option value="PERSONAL">개인용만</option></select></label>
        <label className="field"><span className="field-label">시작일</span><input type="date" value={props.from} onChange={(e) => props.onFromChange(e.target.value)} /></label>
        <label className="field"><span className="field-label">종료일</span><input type="date" value={props.to} onChange={(e) => props.onToChange(e.target.value)} /></label>
        <div className="action-row" style={{ alignSelf: 'end' }}><button className="btn btn-primary" onClick={() => props.onDownload('csv')} disabled={props.downloading !== null}>{props.downloading === 'csv' ? '생성 중…' : 'CSV'}</button><button className="btn btn-secondary" onClick={() => props.onDownload('pdf')} disabled={props.downloading !== null}>{props.downloading === 'pdf' ? '생성 중…' : 'PDF'}</button></div>
      </div>
      <p className="helper" style={{ marginTop: 12 }}>일반 정보 제공용이며 필요경비 인정 여부는 세무사와 최종 확인하세요.</p>
    </section>
  );
}
