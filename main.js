/*
 * SOLID 原则：单一职责
 * 1. LanguageService：只处理语言状态切换
 * 2. ClipboardService：只负责复制文本功能
 * 3. init 入口，组装依赖，不写混杂业务
 */

/**
 * 语言状态管理服务
 * 单一职责：只负责双语显示/隐藏，状态管理
 */
const LanguageService = (function () {
    let isEnglish = false;

    function toggle() {
        isEnglish = !isEnglish;
        const zhNodes = document.querySelectorAll('.lang-zh');
        const enNodes = document.querySelectorAll('.lang-en');
        const btn = document.getElementById('langToggleBtn');

        if (isEnglish) {
            zhNodes.forEach(el => el.style.display = 'none');
            enNodes.forEach(el => el.style.display = 'inline');
            document.documentElement.lang = 'en';
            btn.textContent = '中文';
        } else {
            enNodes.forEach(el => el.style.display = 'none');
            zhNodes.forEach(el => el.style.display = 'inline');
            document.documentElement.lang = 'zh‑CN';
            btn.textContent = 'EN';
        }
    }

    function getIsEnglish() {
        return isEnglish;
    }

    return {
        toggle,
        getIsEnglish
    };
})();

/**
 * 剪贴板复制服务
 * 单一职责：只做复制逻辑，不操作DOM文本内容
 */
const ClipboardService = (function () {
    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { ok: true };
        } catch (err) {
            return { ok: false };
        }
    }
    return { copyText };
})();

/**
 * 页面初始化入口
 * 组装事件绑定，不写业务逻辑
 */
function initApp() {
    // 绑定语言切换按钮
    const langBtn = document.getElementById('langToggleBtn');
    langBtn.addEventListener('click', () => {
        LanguageService.toggle();
    });

    // 批量绑定复制按钮（data‑copy 属性驱动，避免写死onclick）
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
        const copyValue = btn.dataset.copy;
        btn.addEventListener('click', async () => {
            const result = await ClipboardService.copyText(copyValue);
            const isEn = LanguageService.getIsEnglish();
            const originText = isEn ? 'Copy' : '复制';
            const successText = isEn ? 'Copied' : '已复制';
            const failText = isEn ? 'Failed' : '复制失败';

            btn.textContent = result.ok ? successText : failText;
            setTimeout(() => {
                btn.textContent = originText;
            }, 1500);
        });
    });
}

// DOM加载完成后启动
document.addEventListener('DOMContentLoaded', initApp);
