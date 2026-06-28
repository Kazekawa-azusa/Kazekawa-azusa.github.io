
/* ================================================================== */
/* ⚙️ 網站核心設定區 (SITE CONFIGURATION)                               */
/* 每次發布新版本或修改全域狀態時，請只在這裡修改！                         */
/* ================================================================== */
const CONFIG = {
    // 🚩 發布前必改
    VERSION: "U0.5.0",          // 目前系統版本號

    // 🎨 介面與主題設定
    DEFAULT_THEME: "light",     // 預設主題 (light / dark)
    
    // ✨ 跑馬燈速度設定：跑完一整圈需要的「秒數」(數字越大跑得越慢！)
    MARQUEE_SPEED: 40,          

    // 🔗 資源路徑
    FAVICON_LIGHT: "https://kazekawa-azusa.github.io/assets/OG_dark.png?v=2",
    FAVICON_DARK: "https://kazekawa-azusa.github.io/assets/OG_light.png?v=2",
    DATA_SOURCE: "./all_projects.json" 
};

// ==========================================
// ✨ 全域狀態標籤系統 (支援快速擴充)
// ==========================================
window.STATUS_LIST = ['NEW', 'UPDATED', 'WIP', 'ARCHIVED'];

// 共用函數：自動判斷物件屬性並回傳對應的 HTML 徽章
window.getStatusBadgeHtml = function(item, isTitle = false) {
    const titleClass = isTitle ? ' title-badge' : '';
    // 優先權：NEW > UPDATED > WIP > ARCHIVED
    if (item.is_new) return `<span class="status-badge${titleClass}" data-status="NEW">NEW</span>`;
    if (item.is_updated) return `<span class="status-badge${titleClass}" data-status="UPDATED">UPDATED</span>`;
    if (item.is_wip) return `<span class="status-badge${titleClass}" data-status="WIP">WIP</span>`;
    if (item.is_archived) return `<span class="status-badge${titleClass}" data-status="ARCHIVED">ARCHIVED</span>`;
    return '';
};

// 自動將版本號注入到 Footer
const sysVersionEl = document.getElementById('sys-version');
if (sysVersionEl) sysVersionEl.innerText = CONFIG.VERSION;

// ✨ 自動將跑馬燈速度變成 CSS 變數，供畫面排版使用
document.documentElement.style.setProperty('--marquee-speed', `${CONFIG.MARQUEE_SPEED}s`);

// === 全域變數 (系統內部使用) ===
window.siteProjects = [];

// ==========================================
// ✨ 新增：全域圖片破圖處理器 (終極解決 Safari/iOS 限制)
// ==========================================
window.handleImageError = function(img) {
    img.classList.remove('is-loading');
    img.classList.add('is-broken');
    // ✨ 核心魔法：將破圖瞬間替換為 1x1 透明 SVG！
    // 這樣 Safari 就會以為「圖片載入成功了」，進而徹底註銷那個醜陋的原生 X 圓圈！
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
};

// === 1. 介面與導覽列邏輯 (Theme & Menu) ===
document.addEventListener('DOMContentLoaded', () => {
    
    // 深淺色模式切換與 Favicon 連動
    const themeToggle = document.getElementById('theme-toggle');
    
    // 1. 取得使用者過去的點擊紀錄
    const savedTheme = localStorage.getItem('theme');
    
    // 2. 偵測使用者作業系統目前的設定 (是否為淺色模式)
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    // 3. 決定最終要套用的主題
    // ✨ 改用控制面板的設定作為預設值
    let initialTheme = CONFIG.DEFAULT_THEME; 
    
    if (savedTheme) {
    initialTheme = savedTheme;
    } else if (prefersLight) {
    initialTheme = 'light';
    } 

    // 4. 建立一個專門執行切換的函數 (保持程式碼 DRY 原則)
    function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // ✨ 核心修復：決定這一次要換上的目標圖片網址
    const targetFaviconUrl = theme === 'light' ? CONFIG.FAVICON_LIGHT : CONFIG.FAVICON_DARK;
    
    // ✨ 核心修復：無差別抓取 HTML 內「所有」包含 icon 字眼的 link 標籤
    // (這會同時抓到 apple-touch-icon, shortcut icon, icon 192x192 等所有設定)
    const iconLinks = document.querySelectorAll("link[rel*='icon']");
    
    // ✨ 把所有的圖示網址一次性全部更新！
    iconLinks.forEach(link => {
        link.href = targetFaviconUrl;
    });

    // 處理 Giscus 留言板主題 (保持不變)
    const iframe = document.querySelector('iframe.giscus-frame');
    if (iframe && iframe.contentWindow) {
        const newGiscusTheme = theme === 'light' ? 'light' : 'transparent_dark';
        iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: newGiscusTheme } } },
        'https://giscus.app'
        );
    }
    }

    // 執行初次載入
    applyTheme(initialTheme);

    // 5. 綁定點擊按鈕事件
    themeToggle.addEventListener('click', () => {
    // 取得目前的主題
    let currentAttr = document.documentElement.getAttribute('data-theme');
    
    // 決定下一個主題是什麼 (目前只在 dark 和 light 之間切換)
    let newTheme = currentAttr === 'light' ? 'dark' : 'light';
    
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    });

    // 6. (選用) 監聽系統設定的即時變化
    // 如果使用者在瀏覽你的網頁時，突然去改了手機或電腦的深淺色設定，網頁會跟著瞬間變換！
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    // 只有在使用者沒有手動鎖定主題的情況下，才跟著系統即時變動
    if (!localStorage.getItem('theme')) {
        applyTheme(e.matches ? 'light' : 'dark');
    }
    });

    // 全螢幕漢堡選單
    const menuToggle = document.getElementById('menu-toggle');
    const fullscreenMenu = document.getElementById('fullscreen-menu');
    const navItems = document.querySelectorAll('.nav-item');

    menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    fullscreenMenu.classList.toggle('active');
    if (fullscreenMenu.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    });

    navItems.forEach(item => {
    item.addEventListener('click', () => {
        menuToggle.classList.remove('open');
        fullscreenMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
    });
});

// === 2. 返回頂部 (Back to Top) 邏輯 ===
const bttBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
    bttBtn.classList.add('visible');
    } else {
    bttBtn.classList.remove('visible');
    }
});
bttBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// === 3. JSON 資料載入與卡片動態生成 ===
async function loadProjects() {
    const dynamicNav = document.getElementById('dynamic-nav');
    const portfolioSections = document.getElementById('portfolio-sections');
    const marquee = document.getElementById('marquee-text');

    try {
    // ✨ 改用控制面板設定的路徑
    const response = await fetch(CONFIG.DATA_SOURCE);
    const db = await response.json();
    
    const categories = db.categories;
    const projects = db.projects;

    // ==========================================
    // ✨ 智慧狀態推導與全域標籤注入
    // ==========================================
    projects.forEach(p => {
      let isCardUpdated = p.is_updated;
      
      // 狀態推導：如果卡片沒狀態，但裡面的文章有，就自動升級為 UPDATED
      if (!p.is_new && !isCardUpdated && p.articles && p.articles.length > 0) {
        if (p.articles.some(art => art.is_new || art.is_updated)) {
          isCardUpdated = true;
        }
      }
      p.computed_is_updated = isCardUpdated; // 存起來備用

      // 核心魔法：將狀態化為實體 Tag，按照「最低到最高優先權」塞入陣列最前方
      p.tags = p.tags || [];
      if (p.is_archived && !p.tags.includes('ARCHIVED')) p.tags.unshift('ARCHIVED');
      if (p.is_wip && !p.tags.includes('WIP')) p.tags.unshift('WIP');
      if (isCardUpdated && !p.tags.includes('UPDATED')) p.tags.unshift('UPDATED');
      if (p.is_new && !p.tags.includes('NEW')) p.tags.unshift('NEW');
    });

    window.siteProjects = projects;

    // 1. 處理跑馬燈橫幅 (華爾街報價機版 - 點擊聚焦功能)
    if (marquee) {
        const allTags = projects.flatMap(p => p.tags || []);
        const uniqueTags = [...new Set(allTags)].sort(() => Math.random() - 0.5);
        if (uniqueTags.length > 0) {
        const stockContent = uniqueTags.map((tag, i) => {
            const isUp = i % 2 !== 0; 
            const change = (Math.random() * 3 + 0.1).toFixed(2); 
            const arrow = isUp ? '▲' : '▼';
            const colorClass = isUp ? 'stock-up' : 'stock-down';
            const sign = isUp ? '+' : '-';
            
            // ✨ 讓跑馬燈自動感知它是不是一個「狀態標籤」並掛上 data-status
            const statusAttr = window.STATUS_LIST.includes(tag) ? `data-status="${tag}"` : '';
            return `<span class="clickable-ticker-tag" data-tag="${tag}" ${statusAttr} onclick="window.filterByTag('${tag}', event)"><span class="ticker-name">${tag}</span> <span class="${colorClass}">${arrow} ${sign}${change}%</span></span>`;
        }).join('<span style="color: var(--muted); opacity: 0.5; margin: 0 1rem;">|</span>');

        const container = marquee.parentElement;
        container.innerHTML = `
            <div class="marquee-content">${stockContent} <span style="color: var(--muted); opacity: 0.5; margin: 0 1rem;">|</span> </div>
            <div class="marquee-content">${stockContent} <span style="color: var(--muted); opacity: 0.5; margin: 0 1rem;">|</span> </div>
        `;

        // ✨ 點擊跑馬燈的「空白處」會解除過濾
        container.onclick = (e) => {
            if (window.currentActiveTag && !e.target.closest('.clickable-ticker-tag')) {
            window.clearFilter();
            }
        };

        // ==========================================
        // ✨ 終極修復：讓 JS 引擎接管時的動畫 (WAAPI) 也能完美支援 Hover 暫停！
        // ==========================================
        container.onmouseenter = () => {
            document.querySelectorAll('.marquee-content').forEach(m => {
            // 如果 JS 動畫播放器存在，就強制暫停它
            if (m.marqueePlayer) m.marqueePlayer.pause();
            });
        };
        container.onmouseleave = () => {
            document.querySelectorAll('.marquee-content').forEach(m => {
            // 滑鼠離開，恢復播放
            if (m.marqueePlayer) m.marqueePlayer.play();
            });
        };
        }
    }

    // 清空 Loading
    dynamicNav.innerHTML = '';
    portfolioSections.innerHTML = '';

    // 2. 動態生成全螢幕選單與分類區塊
    categories.forEach(cat => {
        
        // ==============================
        // A. 處理全螢幕選單 (維持簡潔)
        // ==============================
        const menuDescHtml = cat.meta 
        ? `<span style="display:block; color:var(--muted); font-size:0.95rem; font-family:sans-serif; text-transform:none; margin-top:0.5rem; letter-spacing:0;">${cat.meta}</span>` 
        : '';
        
        dynamicNav.innerHTML += `
        <li style="margin: 2.5rem 0;">
            <a href="#${cat.id}-section" class="nav-item" style="margin:0; line-height:1.1; display:inline-block;">
            ${cat.title}
            </a>
            ${menuDescHtml}
        </li>
        `;

        // ==============================
        // B. ✨ 處理首頁主畫面的分類區塊 (雙層排版)
        // ==============================
        const sectionMetaHtml = cat.meta 
        ? `<span style="font-size: 1.1rem; color: var(--muted); font-weight: normal; margin-left: 0.5rem;">- ${cat.meta}</span>` 
        : '';
        
        const sectionDescHtml = cat.description
        ? `<p style="color: var(--muted); margin-top: 0.2rem; margin-bottom: 0; line-height: 1.6; max-width: 800px; font-size: 0.95rem;">${cat.description}</p>`
        : '';

        // ✨ 修改：將 onerror 接入全域防護系統
        const sectionImageHtml = cat.cover_image
        ? `<img src="${cat.cover_image}" alt="icon" class="is-loading" onload="this.classList.remove('is-loading')" onerror="window.handleImageError(this)" style="width: 72px; height: 72px; border-radius: 16px; object-fit: cover; border: 1px solid var(--card-border); box-shadow: 0 4px 15px var(--shadow-base); flex-shrink: 0;">`
        : '';

        // 利用 Flexbox 讓文字在左、圖片在右
        portfolioSections.innerHTML += `
        <section id="${cat.id}-section">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; margin-bottom: 1.8rem;">
            <div style="flex: 1;">
                <h2 style="display: flex; align-items: baseline; flex-wrap: wrap; margin-bottom: 0;">
                ${cat.title}
                ${sectionMetaHtml}
                </h2>
                ${sectionDescHtml}
            </div>
            ${sectionImageHtml}
            </div>
            
            <div class="scroll-wrapper">
            <div class="scroll-hint hint-left" id="${cat.id}-hint-left"></div>
            <div class="grid" id="${cat.id}-grid"></div>
            <div class="scroll-hint hint-right" id="${cat.id}-hint-right"></div>
            </div>
        </section>
        `;
    });

    // 3. 把專案卡片填入對應的分類網格中
    projects.forEach(data => {
        const targetGrid = document.getElementById(`${data.category}-grid`); 
        if (targetGrid) {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-tags', (data.tags || []).join(','));
        
        // ==========================================
        // ✨ 智慧推導邏輯 (State Bubbling)
        // ==========================================
        let isCardNew = data.is_new;
        let isCardUpdated = data.is_updated;
        
        // 如果卡片本身沒設定狀態，但內部文章有新動態，就自動把卡片點亮為 UPDATED！
        if (!isCardNew && !isCardUpdated && data.articles && data.articles.length > 0) {
            const hasActiveArticles = data.articles.some(art => art.is_new || art.is_updated);
            if (hasActiveArticles) {
                isCardUpdated = true; 
            }
        }

        // ==========================================
        // ✨ 動態標籤渲染 (自動套用 data-status 發光屬性)
        // ==========================================
        let tagsHTML = (data.tags || []).map(tag => {
            if (window.STATUS_LIST.includes(tag)) {
                return `<span class="tag status-tag" data-tag="${tag}" data-status="${tag}" onclick="window.filterByTag('${tag}', event, this)">${tag}</span>`;
            }
            // 一般標籤維持原樣
            return `<span class="tag" data-tag="${tag}" onclick="window.filterByTag('${tag}', event, this)">${tag}</span>`;
        }).join('');
        
        let actionText = '';
        if (data.articles && data.articles.length > 0) {
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
            if (window.currentActiveTag) window.clearFilter();
            openProjectIndex(data.id);
            };
            actionText = `<div class="action-btn" style="margin-top: 1.2rem; color: var(--accent); font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; transition: color 0.2s ease;">📖 展開系列 (${data.articles.length}) <span class="action-arrow" data-dir="right" style="font-size: 1.2rem; transition: transform 0.2s ease;">➔</span></div>`;
        } else if (data.link) {
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
            if (window.currentActiveTag) window.clearFilter();
            window.open(data.link, '_blank');
            };
            actionText = `<div class="action-btn" style="margin-top: 1.2rem; color: var(--accent); font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; transition: color 0.2s ease;">🔗 前往外部專案 <span class="action-arrow" data-dir="up-right" style="font-size: 1.2rem; transition: transform 0.2s ease;">↗</span></div>`;
        } else {
            // ✨ 終極修復：針對沒有任何連結與文章的靜態卡片
            card.onclick = (e) => {
            // 如果目前是過濾狀態，點擊它依然可以解除過濾！
            if (window.currentActiveTag) window.clearFilter();
            };
            
            // (選用 UX 優化) 當滑鼠移入時，如果有過濾狀態，讓游標變成手指，暗示它現在是可以點擊來解除過濾的
            card.addEventListener('mouseenter', () => {
            if (window.currentActiveTag) card.style.cursor = 'pointer';
            else card.style.cursor = 'default';
            });
        }

        // C. 處理專案卡片
        const cardMetaHtml = data.meta 
            ? `<span style="font-size: 0.95rem; color: var(--muted); font-weight: normal; margin-left: 0.5rem;">- ${data.meta}</span>` 
            : '';

        const cardDescHtml = data.description
            ? `<p style="color: var(--text); font-size: 0.95rem; line-height: 1.6; margin-top: 0.5rem; margin-bottom: 1rem;">${data.description}</p>`
            : '';

        // ==========================================
        // ✨ 終極升級：專案卡片的獨立圖釘 (右上角絕對定位)
        // ==========================================
        
        // 1. 基底圖片 (無圖則直接留白，移除 📄 預設框)
        const cardImageHtml = data.cover_image
            ? `<img src="${data.cover_image}" alt="cover" class="is-loading" onload="this.classList.remove('is-loading')" onerror="window.handleImageError(this)" style="width: 56px; height: 56px; border-radius: 12px; object-fit: cover; border: 1px solid var(--card-border); flex-shrink: 0; background: var(--bg);">`
            : '';

        // 2. 獨立的大型圖釘 (放置於卡片右上角)
        const techPinSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg);"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`;

        // ✨ 終極淨化：將冗長的 inline-style 徹底拔除，交給 .card-pin 全權處理
        const absolutePinHtml = data.pinned
            ? `<div class="card-pin">${techPinSvg}</div>`
            : '';

        // ==========================================
        // ✨ 日期與版本號智慧組合 (Metadata)
        // ==========================================
        let metaParts = [];
        if (data.date) metaParts.push(data.date);
        if (data.version) metaParts.push(`v${data.version}`); // 自動幫前面加上 v
        
        // ✨ 升級為絕對定位：懸浮於卡片左上角的 padding 空白區，完全不影響標題排版！
        const cardDateHtml = metaParts.length > 0
            ? `<div style="position: absolute; top: 0.5rem; left: 1.6rem; font-family: monospace; font-size: 0.72rem; font-weight: 600; color: var(--accent); opacity: 0.6; letter-spacing: 0.05em;">[${metaParts.join(' • ')}]</div>`
            : '';

        // 3. ✨ 組合 HTML：將 absolutePinHtml 與 cardDateHtml 都拉到排版流之外
        card.innerHTML = `
            ${absolutePinHtml}
            ${cardDateHtml} <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
            <h3 style="display: flex; align-items: baseline; flex-wrap: wrap; margin-bottom: 0.2rem; margin-top: 0;">
                ${data.title}   ${cardMetaHtml}
            </h3>
            ${cardImageHtml}
            </div>
            
            ${cardDescHtml}
            <div class="tags-container">${tagsHTML}</div>
            ${actionText}
        `;
        
        targetGrid.appendChild(card);
        }
    });

    // 👇 首頁卡片的雙向精準偵測
    categories.forEach(cat => {
        const grid = document.getElementById(`${cat.id}-grid`);
        const hintRight = document.getElementById(`${cat.id}-hint-right`);
        const hintLeft = document.getElementById(`${cat.id}-hint-left`); // 新增左箭頭抓取
        
        if (grid && hintRight && hintLeft) {
        const checkScroll = () => {
            const isScrollable = grid.scrollWidth > grid.clientWidth + 5;
            const isAtEnd = Math.ceil(grid.scrollLeft + grid.clientWidth) >= Math.floor(grid.scrollWidth) - 10;
            const isAtStart = grid.scrollLeft <= 10; // 新增：是否在最左邊的起點

            // 右箭頭邏輯
            if (isScrollable && !isAtEnd) hintRight.classList.add('visible');
            else hintRight.classList.remove('visible');

            // 左箭頭邏輯
            if (isScrollable && !isAtStart) hintLeft.classList.add('visible');
            else hintLeft.classList.remove('visible');
        };
        
        grid.addEventListener('scroll', checkScroll);
        
        const imgs = grid.querySelectorAll('img');
        imgs.forEach(img => {
            if (img.complete) checkScroll();
            else img.addEventListener('load', checkScroll);
        });

        new ResizeObserver(checkScroll).observe(grid);
        setTimeout(checkScroll, 100); 
        }
    });

    // 4. 隱藏沒有資料的 Section
    categories.forEach(cat => {
        const grid = document.getElementById(`${cat.id}-grid`);
        if (grid && grid.children.length === 0) {
        document.getElementById(`${cat.id}-section`).style.display = 'none';
        }
    });

    // 5. 重新綁定「點擊選單後自動關閉」的事件
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
        const menuToggle = document.getElementById('menu-toggle');
        const fullscreenMenu = document.getElementById('fullscreen-menu');
        menuToggle.classList.remove('open');
        fullscreenMenu.classList.remove('active');
        document.body.style.overflow = '';
        });
    });

    // 6. 設定滾動浮現動畫 (Scroll Reveal)
    const observerOptions = { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1 };
    const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            observer.unobserve(entry.target);
        }
        });
    }, observerOptions);

    document.querySelectorAll('.card').forEach(card => {
        cardObserver.observe(card);
    });

    } catch (err) {
    console.error("載入失敗:", err);
    portfolioSections.innerHTML = `
        <div class="error-container">
        <span class="error-text">ERR: FAILED TO FETCH DATA</span>
        </div>
    `;
    if (marquee) {
        marquee.innerHTML = `<span>SYSTEM OFFLINE • CONNECTION REFUSED • </span>`.repeat(4);
        marquee.style.color = "var(--error-color)";
    }
    }
}

// 啟動資料載入
window.addEventListener('DOMContentLoaded', loadProjects);

// === 4. 索引式 Markdown Modal 邏輯 ===
const modalOverlay = document.getElementById('md-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

// ==========================================
// ✨ 核心升級：同步自適應高度切換 (完美 CSS FLIP 引擎)
// ==========================================
function switchModalContent(updateDOMCallback) {
    function update() {
        updateDOMCallback();
    }
    if (document.startViewTransition) {
        document.startViewTransition(() => {
            update();
        });
    } else {
        update();
    }
}

// ==========================================
// 打開該專案的「目錄頁面」
// ==========================================
window.openProjectIndex = function(projectId, restoreScroll = false) {
    // ✨ 將原本的邏輯包進 switchModalContent
    switchModalContent(() => {
        document.getElementById('modal-top-left').innerHTML = '';
        document.getElementById('toc-mount-point').innerHTML = '';

        document.querySelector('.modal-top-bar').classList.add('is-index-mode');

        const proj = window.siteProjects.find(p => p.id === projectId);
        if (!proj || !proj.articles) return;

        let indexHtml = `<h1 style="padding-right: 4.5rem;">${proj.title} - 內容索引</h1><ul style="list-style:none; padding-left:0; margin-top:1.5rem;">`;
        
        proj.articles.sort((a, b) => {
            const aPinned = a.pinned ? 1 : 0;
            const bPinned = b.pinned ? 1 : 0;
            return bPinned - aPinned;
        });
        
        proj.articles.forEach((art, idx) => {
            let descHtml = art.description ? `<span style="font-size: 0.95rem; color: var(--muted); line-height: 1.4;">- ${art.description}</span>` : '';
            let dateHtml = art.date ? `<span style="font-family: monospace; font-size: 0.85rem; color: var(--muted); margin-left: auto; padding-left: 1rem; flex-shrink: 0;">${art.date}</span>` : '';
            let statusBadgeHtml = window.getStatusBadgeHtml(art, true);

            const techPinSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-45deg);"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`;

            let baseIconHtml = art.cover_image
                ? `<img src="${art.cover_image}" alt="cover" class="is-loading" onload="this.classList.remove('is-loading')" onerror="window.handleImageError(this)" style="position: relative; z-index: 2; width: 44px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border: 1px solid var(--card-border);">`
                : `<div style="position: relative; z-index: 2; width: 44px; height: 44px; flex-shrink: 0; background: var(--bg); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 1px solid var(--card-border);">📄</div>`;

            let pinnedBadgeHtml = art.pinned ? `<div class="modal-pin">${techPinSvg}</div>` : '';

            let iconHtml = `<div style="position: relative; flex-shrink: 0; display: flex;">${pinnedBadgeHtml}${baseIconHtml}</div>`;

            indexHtml += `
                <li style="margin-bottom: 1rem; border-bottom: 1px dashed var(--divider-line); padding-bottom: 0.8rem;">
                <a href="#" onclick="event.preventDefault(); openArticle('${projectId}', ${idx})" 
                    style="display: flex; align-items: center; gap: 1rem; text-decoration: none; padding: 0.5rem; border-radius: 0.8rem; transition: background-color 0.2s;">
                    
                    ${iconHtml}
                    
                    <div style="display: flex; align-items: center; width: 100%; flex-wrap: wrap; row-gap: 0.4rem;">
                        <div style="display: flex; align-items: baseline; flex-wrap: wrap; gap: 0.5rem;">
                            <span style="font-size: 1.15rem; color: var(--accent); font-weight: bold;">
                                ${art.title}${statusBadgeHtml}
                            </span>
                            ${descHtml}
                        </div>
                        ${dateHtml}
                    </div>
                </a>
                </li>`;
        });
        indexHtml += `</ul>`;
        indexHtml += `<style>#modal-body li a:hover { background: rgba(128, 128, 128, 0.05); }</style>`;

        modalBody.innerHTML = indexHtml;
        document.querySelector('.modal-content').style.viewTransitionName = 'modal-content';
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        const modalContainer = document.querySelector('.modal-content');
        window.pendingModalScroll =
        window.lastIndexScrollPos ?? 0;
    }); // ✨ switchModalContent 結束
};

// ==========================================
// 打開具體的「文章內文」
// ==========================================
window.openArticle = function(projectId, articleIndex) {
    // ✨ 在淡出前，先記住目前的捲軸位置
    window.lastIndexScrollPos = document.querySelector('.modal-content').scrollTop;

    // ✨ 將原本的邏輯包進 switchModalContent
    switchModalContent(() => {
        document.querySelector('.modal-top-bar').classList.remove('is-index-mode');

        const proj = window.siteProjects.find(p => p.id === projectId);
        const article = proj.articles[articleIndex];
        
        const articleHtml = marked.parse(article.content);
        modalBody.innerHTML = articleHtml;
        document.querySelector('.modal-content').scrollTop = 0;

        const firstH1 = modalBody.querySelector('h1');
        if (firstH1 && (article.date || article.is_new || article.is_updated || article.is_wip || article.is_archived)){
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'baseline';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.flexWrap = 'wrap';
            wrapper.style.borderBottom = '2px solid var(--card-border)';
            wrapper.style.paddingBottom = '0.3rem';
            wrapper.style.marginBottom = '0.8rem';
            wrapper.style.marginTop = (firstH1 === modalBody.firstElementChild) ? '0' : '0.8rem';

            firstH1.style.borderBottom = 'none';
            firstH1.style.paddingBottom = '0';
            firstH1.style.margin = '0';

            firstH1.parentNode.insertBefore(wrapper, firstH1);
            wrapper.appendChild(firstH1);

            let statusBadge = window.getStatusBadgeHtml(article, false);
            const metaHtml = `
                <div style="display: flex; align-items: center; gap: 0.8rem; font-family: monospace; font-size: 0.95rem; color: var(--muted);">
                    ${statusBadge}
                    ${article.date ? `<span>${article.date}</span>` : ''}
                </div>
            `;
            wrapper.insertAdjacentHTML('beforeend', metaHtml);
        }

        modalBody.querySelectorAll('img').forEach(img => {
          if (img.complete && img.naturalWidth === 0) {
            window.handleImageError(img);
          } else if (!img.complete) {
            img.classList.add('is-loading');
            img.onload = () => img.classList.remove('is-loading');
            img.onerror = () => window.handleImageError(img);
          }
        });

        const topLeft = document.getElementById('modal-top-left');
        topLeft.innerHTML = ''; 
        
        const backBtn = document.createElement('button');
        backBtn.className = 'modal-back-btn'; 
        backBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> <span>返回索引</span>`;
        backBtn.onclick = () => openProjectIndex(projectId, true);
        topLeft.appendChild(backBtn);

        const tocMount = document.getElementById('toc-mount-point');
        tocMount.innerHTML = ''; 
        
        const headings = modalBody.querySelectorAll('h1, h2, h3'); 
        if (headings.length > 1) {
            const tocWrapper = document.createElement('div');
            tocWrapper.className = 'toc-wrapper';

            const tocBtn = document.createElement('div');
            tocBtn.className = 'toc-toggle-btn';
            tocBtn.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';

            const tocDropdown = document.createElement('div');
            tocDropdown.className = 'toc-dropdown';
            tocDropdown.innerHTML = '<ul class="toc-list"></ul>';
            const tocList = tocDropdown.querySelector('.toc-list');

            headings.forEach((h, index) => {
                const id = `article-heading-${index}`;
                h.id = id;

                const li = document.createElement('li');
                li.className = `toc-${h.tagName.toLowerCase()}`; 
                
                const a = document.createElement('a');
                a.innerText = h.innerText;
                a.href = "javascript:void(0)"; 
                
                a.onclick = () => {
                    const modalContainer = document.querySelector('.modal-content');

                    requestAnimationFrame(() => {
                        if(window.lastIndexScrollPos !== undefined){
                            modalContainer.scrollTop =
                                window.lastIndexScrollPos;
                        }
                    });
                    h.classList.add('highlight-flash');
                    setTimeout(() => { h.classList.remove('highlight-flash'); }, 1000);
                    tocBtn.classList.remove('open');
                    tocDropdown.classList.remove('active');
                };
                
                li.appendChild(a);
                tocList.appendChild(li);
            });

            tocBtn.onclick = () => {
                tocBtn.classList.toggle('open');
                tocDropdown.classList.toggle('active');
            };

            tocWrapper.appendChild(tocBtn);
            tocWrapper.appendChild(tocDropdown);
            tocMount.appendChild(tocWrapper);
        }

        const galleries = modalBody.querySelectorAll('.gallery');
        galleries.forEach(gallery => {
            const wrapper = document.createElement('div');
            wrapper.className = 'scroll-wrapper';
            gallery.parentNode.insertBefore(wrapper, gallery);

            const hintLeft = document.createElement('div');
            hintLeft.className = 'scroll-hint hint-left';
            wrapper.appendChild(hintLeft);
            wrapper.appendChild(gallery);

            const hintRight = document.createElement('div');
            hintRight.className = 'scroll-hint hint-right';
            wrapper.appendChild(hintRight);

            const checkScroll = () => {
                const isScrollable = gallery.scrollWidth > gallery.clientWidth + 5;
                const isAtEnd = Math.ceil(gallery.scrollLeft + gallery.clientWidth) >= Math.floor(gallery.scrollWidth) - 10;
                const isAtStart = gallery.scrollLeft <= 10;

                if (isScrollable && !isAtEnd) hintRight.classList.add('visible');
                else hintRight.classList.remove('visible');

                if (isScrollable && !isAtStart) hintLeft.classList.add('visible');
                else hintLeft.classList.remove('visible');
            };
            
            gallery.addEventListener('scroll', checkScroll);
            
            const imgs = gallery.querySelectorAll('img');
            imgs.forEach(img => {
                if (img.complete) checkScroll();
                else img.addEventListener('load', checkScroll);
            });

            new ResizeObserver(checkScroll).observe(gallery);
            setTimeout(checkScroll, 100); 
        });

        const figures = modalBody.querySelectorAll('.gallery figure');
        figures.forEach(figure => {
            figure.addEventListener('click', () => {
                figure.classList.toggle('hide-caption');
            });
        });
    }); // ✨ switchModalContent 結束
};

// === 5. 標籤點擊聚焦邏輯 (Focus Highlight) ===
window.currentActiveTag = null; 
window.highlightedCards = []; 
window.currentCardIndex = 0;  

window.clearFilter = function(event) {
    if (event) event.stopPropagation(); 

    window.currentActiveTag = null;
    window.highlightedCards = []; 
    window.currentCardIndex = 0;  
    
    document.querySelectorAll('.card').forEach(c => {
    c.classList.remove('highlighted', 'jump-bump');
    });
    
    document.querySelectorAll('.active-tag').forEach(t => t.classList.remove('active-tag'));
    
    const toast = document.getElementById('filter-toast');
    if (toast) toast.classList.remove('active');

    // ✨ 跑馬燈終極修復：原地接續滾動 (不跳回設定前)
    document.querySelectorAll('.marquee-content').forEach(m => {
    // 1. 先停掉可能正在執行的 WAAPI 動畫
    if (m.marqueePlayer) {
        m.marqueePlayer.cancel();
        m.marqueePlayer = null;
    }

    // 2. 讀取跑馬燈「現在這一瞬間」的絕對座標
    const style = window.getComputedStyle(m);
    const matrix = new DOMMatrix(style.transform);
    let currentX = matrix.m41; 
    
    const contentWidth = m.offsetWidth;
    
    // 正規化座標，避免因為無縫輪播把位置推到不合理範圍
    currentX = currentX % contentWidth;
    if (currentX > 0) currentX -= contentWidth;

    // 3. 計算剩下要走完的比例與時間 (總時間 25 秒)
    const remainingFraction = 1 - (Math.abs(currentX) / contentWidth);
    const remainingTime = (CONFIG.MARQUEE_SPEED * 1000) * remainingFraction; 

    m.style.transition = 'none';
    m.style.animation = 'none';
    
    // 4. 動態生成一次性動畫，讓它穩穩滑到終點
    m.marqueePlayer = m.animate([
        { transform: `translateX(${currentX}px)` },
        { transform: `translateX(-${contentWidth}px)` }
    ], {
        duration: remainingTime,
        easing: 'linear'
    });

    // 5. 跑完之後，無縫接回 CSS 原本的無限迴圈動畫
    m.marqueePlayer.onfinish = () => {
        m.style.transform = '';
        m.style.animation = ''; 
        m.marqueePlayer = null;
    };
    });
};

// ✨ 注意：這裡新增了 clickedElement 參數接收剛剛傳遞過來的 this
window.filterByTag = function(targetTag, event, clickedElement) {
    if (event) event.stopPropagation(); 

    if (window.currentActiveTag === targetTag) {
    window.clearFilter();
    return;
    }

    window.clearFilter();
    window.currentActiveTag = targetTag;
    window.highlightedCards = []; 
    
    // ==========================================
    // 1. ✨ 跑馬燈平滑置中魔法 (防破圖修正版)
    // ==========================================
    const firstContent = document.querySelector('.marquee-content');
    const targetTagEl = firstContent.querySelector(`.clickable-ticker-tag[data-tag="${targetTag}"]`);
    
    if (targetTagEl) {
    const contentWidth = firstContent.offsetWidth;
    const containerWidth = firstContent.parentElement.clientWidth;
    const tagCenter = targetTagEl.offsetLeft + (targetTagEl.offsetWidth / 2);
    
    // 算出目標位置，並嚴格限制在 0 ~ -contentWidth 之間 (這就是絕對安全區)
    let targetX = (containerWidth / 2) - tagCenter;
    targetX = targetX % contentWidth;
    if (targetX > 0) targetX -= contentWidth;
    
    document.querySelectorAll('.marquee-content').forEach(m => {
        if (m.marqueePlayer) {
        m.marqueePlayer.cancel();
        m.marqueePlayer = null;
        }
        
        const style = window.getComputedStyle(m);
        const matrix = new DOMMatrix(style.transform);
        let currentX = matrix.m41; 
        
        // 強制將現在的座標也拉回安全區，消滅任何往右拉的可能性
        currentX = currentX % contentWidth;
        if (currentX > 0) currentX -= contentWidth;
        
        m.style.transition = 'none';
        m.style.transform = `translateX(${currentX}px)`;
        m.style.animation = 'none';

        void m.offsetWidth; // 強制重繪

        // ✨ 動態車速演算：根據要滑行的距離長短，決定煞車時間，確保不會「太快」
        const travelDistance = Math.abs(targetX - currentX);
        const travelRatio = travelDistance / contentWidth;
        // 基礎滑行 0.8 秒，最長可以滑行 1.5 秒
        const dynamicDuration = 0.8 + (travelRatio * 0.7);

        // 套用動態時間與超絲滑貝茲曲線
        m.style.transition = `transform ${dynamicDuration}s cubic-bezier(0.22, 1, 0.36, 1)`;
        m.style.transform = `translateX(${targetX}px)`;
    });
    }

    document.querySelectorAll(`[data-tag="${targetTag}"]`).forEach(t => t.classList.add('active-tag'));

    document.querySelectorAll('.card').forEach(card => {
    const tags = card.getAttribute('data-tags');
    if (tags && tags.includes(targetTag)) {
        card.classList.add('highlighted');
        window.highlightedCards.push(card); 
    }
    });
    
    // ==========================================
    // 2. ✨ 上下文感知：判斷是從哪張卡片點擊的？
    // ==========================================
    // 找找看剛剛點擊的標籤，它的外層是不是包著一張卡片？
    let clickedCard = clickedElement ? clickedElement.closest('.card') : null;
    
    if (clickedCard) {
    // 如果是，就找出這張卡片在「發光陣列」裡排第幾個，並設定為起始進度！
    window.currentCardIndex = window.highlightedCards.indexOf(clickedCard);
    if (window.currentCardIndex === -1) window.currentCardIndex = 0;
    } else {
    // 如果是點擊跑馬燈的標籤，就乖乖從第 1 個開始
    window.currentCardIndex = 0;
    }

    const toast = document.getElementById('filter-toast');
    const toastText = document.getElementById('toast-text');
    const toastCount = document.getElementById('toast-count');
    
    if (toast && toastText) {
    toastText.innerHTML = `<span class="toast-tag-name">${targetTag}</span>`;
    // ✨ 更新膠囊數字為目前的精準進度
    if (toastCount) toastCount.innerText = `(${window.currentCardIndex + 1}/${window.highlightedCards.length})`;
    toast.classList.add('active');
    }

    if (window.highlightedCards.length > 0) {
    // ✨ 直接鎖定到使用者目前點擊的這張卡片
    const targetCard = window.highlightedCards[window.currentCardIndex];
    
    const cardRect = targetCard.getBoundingClientRect();
    const isVisible = cardRect.left >= 0 && cardRect.right <= window.innerWidth;
    const delay = isVisible ? 150 : 300; 
    
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    
    setTimeout(() => {
        targetCard.classList.remove('jump-bump');
        void targetCard.offsetWidth; 
        targetCard.classList.add('jump-bump');
        
        // ✨ 新增：動畫播完 (600ms) 後立刻拔除 class，保持卡片狀態乾淨，不干擾後續 Hover
        setTimeout(() => {
        targetCard.classList.remove('jump-bump');
        }, 600);
    }, delay);
    }
};

window.scrollToNextCard = function(event) {
    if (event) event.stopPropagation();

    if (window.highlightedCards.length <= 1) return;

    window.currentCardIndex = (window.currentCardIndex + 1) % window.highlightedCards.length;
    
    const toastCount = document.getElementById('toast-count');
    if (toastCount) {
    toastCount.innerText = `(${window.currentCardIndex + 1}/${window.highlightedCards.length})`;
    }

    const targetCard = window.highlightedCards[window.currentCardIndex];
    
    // ✨ 同理：動態判斷跳轉延遲
    const cardRect = targetCard.getBoundingClientRect();
    const isVisible = cardRect.left >= 0 && cardRect.right <= window.innerWidth;
    const delay = isVisible ? 150 : 300;

    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    
    setTimeout(() => {
    targetCard.classList.remove('jump-bump');
    void targetCard.offsetWidth;
    targetCard.classList.add('jump-bump');
    
    // ✨ 同理：在這裡也補上清理動作
    setTimeout(() => {
        targetCard.classList.remove('jump-bump');
    }, 600);
    }, delay);
};

// 為了保留首頁的測試按鈕，加入這個純文字渲染函數
window.openMarkdownModal = function(markdownText) {
    modalBody.innerHTML = marked.parse(markdownText);
    document.querySelector('.modal-content').style.viewTransitionName = 'modal-content';
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.querySelector('.modal-content').scrollTop = 0;
};

function closeModal() {

    const modalContent =
        document.querySelector('.modal-content');

    modalContent.style.viewTransitionName = 'none';

    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';

    requestAnimationFrame(() => {
        modalContent.style.removeProperty('view-transition-name');
    });
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
});