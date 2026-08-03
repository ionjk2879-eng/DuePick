import type { ProposalAnalysis } from '../../api/proposal';

interface AnalysisResultProps {
  result: ProposalAnalysis;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

export default function AnalysisResult({ result, saving, saved, onSave }: AnalysisResultProps) {
  return (
    <section aria-live="polite" style={{ marginTop: 28, border: '1px solid #d8dee9', borderRadius: 12, padding: 22 }}>
      <h2 style={{ marginTop: 0 }}>분석 결과</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <ResultItem label="거래처" value={result.client ?? '확인 필요'} />
        <ResultItem label="제안 유형" value={result.dealType ?? '확인 필요'} />
        <ResultItem label="제안 금액" value={result.amount == null ? '찾지 못함' : `${result.amount.toLocaleString()}원`} />
        <ResultItem label="초안 납기" value={result.draftDueDate ?? '확인 필요'} />
        <ResultItem label="게시 납기" value={result.publishDueDate ?? '확인 필요'} />
        <ResultItem label="수정 횟수" value={result.revisionCount == null ? '명시되지 않음' : `${result.revisionCount}회`} />
        <ResultItem label="2차 활용" value={result.secondaryUsage ?? '명시되지 않음'} />
      </div>
      <DetailList title="작업 범위" values={result.deliverables} empty="작업물을 찾지 못함" />
      <h3>지급 조건</h3><p>{result.paymentCondition ?? '찾지 못함'}</p>
      <DetailList title="해야 할 일" values={result.tasks} empty="자동 생성된 할 일이 없음" ordered />
      {result.risks.length > 0 && <DetailList title="계약 조건 확인" values={result.risks} empty="" warning />}
      <p style={{ color: '#667085', fontSize: 14 }}>적용 규칙: {result.matchedRules.join(', ') || '없음'}</p>
      {result.warnings.length > 0 && (
        <div style={{ background: '#fffaeb', color: '#7a2e0e', padding: '10px 14px', borderRadius: 8 }}>
          {result.warnings.map((warning) => <div key={warning}>확인 필요: {warning}</div>)}
        </div>
      )}
      <p style={{ marginBottom: 0, fontSize: 13, color: '#667085' }}>규칙 기반 미리보기이므로 계약 전 원문을 반드시 다시 확인하세요.</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button onClick={onSave} disabled={saving || saved}>{saved ? '거래로 저장됨' : saving ? '저장 중…' : '확인 후 거래로 저장'}</button>
      </div>
    </section>
  );
}

function DetailList({ title, values, empty, ordered = false, warning = false }: { title: string; values: string[]; empty: string; ordered?: boolean; warning?: boolean }) {
  const List = ordered ? 'ol' : 'ul';
  return (
    <div style={warning ? { background: '#fffaeb', color: '#7a2e0e', padding: '8px 14px', borderRadius: 8, marginTop: 16 } : undefined}>
      <h3>{title}</h3>
      {values.length ? <List>{values.map((value) => <li key={value}>{value}</li>)}</List> : <p>{empty}</p>}
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return <div style={{ background: '#f7f9fc', borderRadius: 8, padding: 14 }}><div style={{ fontSize: 13, color: '#667085' }}>{label}</div><strong>{value}</strong></div>;
}
