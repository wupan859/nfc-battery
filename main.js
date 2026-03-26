document.addEventListener('DOMContentLoaded', () => {
    // 1. 初始化页面配置
    if (typeof APP_CONFIG === 'undefined') {
        showError('缺失配置文件 config.js');
        return;
    }

    if (APP_CONFIG.page.title) {
        // 注释掉这行，不再使用 config.js 覆盖 index.html 中的标题
        // document.getElementById('page-title').textContent = APP_CONFIG.page.title;
        document.title = APP_CONFIG.page.title;
    }
    if (APP_CONFIG.page.brandColor) {
        document.documentElement.style.setProperty('--brand-color', APP_CONFIG.page.brandColor);
    }

    const appContent = document.getElementById('content');
    const loading = document.getElementById('loading');
    const refreshBtn = document.getElementById('refresh-btn');

    // 2. 解析 URL 参数
    function getParams() {
        const params = new URLSearchParams(window.location.search);
        const data = {};
        for (const [key, value] of params.entries()) {
            // XSS 防御核心：不使用 innerHTML，后续渲染全程使用 textContent
            data[key] = value;
        }
        return data;
    }

    // 3. 缓存逻辑管理
    const CACHE_KEY = 'nfc_battery_cache';
    function getCachedData(currentParamsStr) {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_KEY));
            if (cache && cache.paramsStr === currentParamsStr) {
                const now = new Date().getTime();
                const expireMs = (APP_CONFIG.cache.expireMinutes || 5) * 60 * 1000;
                if (now - cache.timestamp < expireMs) {
                    return cache.data;
                }
            }
        } catch (e) {
            console.warn('缓存读取失败', e);
        }
        return null;
    }

    function setCache(paramsStr, data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                paramsStr,
                data,
                timestamp: new Date().getTime()
            }));
        } catch (e) {
            console.warn('缓存写入失败', e);
        }
    }

    // 4. 渲染引擎
    function render(data) {
        appContent.innerHTML = ''; // 清空当前内容
        const fragment = document.createDocumentFragment();
        const definedKeys = [];

        // 按配置顺序渲染已知卡片
        APP_CONFIG.sections.forEach(section => {
            const card = document.createElement('div');
            card.className = 'card';

            if (section.type === 'hero') {
                card.classList.add('hero-section');
                section.items.forEach(item => {
                    definedKeys.push(item.key);
                    const val = data[item.key] !== undefined ? data[item.key] : item.default;
                    let displayVal = val;
                    if (val !== item.default && item.formatter) {
                        displayVal = item.formatter(val);
                        if (isNaN(displayVal)) displayVal = val; // 防止格式化出错
                    }
                    
                    const div = document.createElement('div');
                    div.className = 'hero-item';
                    
                    const valDiv = document.createElement('div');
                    valDiv.className = 'hero-value';
                    valDiv.textContent = displayVal + (val !== item.default ? item.unit : '');
                    
                    // 阈值告警颜色
                    if (val !== item.default && APP_CONFIG.alerts && APP_CONFIG.alerts[item.key]) {
                        const numVal = parseFloat(val);
                        if (!isNaN(numVal)) {
                            const alert = APP_CONFIG.alerts[item.key];
                            if ((alert.max !== undefined && numVal > alert.max) || 
                                (alert.min !== undefined && numVal < alert.min)) {
                                valDiv.style.color = alert.color;
                            }
                        }
                    }

                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'hero-label';
                    labelDiv.textContent = item.label;

                    div.appendChild(valDiv);
                    div.appendChild(labelDiv);
                    card.appendChild(div);
                });
            } else if (section.type === 'list') {
                const listContainer = document.createElement('div');
                listContainer.className = 'list-section';

                section.items.forEach(item => {
                    definedKeys.push(item.key);
                    const val = data[item.key] !== undefined ? data[item.key] : item.default;
                    let displayVal = val;
                    if (val !== item.default && item.formatter) {
                        displayVal = item.formatter(val);
                        if (isNaN(displayVal)) displayVal = val;
                    }

                    const row = document.createElement('div');
                    row.className = 'list-item';

                    const labelDiv = document.createElement('div');
                    labelDiv.className = 'list-label';
                    labelDiv.textContent = item.label;

                    const valDiv = document.createElement('div');
                    valDiv.className = 'list-value';
                    valDiv.textContent = displayVal + (val !== item.default ? item.unit : '');

                    row.appendChild(labelDiv);
                    row.appendChild(valDiv);
                    listContainer.appendChild(row);
                });
                card.appendChild(listContainer);
            }
            fragment.appendChild(card);
        });

        // 动态扩展：渲染 URL 中未在配置里定义的额外参数
        const extraKeys = Object.keys(data).filter(k => !definedKeys.includes(k));
        if (extraKeys.length > 0) {
            const card = document.createElement('div');
            card.className = 'card';
            const listContainer = document.createElement('div');
            listContainer.className = 'list-section';
            
            extraKeys.forEach(key => {
                const row = document.createElement('div');
                row.className = 'list-item';
                
                const labelDiv = document.createElement('div');
                labelDiv.className = 'list-label';
                labelDiv.textContent = key; // 未知键名原样展示

                const valDiv = document.createElement('div');
                valDiv.className = 'list-value';
                valDiv.textContent = data[key]; // 未知值原样展示

                row.appendChild(labelDiv);
                row.appendChild(valDiv);
                listContainer.appendChild(row);
            });
            card.appendChild(listContainer);
            fragment.appendChild(card);
        }

        appContent.appendChild(fragment);
        loading.style.display = 'none';
        appContent.style.display = 'block';
    }

    function showError(msg) {
        loading.style.display = 'none';
        appContent.style.display = 'none';
        const errDiv = document.getElementById('error');
        errDiv.textContent = msg;
        errDiv.style.display = 'block';
    }

    // 5. 核心控制流
    function init(forceRefresh = false) {
        loading.style.display = 'block';
        appContent.style.display = 'none';
        document.getElementById('error').style.display = 'none';

        const paramsStr = window.location.search;
        if (!paramsStr && !forceRefresh) {
            showError('未检测到设备数据 (URL中缺少参数)');
            return;
        }

        const data = getParams();
        
        if (!forceRefresh) {
            const cached = getCachedData(paramsStr);
            if (cached) {
                console.log('读取本地缓存数据');
                render(cached);
                return;
            }
        }

        // 模拟短暂网络延迟动画，若要求极致速度可直接调用 render(data)
        setTimeout(() => {
            render(data);
            setCache(paramsStr, data);
        }, 150);
    }

    // 绑定刷新事件：强制绕过缓存
    refreshBtn.addEventListener('click', () => {
        // 添加旋转动画反馈
        const svg = refreshBtn.querySelector('svg');
        svg.style.transition = 'transform 0.3s ease';
        svg.style.transform = `rotate(360deg)`;
        setTimeout(() => { svg.style.transition = 'none'; svg.style.transform = 'rotate(0deg)'; }, 300);
        
        init(true); 
    });

    // 启动应用
    init();
});
