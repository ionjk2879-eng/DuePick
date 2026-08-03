import type { FormEvent } from 'react';

interface ProposalEditorProps {
  text: string;
  loading: boolean;
  onTextChange: (text: string) => void;
  onLoadExample: () => void;
  onSubmit: (event: FormEvent) => void;
}

export default function ProposalEditor({ text, loading, onTextChange, onLoadExample, onSubmit }: ProposalEditorProps) {
  return (
    <form onSubmit={onSubmit}>
      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder="이곳에 이메일, 메신저 또는 문서의 외주 제안 내용을 붙여넣으세요."
        maxLength={20000}
        required
        style={{ width: '100%', minHeight: 260, boxSizing: 'border-box', padding: 16, border: '1px solid #ccd3df', borderRadius: 10, resize: 'vertical', font: 'inherit', lineHeight: 1.6 }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <button type="button" onClick={onLoadExample}>예시 불러오기</button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#667085' }}>{text.length.toLocaleString()} / 20,000자</span>
          <button type="submit" disabled={loading || !text.trim()}>{loading ? '분석 중…' : '분석 미리보기'}</button>
        </div>
      </div>
    </form>
  );
}
