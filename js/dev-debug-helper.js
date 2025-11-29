/**
 * Dev Debug Helper - PHP용 개발 디버그 도구
 *
 * 기능:
 * - Ctrl + 마우스 이동: 요소의 className과 data-source 속성 툴팁 미리보기
 * - Ctrl + 우클릭: 클립보드에 복사
 * - 콘솔에서 toggleDevDebug()로 제어
 *
 * @author Claude Code
 * @version 1.0.0
 */

(function() {
    'use strict';

    // localhost 또는 개발 도메인에서만 동작
    // 필요시 아래에 개발 도메인 추가: location.hostname === 'dev.example.com'
    const isLocalhost = ['localhost', '127.0.0.1', ''].includes(location.hostname) ||
                        location.hostname.endsWith('.local') ||
                        location.hostname.endsWith('.test');

    if (!isLocalhost && !window.FORCE_DEV_DEBUG) {
        console.log('[DevDebug] 프로덕션 환경 - 비활성화됨');
        return;
    }

    // 상태
    let isEnabled = localStorage.getItem('devDebugEnabled') !== 'false';
    let isCtrlPressed = false;
    let currentElement = null;
    let tooltip = null;

    // 스타일 정의
    const styles = `
        .dev-debug-tooltip {
            position: fixed;
            z-index: 999999;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            line-height: 1.5;
            max-width: 500px;
            word-break: break-all;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .dev-debug-tooltip .source {
            color: #4ade80;
            font-weight: bold;
            margin-bottom: 4px;
        }
        .dev-debug-tooltip .classname {
            color: #60a5fa;
        }
        .dev-debug-tooltip .id-name {
            color: #f472b6;
        }
        .dev-debug-tooltip .tag-name {
            color: #fbbf24;
        }
        .dev-debug-tooltip .hint {
            color: #9ca3af;
            font-size: 10px;
            margin-top: 6px;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 6px;
        }
        .dev-debug-highlight {
            outline: 2px dashed #4ade80 !important;
            outline-offset: 2px;
        }
        .dev-debug-copied {
            position: fixed;
            z-index: 999999;
            background: #4ade80;
            color: #000;
            padding: 8px 16px;
            border-radius: 6px;
            font-family: sans-serif;
            font-size: 14px;
            font-weight: bold;
            animation: devDebugFadeOut 1.5s ease-out forwards;
        }
        @keyframes devDebugFadeOut {
            0% { opacity: 1; transform: translateY(0); }
            70% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-10px); }
        }
    `;

    // 스타일 삽입
    function injectStyles() {
        if (document.getElementById('dev-debug-styles')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'dev-debug-styles';
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }

    // 툴팁 생성
    function createTooltip() {
        if (tooltip) return tooltip;
        tooltip = document.createElement('div');
        tooltip.className = 'dev-debug-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    // 가장 가까운 data-source를 가진 부모 요소 찾기
    function findNearestSource(element) {
        let el = element;
        while (el && el !== document.body) {
            const source = el.getAttribute('data-source');
            if (source) {
                // 부모 요소 식별자 생성 (태그명.클래스 또는 태그명#id)
                let parentIdentifier = el.tagName.toLowerCase();
                if (el.id) {
                    parentIdentifier += `#${el.id}`;
                } else if (el.className && typeof el.className === 'string') {
                    const firstClass = el.className.split(' ')[0];
                    if (firstClass) {
                        parentIdentifier += `.${firstClass}`;
                    }
                }
                return { source, element: el, inherited: el !== element, parentIdentifier };
            }
            el = el.parentElement;
        }
        return { source: null, element: null, inherited: false, parentIdentifier: null };
    }

    // 현재 파일명 추정 (URL 기반)
    function getCurrentFileName() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.php';
        return fileName.includes('.') ? fileName : fileName + '.php';
    }

    // 툴팁 표시
    function showTooltip(element, x, y) {
        if (!tooltip) createTooltip();

        const { source, element: sourceEl, inherited, parentIdentifier } = findNearestSource(element);
        const currentFile = getCurrentFileName();

        let sourceDisplay;
        if (source) {
            sourceDisplay = inherited
                ? `${source} <span style="color:#9ca3af">(${parentIdentifier}에서 상속)</span>`
                : source;
        } else {
            sourceDisplay = `<span style="color:#fbbf24">${currentFile}</span> <span style="color:#9ca3af">(추정)</span>`;
        }

        const className = element.className || '(class 없음)';
        const id = element.id ? `#${element.id}` : '';
        const tagName = element.tagName.toLowerCase();

        // className이 객체인 경우 (SVG 등) 문자열로 변환
        const classStr = typeof className === 'string' ? className :
                        (className.baseVal !== undefined ? className.baseVal : String(className));

        const fullUrl = window.location.href;

        tooltip.innerHTML = `
            <div class="source">📁 ${sourceDisplay}</div>
            <div style="color:#9ca3af; font-size:11px; margin-bottom:6px;">🔗 ${fullUrl}</div>
            <div class="tag-name">&lt;${tagName}${id ? ` <span class="id-name">${id}</span>` : ''}&gt;</div>
            ${classStr && classStr !== '(class 없음)' ? `<div class="classname">class="${classStr}"</div>` : ''}
            <div class="hint">Ctrl+우클릭: 복사</div>
        `;

        // 위치 계산
        const tooltipRect = tooltip.getBoundingClientRect();
        let left = x + 15;
        let top = y + 15;

        // 화면 밖으로 나가지 않도록 조정
        if (left + 350 > window.innerWidth) {
            left = x - 350;
        }
        if (top + 150 > window.innerHeight) {
            top = y - 150;
        }

        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.display = 'block';
    }

    // 툴팁 숨기기
    function hideTooltip() {
        if (tooltip) {
            tooltip.style.display = 'none';
        }
        if (currentElement) {
            currentElement.classList.remove('dev-debug-highlight');
            currentElement = null;
        }
    }

    // 복사 텍스트 생성
    function generateCopyText(element) {
        const { source } = findNearestSource(element);
        const className = element.className || '';
        let classStr = typeof className === 'string' ? className :
                        (className.baseVal !== undefined ? className.baseVal : String(className));
        // dev-debug-highlight 클래스 제외
        classStr = classStr.replace(/\s*dev-debug-highlight\s*/g, ' ').trim();
        const fullUrl = window.location.href;

        const { source: nearestSource, inherited, parentIdentifier } = findNearestSource(element);

        let text = '';
        text += `URL: ${fullUrl}\n`;
        if (nearestSource) {
            text += `File: ${nearestSource}`;
            if (inherited && parentIdentifier) {
                text += ` (${parentIdentifier}에서 상속)`;
            }
            text += `\n`;
        } else {
            text += `File: ${getCurrentFileName()}\n`;
        }

        // 요소 정보
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        text += `Element: <${tagName}${id}>\n`;

        if (classStr) {
            text += `Class: ${classStr}`;
        }
        return text;
    }

    // 클립보드 복사
    async function copyToClipboard(text, x, y) {
        try {
            await navigator.clipboard.writeText(text);
            showCopiedNotification(x, y);
            console.log('[DevDebug] 복사됨:\n' + text);
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showCopiedNotification(x, y);
            console.log('[DevDebug] 복사됨:\n' + text);
        }
    }

    // 복사 완료 알림
    function showCopiedNotification(x, y) {
        const notification = document.createElement('div');
        notification.className = 'dev-debug-copied';
        notification.textContent = '✓ 복사됨';
        notification.style.left = x + 'px';
        notification.style.top = y + 'px';
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 1500);
    }

    // 이벤트 핸들러
    function handleKeyDown(e) {
        if (e.key === 'Control' && isEnabled) {
            isCtrlPressed = true;
        }
    }

    function handleKeyUp(e) {
        if (e.key === 'Control') {
            isCtrlPressed = false;
            hideTooltip();
        }
    }

    function handleMouseMove(e) {
        if (!isCtrlPressed || !isEnabled) return;

        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element || element === tooltip || tooltip?.contains(element)) return;

        // 이전 요소 하이라이트 제거
        if (currentElement && currentElement !== element) {
            currentElement.classList.remove('dev-debug-highlight');
        }

        currentElement = element;
        element.classList.add('dev-debug-highlight');
        showTooltip(element, e.clientX, e.clientY);
    }

    function handleContextMenu(e) {
        if (!isCtrlPressed || !isEnabled) return;

        e.preventDefault();
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element || element === tooltip) return;

        const text = generateCopyText(element);
        copyToClipboard(text, e.clientX, e.clientY);
    }

    function handleBlur() {
        isCtrlPressed = false;
        hideTooltip();
    }

    // 초기화
    function init() {
        injectStyles();
        createTooltip();

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('blur', handleBlur);

        console.log('[DevDebug] 활성화됨 - Ctrl+마우스로 요소 정보 확인, Ctrl+우클릭으로 복사');
        console.log('[DevDebug] toggleDevDebug()로 on/off 전환');
    }

    // 토글 함수 (전역)
    window.toggleDevDebug = function(state) {
        if (typeof state === 'boolean') {
            isEnabled = state;
        } else {
            isEnabled = !isEnabled;
        }
        localStorage.setItem('devDebugEnabled', isEnabled);
        hideTooltip();
        console.log(`[DevDebug] ${isEnabled ? '활성화' : '비활성화'}됨`);
        return isEnabled;
    };

    // 상태 확인 함수 (전역)
    window.devDebugStatus = function() {
        console.log(`[DevDebug] 상태: ${isEnabled ? '활성화' : '비활성화'}`);
        console.log(`[DevDebug] 환경: ${isLocalhost ? 'localhost' : 'production'}`);
        return { enabled: isEnabled, localhost: isLocalhost };
    };

    // DOM 로드 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
