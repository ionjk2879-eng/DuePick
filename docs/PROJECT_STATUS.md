# Duepick 프로젝트 상태

마지막 확인일: 2026-08-03

## 현재 단계

**Cloudflare 전환 및 3단계 기본 구현 완료**

Cloudflare Workers + D1 기반으로 전환했으며, 직접 붙여넣기와 사용자별 Resend 전달 주소를 지원한다. 인바운드 메일은 분석 초안으로만 저장되고 자동으로 거래 확정되지 않는다. 실제 Resend 웹훅 등록과 운영 배포는 아직 필요하다.

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
- Cloudflare 정적 자산과 Worker API 단일 배포 구성
- GitHub `main` push 기반 Cloudflare Workers 자동 배포

## 다음 작업

1. Cloudflare D1을 생성하고 첫 운영 배포 및 Resend 웹훅 등록을 완료한다.
2. 받은 메일의 분석 초안을 거래 저장 전에 수정하는 UI를 추가한다.
3. 실패한 인바운드 이벤트의 상태 기록과 관리자 재시도를 추가한다.
4. 규칙 기반 분석기를 교체 또는 보완할 LLM Structured Output 어댑터를 추가한다.
4. Notion Public OAuth/API로 확인된 거래를 등록한다.
5. Google Calendar에 초안·게시·입금 예정 일정을 만든다.
6. Google Sheets 내보내기와 PDF/OCR 첨부 분석을 추가한다.
7. 기존 구독 비용을 거래별 실제 수익 계산과 연결한다.

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
