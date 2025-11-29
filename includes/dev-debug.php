<?php
/**
 * Dev Debug Helper - PHP 헬퍼 함수
 *
 * 사용법:
 * 1. 이 파일을 include
 * 2. HTML 요소에 <?= dd() ?> 또는 <?= debug_attr() ?> 추가
 * 3. 개발 환경에서만 data-source 속성이 출력됨
 *
 * @author Claude Code
 * @version 1.0.0
 */

// 개발 환경 감지 (필요시 수정)
if (!defined('IS_DEV')) {
    define('IS_DEV',
        isset($_SERVER['HTTP_HOST']) && (
            strpos($_SERVER['HTTP_HOST'], 'localhost') !== false ||
            strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false ||
            strpos($_SERVER['HTTP_HOST'], '.local') !== false ||
            strpos($_SERVER['HTTP_HOST'], '.test') !== false
        ) || (defined('DEBUG_MODE') && DEBUG_MODE === true)
    );
}

/**
 * data-source 속성 출력 (축약형)
 *
 * 사용: <div <?= dd() ?>>
 *
 * @return string data-source 속성 또는 빈 문자열
 */
function dd() {
    if (!IS_DEV) return '';

    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0];
    $file = basename($trace['file']);
    $line = $trace['line'];

    return 'data-source="' . htmlspecialchars($file . ':' . $line) . '"';
}

/**
 * data-source 속성 출력 (전체 함수명)
 *
 * 사용: <div <?= debug_attr() ?>>
 *
 * @param bool $fullPath 전체 경로 사용 여부 (기본: false)
 * @return string data-source 속성 또는 빈 문자열
 */
function debug_attr($fullPath = false) {
    if (!IS_DEV) return '';

    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0];
    $file = $fullPath ? $trace['file'] : basename($trace['file']);
    $line = $trace['line'];

    return 'data-source="' . htmlspecialchars($file . ':' . $line) . '"';
}

/**
 * data-source 값만 반환 (속성 없이)
 *
 * 사용: data-source="<?= debug_source() ?>"
 *
 * @param bool $fullPath 전체 경로 사용 여부
 * @return string 파일:라인 문자열 또는 빈 문자열
 */
function debug_source($fullPath = false) {
    if (!IS_DEV) return '';

    $trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 1)[0];
    $file = $fullPath ? $trace['file'] : basename($trace['file']);
    $line = $trace['line'];

    return htmlspecialchars($file . ':' . $line);
}

/**
 * 디버그 스크립트 태그 출력
 *
 * 사용: <?= dev_debug_script() ?> (</body> 앞에 추가)
 *
 * @param string $scriptPath JS 파일 경로 (기본: js/dev-debug-helper.js)
 * @return string script 태그 또는 빈 문자열
 */
function dev_debug_script($scriptPath = 'js/dev-debug-helper.js') {
    if (!IS_DEV) return '';

    return '<script src="' . htmlspecialchars($scriptPath) . '"></script>';
}

/**
 * 디버그 스크립트 태그 출력 (절대 경로용)
 *
 * @param string $basePath 기본 경로
 * @return string script 태그 또는 빈 문자열
 */
function dev_debug_script_absolute($basePath = '/') {
    if (!IS_DEV) return '';

    return '<script src="' . htmlspecialchars($basePath . 'js/dev-debug-helper.js') . '"></script>';
}
