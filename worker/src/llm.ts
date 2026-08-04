import { analyzeProposal, type ProposalAnalysis } from './analyze';
import type { Env } from './types';

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const nullableNumber = { anyOf: [{ type: 'number' }, { type: 'null' }] };
const stringArray = { type: 'array', items: { type: 'string' } };

const proposalSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    client: nullableString, dealType: nullableString, amount: nullableNumber, currency: nullableString,
    deliverables: stringArray, draftDueDate: nullableString, publishDueDate: nullableString,
    revisionCount: nullableNumber, secondaryUsage: nullableString, paymentCondition: nullableString,
    tasks: stringArray, risks: stringArray, startDate: nullableString, endDate: nullableString,
    paymentTerms: stringArray, matchedRules: stringArray, warnings: stringArray,
  },
  required: ['client', 'dealType', 'amount', 'currency', 'deliverables', 'draftDueDate', 'publishDueDate',
    'revisionCount', 'secondaryUsage', 'paymentCondition', 'tasks', 'risks', 'startDate', 'endDate',
    'paymentTerms', 'matchedRules', 'warnings'],
};

function isAnalysis(value: unknown): value is ProposalAnalysis {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return ['deliverables', 'tasks', 'risks', 'paymentTerms', 'matchedRules', 'warnings'].every((key) => Array.isArray(row[key]));
}

export async function analyzeWithAdapter(raw: string, env: Env): Promise<ProposalAnalysis> {
  const fallback = analyzeProposal(raw);
  if (!env.OPENAI_API_KEY) return fallback;
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-5.6-sol',
        input: [
          { role: 'developer', content: '한국어 협찬·외주 제안문을 구조화한다. 원문에 없는 계약 조건은 추측하지 말고 null 또는 빈 배열로 두며 risks와 warnings에 확인 필요 사유를 기록한다. 날짜는 확인 가능한 경우 YYYY-MM-DD로 쓴다.' },
          { role: 'user', content: raw },
        ],
        text: { format: { type: 'json_schema', name: 'proposal_analysis', strict: true, schema: proposalSchema } },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI 응답 오류 (${response.status})`);
    const data = await response.json<{ output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }>();
    const outputText = data.output_text ?? data.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    const parsed: unknown = outputText ? JSON.parse(outputText) : null;
    if (!isAnalysis(parsed)) throw new Error('OpenAI 구조화 결과 검증 실패');
    return parsed;
  } catch {
    return { ...fallback, warnings: [...fallback.warnings, 'AI 분석을 사용할 수 없어 규칙 기반 결과를 표시합니다.'] };
  }
}
