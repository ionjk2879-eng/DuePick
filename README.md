# Duepick

프리랜서·크리에이터·1인 사업자의 **제안 → 계약 → 작업 → 입금 → 비용 → 실제 수익**을 한곳에서 관리하는 프로젝트입니다.

> 제안부터 입금까지, 놓치지 않게.

## 제품 구조

- 수입·업무: 협찬/외주 메일에서 거래처, 금액, 작업물, 납기, 수정 횟수, 게시 및 지급 조건을 구조화
- 지출: 업무용/개인용 구독 비용, 월 환산 금액, 계정과목과 리포트 관리
- 통합 흐름: 제안 분석 결과를 사용자가 확인한 뒤 저장하고, 이후 작업 일정·입금 상태·비용을 연결

현재 단계는 메일 원문을 직접 붙여넣는 안전한 MVP입니다. Gmail 전체 읽기 권한은 사용하지 않습니다.

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

요구 사항: Java 21, Node.js 18 이상

전체 프로젝트 검증은 루트에서 한 번에 실행할 수 있습니다.

```bash
./gradlew build
```

백엔드:

```bash
cd backend
./gradlew bootRun
```

루트에서 `./gradlew bootRun`으로 실행할 수도 있습니다. Windows PowerShell에서는 `./gradlew.bat bootRun`을 사용합니다. 기본 API 주소는 `http://localhost:8080`이며 데이터는 `backend/data/pinpoint.mv.db`에 유지됩니다. 기존 로컬 데이터 호환을 위해 DB 파일명은 이전 프로젝트 식별자를 유지합니다. PostgreSQL이나 Docker는 기본 실행에 필요하지 않습니다.

프론트엔드:

```bash
cd frontend
npm install
npm run dev
```

기본 화면은 `http://localhost:5173`입니다. 회원가입 또는 로그인 후 대시보드의 **외주 제안 분석** 링크를 이용합니다.

## 환경변수

예시는 [.env.example](.env.example)에 있습니다. Spring Boot 환경변수는 실행 셸 또는 IDE 실행 구성에 설정하고, 프론트 API 주소를 바꿀 때는 `frontend/.env.local`에 `VITE_API_BASE_URL`을 설정합니다.

| 변수 | 기본값 | 설명 |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | 백엔드 포트 |
| `DB_URL` | `jdbc:h2:file:./data/pinpoint;AUTO_SERVER=TRUE` | JDBC 주소 |
| `DB_DRIVER` | `org.h2.Driver` | JDBC 드라이버 |
| `DB_USERNAME` | `sa` | DB 사용자 |
| `DB_PASSWORD` | 빈 값 | DB 비밀번호 |
| `JWT_SECRET` | 개발용 기본 문자열 | 운영 환경에서는 32자 이상의 임의 값 필수 |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | 프론트의 API 기본 주소 |

기존 PostgreSQL을 사용하려면 `DB_URL`, `DB_DRIVER`, `DB_USERNAME`, `DB_PASSWORD`만 PostgreSQL 값으로 덮어쓰면 됩니다. `docker-compose.yml`은 선택 사항입니다.

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

1. 사용자별 전달 주소와 Resend Inbound 웹훅으로 선택한 메일만 수신
2. 사용자 확인 후 구조화 결과를 거래로 저장
3. Notion Public OAuth/API로 거래 데이터베이스 등록
4. Google Calendar에 초안·게시·입금 일정을 생성
5. Google Sheets 내보내기와 첨부 PDF/OCR 분석 추가

외부 API 키가 없어도 현재 애플리케이션과 빌드는 정상 동작합니다.

## 검증

```bash
cd backend
./gradlew test build

cd ../frontend
npm ci
npm run build
```
