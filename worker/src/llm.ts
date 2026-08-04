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
  return ['deliverables', 'tasks', 'risks', 'paymentTerms', 'matchedRules', 'warnings']
    .every((key) => Array.isArray(row[key]));
}

export async function analyzeWithAdapter(raw: string, env: Env): Promise<ProposalAnalysis> {
  const fallback = analyzeProposal(raw);
  if (!env.ANTHROPIC_API_KEY) return fallback;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: '한국어 협찬·외주 제안 메일에서 명시된 정보만 추출하세요. 추측하지 말고, 누락되거나 모호한 조건은 risks와 warnings에 확인 필요 사유를 기록하세요. 날짜는 확인 가능한 경우 YYYY-MM-DD로 작성하세요.',
        messages: [{ role: 'user', content: raw }],
        output_config: { format: { type: 'json_schema', schema: proposalSchema } },
      }),
    });

    if (!response.ok) throw new Error(`Claude 응답 오류 (${response.status})`);
    const data = await response.json<{ content?: Array<{ type?: string; text?: string }> }>();
    const outputText = data.content?.find((item) => item.type === 'text')?.text;
    const parsed: unknown = outputText ? JSON.parse(outputText) : null;
    if (!isAnalysis(parsed)) throw new Error('Claude 구조화 결과 검증 실패');
    return parsed;
  } catch {
    return {
      ...fallback,
      warnings: [...fallback.warnings, 'AI 분석을 사용할 수 없어 규칙 기반 결과를 표시합니다.'],
    };
  }
}
