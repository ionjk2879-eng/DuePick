# Duepick

프리랜서·크리에이터·1인 사업자의 **제안 → 계약 → 작업 → 입금 → 비용 → 실제 수익**을 한곳에서 관리하는 프로젝트입니다.

> 제안부터 입금까지, 놓치지 않게.

## 제품 구조

- 수입·업무: 협찬/외주 메일에서 거래처, 금액, 작업물, 납기, 수정 횟수, 게시 및 지급 조건을 구조화
- 지출: 업무용/개인용 구독 비용, 월 환산 금액, 계정과목과 리포트 관리
- 통합 흐름: 제안 분석 결과를 사용자가 확인한 뒤 저장하고, 이후 작업 일정·입금 상태·비용을 연결

현재 단계는 메일 원문 직접 붙여넣기와 사용자별 Resend 전달 주소를 제공하는 안전한 MVP입니다. Gmail 전체 읽기 권한은 사용하지 않습니다.

## 1단계 기능

- 별도 설치 없이 사용하는 H2 로컬 파일 DB
- 협찬·외주 원문 붙여넣기 화면
- 외부 AI/API 비용이 없는 규칙 기반 거래처·금액·작업물·날짜·지급 조건 분석
- 계약 조건 누락 위험과 작업 체크리스트 생성
- 인증 사용자용 `POST /api/proposals/preview` 분석 미리보기 API
- 구독 CRUD, 분류 추천, 통계 차트, CSV/PDF 보고서

분석 결과는 계약 또는 세무 자문이 아닌 미리보기입니다. 계약 전 원문을 다시 확인하세요.

## 2단계 기능

- 분석 결과를 사용자 확인 후 협찬·외주 거래로 저장
- 사용자별 거래 목록과 원문·작업물·체크리스트·위험 항목 보관
- `확인 필요 → 확정 → 진행 중 → 작업 완료 → 입금 완료` 상태 관리
- 거래 삭제 및 확정 거래 금액 합계

| Method | URL | 설명 |
| --- | --- | --- |
| `GET` | `/api/deals` | 내 거래 목록 |
| `POST` | `/api/deals` | 확인한 분석 결과 저장 |
| `PATCH` | `/api/deals/{id}/status` | 거래 상태 변경 |
| `DELETE` | `/api/deals/{id}` | 거래 삭제 |

## 실행

요구 사항: Node.js 20 이상. 운영 런타임은 Cloudflare Workers, 데이터베이스는 D1입니다. 기존 Spring Boot 코드는 전환 검증과 데이터 참고를 위해 `backend/`에 보존되어 있습니다.

최초 한 번:

```bash
cd frontend
npm install
cd ../worker
npm install
Copy-Item .dev.vars.example .dev.vars
npm run db:local
```

프론트엔드 개발 서버:

```bash
cd frontend
npm install
npm run dev
```

Worker API와 정적 화면을 함께 실행:

```bash
cd worker
npm run build:frontend
npm run dev
```

Worker 단독 개발 시 프론트의 `frontend/.env.local`에 `VITE_API_BASE_URL=http://localhost:8787/api`를 설정합니다.

## 환경변수

예시는 [worker/.dev.vars.example](worker/.dev.vars.example)에 있습니다. 로컬 비밀값은 Git에서 제외되는 `worker/.dev.vars`에 넣고, 운영 비밀값은 `wrangler secret put`으로 등록합니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `JWT_SECRET` | 없음 | 운영 환경에서는 32자 이상의 임의 값 필수 |
| `RESEND_API_KEY` | 없음 | 수신 메일 본문 조회용 API 키 |
| `RESEND_WEBHOOK_SECRET` | 없음 | Resend 웹훅 서명 검증 키 |
| `RESEND_RECEIVING_DOMAIN` | `zenuuxdoeu.resend.app` | 사용자별 전달 주소의 수신 도메인 |
| `APP_ORIGIN` | `http://localhost:5173` | 허용할 프론트엔드 Origin, 쉼표로 복수 지정 가능 |
| `VITE_API_BASE_URL` | `/api` | 프론트의 API 기본 주소 |

운영 D1 생성 후 `worker/wrangler.jsonc`의 `database_id`를 실제 ID로 교체합니다. 비밀값은 저장소에 커밋하지 않습니다.

`main` 브랜치에 push하면 Cloudflare Workers Builds가 `worker` 디렉터리를 기준으로 프론트엔드와 Worker를 자동 배포합니다.

## 분석 미리보기 API

JWT 인증이 필요합니다.

```http
POST /api/proposals/preview
Authorization: Bearer {accessToken}
Content-Type: application/json

{"text":"예산 350만원, 기간 2026-08-10 ~ 2026-09-20, 착수금 30%, 잔금 70%"}
```

응답에는 `client`, `dealType`, `amount`, `deliverables`, `draftDueDate`, `publishDueDate`, `revisionCount`, `secondaryUsage`, `paymentCondition`, `tasks`, `risks` 등이 포함됩니다. 분석기는 명시된 정보만 구조화하며 찾지 못한 값은 추측하지 않고 확인 항목으로 반환합니다.

## 다음 연동 단계

외부 서비스는 핵심 도메인과 분리해 다음 순서로 연결합니다.

1. 실패한 인바운드 처리의 상태 기록과 재시도 기능
2. 분석 초안에서 작업물·체크리스트·위험 항목까지 편집하는 기능
3. LLM Structured Output 분석 어댑터
4. Notion Public OAuth/API로 거래 데이터베이스 등록
4. Google Calendar에 초안·게시·입금 일정을 생성
5. Google Sheets 내보내기와 첨부 PDF/OCR 분석 추가

외부 API 키가 없어도 현재 애플리케이션과 빌드는 정상 동작합니다.

## 검증

```bash
cd worker
npm ci
npm run typecheck
npm run db:local
npm run build:frontend
```
