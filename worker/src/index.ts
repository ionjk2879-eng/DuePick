import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { analyzeProposal, type ProposalAnalysis } from './analyze';
import { body, dealResponse, getUser, subscriptionResponse, type AppContext } from './helpers';
import { createToken, hashPassword, randomToken, verifyPassword, verifyToken } from './security';
import type { Env, UserRow, Variables } from './types';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
const encoder = new TextEncoder();

app.use('*', async (c, next) => cors({
  origin: c.env.APP_ORIGIN.split(',').map((value) => value.trim()),
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Disposition'],
})(c, next));

app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth/') || c.req.path === '/api/webhooks/resend' || c.req.method === 'OPTIONS') return next();
  const authorization = c.req.header('Authorization');
  const userId = authorization?.startsWith('Bearer ') ? await verifyToken(authorization.slice(7), c.env.JWT_SECRET) : null;
  if (!userId) return c.json({ message: '로그인이 필요합니다.' }, 401);
  const user = await c.env.DB.prepare('SELECT id, email, nickname, inbox_token FROM users WHERE id = ?').bind(userId).first<UserRow>();
  if (!user) return c.json({ message: '사용자를 찾을 수 없습니다.' }, 401);
  c.set('user', user);
  return next();
});

app.onError((error, c) => {
  console.error(error);
  const message = error instanceof Error ? error.message : '요청을 처리하지 못했습니다.';
  return c.json({ message }, message.includes('찾을 수') ? 404 : 400);
});

app.get('/api/health', (c) => c.json({ status: 'ok', runtime: 'cloudflare-workers' }));

app.post('/api/auth/signup', async (c) => {
  const input = await body<{ email?: string; password?: string; nickname?: string }>(c as AppContext);
  const email = input.email?.trim().toLowerCase();
  const nickname = input.nickname?.trim();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return c.json({ message: '올바른 이메일을 입력해주세요.' }, 400);
  if (!input.password || input.password.length < 8) return c.json({ message: '비밀번호는 8자 이상이어야 합니다.' }, 400);
  if (!nickname) return c.json({ message: '닉네임을 입력해주세요.' }, 400);
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ message: '이미 가입된 이메일입니다.' }, 409);
  const result = await c.env.DB.prepare(
    'INSERT INTO users (email, password_hash, nickname, inbox_token) VALUES (?, ?, ?, ?)'
  ).bind(email, await hashPassword(input.password), nickname, randomToken()).run();
  const userId = Number(result.meta.last_row_id);
  await c.env.DB.prepare('INSERT INTO user_plans (user_id) VALUES (?)').bind(userId).run();
  return c.json({ accessToken: await createToken(userId, c.env.JWT_SECRET), nickname });
});

app.post('/api/auth/login', async (c) => {
  const input = await body<{ email?: string; password?: string }>(c as AppContext);
  const row = await c.env.DB.prepare(
    'SELECT id, nickname, password_hash FROM users WHERE email = ?'
  ).bind(input.email?.trim().toLowerCase()).first<{ id: number; nickname: string; password_hash: string }>();
  if (!row || !input.password || !await verifyPassword(input.password, row.password_hash)) {
    return c.json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, 400);
  }
  return c.json({ accessToken: await createToken(row.id, c.env.JWT_SECRET), nickname: row.nickname });
});

app.get('/api/subscriptions', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC').bind(getUser(c as AppContext).id).all();
  return c.json(rows.results.map(subscriptionResponse));
});

app.post('/api/subscriptions', async (c) => saveSubscription(c as AppContext));
app.put('/api/subscriptions/:id', async (c) => saveSubscription(c as AppContext, Number(c.req.param('id'))));

app.delete('/api/subscriptions/:id', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?')
    .bind(Number(c.req.param('id')), getUser(c as AppContext).id).run();
  if (!result.meta.changes) return c.json({ message: '구독 정보를 찾을 수 없습니다.' }, 404);
  return c.body(null, 204);
});

app.get('/api/subscriptions/summary', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ?').bind(getUser(c as AppContext).id).all()).results as Record<string, unknown>[];
  const monthly = (row: Record<string, unknown>) => Math.round(Number(row.amount) / (row.billing_cycle === 'YEARLY' ? 12 : 1));
  const total = (usage: string) => rows.filter((row) => row.usage_type === usage).reduce((sum, row) => sum + monthly(row), 0);
  const categories = new Map<string, number>();
  rows.filter((row) => row.usage_type === 'BUSINESS').forEach((row) => {
    const category = String(row.accounting_category || '미분류');
    categories.set(category, (categories.get(category) ?? 0) + monthly(row));
  });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + offset, 1));
    return date.toISOString().slice(0, 7);
  });
  return c.json({ businessMonthlyTotal: total('BUSINESS'), personalMonthlyTotal: total('PERSONAL'),
    byAccountingCategory: [...categories].map(([category, monthlyTotal]) => ({ category, monthlyTotal })).sort((a, b) => b.monthlyTotal - a.monthlyTotal),
    registrationTrend: months.map((month) => ({ month, count: rows.filter((row) => String(row.created_at).startsWith(month)).length })) });
});

app.get('/api/subscriptions/suggest', (c) => {
  const name = (c.req.query('serviceName') ?? '').toLowerCase();
  const dictionary: Array<[string, string, string]> = [
    ['notion', 'BUSINESS', '지급수수료'], ['노션', 'BUSINESS', '지급수수료'], ['canva', 'BUSINESS', '광고선전비'],
    ['adobe', 'BUSINESS', '지급수수료'], ['chatgpt', 'BUSINESS', '지급수수료'], ['netflix', 'PERSONAL', '개인사용'],
  ];
  const found = dictionary.filter(([keyword]) => name.includes(keyword)).sort((a, b) => b[0].length - a[0].length)[0];
  return c.json(found ? { matched: true, suggestedUsageType: found[1], suggestedAccountingCategory: found[2], note: '일반적인 분류 사례를 참고해 추천했습니다. 실제 용도에 맞게 최종 확인해주세요.' }
    : { matched: false, suggestedUsageType: null, suggestedAccountingCategory: null, note: '등록된 사전에 없는 서비스입니다. 업무용·개인용 여부를 직접 선택해주세요.' });
});

app.post('/api/proposals/preview', async (c) => {
  const input = await body<{ text?: string }>(c as AppContext);
  if (!input.text?.trim()) return c.json({ message: '제안 내용을 입력해주세요.' }, 400);
  if (input.text.length > 20_000) return c.json({ message: '제안 내용은 20,000자 이하여야 합니다.' }, 400);
  return c.json(analyzeProposal(input.text));
});

app.get('/api/deals', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM deals WHERE user_id = ? ORDER BY created_at DESC').bind(getUser(c as AppContext).id).all();
  return c.json(rows.results.map((row) => dealResponse(row as Record<string, unknown>)));
});

app.post('/api/deals', async (c) => {
  const input = await body<Record<string, unknown>>(c as AppContext);
  if (!String(input.rawText ?? '').trim()) return c.json({ message: '원문이 필요합니다.' }, 400);
  const result = await c.env.DB.prepare(`INSERT INTO deals
    (user_id, client, deal_type, amount, deliverables, draft_due_date, publish_due_date, revision_count,
     secondary_usage, payment_condition, tasks, risks, raw_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(getUser(c as AppContext).id, input.client ?? null, input.dealType ?? null, input.amount ?? null,
      JSON.stringify(input.deliverables ?? []), input.draftDueDate ?? null, input.publishDueDate ?? null,
      input.revisionCount ?? null, input.secondaryUsage ?? null, input.paymentCondition ?? null,
      JSON.stringify(input.tasks ?? []), JSON.stringify(input.risks ?? []), input.rawText).run();
  const row = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(result.meta.last_row_id).first<Record<string, unknown>>();
  return c.json(dealResponse(row!), 201);
});

app.patch('/api/deals/:id/status', async (c) => {
  const input = await body<{ status?: string }>(c as AppContext);
  if (!['REVIEW', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'PAID'].includes(input.status ?? '')) return c.json({ message: '올바르지 않은 거래 상태입니다.' }, 400);
  const result = await c.env.DB.prepare("UPDATE deals SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?")
    .bind(input.status, Number(c.req.param('id')), getUser(c as AppContext).id).run();
  if (!result.meta.changes) return c.json({ message: '거래를 찾을 수 없습니다.' }, 404);
  const row = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(Number(c.req.param('id'))).first<Record<string, unknown>>();
  return c.json(dealResponse(row!));
});

app.delete('/api/deals/:id', async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM deals WHERE id = ? AND user_id = ?').bind(Number(c.req.param('id')), getUser(c as AppContext).id).run();
  if (!result.meta.changes) return c.json({ message: '거래를 찾을 수 없습니다.' }, 404);
  return c.body(null, 204);
});

app.get('/api/plans/me', async (c) => {
  const plan = await c.env.DB.prepare('SELECT plan_type, expires_at FROM user_plans WHERE user_id = ?').bind(getUser(c as AppContext).id).first<{ plan_type: string; expires_at: string | null }>();
  const isPro = plan?.plan_type === 'PRO' && (!plan.expires_at || new Date(plan.expires_at) > new Date());
  return c.json({ planType: isPro ? 'PRO' : 'FREE', isPro, expiresAt: plan?.expires_at ?? null });
});

app.post('/api/plans/upgrade', async (c) => {
  const expires = new Date(); expires.setUTCMonth(expires.getUTCMonth() + 1);
  await c.env.DB.prepare("INSERT INTO user_plans (user_id, plan_type, expires_at) VALUES (?, 'PRO', ?) ON CONFLICT(user_id) DO UPDATE SET plan_type = 'PRO', expires_at = excluded.expires_at, updated_at = CURRENT_TIMESTAMP")
    .bind(getUser(c as AppContext).id, expires.toISOString()).run();
  return c.json({ planType: 'PRO', isPro: true, expiresAt: expires.toISOString() });
});

app.get('/api/inbox', async (c) => c.json({ address: `inbox-${getUser(c as AppContext).inbox_token}@${c.env.RESEND_RECEIVING_DOMAIN}` }));

app.get('/api/inbox/messages', async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, sender, recipient, subject, analysis, status, created_at FROM inbound_emails WHERE user_id = ? ORDER BY created_at DESC')
    .bind(getUser(c as AppContext).id).all();
  return c.json(rows.results.map((row) => ({ id: row.id, sender: row.sender, recipient: row.recipient,
    subject: row.subject, analysis: JSON.parse(String(row.analysis)), status: row.status, createdAt: row.created_at })));
});

app.post('/api/inbox/messages/:id/save', async (c) => {
  const user = getUser(c as AppContext);
  const message = await c.env.DB.prepare(
    'SELECT id, resend_email_id, text_body, analysis, status FROM inbound_emails WHERE id = ? AND user_id = ?'
  ).bind(Number(c.req.param('id')), user.id).first<{ id: number; resend_email_id: string; text_body: string; analysis: string; status: string }>();
  if (!message) return c.json({ message: '수신 메일을 찾을 수 없습니다.' }, 404);
  const existing = await c.env.DB.prepare('SELECT * FROM deals WHERE source_email_id = ? AND user_id = ?')
    .bind(message.resend_email_id, user.id).first<Record<string, unknown>>();
  if (existing) return c.json(dealResponse(existing));
  const analysis = JSON.parse(message.analysis) as ProposalAnalysis;
  const insert = await c.env.DB.prepare(`INSERT INTO deals
    (user_id, client, deal_type, amount, deliverables, draft_due_date, publish_due_date, revision_count,
     secondary_usage, payment_condition, tasks, risks, raw_text, source_email_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(user.id, analysis.client, analysis.dealType, analysis.amount, JSON.stringify(analysis.deliverables),
      analysis.draftDueDate, analysis.publishDueDate, analysis.revisionCount, analysis.secondaryUsage,
      analysis.paymentCondition, JSON.stringify(analysis.tasks), JSON.stringify(analysis.risks),
      message.text_body, message.resend_email_id);
  const update = c.env.DB.prepare("UPDATE inbound_emails SET status = 'SAVED' WHERE id = ? AND user_id = ?")
    .bind(message.id, user.id);
  const [created] = await c.env.DB.batch([insert, update]);
  const row = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(created.meta.last_row_id).first<Record<string, unknown>>();
  return c.json(dealResponse(row!), 201);
});

app.post('/api/webhooks/resend', async (c) => {
  if (!c.env.RESEND_WEBHOOK_SECRET || !c.env.RESEND_API_KEY) return c.json({ message: 'Resend 환경변수가 설정되지 않았습니다.' }, 503);
  const payload = await c.req.text();
  if (!await verifyWebhook(payload, c.req.raw.headers, c.env.RESEND_WEBHOOK_SECRET)) return c.json({ message: '서명이 올바르지 않습니다.' }, 400);
  const event = JSON.parse(payload) as { type: string; data: { email_id: string; from?: string; to?: string[]; subject?: string } };
  if (event.type !== 'email.received') return c.json({ received: true });
  const svixId = c.req.header('svix-id')!;
  const duplicate = await c.env.DB.prepare('SELECT id FROM inbound_emails WHERE svix_id = ? OR resend_email_id = ?').bind(svixId, event.data.email_id).first();
  if (duplicate) return c.json({ received: true, duplicate: true });
  const recipient = event.data.to?.find((value) => value.toLowerCase().endsWith(`@${c.env.RESEND_RECEIVING_DOMAIN.toLowerCase()}`));
  const token = recipient?.split('@')[0].replace(/^inbox-/, '');
  const user = token ? await c.env.DB.prepare('SELECT id FROM users WHERE inbox_token = ?').bind(token).first<{ id: number }>() : null;
  if (!user || !recipient) return c.json({ received: true, ignored: 'unknown_recipient' });
  const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(event.data.email_id)}`, {
    headers: { Authorization: `Bearer ${c.env.RESEND_API_KEY}`, 'User-Agent': 'duepick-worker/1.0' },
  });
  if (!response.ok) throw new Error(`Resend 본문 조회 실패 (${response.status})`);
  const email = await response.json<{ text?: string | null; html?: string | null; from?: string; subject?: string }>();
  const text = email.text?.trim() || stripHtml(email.html ?? '');
  const analysis = analyzeProposal(text);
  await c.env.DB.prepare(`INSERT INTO inbound_emails
    (user_id, resend_email_id, svix_id, sender, recipient, subject, text_body, analysis)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(user.id, event.data.email_id, svixId, email.from ?? event.data.from ?? null, recipient,
      email.subject ?? event.data.subject ?? null, text, JSON.stringify(analysis)).run();
  return c.json({ received: true });
});

app.get('/api/reports/subscriptions/csv', async (c) => {
  const rows = (await c.env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC').bind(getUser(c as AppContext).id).all()).results as Record<string, unknown>[];
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = ['서비스명,금액,결제주기,사용구분,계정과목,등록일', ...rows.map((row) => [row.service_name, row.amount, row.billing_cycle, row.usage_type, row.accounting_category, row.created_at].map(escape).join(','))].join('\r\n');
  return new Response(`\uFEFF${csv}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="subscriptions-report.csv"' } });
});

app.get('/api/reports/subscriptions/pdf', (c) => c.json({ message: 'PDF 보고서는 Cloudflare 전환 후 다시 제공할 예정입니다. CSV를 이용해주세요.' }, 501));

async function saveSubscription(c: AppContext, id?: number) {
  const input = await body<{ serviceName?: string; amount?: number; billingCycle?: string; usageType?: string; accountingCategory?: string }>(c);
  if (!input.serviceName?.trim() || !Number.isFinite(input.amount) || Number(input.amount) < 0) return c.json({ message: '서비스명과 올바른 금액을 입력해주세요.' }, 400);
  if (!['MONTHLY', 'YEARLY'].includes(input.billingCycle ?? '') || !['BUSINESS', 'PERSONAL'].includes(input.usageType ?? '')) return c.json({ message: '결제 주기 또는 사용 구분이 올바르지 않습니다.' }, 400);
  if (id) {
    const result = await c.env.DB.prepare(`UPDATE subscriptions SET service_name = ?, amount = ?, billing_cycle = ?, usage_type = ?, accounting_category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`)
      .bind(input.serviceName.trim(), input.amount, input.billingCycle, input.usageType, input.accountingCategory?.trim() || null, id, getUser(c).id).run();
    if (!result.meta.changes) return c.json({ message: '구독 정보를 찾을 수 없습니다.' }, 404);
  } else {
    const result = await c.env.DB.prepare('INSERT INTO subscriptions (user_id, service_name, amount, billing_cycle, usage_type, accounting_category) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(getUser(c).id, input.serviceName.trim(), input.amount, input.billingCycle, input.usageType, input.accountingCategory?.trim() || null).run();
    id = Number(result.meta.last_row_id);
  }
  const row = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(id).first<Record<string, unknown>>();
  return c.json(subscriptionResponse(row!));
}

function stripHtml(html: string): string {
  return html.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

async function verifyWebhook(payload: string, headers: Headers, secret: string): Promise<boolean> {
  const id = headers.get('svix-id');
  const timestamp = headers.get('svix-timestamp');
  const signatures = headers.get('svix-signature');
  if (!id || !timestamp || !signatures || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  try {
    const secretBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (char) => char.charCodeAt(0));
    const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${id}.${timestamp}.${payload}`)));
    let binary = ''; for (const byte of signed) binary += String.fromCharCode(byte);
    const expected = btoa(binary);
    return signatures.split(' ').some((item) => item.replace(/^v1,/, '') === expected);
  } catch { return false; }
}

export default app;
