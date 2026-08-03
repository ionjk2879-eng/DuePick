import { useState, type FormEvent } from 'react';
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
    <>
      <header className="page-header"><div><p className="eyebrow">MANUAL ANALYSIS</p><h1 className="page-title">제안 직접 분석</h1><p className="page-description">메일이나 메신저로 받은 내용을 붙여넣으면 거래 조건, 일정, 확인할 위험을 구조화합니다.</p></div></header>
      <section className="card card-body"><div className="alert alert-info" style={{ marginTop: 0 }}>원문에 없는 조건은 임의로 채우지 않습니다. 분석 후 반드시 원문과 결과를 함께 확인해주세요.</div><ProposalEditor text={text} loading={loading} onTextChange={setText} onLoadExample={() => setText(example)} onSubmit={handleSubmit} /></section>
      {error && <div className="alert alert-error">{error}</div>}
      {result && <AnalysisResult result={result} saving={saving} saved={saved} onSave={handleSave} />}
    </>
  );
}
