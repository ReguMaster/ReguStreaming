![Introduction](res/intro.png)

소개
=============
### ReguStreaming(레그 스트리밍)은 영상 기반 커뮤니케이션 서비스입니다.
##### 실시간으로 영상을 감상하면서 커뮤니케이션을 할 수 있습니다.

* 큐(Queue) 기반 영상 대기열 시스템
* 여러 외부 서비스 로그인 지원 (카카오 계정, 스팀 계정 등)
* YouTube/Ani24/Tvple/Direct 영상 추가 지원
* 접속 위치 추적(WHOIS API) 기능으로 특정 국가 또는 특정 지역 사용자 접속 차단 기능
* DB 쿼리 캐싱 시스템
* Electron 기반 서버 콘솔 인터페이스
* 채팅, 파일 업로드, 영상 건너뛰기 투표 기능
* 파일 업로드 시 바이러스 검사(VirusTotal API) 또는 성인 이미지 판별(Kakao Vision API) 기능
* LiveService 시스템(서버를 재시작 하지 않고서 코드를 리프레싱 하는 기술)

사용 기술 및 라이브러리
=============
서버 사이드 | 클라이언트 사이드
:---:|:---:
Node.js | HTML5
socket.io | CSS3
express | jQuery
MySQL | jQuery UI
Redis | animate.css
EJS | hover.css
Passport | Google Recaptcha
Recaptcha2 | Bootstrap
Superagent |
Discord.js |
jQuery |
uniqid

리포지토리 폴더 소개
=============
폴더 | 설명
:---:|:---:
background | 메인 백그라운드 이미지 파일 폴더
electron | Electron 기반 서버 콘솔 인터페이스 구현 폴더
fileStorage | FileStorage 확장자 기반 db 파일 폴더
modules | 핵심 모듈 폴더
public | 접속 가능한 공개 파일 폴더
res | Github 용 리소스 파일 폴더
routes | express 웹서버 라우터 폴더
service | LiveService 파일 및 서버 설정값 정의 폴더
views | EJS 확장자 HTML 파일 폴더

총 개발 기간
=============
##### 2018-06-11 ~ 현재

라이선스
=============
[MIT 라이선스](https://ko.wikipedia.org/wiki/MIT_%ED%97%88%EA%B0%80%EC%84%9C)를 사용합니다.

> __참고__ <br>
> 이 리포지토리에는 여러 핵심 설정값 파일이 업로드되어 있지 않습니다. (MySQL 접속 비밀번호 등)