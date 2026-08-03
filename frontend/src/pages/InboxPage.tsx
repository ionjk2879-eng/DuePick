import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchInboxAddress, fetchInboxMessages, saveInboxMessage, updateInboxAnalysis, type InboxMessage } from '../api/inbox';
import type { ProposalAnalysis } from '../api/proposal';

export default function InboxPage() {
  const [address, setAddress] = useState('');
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ProposalAnalysis | null>(null);

  const load = async () => {
    try {
      const [nextAddress, nextMessages] = await Promise.all([fetchInboxAddress(), fetchInboxMessages()]);
      setAddress(nextAddress);
      setMessages(nextMessages);
    } catch {
      setError('받은 메일함을 불러오지 못했습니다.');
    }
  };

  useEffect(() => { void load(); }, []);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const saveAsDeal = async (id: number) => {
    setSavingId(id);
    setError(null);
    try {
      await saveInboxMessage(id);
      setMessages((items) => items.map((item) => item.id === id ? { ...item, status: 'SAVED' } : item));
    } catch {
      setError('거래 저장에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  const startEditing = (message: InboxMessage) => {
    setEditingId(message.id);
    setDraft({ ...message.analysis });
  };

  const updateDraft = <K extends keyof ProposalAnalysis>(key: K, value: ProposalAnalysis[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const saveDraft = async () => {
    if (editingId === null || !draft) return;
    setSavingId(editingId);
    setError(null);
    try {
      const updated = await updateInboxAnalysis(editingId, draft);
      setMessages((items) => items.map((item) => item.id === editingId ? { ...item, analysis: updated } : item));
      setEditingId(null);
      setDraft(null);
    } catch {
      setError('분석 초안 수정에 실패했습니다.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main style={{ maxWidth: 820, margin: '40px auto', padding: '0 20px', fontFamily: 'sans-serif', color: '#172033' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><strong>Duepick</strong><h1 style={{ marginTop: 6 }}>메일로 제안 받기</h1></div>
        <nav style={{ display: 'flex', gap: 12 }}><Link to="/deals">거래 목록</Link><Link to="/dashboard">대시보드</Link></nav>
      </header>

      <section style={{ padding: 20, border: '1px solid #d8dee9', borderRadius: 12, marginBottom: 24 }}>
        <p style={{ marginTop: 0 }}>협찬·외주 메일을 아래 주소로 전달하세요. 분석 결과는 자동 확정되지 않습니다.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={address} readOnly style={{ flex: 1, padding: 10 }} aria-label="내 Duepick 전달 주소" />
          <button onClick={copyAddress} disabled={!address}>{copied ? '복사됨' : '주소 복사'}</button>
          <button onClick={() => void load()}>새로고침</button>
        </div>
      </section>

      {error && <p style={{ color: '#b42318' }}>{error}</p>}
      {!messages.length && <p style={{ padding: 24, textAlign: 'center', border: '1px dashed #ccd3df', borderRadius: 10 }}>아직 도착한 메일이 없습니다.</p>}
      <div style={{ display: 'grid', gap: 14 }}>
        {messages.map((message) => (
          <article key={message.id} style={{ padding: 18, border: '1px solid #d8dee9', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong>{message.subject || '제목 없음'}</strong><span>{message.status === 'SAVED' ? '거래 저장됨' : '확인 필요'}</span>
            </div>
            <p style={{ color: '#667085', fontSize: 14 }}>보낸 사람: {message.sender || '-'}</p>
            {editingId === message.id && draft ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 14 }}>
                <label>거래처<input value={draft.client ?? ''} onChange={(event) => updateDraft('client', event.target.value || null)} /></label>
                <label>거래 유형<input value={draft.dealType ?? ''} onChange={(event) => updateDraft('dealType', event.target.value || null)} /></label>
                <label>금액<input type="number" min="0" value={draft.amount ?? ''} onChange={(event) => updateDraft('amount', event.target.value === '' ? null : Number(event.target.value))} /></label>
                <label>수정 횟수<input type="number" min="0" value={draft.revisionCount ?? ''} onChange={(event) => updateDraft('revisionCount', event.target.value === '' ? null : Number(event.target.value))} /></label>
                <label>초안 기한<input type="date" value={draft.draftDueDate ?? ''} onChange={(event) => updateDraft('draftDueDate', event.target.value || null)} /></label>
                <label>게시 기한<input type="date" value={draft.publishDueDate ?? ''} onChange={(event) => updateDraft('publishDueDate', event.target.value || null)} /></label>
                <label>2차 사용<input value={draft.secondaryUsage ?? ''} onChange={(event) => updateDraft('secondaryUsage', event.target.value || null)} /></label>
                <label>지급 조건<input value={draft.paymentCondition ?? ''} onChange={(event) => updateDraft('paymentCondition', event.target.value || null)} /></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => void saveDraft()} disabled={savingId === message.id}>수정 저장</button>
                  <button onClick={() => { setEditingId(null); setDraft(null); }}>취소</button>
                </div>
              </div>
            ) : (
              <>
                <p>거래처: {message.analysis.client || '확인 필요'} · 금액: {message.analysis.amount?.toLocaleString() ?? '확인 필요'}원</p>
                {!!message.analysis.risks.length && <p style={{ color: '#b54708' }}>확인 항목: {message.analysis.risks.join(' · ')}</p>}
              </>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => startEditing(message)} disabled={message.status === 'SAVED' || editingId === message.id}>분석 수정</button>
              <button onClick={() => void saveAsDeal(message.id)} disabled={message.status === 'SAVED' || savingId === message.id || editingId === message.id}>
                {message.status === 'SAVED' ? '거래 저장됨' : savingId === message.id ? '저장 중…' : '이 분석으로 거래 저장'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
