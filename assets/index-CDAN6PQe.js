(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))o(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const s of e.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function a(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function o(t){if(t.ep)return;t.ep=!0;const e=a(t);fetch(t.href,e)}})();const N="BookHandoverDB",P=1,y="books",b=()=>new Promise((n,r)=>{const a=indexedDB.open(N,P);a.onerror=o=>{console.error("Database error:",o.target.error),r(o.target.error)},a.onsuccess=o=>{n(o.target.result)},a.onupgradeneeded=o=>{const t=o.target.result;t.objectStoreNames.contains(y)||t.createObjectStore(y,{keyPath:"id",autoIncrement:!0})}}),T=async n=>{const r=await b();return new Promise((a,o)=>{const t=r.transaction([y],"readwrite"),e=t.objectStore(y);t.oncomplete=()=>a(),t.onerror=s=>o(s.target.error),n.forEach(s=>{const i={title:s.title||"Unknown Title",quantity:parseInt(s.quantity)||0,isbns:Array.isArray(s.isbns)?s.isbns:s.isbn?[s.isbn]:[],handedOver:parseInt(s.handedOver)||0,createdAt:new Date().toISOString()};e.add(i)})})},R=async()=>{const n=await b();return new Promise((r,a)=>{const e=n.transaction([y],"readonly").objectStore(y).getAll();e.onsuccess=()=>r(e.result),e.onerror=s=>a(s.target.error)})},I=async(n,r)=>{const a=await b();return new Promise((o,t)=>{const s=a.transaction([y],"readwrite").objectStore(y),i=s.get(n);i.onsuccess=()=>{const c=i.result;c.handedOver=r;const l=s.put(c);l.onsuccess=()=>o(),l.onerror=u=>t(u.target.error)},i.onerror=c=>t(c.target.error)})},C=async()=>{const n=await b();return new Promise((r,a)=>{const e=n.transaction([y],"readwrite").objectStore(y).clear();e.onsuccess=()=>r(),e.onerror=s=>a(s.target.error)})},$=n=>new Promise(r=>setTimeout(r,n)),k=async n=>{const r=localStorage.getItem("cors_proxy_url");if(!r)return console.warn("CORS Proxy URL is not set. Skipping fetch."),"";const a=`${r}?${encodeURIComponent(n)}`,o=5;for(let t=0;t<o;t++)try{const e=await fetch(a);if(e.ok)return await e.text();if((e.status===429||e.status===400)&&(console.warn(`Proxy returned ${e.status}. Retrying (${t+1}/${o})...`),t<o-1)){await $(1e3);continue}throw new Error(`Proxy Error: ${e.status}`)}catch(e){if(t===o-1)throw e;console.warn(`Fetch error: ${e.message}. Retrying (${t+1}/${o})...`),await $(1e3)}},S=async n=>{try{console.log(`Searching Books.com.tw for: ${n}`);const r=`https://search.books.com.tw/search/query/key/${encodeURIComponent(n)}/cat/all`,a=await k(r),o=new DOMParser,e=o.parseFromString(a,"text/html").querySelector('h4 a[href*="item/"]');if(!e)return console.log("No results found on Books.com.tw"),[];const s=e.getAttribute("href"),i=s.match(/item\/([\w\d]+)/);if(!i||!i[1])return console.log("Could not extract item ID from link:",s),[];const l=`https://www.books.com.tw/products/${i[1]}`;console.log(`Constructed detail URL: ${l}`);const u=await k(l),v=o.parseFromString(u,"text/html").body.textContent.match(/ISBN：(\d{13})/);return v&&v[1]?(console.log(`Found ISBN on Books.com.tw: ${v[1]}`),[v[1]]):[]}catch(r){return console.error("Error searching Books.com.tw:",r),[]}},D=async(n,r)=>{try{r&&r("Google Books");const a=localStorage.getItem("google_books_api_key");let o=`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(n)}&maxResults=5`;a&&(o+=`&key=${a}`);const t=await fetch(o);if(t.status===429)console.warn("Google Books API Rate Limit Exceeded. Trying fallback...");else if(t.ok){const s=await t.json();if(s.items&&s.items.length>0){const i=new Set;if(s.items.forEach(c=>{const l=c.volumeInfo?.industryIdentifiers;l&&l.forEach(u=>{u.type==="ISBN_13"&&i.add(u.identifier)})}),i.size>0)return Array.from(i)}}return localStorage.getItem("cors_proxy_url")?(console.log("Google Books returned no results. Trying Books.com.tw fallback..."),r&&r("Books.com.tw"),await S(n)):(console.log("Google Books returned no results and no CORS Proxy set. Skipping Books.com.tw fallback."),[])}catch(a){return console.error(`Error searching ISBN for "${n}":`,a),localStorage.getItem("cors_proxy_url")?(r&&r("Books.com.tw"),await S(n)):[]}},H=n=>{const r=n.split(/\r?\n/).filter(a=>a.trim()!=="");return r.length===0?[]:(r[0].split(",").map(a=>a.trim().replace(/^"(.*)"$/,"$1")),r.slice(1).map(a=>{const o=[];let t="",e=!1;for(let s=0;s<a.length;s++){const i=a[s];i==='"'?e=!e:i===","&&!e?(o.push(t.trim().replace(/^"(.*)"$/,"$1")),t=""):t+=i}return o.push(t.trim().replace(/^"(.*)"$/,"$1")),{title:o[0]||"",quantity:parseInt(o[1])||0}}).filter(a=>a.title!==""))},q=(n,r)=>{const a=new Blob([JSON.stringify(n,null,2)],{type:"application/json"}),o=URL.createObjectURL(a),t=document.createElement("a");t.href=o,t.download=r,document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(o)};let d=null;const A=()=>{d||(d=new(window.AudioContext||window.webkitAudioContext)),d.state==="suspended"&&d.resume()},_=()=>{try{A();const n=d.createOscillator(),r=d.createGain();n.connect(r),r.connect(d.destination),n.type="sine",n.frequency.setValueAtTime(880,d.currentTime),r.gain.setValueAtTime(0,d.currentTime),r.gain.linearRampToValueAtTime(.1,d.currentTime+.05),r.gain.exponentialRampToValueAtTime(.01,d.currentTime+.2),n.start(),n.stop(d.currentTime+.2)}catch(n){console.error("Audio playback failed:",n)}},E=()=>{try{A();const n=d.createOscillator(),r=d.createGain();n.connect(r),r.connect(d.destination),n.type="square",n.frequency.setValueAtTime(150,d.currentTime),r.gain.setValueAtTime(0,d.currentTime),r.gain.linearRampToValueAtTime(.1,d.currentTime+.05),r.gain.exponentialRampToValueAtTime(.01,d.currentTime+.4),n.start(),n.stop(d.currentTime+.4)}catch(n){console.error("Audio playback failed:",n)}};let p=[];document.addEventListener("DOMContentLoaded",async()=>{await b(),await h(),U(),g("convert"),f()});const U=()=>{const n=document.querySelectorAll(".nav-btn");n.forEach(r=>{r.addEventListener("click",()=>{n.forEach(o=>o.classList.remove("active")),r.classList.add("active");const a=r.getAttribute("data-view");g(a)})})},h=async()=>{p=await R(),f()},f=()=>{const n=p.reduce((o,t)=>o+t.quantity,0),r=p.reduce((o,t)=>o+t.handedOver,0),a=n>0?Math.round(r/n*100):0;document.getElementById("overall-progress").textContent=a},g=n=>{const r=document.getElementById("view-container");switch(document.querySelectorAll(".nav-btn").forEach(o=>{o.getAttribute("data-view")===n?o.classList.add("active"):o.classList.remove("active")}),n){case"convert":r.innerHTML=M(),j();break;case"upload":r.innerHTML=z(),V();break;case"with-isbn":r.innerHTML=K();break;case"without-isbn":r.innerHTML=J();break;case"handover":r.innerHTML=W(),G();break}},M=()=>{const r=localStorage.getItem("google_books_api_key")?`
        <div class="api-key-section" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: rgba(35, 134, 54, 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="color: var(--success-color); font-weight: 600;">✅ API Key 已設定</p>
                <button class="btn btn-secondary" id="clear-api-key-btn" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">清除 API Key</button>
            </div>
        </div>`:`
        <div class="api-key-section" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color);">
            <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">設定 Google Books API Key (選填，可增加查詢配額)</p>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="api-key-input" placeholder="輸入 API Key..." style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--panel-bg); color: var(--text-primary);">
                <button class="btn" id="save-api-key-btn" style="padding: 0.5rem 1rem;">儲存</button>
            </div>
        </div>`,a=localStorage.getItem("cors_proxy_url"),o=a?`
        <div class="proxy-url-section" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: rgba(88, 166, 255, 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="color: var(--accent-color); font-weight: 600;">🌐 CORS Proxy 已設定</p>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">URL: ${a}</p>
                </div>
                <button class="btn btn-secondary" id="clear-proxy-url-btn" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">清除 Proxy</button>
            </div>
        </div>`:`
        <div class="proxy-url-section" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color);">
            <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">設定 CORS Proxy URL (選填，用於抓取博客來資料)</p>
            <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">範例: https://proxy.example.com/api</p>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="proxy-url-input" placeholder="輸入完整 Proxy URL (包含 http/https)..." style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--panel-bg); color: var(--text-primary);">
                <button class="btn" id="save-proxy-url-btn" style="padding: 0.5rem 1rem;">儲存</button>
            </div>
        </div>`;return`
    <div class="view-card">
      <h2>📄 轉換書單 → 點交系統書單</h2>
      <p class="description">上傳 CSV 書單，系統會自動使用 Google Books API 查詢 ISBN，並產生點交系統專用的 JSON 檔案。</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          ${r}
          ${o}
      </div>

      <div class="upload-box" id="csv-upload-box">
        <p style="font-size: 2rem; margin-bottom: 1rem;">📤</p>
        <p>點擊或拖曳 CSV 檔案至此處</p>
        <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
      </div>
      
      <div id="convert-result" style="margin-top: 2rem;"></div>
    </div>
  `},j=()=>{const n=document.getElementById("csv-upload-box"),r=document.getElementById("csv-file-input"),a=document.getElementById("save-api-key-btn"),o=document.getElementById("clear-api-key-btn"),t=document.getElementById("api-key-input");a&&a.addEventListener("click",()=>{const c=t.value.trim();c&&(localStorage.setItem("google_books_api_key",c),g("convert"))}),o&&o.addEventListener("click",()=>{confirm("確定要清除 API Key 嗎？")&&(localStorage.removeItem("google_books_api_key"),g("convert"))});const e=document.getElementById("save-proxy-url-btn"),s=document.getElementById("clear-proxy-url-btn"),i=document.getElementById("proxy-url-input");e&&e.addEventListener("click",()=>{let c=i.value.trim();if(c){if(!c.startsWith("http://")&&!c.startsWith("https://")){alert("請輸入包含 http:// 或 https:// 的完整 URL");return}localStorage.setItem("cors_proxy_url",c),g("convert")}}),s&&s.addEventListener("click",()=>{confirm("確定要清除 CORS Proxy URL 嗎？")&&(localStorage.removeItem("cors_proxy_url"),g("convert"))}),n.addEventListener("click",()=>r.click()),r.addEventListener("change",async c=>{const l=c.target.files[0];l&&await L(l)}),n.addEventListener("dragover",c=>{c.preventDefault(),n.style.borderColor="var(--accent-color)"}),n.addEventListener("dragleave",()=>{n.style.borderColor="var(--border-color)"}),n.addEventListener("drop",async c=>{c.preventDefault(),n.style.borderColor="var(--border-color)";const l=c.dataTransfer.files[0];l&&l.name.endsWith(".csv")&&await L(l)})},L=async n=>{const r=document.getElementById("convert-result");r.innerHTML='<div class="spinner"></div><p>正在讀取 CSV 並查詢 ISBN...</p>';const a=await n.text(),o=H(a);if(o.length===0){r.innerHTML='<p style="color: var(--danger-color);">❌ CSV 檔案格式錯誤或無資料</p>';return}const t=[];for(let s=0;s<o.length;s++){const i=o[s],c=await D(i.title,l=>{r.innerHTML=`<div class="spinner"></div>
                                   <p>正在查詢 ISBN... (${s+1}/${o.length})</p>
                                   <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">來源: <span style="color: var(--accent-color); font-weight: 500;">${l}</span></p>
                                   <p style="font-size: 0.85rem; color: var(--text-secondary);">書名: ${i.title}</p>`});t.push({title:i.title,quantity:i.quantity,isbns:c}),await new Promise(l=>setTimeout(l,300))}let e="<h3>✅ 轉換完成</h3>";e+='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th></tr></thead><tbody>',t.forEach(s=>{const i=s.isbns.length>0?s.isbns.join(", "):"查無 ISBN";e+=`<tr><td>${s.title}</td><td>${s.quantity}</td><td>${i}</td></tr>`}),e+="</tbody></table>",e+='<div style="margin-top: 1.5rem;">',e+='<button class="btn" id="download-json-btn" style="margin-right: 1rem;">💾 下載 JSON 檔案</button>',e+='<button class="btn btn-primary" id="import-db-btn">📥 直接匯入資料庫</button>',e+="</div>",r.innerHTML=e,document.getElementById("download-json-btn").addEventListener("click",()=>{const s=new Date().toISOString().split("T")[0];q(t,`book-handover-list-${s}.json`)}),document.getElementById("import-db-btn").addEventListener("click",async()=>{const s=t.map(i=>({title:i.title,quantity:parseInt(i.quantity)||0,isbns:Array.isArray(i.isbns)?i.isbns:[],handedOver:0}));await T(s),await h(),g("upload")})},z=()=>`
    <div class="view-card">
      <h2>📥 上傳點交系統書單</h2>
      <p class="description">上傳先前產生的 JSON 書單檔案，系統會將資料儲存至本地資料庫。</p>
      
      ${p.length>0?`
        <div style="background: rgba(88, 166, 255, 0.1); border: 1px solid var(--accent-color); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="color: var(--accent-color);">📊 資料庫中已有 ${p.length} 筆書籍資料</p>
          <div style="margin-top: 0.5rem;">
            <button class="btn" id="download-db-btn" style="margin-right: 0.5rem;">💾 下載書單</button>
            <button class="btn btn-danger" id="clear-db-btn">🗑️ 清空現有資料</button>
          </div>
        </div>
      `:""}
      
      <div class="upload-box" id="json-upload-box">
        <p style="font-size: 2rem; margin-bottom: 1rem;">📤</p>
        <p>點擊或拖曳 JSON 檔案至此處</p>
        <input type="file" id="json-file-input" accept=".json" style="display: none;">
      </div>
      
      <div id="upload-result" style="margin-top: 2rem;"></div>
    </div>
  `,V=()=>{const n=document.getElementById("json-upload-box"),r=document.getElementById("json-file-input"),a=document.getElementById("clear-db-btn"),o=document.getElementById("download-db-btn");o&&o.addEventListener("click",()=>{const t=p.map(s=>({title:s.title,quantity:s.quantity,isbns:s.isbns})),e=new Date().toISOString().split("T")[0];q(t,`book-handover-list-${e}.json`)}),a&&a.addEventListener("click",async()=>{confirm("確定要清空所有書籍資料嗎？此操作無法復原！")&&(await C(),await h(),g("upload"))}),n.addEventListener("click",()=>r.click()),r.addEventListener("change",async t=>{const e=t.target.files[0];e&&await O(e)}),n.addEventListener("dragover",t=>{t.preventDefault(),n.style.borderColor="var(--accent-color)"}),n.addEventListener("dragleave",()=>{n.style.borderColor="var(--border-color)"}),n.addEventListener("drop",async t=>{t.preventDefault(),n.style.borderColor="var(--border-color)";const e=t.dataTransfer.files[0];e&&e.name.endsWith(".json")&&await O(e)})},O=async n=>{const r=document.getElementById("upload-result");try{const a=await n.text(),o=JSON.parse(a);if(!Array.isArray(o))throw new Error("JSON 格式錯誤：必須是陣列");const t=o.map(e=>({title:e.title,quantity:parseInt(e.quantity)||0,isbns:Array.isArray(e.isbns)?e.isbns:[],handedOver:0}));await T(t),await h(),r.innerHTML=`<p style="color: var(--success-color);">✅ 成功上傳 ${t.length} 筆書籍資料！</p>`,setTimeout(()=>g("upload"),1500)}catch(a){r.innerHTML=`<p style="color: var(--danger-color);">❌ 上傳失敗: ${a.message}</p>`}},K=()=>{const n=p.filter(e=>e.isbns&&e.isbns.length>0),r=n.filter(e=>e.handedOver<e.quantity),a=n.filter(e=>e.handedOver>=e.quantity),o=r.reduce((e,s)=>e+(s.quantity-s.handedOver),0),t=a.reduce((e,s)=>e+s.handedOver,0);return`
    <div class="view-card">
      <h2>✅ 有 ISBN 的書籍</h2>
      <p class="description">顯示所有已查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${r.length} 款 / 共 ${o} 本)
          </span>
        </h3>
        ${x(r)}
      </div>
      
      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>
          ✅ 已點交的書
          <span style="color: var(--success-color); font-size: 0.9em;">
            (${a.length} 款 / 共 ${t} 本)
          </span>
        </h3>
        ${x(a)}
      </div>
    </div>
  `},J=()=>{const n=p.filter(e=>!e.isbns||e.isbns.length===0),r=n.filter(e=>e.handedOver<e.quantity),a=n.filter(e=>e.handedOver>=e.quantity),o=r.reduce((e,s)=>e+(s.quantity-s.handedOver),0),t=a.reduce((e,s)=>e+s.handedOver,0);return`
    <div class="view-card">
      <h2>❌ 沒有 ISBN 的書籍</h2>
      <p class="description">顯示所有未查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${r.length} 款 / 共 ${o} 本)
          </span>
        </h3>
        ${x(r,!0)}
      </div>

      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>
          ✅ 已點交的書
          <span style="color: var(--success-color); font-size: 0.9em;">
            (${a.length} 款 / 共 ${t} 本)
          </span>
        </h3>
        ${x(a,!0)}
      </div>
    </div>
  `},W=()=>{const n=p.filter(t=>t.handedOver<t.quantity),r=p.filter(t=>t.handedOver>=t.quantity),a=n.reduce((t,e)=>t+(e.quantity-e.handedOver),0),o=r.reduce((t,e)=>t+e.handedOver,0);return`
    <div class="handover-view">
      <div class="split-left">
        <div class="book-list-section">
          <h3>
            📋 未點交的書
            <span id="pending-stats" style="color: var(--warning-color); font-size: 0.9em;">
              (${n.length} 款 / 共 ${a} 本)
            </span>
          </h3>
          <div id="pending-books">${w(n,!0,"pending")}</div>
        </div>
        
        <div class="book-list-section">
          <h3>
            ✅ 已點交的書
            <span id="completed-stats" style="color: var(--success-color); font-size: 0.9em;">
              (${r.length} 款 / 共 ${o} 本)
            </span>
          </h3>
          <div id="completed-books">${w(r,!0,"completed")}</div>
        </div>
      </div>
      
      <div class="split-right">
        <div class="view-card">
          <h3>🔍 輸入 ISBN</h3>
          <p class="description">掃描或輸入書籍的 ISBN 條碼</p>
          
          <div class="input-group">
            <input type="text" id="isbn-input" placeholder="請輸入 ISBN..." autofocus>
            <div id="match-result" style="margin-top: 1rem; min-height: 60px;"></div>
          </div>
        </div>
      </div>
    </div>
  `},G=()=>{const n=document.getElementById("isbn-input"),r=document.getElementById("match-result"),a=document.getElementById("pending-books"),o=document.getElementById("completed-books"),t=()=>{const s=p.filter(m=>m.handedOver<m.quantity),i=p.filter(m=>m.handedOver>=m.quantity);document.getElementById("pending-books").innerHTML=w(s,!0,"pending"),document.getElementById("completed-books").innerHTML=w(i,!0,"completed");const c=s.reduce((m,v)=>m+(v.quantity-v.handedOver),0),l=i.reduce((m,v)=>m+v.handedOver,0),u=document.getElementById("pending-stats"),B=document.getElementById("completed-stats");u&&(u.textContent=`(${s.length} 款 / 共 ${c} 本)`),B&&(B.textContent=`(${i.length} 款 / 共 ${l} 本)`)},e=async s=>{if(s.target.classList.contains("btn-handover")){const i=parseInt(s.target.getAttribute("data-book-id")),c=p.find(l=>l.id===i);if(c){let l;s.target.classList.contains("btn-increment")?l=c.handedOver+1:s.target.classList.contains("btn-decrement")&&(l=Math.max(0,c.handedOver-1)),l!==void 0&&(await I(c.id,l),await h(),t(),f())}}};a&&a.addEventListener("click",e),o&&o.addEventListener("click",e),n.addEventListener("keypress",async s=>{if(s.key==="Enter"){const i=n.value.trim();if(!i)return;const c=p.find(l=>l.isbns&&l.isbns.some(u=>u===i));if(c&&c.handedOver<c.quantity){const l=c.handedOver+1;await I(c.id,l),await h(),_(),r.innerHTML=`
          <div style="background: rgba(35, 134, 54, 0.2); border: 1px solid var(--success-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--success-color); font-weight: 600;">✅ 點交成功！</p>
            <p style="margin-top: 0.5rem;">${c.title}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">已點交: ${l}/${c.quantity}</p>
          </div>
        `,t(),f()}else c&&c.handedOver>=c.quantity?(E(),r.innerHTML=`
          <div style="background: rgba(210, 153, 34, 0.2); border: 1px solid var(--warning-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--warning-color); font-weight: 600;">⚠️ 此書已全部點交完成</p>
            <p style="margin-top: 0.5rem;">${c.title}</p>
          </div>
        `):(E(),r.innerHTML=`
          <div style="background: rgba(248, 81, 73, 0.2); border: 1px solid var(--danger-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--danger-color); font-weight: 600;">❌ 找不到符合的書籍</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">ISBN: ${i}</p>
          </div>
        `);n.value="",setTimeout(()=>{r.innerHTML=""},2e3)}})},w=(n,r=!1,a="pending")=>{if(n.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let o='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th>';return r&&(o+="<th>手動點交</th>"),o+="</tr></thead><tbody>",n.forEach(t=>{let e="查無 ISBN",s=t.title;if(t.isbns&&t.isbns.length>0)e=t.isbns.join(", ");else{const i=`https://search.books.com.tw/search/query/key/${encodeURIComponent(t.title)}/cat/all`;s+=` <a href="${i}" target="_blank" style="text-decoration: none; font-size: 0.8rem; margin-left: 0.5rem;" title="在博客來搜尋">🔍</a>`}o+=`
      <tr>
        <td>${s}</td>
        <td>${t.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${e}</td>
        <td><span style="color: ${t.handedOver>=t.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${t.handedOver}/${t.quantity}</span></td>`,r&&(o+='<td><div class="btn-group">',a==="completed"?o+=`<button class="btn-handover btn-decrement" data-book-id="${t.id}">-1</button>`:o+=`<button class="btn-handover btn-decrement" data-book-id="${t.id}">-1</button>
                         <button class="btn-handover btn-increment" data-book-id="${t.id}">+1</button>`,o+="</div></td>"),o+="</tr>"}),o+="</tbody></table>",o},x=(n,r=!1)=>{if(n.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let a='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th></tr></thead><tbody>';return n.forEach(o=>{let t="查無 ISBN",e=o.title;if(!r&&o.isbns&&o.isbns.length>0)t=o.isbns.join(", ");else if(r){const s=`https://search.books.com.tw/search/query/key/${encodeURIComponent(o.title)}/cat/all`;e+=` <a href="${s}" target="_blank" style="text-decoration: none; font-size: 0.8rem; margin-left: 0.5rem;" title="在博客來搜尋">🔍</a>`}a+=`
      <tr>
        <td>${e}</td>
        <td>${o.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${t}</td>
        <td><span style="color: ${o.handedOver>=o.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${o.handedOver}/${o.quantity}</span></td>
      </tr>
    `}),a+="</tbody></table>",a};
