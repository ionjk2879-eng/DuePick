# Duepick 프로젝트 상태

마지막 확인일: 2026-08-04

## 현재 단계

**Cloudflare 전환 및 운영 안정화·증빙 업로드·AI 분석 어댑터 구현 완료**

Cloudflare Workers + D1 기반으로 전환했으며, 직접 붙여넣기와 사용자별 Resend 전달 주소를 지원한다. 인바운드 메일은 분석 초안으로만 저장되고 자동으로 거래 확정되지 않는다. 실패 상태와 사용자별 재처리, R2 증빙 업로드, 선택적 OpenAI Structured Outputs 분석을 구현하고 운영 배포했다. 운영 `duepick-evidence` R2 버킷 생성과 D1 `0004_inbound_evidence.sql` 적용을 완료했다. Resend 비밀값은 등록되어 있으며 OpenAI 비밀값은 선택 사항으로 아직 등록하지 않았다.

## 현재 구현 상태

- Cloudflare Workers / TypeScript / Hono 백엔드
- React 18 / TypeScript / Vite 프론트엔드
- JWT 회원가입·로그인
- Cloudflare D1 데이터베이스와 마이그레이션
- 구독 비용 CRUD, 분류 추천, 요약 차트
- CSV 리포트(PDF 리포트는 Workers 전환 중 일시 중단)
- 무료/프로 플랜 및 모의 결제 골격
- 협찬·외주 원문 붙여넣기 화면
- 규칙 기반 제안 분석 미리보기 API
- 거래처, 금액, 결과물, 날짜, 수정 횟수, 2차 활용, 지급 조건 추출
- 누락 위험과 작업 체크리스트 생성
- 확인한 분석 결과를 사용자별 거래로 저장
- 거래 목록, 삭제, 금액 합계
- `확인 필요 → 확정 → 진행 중 → 작업 완료 → 입금 완료` 상태 관리
- 사용자별 예측하기 어려운 Resend 전달 주소
- Resend 웹훅 원문 서명 검증과 중복 이벤트 방지
- Receiving API 본문 조회, HTML 정규화, 분석 초안 저장
- 받은 메일 분석 초안을 중복 없이 거래로 확정하는 사용자 확인 기능
- 거래 저장 전 받은 메일의 핵심 분석 필드를 수정하는 기능
- Cloudflare 정적 자산과 Worker API 단일 배포 구성
- GitHub `main` push 기반 Cloudflare Workers 자동 배포
- 공통 사이드바·헤더·디자인 토큰 기반의 반응형 웹 UI
- Duepick 파비콘, 웹 앱 매니페스트, 카카오톡·SNS 공유용 Open Graph 카드
- 입금 완료 거래와 일반 비용을 연결하는 재무 장부
- 업무 사용 비율·증빙 링크·공제 검토 상태 및 최근 6개월 손익
- 수입·비용 통합 신고 준비용 CSV
- 실패한 인바운드 이벤트의 오류·시도 횟수 기록과 사용자별 재처리
- Cloudflare R2 기반 PDF·이미지 증빙 업로드, 인증 다운로드와 비용 삭제 시 정리
- OpenAI Responses API의 JSON Schema Structured Outputs 분석 어댑터
- OpenAI API 키가 없거나 분석 호출이 실패할 때 규칙 기반 분석기로 자동 복귀
- 운영 R2에서 증빙 업로드·다운로드 해시·교체·형식 제한·10MB 제한·삭제 검증 완료
- 실제 네이버 메일로 Resend 정상 수신·빈 본문 실패 기록·재처리 시도 횟수·사용자 확인 저장·거래 중복 방지 운영 검증 완료
- 받은 메일 분석 초안에서 작업물·체크리스트·위험 항목을 줄 단위로 수정하는 기능
- 거래 저장 후 거래처·유형·금액·작업물·수정 횟수·2차 사용·지급 조건·체크리스트·위험 항목을 수정하는 상세 편집
- 초안 기한·게시 기한·입금 예정일을 거래별로 관리하는 일정 필드

## 다음 작업

1. Notion Public OAuth/API로 확인된 거래를 등록한다.
2. Google Calendar에 초안·게시·입금 예정 일정을 만든다.
3. Google Sheets 내보내기와 PDF/OCR 첨부 분석을 추가한다.

## 다음 작업의 완료 조건

Resend 단계는 다음 조건을 만족하면 완료로 본다.

- 수신 웹훅의 서명 또는 신뢰성 검증
- 수신자 주소로 Duepick 사용자를 안전하게 식별
- 본문 정규화와 중복 이벤트 방지
- 실패 재처리 또는 명확한 실패 상태
- 메일이 자동 확정되지 않고 분석 초안으로 저장됨
- 외부 API 키가 없을 때 기존 로컬 기능과 테스트가 계속 동작함
- 개인정보가 로그에 불필요하게 남지 않음

## 결정 사항

- 정식 제품명은 `Duepick(듀픽)`이며 슬로건은 `제안부터 입금까지, 놓치지 않게`로 한다.
- 기존 Pinpoint를 별도 협찬 메일 서비스와 분리하지 않고 Duepick으로 확장한다.
- 1인 개발자의 초기 운영비를 최소화하기 위해 운영 런타임을 Cloudflare Workers + D1으로 전환한다.
- 기존 Spring Boot 코드는 전환 검증과 데이터 참고가 끝날 때까지 `backend/`에 보존한다.
- 운영 배포는 GitHub `main`과 연결된 Cloudflare Workers Builds를 사용한다.
- 기존 구독 관리는 비용 영역으로 유지한다.
- Gmail 전체 읽기 OAuth는 MVP 범위에서 제외한다.
- 첫 입력 방식은 직접 붙여넣기이며, 다음 입력 방식은 전용 전달 주소다.
- 분석 결과는 항상 사용자 확인 후 거래로 확정한다.
- 찾지 못한 계약 조건을 AI가 임의로 채우지 않는다.
- 실패한 인바운드 재시도는 별도 관리자 역할이 생기기 전까지 해당 메일 소유 사용자에게만 허용한다.
- R2 증빙은 공개 URL을 만들지 않고 JWT 인증 API를 통해서만 내려받는다. PDF·JPG·PNG·WEBP, 파일당 10MB로 제한한다.
- `OPENAI_API_KEY`가 있을 때 Responses API Structured Outputs를 사용하고, 키가 없거나 호출이 실패하면 규칙 기반 분석기로 복귀한다.
- OpenAI API는 ChatGPT 구독과 별도 비용이 발생하므로 실제 사용자 메일에서 규칙 기반 분석의 한계가 확인될 때까지 운영 키 등록을 보류한다.
- Notion·Calendar 같은 외부 연동 전에 Duepick 내부에서 거래 조건과 핵심 일정을 수정·관리할 수 있는 흐름을 먼저 완결한다.

## 검증 명령

Worker 타입 검사와 로컬 D1 마이그레이션:

```powershell
Set-Location worker
npm run typecheck
npm run db:local
```

프론트엔드만 검증:

```powershell
Set-Location worker
npm run build:frontend
```

## 상태 갱신 메모

기능을 완료할 때 이 파일의 `현재 구현 상태`, `다음 작업`, `결정 사항`, `마지막 확인일`을 함께 갱신한다. 제품의 장기 설명은 `PRODUCT_DIRECTION.md`에만 기록한다.
