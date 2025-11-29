================================================================================
                    Dev Debug Helper - PHP용 개발 디버그 도구
                              사용 설명서 v1.1.0
================================================================================

개요
----
PHP 웹사이트 개발 시 HTML 요소의 소스 위치를 쉽게 파악할 수 있는 도구입니다.
Ctrl + 마우스로 요소 정보를 미리보기하고, Ctrl + 우클릭으로 클립보드에 복사합니다.


파일 구성
---------
1. js/dev-debug-helper.js   - 프론트엔드 JavaScript
2. includes/dev-debug.php   - PHP 헬퍼 함수


주요 기능
---------
- Ctrl + 마우스 이동으로 요소 정보 툴팁 표시
- Ctrl + 우클릭으로 클립보드 복사
- data-source 속성이 없어도 부모 요소에서 자동 상속
- URL 기반 파일명 자동 추정
- 현재 페이지 URL 표시 및 복사


설치 방법
---------

1단계: 파일 복사
   - js/dev-debug-helper.js → 프로젝트의 js/ 폴더에 복사
   - includes/dev-debug.php → 프로젝트의 includes/ 폴더에 복사


2단계: PHP에서 헬퍼 파일 include

   <?php
   require_once __DIR__ . '/includes/dev-debug.php';
   ?>


3단계: HTML에 JavaScript 로드 (</body> 앞에 추가)

   방법 A - 헬퍼 함수 사용 (권장):
   <?= dev_debug_script() ?>

   방법 B - 직접 작성:
   <?php if (IS_DEV): ?>
   <script src="js/dev-debug-helper.js"></script>
   <?php endif; ?>


4단계: HTML 요소에 data-source 속성 추가

   <!-- 축약형 (권장) -->
   <div <?= dd() ?> class="container">

   <!-- 전체 함수명 -->
   <nav <?= debug_attr() ?> class="navbar">

   <!-- 값만 출력 -->
   <header data-source="<?= debug_source() ?>">


사용법
------

● Ctrl + 마우스 이동
  - 요소 위에서 Ctrl 키를 누른 채로 마우스를 움직이면
  - 해당 요소의 소스 파일, 라인 번호, URL, class 정보가 툴팁으로 표시됩니다.
  - data-source 속성이 없어도 부모 요소에서 자동으로 상속받아 표시합니다.
  - 상속된 경우 "(nav.navbar에서 상속)" 형태로 표시됩니다.

● Ctrl + 우클릭
  - 요소 위에서 Ctrl + 우클릭하면 클립보드에 복사됩니다.
  - 복사 형식:
    URL: http://example.com/dashboard.php
    File: dashboard.php:42
    Element: <div#main-content>
    Class: container-fluid py-3

● 콘솔 명령어
  - toggleDevDebug()     : 디버그 기능 on/off 토글
  - toggleDevDebug(true) : 디버그 기능 켜기
  - toggleDevDebug(false): 디버그 기능 끄기
  - devDebugStatus()     : 현재 상태 확인


PHP 헬퍼 함수
-------------

1. dd()
   - 가장 짧은 축약형
   - 사용: <div <?= dd() ?>>
   - 출력: data-source="파일명:라인번호"

2. debug_attr($fullPath = false)
   - 전체 함수명 버전
   - $fullPath = true로 전체 경로 출력 가능
   - 사용: <div <?= debug_attr() ?>>

3. debug_source($fullPath = false)
   - 속성 없이 값만 반환
   - 사용: data-source="<?= debug_source() ?>"

4. dev_debug_script($path = 'js/dev-debug-helper.js')
   - 스크립트 태그 출력
   - 개발 환경에서만 출력됨
   - 사용: <?= dev_debug_script() ?>


환경 설정
---------

● PHP (dev-debug.php)
  개발 환경 감지 조건:
  - localhost, 127.0.0.1 도메인
  - .local, .test로 끝나는 도메인
  - DEBUG_MODE 상수가 true인 경우

  커스텀 설정:
  <?php
  define('IS_DEV', $_SERVER['SERVER_NAME'] === 'dev.example.com');
  require_once 'includes/dev-debug.php';
  ?>

● JavaScript (dev-debug-helper.js)
  개발 환경 감지 조건:
  - localhost, 127.0.0.1
  - .local, .test로 끝나는 도메인
  - window.FORCE_DEV_DEBUG = true로 강제 활성화 가능

  개발 도메인 추가 방법 (JS 파일 수정):
  const isLocalhost = ['localhost', '127.0.0.1', ''].includes(location.hostname) ||
                      location.hostname.endsWith('.local') ||
                      location.hostname.endsWith('.test') ||
                      location.hostname === 'your-dev-domain.com';  // 추가


자동 상속 기능
--------------
data-source 속성이 없는 요소를 선택해도 부모 요소를 탐색하여
가장 가까운 data-source를 찾아 표시합니다.

예시:
<div <?= dd() ?> class="card">           <!-- data-source="page.php:10" -->
    <div class="card-body">              <!-- data-source 없음 -->
        <h5 class="card-title">제목</h5>  <!-- data-source 없음 -->
    </div>
</div>

card-title을 선택하면:
"page.php:10 (div.card에서 상속)" 으로 표시됩니다.


파일명 추정 기능
----------------
data-source가 전혀 없는 경우에도 현재 URL을 기반으로
파일명을 추정하여 표시합니다.

예시:
- http://example.com/dashboard.php → dashboard.php (추정)
- http://example.com/users/ → index.php (추정)


프로덕션 환경
-------------

프로덕션 환경에서는:
- IS_DEV가 false가 되어 PHP 함수들이 빈 문자열 반환
- JavaScript는 개발 도메인이 아니면 자동으로 비활성화
- 성능 영향 없음


적용 예시
---------

<?php
require_once __DIR__ . '/includes/dev-debug.php';
?>
<!DOCTYPE html>
<html>
<head>
    <title>예시 페이지</title>
</head>
<body>
    <nav <?= dd() ?> class="navbar navbar-dark">
        <a <?= dd() ?> class="navbar-brand" href="/">로고</a>
    </nav>

    <main <?= dd() ?> class="container">
        <h1>제목</h1>    <!-- 부모(main)에서 상속 -->
        <p>내용</p>      <!-- 부모(main)에서 상속 -->
    </main>

    <footer <?= dd() ?> class="footer">
        &copy; 2024
    </footer>

    <?= dev_debug_script() ?>
</body>
</html>


팁
--

1. 모든 요소에 dd()를 추가할 필요 없음
   - 주요 컨테이너, 컴포넌트 레벨에만 추가
   - 자식 요소는 자동으로 부모에서 상속받음

2. include 파일에서도 사용 가능
   - dd()는 호출된 위치의 파일명과 라인을 반환

3. 기존 코드 수정 최소화
   - 새로 만드는 요소에만 점진적으로 적용 가능

4. IDE 플러그인과 연동
   - 복사된 파일:라인 형식은 대부분의 IDE에서 바로 점프 가능

5. URL 복사 활용
   - 복사된 URL을 팀원과 공유하여 동일 페이지 확인 가능


문제 해결
---------

Q: 툴팁이 안 나타나요
A: 콘솔에서 devDebugStatus() 실행하여 상태 확인
   toggleDevDebug(true)로 활성화

Q: 프로덕션에서도 동작해요
A: IS_DEV 상수 값 확인, JS 파일의 도메인 설정 확인

Q: data-source가 출력 안 돼요
A: IS_DEV가 true인지 확인
   dev-debug.php가 정상적으로 include 되었는지 확인

Q: 특정 도메인에서 동작 안 해요
A: JS 파일에서 isLocalhost 변수에 해당 도메인 추가


변경 이력
---------
v1.1.0
- 부모 요소에서 data-source 자동 상속 기능 추가
- URL 기반 파일명 추정 기능 추가
- 툴팁에 현재 페이지 URL 표시
- 복사 형식 개선 (URL, File, Element, Class)

v1.0.0
- 최초 릴리즈


================================================================================
                              Happy Debugging! 🐛
================================================================================
