import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { previewProposal, type ProposalAnalysis } from '../api/proposal';
import ProposalEditor from '../components/proposal/ProposalEditor';
import AnalysisResult from '../components/proposal/AnalysisResult';
import { createDeal } from '../api/deals';

const example = `모바일 웹 화면 개발 외주를 제안드립니다.
브랜드: A 브랜드
8월 20일까지 유튜브 영상 1건과 쇼츠 2건 부탁드립니다.
초안은 8월 14일까지 전달 부탁드리며, 2차 활용은 3개월입니다.
비용은 원천세 포함 150만원이고 게시 후 익월 말 지급입니다.`;

export default function ProposalPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ProposalAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      setResult(await previewProposal(text));
    } catch (err) {
      setResult(null);
      setError(isAxiosError(err) ? err.response?.data?.message ?? '분석에 실패했습니다.' : '분석에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try { await createDeal(result, text); setSaved(true); }
    catch { setError('거래 저장에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  return (
    <main style={{ maxWidth: 820, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif', color: '#172033' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>외주 제안 분석</h1>
          <p style={{ marginTop: 0, color: '#667085' }}>협찬·외주 메일을 붙여넣으면 거래 조건과 해야 할 일을 한눈에 정리합니다.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}><Link to="/deals">거래 목록</Link><Link to="/dashboard">비용 대시보드</Link></div>
      </div>

      <ProposalEditor text={text} loading={loading} onTextChange={setText} onLoadExample={() => setText(example)} onSubmit={handleSubmit} />

      {error && <p style={{ color: '#b42318', background: '#fef3f2', padding: 12, borderRadius: 8 }}>{error}</p>}
      {result && <AnalysisResult result={result} saving={saving} saved={saved} onSave={handleSave} />}
    </main>
  );
}
