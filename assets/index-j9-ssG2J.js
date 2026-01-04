(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))r(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const o of e.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function a(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function r(t){if(t.ep)return;t.ep=!0;const e=a(t);fetch(t.href,e)}})();const q="BookHandoverDB",T=1,m="books",b=()=>new Promise((s,n)=>{const a=indexedDB.open(q,T);a.onerror=r=>{console.error("Database error:",r.target.error),n(r.target.error)},a.onsuccess=r=>{s(r.target.result)},a.onupgradeneeded=r=>{const t=r.target.result;t.objectStoreNames.contains(m)||t.createObjectStore(m,{keyPath:"id",autoIncrement:!0})}}),L=async s=>{const n=await b();return new Promise((a,r)=>{const t=n.transaction([m],"readwrite"),e=t.objectStore(m);t.oncomplete=()=>a(),t.onerror=o=>r(o.target.error),s.forEach(o=>{const i={title:o.title||"Unknown Title",quantity:parseInt(o.quantity)||0,isbns:Array.isArray(o.isbns)?o.isbns:o.isbn?[o.isbn]:[],handedOver:parseInt(o.handedOver)||0,createdAt:new Date().toISOString()};e.add(i)})})},N=async()=>{const s=await b();return new Promise((n,a)=>{const e=s.transaction([m],"readonly").objectStore(m).getAll();e.onsuccess=()=>n(e.result),e.onerror=o=>a(o.target.error)})},B=async(s,n)=>{const a=await b();return new Promise((r,t)=>{const o=a.transaction([m],"readwrite").objectStore(m),i=o.get(s);i.onsuccess=()=>{const c=i.result;c.handedOver=n;const d=o.put(c);d.onsuccess=()=>r(),d.onerror=p=>t(p.target.error)},i.onerror=c=>t(c.target.error)})},P=async()=>{const s=await b();return new Promise((n,a)=>{const e=s.transaction([m],"readwrite").objectStore(m).clear();e.onsuccess=()=>n(),e.onerror=o=>a(o.target.error)})},I=s=>new Promise(n=>setTimeout(n,s)),$=async s=>{const n=localStorage.getItem("cors_proxy_url");if(!n)return console.warn("CORS Proxy URL is not set. Skipping fetch."),"";const a=`https://${n}/api?${encodeURIComponent(s)}`,r=5;for(let t=0;t<r;t++)try{const e=await fetch(a);if(e.ok)return await e.text();if((e.status===429||e.status===400)&&(console.warn(`Proxy returned ${e.status}. Retrying (${t+1}/${r})...`),t<r-1)){await I(1e3);continue}throw new Error(`Proxy Error: ${e.status}`)}catch(e){if(t===r-1)throw e;console.warn(`Fetch error: ${e.message}. Retrying (${t+1}/${r})...`),await I(1e3)}},k=async s=>{try{console.log(`Searching Books.com.tw for: ${s}`);const n=`https://search.books.com.tw/search/query/key/${encodeURIComponent(s)}/cat/all`,a=await $(n),r=new DOMParser,e=r.parseFromString(a,"text/html").querySelector('h4 a[href*="item/"]');if(!e)return console.log("No results found on Books.com.tw"),[];const o=e.getAttribute("href"),i=o.match(/item\/([\w\d]+)/);if(!i||!i[1])return console.log("Could not extract item ID from link:",o),[];const d=`https://www.books.com.tw/products/${i[1]}`;console.log(`Constructed detail URL: ${d}`);const p=await $(d),y=r.parseFromString(p,"text/html").body.textContent.match(/ISBN：(\d{13})/);return y&&y[1]?(console.log(`Found ISBN on Books.com.tw: ${y[1]}`),[y[1]]):[]}catch(n){return console.error("Error searching Books.com.tw:",n),[]}},C=async(s,n)=>{try{n&&n("Google Books");const a=localStorage.getItem("google_books_api_key");let r=`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(s)}&maxResults=5`;a&&(r+=`&key=${a}`);const t=await fetch(r);if(t.status===429)console.warn("Google Books API Rate Limit Exceeded. Trying fallback...");else if(t.ok){const o=await t.json();if(o.items&&o.items.length>0){const i=new Set;if(o.items.forEach(c=>{var p;const d=(p=c.volumeInfo)==null?void 0:p.industryIdentifiers;d&&d.forEach(g=>{g.type==="ISBN_13"&&i.add(g.identifier)})}),i.size>0)return Array.from(i)}}return localStorage.getItem("cors_proxy_url")?(console.log("Google Books returned no results. Trying Books.com.tw fallback..."),n&&n("Books.com.tw"),await k(s)):(console.log("Google Books returned no results and no CORS Proxy set. Skipping Books.com.tw fallback."),[])}catch(a){return console.error(`Error searching ISBN for "${s}":`,a),localStorage.getItem("cors_proxy_url")?(n&&n("Books.com.tw"),await k(s)):[]}},D=s=>{const n=s.split(/\r?\n/).filter(a=>a.trim()!=="");return n.length===0?[]:(n[0].split(",").map(a=>a.trim().replace(/^"(.*)"$/,"$1")),n.slice(1).map(a=>{const r=[];let t="",e=!1;for(let o=0;o<a.length;o++){const i=a[o];i==='"'?e=!e:i===","&&!e?(r.push(t.trim().replace(/^"(.*)"$/,"$1")),t=""):t+=i}return r.push(t.trim().replace(/^"(.*)"$/,"$1")),{title:r[0]||"",quantity:parseInt(r[1])||0}}).filter(a=>a.title!==""))},O=(s,n)=>{const a=new Blob([JSON.stringify(s,null,2)],{type:"application/json"}),r=URL.createObjectURL(a),t=document.createElement("a");t.href=r,t.download=n,document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(r)};let l=[];document.addEventListener("DOMContentLoaded",async()=>{await b(),await h(),H(),v("convert"),f()});const H=()=>{const s=document.querySelectorAll(".nav-btn");s.forEach(n=>{n.addEventListener("click",()=>{s.forEach(r=>r.classList.remove("active")),n.classList.add("active");const a=n.getAttribute("data-view");v(a)})})},h=async()=>{l=await N(),f()},f=()=>{const s=l.reduce((r,t)=>r+t.quantity,0),n=l.reduce((r,t)=>r+t.handedOver,0),a=s>0?Math.round(n/s*100):0;document.getElementById("overall-progress").textContent=a},v=s=>{const n=document.getElementById("view-container");switch(document.querySelectorAll(".nav-btn").forEach(r=>{r.getAttribute("data-view")===s?r.classList.add("active"):r.classList.remove("active")}),s){case"convert":n.innerHTML=R(),_();break;case"upload":n.innerHTML=A(),M();break;case"with-isbn":n.innerHTML=U();break;case"without-isbn":n.innerHTML=j();break;case"handover":n.innerHTML=z(),K();break}},R=()=>{const n=localStorage.getItem("google_books_api_key")?`
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
        </div>`,a=localStorage.getItem("cors_proxy_url"),r=a?`
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
            <p style="margin-bottom: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">格式: example.com (不含 https:// 和 /api)</p>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="proxy-url-input" placeholder="輸入 Proxy URL (例如: proxy.example.workers.dev)..." style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--panel-bg); color: var(--text-primary);">
                <button class="btn" id="save-proxy-url-btn" style="padding: 0.5rem 1rem;">儲存</button>
            </div>
        </div>`;return`
    <div class="view-card">
      <h2>📄 轉換書單 → 點交系統書單</h2>
      <p class="description">上傳 CSV 書單，系統會自動使用 Google Books API 查詢 ISBN，並產生點交系統專用的 JSON 檔案。</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          ${n}
          ${r}
      </div>

      <div class="upload-box" id="csv-upload-box">
        <p style="font-size: 2rem; margin-bottom: 1rem;">📤</p>
        <p>點擊或拖曳 CSV 檔案至此處</p>
        <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
      </div>
      
      <div id="convert-result" style="margin-top: 2rem;"></div>
    </div>
  `},_=()=>{const s=document.getElementById("csv-upload-box"),n=document.getElementById("csv-file-input"),a=document.getElementById("save-api-key-btn"),r=document.getElementById("clear-api-key-btn"),t=document.getElementById("api-key-input");a&&a.addEventListener("click",()=>{const c=t.value.trim();c&&(localStorage.setItem("google_books_api_key",c),v("convert"))}),r&&r.addEventListener("click",()=>{confirm("確定要清除 API Key 嗎？")&&(localStorage.removeItem("google_books_api_key"),v("convert"))});const e=document.getElementById("save-proxy-url-btn"),o=document.getElementById("clear-proxy-url-btn"),i=document.getElementById("proxy-url-input");e&&e.addEventListener("click",()=>{const c=i.value.trim().replace(/^https?:\/\//,"").replace(/\/api$/,"").replace(/\/$/,"");c&&(localStorage.setItem("cors_proxy_url",c),v("convert"))}),o&&o.addEventListener("click",()=>{confirm("確定要清除 CORS Proxy URL 嗎？")&&(localStorage.removeItem("cors_proxy_url"),v("convert"))}),s.addEventListener("click",()=>n.click()),n.addEventListener("change",async c=>{const d=c.target.files[0];d&&await S(d)}),s.addEventListener("dragover",c=>{c.preventDefault(),s.style.borderColor="var(--accent-color)"}),s.addEventListener("dragleave",()=>{s.style.borderColor="var(--border-color)"}),s.addEventListener("drop",async c=>{c.preventDefault(),s.style.borderColor="var(--border-color)";const d=c.dataTransfer.files[0];d&&d.name.endsWith(".csv")&&await S(d)})},S=async s=>{const n=document.getElementById("convert-result");n.innerHTML='<div class="spinner"></div><p>正在讀取 CSV 並查詢 ISBN...</p>';const a=await s.text(),r=D(a);if(r.length===0){n.innerHTML='<p style="color: var(--danger-color);">❌ CSV 檔案格式錯誤或無資料</p>';return}const t=[];for(let o=0;o<r.length;o++){const i=r[o],c=await C(i.title,d=>{n.innerHTML=`<div class="spinner"></div>
                                   <p>正在查詢 ISBN... (${o+1}/${r.length})</p>
                                   <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">來源: <span style="color: var(--accent-color); font-weight: 500;">${d}</span></p>
                                   <p style="font-size: 0.85rem; color: var(--text-secondary);">書名: ${i.title}</p>`});t.push({title:i.title,quantity:i.quantity,isbns:c}),await new Promise(d=>setTimeout(d,300))}let e="<h3>✅ 轉換完成</h3>";e+='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th></tr></thead><tbody>',t.forEach(o=>{const i=o.isbns.length>0?o.isbns.join(", "):"查無 ISBN";e+=`<tr><td>${o.title}</td><td>${o.quantity}</td><td>${i}</td></tr>`}),e+="</tbody></table>",e+='<div style="margin-top: 1.5rem;">',e+='<button class="btn" id="download-json-btn" style="margin-right: 1rem;">💾 下載 JSON 檔案</button>',e+='<button class="btn btn-primary" id="import-db-btn">📥 直接匯入資料庫</button>',e+="</div>",n.innerHTML=e,document.getElementById("download-json-btn").addEventListener("click",()=>{const o=new Date().toISOString().split("T")[0];O(t,`book-handover-list-${o}.json`)}),document.getElementById("import-db-btn").addEventListener("click",async()=>{const o=t.map(i=>({title:i.title,quantity:parseInt(i.quantity)||0,isbns:Array.isArray(i.isbns)?i.isbns:[],handedOver:0}));await L(o),await h(),v("upload")})},A=()=>`
    <div class="view-card">
      <h2>📥 上傳點交系統書單</h2>
      <p class="description">上傳先前產生的 JSON 書單檔案，系統會將資料儲存至本地資料庫。</p>
      
      ${l.length>0?`
        <div style="background: rgba(88, 166, 255, 0.1); border: 1px solid var(--accent-color); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="color: var(--accent-color);">📊 資料庫中已有 ${l.length} 筆書籍資料</p>
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
  `,M=()=>{const s=document.getElementById("json-upload-box"),n=document.getElementById("json-file-input"),a=document.getElementById("clear-db-btn"),r=document.getElementById("download-db-btn");r&&r.addEventListener("click",()=>{const t=l.map(o=>({title:o.title,quantity:o.quantity,isbns:o.isbns})),e=new Date().toISOString().split("T")[0];O(t,`book-handover-list-${e}.json`)}),a&&a.addEventListener("click",async()=>{confirm("確定要清空所有書籍資料嗎？此操作無法復原！")&&(await P(),await h(),v("upload"))}),s.addEventListener("click",()=>n.click()),n.addEventListener("change",async t=>{const e=t.target.files[0];e&&await E(e)}),s.addEventListener("dragover",t=>{t.preventDefault(),s.style.borderColor="var(--accent-color)"}),s.addEventListener("dragleave",()=>{s.style.borderColor="var(--border-color)"}),s.addEventListener("drop",async t=>{t.preventDefault(),s.style.borderColor="var(--border-color)";const e=t.dataTransfer.files[0];e&&e.name.endsWith(".json")&&await E(e)})},E=async s=>{const n=document.getElementById("upload-result");try{const a=await s.text(),r=JSON.parse(a);if(!Array.isArray(r))throw new Error("JSON 格式錯誤：必須是陣列");const t=r.map(e=>({title:e.title,quantity:parseInt(e.quantity)||0,isbns:Array.isArray(e.isbns)?e.isbns:[],handedOver:0}));await L(t),await h(),n.innerHTML=`<p style="color: var(--success-color);">✅ 成功上傳 ${t.length} 筆書籍資料！</p>`,setTimeout(()=>v("upload"),1500)}catch(a){n.innerHTML=`<p style="color: var(--danger-color);">❌ 上傳失敗: ${a.message}</p>`}},U=()=>{const s=l.filter(e=>e.isbns&&e.isbns.length>0),n=s.filter(e=>e.handedOver<e.quantity),a=s.filter(e=>e.handedOver>=e.quantity),r=n.reduce((e,o)=>e+(o.quantity-o.handedOver),0),t=a.reduce((e,o)=>e+o.handedOver,0);return`
    <div class="view-card">
      <h2>✅ 有 ISBN 的書籍</h2>
      <p class="description">顯示所有已查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${n.length} 款 / 共 ${r} 本)
          </span>
        </h3>
        ${x(n)}
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
  `},j=()=>{const s=l.filter(e=>!e.isbns||e.isbns.length===0),n=s.filter(e=>e.handedOver<e.quantity),a=s.filter(e=>e.handedOver>=e.quantity),r=n.reduce((e,o)=>e+(o.quantity-o.handedOver),0),t=a.reduce((e,o)=>e+o.handedOver,0);return`
    <div class="view-card">
      <h2>❌ 沒有 ISBN 的書籍</h2>
      <p class="description">顯示所有未查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${n.length} 款 / 共 ${r} 本)
          </span>
        </h3>
        ${x(n,!0)}
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
  `},z=()=>{const s=l.filter(t=>t.handedOver<t.quantity),n=l.filter(t=>t.handedOver>=t.quantity),a=s.reduce((t,e)=>t+(e.quantity-e.handedOver),0),r=n.reduce((t,e)=>t+e.handedOver,0);return`
    <div class="handover-view">
      <div class="split-left">
        <div class="book-list-section">
          <h3>
            📋 未點交的書
            <span id="pending-stats" style="color: var(--warning-color); font-size: 0.9em;">
              (${s.length} 款 / 共 ${a} 本)
            </span>
          </h3>
          <div id="pending-books">${w(s,!0,"pending")}</div>
        </div>
        
        <div class="book-list-section">
          <h3>
            ✅ 已點交的書
            <span id="completed-stats" style="color: var(--success-color); font-size: 0.9em;">
              (${n.length} 款 / 共 ${r} 本)
            </span>
          </h3>
          <div id="completed-books">${w(n,!0,"completed")}</div>
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
  `},K=()=>{const s=document.getElementById("isbn-input"),n=document.getElementById("match-result"),a=document.getElementById("pending-books"),r=document.getElementById("completed-books"),t=()=>{const o=l.filter(u=>u.handedOver<u.quantity),i=l.filter(u=>u.handedOver>=u.quantity);document.getElementById("pending-books").innerHTML=w(o,!0,"pending"),document.getElementById("completed-books").innerHTML=w(i,!0,"completed");const c=o.reduce((u,y)=>u+(y.quantity-y.handedOver),0),d=i.reduce((u,y)=>u+y.handedOver,0),p=document.getElementById("pending-stats"),g=document.getElementById("completed-stats");p&&(p.textContent=`(${o.length} 款 / 共 ${c} 本)`),g&&(g.textContent=`(${i.length} 款 / 共 ${d} 本)`)},e=async o=>{if(o.target.classList.contains("btn-handover")){const i=parseInt(o.target.getAttribute("data-book-id")),c=l.find(d=>d.id===i);if(c){let d;o.target.classList.contains("btn-increment")?d=c.handedOver+1:o.target.classList.contains("btn-decrement")&&(d=Math.max(0,c.handedOver-1)),d!==void 0&&(await B(c.id,d),await h(),t(),f())}}};a&&a.addEventListener("click",e),r&&r.addEventListener("click",e),s.addEventListener("keypress",async o=>{if(o.key==="Enter"){const i=s.value.trim();if(!i)return;const c=l.find(d=>d.isbns&&d.isbns.some(p=>p===i));if(c&&c.handedOver<c.quantity){const d=c.handedOver+1;await B(c.id,d),await h(),n.innerHTML=`
          <div style="background: rgba(35, 134, 54, 0.2); border: 1px solid var(--success-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--success-color); font-weight: 600;">✅ 點交成功！</p>
            <p style="margin-top: 0.5rem;">${c.title}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">已點交: ${d}/${c.quantity}</p>
          </div>
        `,t(),f()}else c&&c.handedOver>=c.quantity?n.innerHTML=`
          <div style="background: rgba(210, 153, 34, 0.2); border: 1px solid var(--warning-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--warning-color); font-weight: 600;">⚠️ 此書已全部點交完成</p>
            <p style="margin-top: 0.5rem;">${c.title}</p>
          </div>
        `:n.innerHTML=`
          <div style="background: rgba(248, 81, 73, 0.2); border: 1px solid var(--danger-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--danger-color); font-weight: 600;">❌ 找不到符合的書籍</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">ISBN: ${i}</p>
          </div>
        `;s.value="",setTimeout(()=>{n.innerHTML=""},2e3)}})},w=(s,n=!1,a="pending")=>{if(s.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let r='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th>';return n&&(r+="<th>手動點交</th>"),r+="</tr></thead><tbody>",s.forEach(t=>{let e="查無 ISBN",o=t.title;if(t.isbns&&t.isbns.length>0)e=t.isbns.join(", ");else{const i=`https://search.books.com.tw/search/query/key/${encodeURIComponent(t.title)}/cat/all`;o+=` <a href="${i}" target="_blank" style="text-decoration: none; font-size: 0.8rem; margin-left: 0.5rem;" title="在博客來搜尋">🔍</a>`}r+=`
      <tr>
        <td>${o}</td>
        <td>${t.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${e}</td>
        <td><span style="color: ${t.handedOver>=t.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${t.handedOver}/${t.quantity}</span></td>`,n&&(r+='<td><div class="btn-group">',a==="completed"?r+=`<button class="btn-handover btn-decrement" data-book-id="${t.id}">-1</button>`:r+=`<button class="btn-handover btn-decrement" data-book-id="${t.id}">-1</button>
                         <button class="btn-handover btn-increment" data-book-id="${t.id}">+1</button>`,r+="</div></td>"),r+="</tr>"}),r+="</tbody></table>",r},x=(s,n=!1)=>{if(s.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let a='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th></tr></thead><tbody>';return s.forEach(r=>{let t="查無 ISBN",e=r.title;if(!n&&r.isbns&&r.isbns.length>0)t=r.isbns.join(", ");else if(n){const o=`https://search.books.com.tw/search/query/key/${encodeURIComponent(r.title)}/cat/all`;e+=` <a href="${o}" target="_blank" style="text-decoration: none; font-size: 0.8rem; margin-left: 0.5rem;" title="在博客來搜尋">🔍</a>`}a+=`
      <tr>
        <td>${e}</td>
        <td>${r.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${t}</td>
        <td><span style="color: ${r.handedOver>=r.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${r.handedOver}/${r.quantity}</span></td>
      </tr>
    `}),a+="</tbody></table>",a};
