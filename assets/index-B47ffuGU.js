(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver(e=>{for(const s of e)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&t(a)}).observe(document,{childList:!0,subtree:!0});function o(e){const s={};return e.integrity&&(s.integrity=e.integrity),e.referrerPolicy&&(s.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?s.credentials="include":e.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function t(e){if(e.ep)return;e.ep=!0;const s=o(e);fetch(e.href,s)}})();const E="BookHandoverDB",L=1,p="books",y=()=>new Promise((r,n)=>{const o=indexedDB.open(E,L);o.onerror=t=>{console.error("Database error:",t.target.error),n(t.target.error)},o.onsuccess=t=>{r(t.target.result)},o.onupgradeneeded=t=>{const e=t.target.result;e.objectStoreNames.contains(p)||e.createObjectStore(p,{keyPath:"id",autoIncrement:!0})}}),I=async r=>{const n=await y();return new Promise((o,t)=>{const e=n.transaction([p],"readwrite"),s=e.objectStore(p);e.oncomplete=()=>o(),e.onerror=a=>t(a.target.error),r.forEach(a=>{const i={title:a.title||"Unknown Title",quantity:parseInt(a.quantity)||0,isbns:Array.isArray(a.isbns)?a.isbns:a.isbn?[a.isbn]:[],handedOver:parseInt(a.handedOver)||0,createdAt:new Date().toISOString()};s.add(i)})})},$=async()=>{const r=await y();return new Promise((n,o)=>{const s=r.transaction([p],"readonly").objectStore(p).getAll();s.onsuccess=()=>n(s.result),s.onerror=a=>o(a.target.error)})},f=async(r,n)=>{const o=await y();return new Promise((t,e)=>{const a=o.transaction([p],"readwrite").objectStore(p),i=a.get(r);i.onsuccess=()=>{const d=i.result;d.handedOver=n;const c=a.put(d);c.onsuccess=()=>t(),c.onerror=h=>e(h.target.error)},i.onerror=d=>e(d.target.error)})},O=async()=>{const r=await y();return new Promise((n,o)=>{const s=r.transaction([p],"readwrite").objectStore(p).clear();s.onsuccess=()=>n(),s.onerror=a=>o(a.target.error)})},k=async r=>{try{const n=localStorage.getItem("google_books_api_key");let o=`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(r)}&maxResults=5`;n&&(o+=`&key=${n}`);const e=await(await fetch(o)).json();if(!e.items||e.items.length===0)return[];const s=new Set;return e.items.forEach(a=>{var d;const i=(d=a.volumeInfo)==null?void 0:d.industryIdentifiers;i&&i.forEach(c=>{c.type==="ISBN_13"&&s.add(c.identifier)})}),Array.from(s)}catch(n){return console.error(`Error searching ISBN for "${r}":`,n),[]}},x=r=>{const n=r.split(/\r?\n/).filter(o=>o.trim()!=="");return n.length===0?[]:(n[0].split(",").map(o=>o.trim().replace(/^"(.*)"$/,"$1")),n.slice(1).map(o=>{const t=[];let e="",s=!1;for(let a=0;a<o.length;a++){const i=o[a];i==='"'?s=!s:i===","&&!s?(t.push(e.trim().replace(/^"(.*)"$/,"$1")),e=""):e+=i}return t.push(e.trim().replace(/^"(.*)"$/,"$1")),{title:t[0]||"",quantity:parseInt(t[1])||0}}).filter(o=>o.title!==""))},S=(r,n)=>{const o=new Blob([JSON.stringify(r,null,2)],{type:"application/json"}),t=URL.createObjectURL(o),e=document.createElement("a");e.href=t,e.download=n,document.body.appendChild(e),e.click(),document.body.removeChild(e),URL.revokeObjectURL(t)};let l=[];document.addEventListener("DOMContentLoaded",async()=>{await y(),await v(),N(),u("convert"),m()});const N=()=>{const r=document.querySelectorAll(".nav-btn");r.forEach(n=>{n.addEventListener("click",()=>{r.forEach(t=>t.classList.remove("active")),n.classList.add("active");const o=n.getAttribute("data-view");u(o)})})},v=async()=>{l=await $(),m()},m=()=>{const r=l.reduce((t,e)=>t+e.quantity,0),n=l.reduce((t,e)=>t+e.handedOver,0),o=r>0?Math.round(n/r*100):0;document.getElementById("overall-progress").textContent=o},u=r=>{const n=document.getElementById("view-container");switch(document.querySelectorAll(".nav-btn").forEach(t=>{t.getAttribute("data-view")===r?t.classList.add("active"):t.classList.remove("active")}),r){case"convert":n.innerHTML=q(),T();break;case"upload":n.innerHTML=H(),A();break;case"with-isbn":n.innerHTML=D();break;case"without-isbn":n.innerHTML=j();break;case"handover":n.innerHTML=M(),C();break}},q=()=>`
    <div class="view-card">
      <h2>📄 轉換書單 → 點交系統書單</h2>
      <p class="description">上傳 CSV 書單，系統會自動使用 Google Books API 查詢 ISBN，並產生點交系統專用的 JSON 檔案。</p>
      
      ${localStorage.getItem("google_books_api_key")?`
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
        </div>`}

      <div class="upload-box" id="csv-upload-box">
        <p style="font-size: 2rem; margin-bottom: 1rem;">📤</p>
        <p>點擊或拖曳 CSV 檔案至此處</p>
        <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
      </div>
      
      <div id="convert-result" style="margin-top: 2rem;"></div>
    </div>
  `,T=()=>{const r=document.getElementById("csv-upload-box"),n=document.getElementById("csv-file-input"),o=document.getElementById("save-api-key-btn"),t=document.getElementById("clear-api-key-btn"),e=document.getElementById("api-key-input");o&&o.addEventListener("click",()=>{const s=e.value.trim();s&&(localStorage.setItem("google_books_api_key",s),u("convert"))}),t&&t.addEventListener("click",()=>{confirm("確定要清除 API Key 嗎？")&&(localStorage.removeItem("google_books_api_key"),u("convert"))}),r.addEventListener("click",()=>n.click()),n.addEventListener("change",async s=>{const a=s.target.files[0];a&&await w(a)}),r.addEventListener("dragover",s=>{s.preventDefault(),r.style.borderColor="var(--accent-color)"}),r.addEventListener("dragleave",()=>{r.style.borderColor="var(--border-color)"}),r.addEventListener("drop",async s=>{s.preventDefault(),r.style.borderColor="var(--border-color)";const a=s.dataTransfer.files[0];a&&a.name.endsWith(".csv")&&await w(a)})},w=async r=>{const n=document.getElementById("convert-result");n.innerHTML='<div class="spinner"></div><p>正在讀取 CSV 並查詢 ISBN...</p>';const o=await r.text(),t=x(o);if(t.length===0){n.innerHTML='<p style="color: var(--danger-color);">❌ CSV 檔案格式錯誤或無資料</p>';return}const e=[];for(let a=0;a<t.length;a++){const i=t[a];n.innerHTML=`<div class="spinner"></div><p>正在查詢 ISBN... (${a+1}/${t.length})</p>`;const d=await k(i.title);e.push({title:i.title,quantity:i.quantity,isbns:d}),await new Promise(c=>setTimeout(c,300))}let s="<h3>✅ 轉換完成</h3>";s+='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th></tr></thead><tbody>',e.forEach(a=>{const i=a.isbns.length>0?a.isbns.join(", "):"查無 ISBN";s+=`<tr><td>${a.title}</td><td>${a.quantity}</td><td>${i}</td></tr>`}),s+="</tbody></table>",s+='<div style="margin-top: 1.5rem;">',s+='<button class="btn" id="download-json-btn" style="margin-right: 1rem;">💾 下載 JSON 檔案</button>',s+='<button class="btn btn-primary" id="import-db-btn">📥 直接匯入資料庫</button>',s+="</div>",n.innerHTML=s,document.getElementById("download-json-btn").addEventListener("click",()=>{const a=new Date().toISOString().split("T")[0];S(e,`book-handover-list-${a}.json`)}),document.getElementById("import-db-btn").addEventListener("click",async()=>{const a=e.map(i=>({title:i.title,quantity:parseInt(i.quantity)||0,isbns:Array.isArray(i.isbns)?i.isbns:[],handedOver:0}));await I(a),await v(),u("upload")})},H=()=>`
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
  `,A=()=>{const r=document.getElementById("json-upload-box"),n=document.getElementById("json-file-input"),o=document.getElementById("clear-db-btn"),t=document.getElementById("download-db-btn");t&&t.addEventListener("click",()=>{const e=l.map(a=>({title:a.title,quantity:a.quantity,isbns:a.isbns})),s=new Date().toISOString().split("T")[0];S(e,`book-handover-list-${s}.json`)}),o&&o.addEventListener("click",async()=>{confirm("確定要清空所有書籍資料嗎？此操作無法復原！")&&(await O(),await v(),u("upload"))}),r.addEventListener("click",()=>n.click()),n.addEventListener("change",async e=>{const s=e.target.files[0];s&&await B(s)}),r.addEventListener("dragover",e=>{e.preventDefault(),r.style.borderColor="var(--accent-color)"}),r.addEventListener("dragleave",()=>{r.style.borderColor="var(--border-color)"}),r.addEventListener("drop",async e=>{e.preventDefault(),r.style.borderColor="var(--border-color)";const s=e.dataTransfer.files[0];s&&s.name.endsWith(".json")&&await B(s)})},B=async r=>{const n=document.getElementById("upload-result");try{const o=await r.text(),t=JSON.parse(o);if(!Array.isArray(t))throw new Error("JSON 格式錯誤：必須是陣列");const e=t.map(s=>({title:s.title,quantity:parseInt(s.quantity)||0,isbns:Array.isArray(s.isbns)?s.isbns:[],handedOver:0}));await I(e),await v(),n.innerHTML=`<p style="color: var(--success-color);">✅ 成功上傳 ${e.length} 筆書籍資料！</p>`,setTimeout(()=>u("upload"),1500)}catch(o){n.innerHTML=`<p style="color: var(--danger-color);">❌ 上傳失敗: ${o.message}</p>`}},D=()=>{const r=l.filter(t=>t.isbns&&t.isbns.length>0),n=r.filter(t=>t.handedOver<t.quantity),o=r.filter(t=>t.handedOver>=t.quantity);return`
    <div class="view-card">
      <h2>✅ 有 ISBN 的書籍</h2>
      <p class="description">顯示所有已查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>📋 未點交的書 <span style="color: var(--warning-color);">(${n.length})</span></h3>
        ${b(n)}
      </div>
      
      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>✅ 已點交的書 <span style="color: var(--success-color);">(${o.length})</span></h3>
        ${b(o)}
      </div>
    </div>
  `},j=()=>{const r=l.filter(t=>!t.isbns||t.isbns.length===0),n=r.filter(t=>t.handedOver<t.quantity),o=r.filter(t=>t.handedOver>=t.quantity);return`
    <div class="view-card">
      <h2>❌ 沒有 ISBN 的書籍</h2>
      <p class="description">顯示所有未查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>📋 未點交的書 <span style="color: var(--warning-color);">(${n.length})</span></h3>
        ${b(n,!0)}
      </div>

      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>✅ 已點交的書 <span style="color: var(--success-color);">(${o.length})</span></h3>
        ${b(o,!0)}
      </div>
    </div>
  `},M=()=>{const r=l.filter(o=>o.handedOver<o.quantity),n=l.filter(o=>o.handedOver>=o.quantity);return`
    <div class="handover-view">
      <div class="split-left">
        <div class="book-list-section">
          <h3>📋 未點交的書 <span style="color: var(--warning-color);">(${r.length})</span></h3>
          <div id="pending-books">${g(r,!0,"pending")}</div>
        </div>
        
        <div class="book-list-section">
          <h3>✅ 已點交的書 <span style="color: var(--success-color);">(${n.length})</span></h3>
          <div id="completed-books">${g(n,!0,"completed")}</div>
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
  `},C=()=>{const r=document.getElementById("isbn-input"),n=document.getElementById("match-result"),o=document.getElementById("pending-books"),t=document.getElementById("completed-books"),e=()=>{document.getElementById("pending-books").innerHTML=g(l.filter(a=>a.handedOver<a.quantity),!0,"pending"),document.getElementById("completed-books").innerHTML=g(l.filter(a=>a.handedOver>=a.quantity),!0,"completed")},s=async a=>{if(a.target.classList.contains("btn-handover")){const i=parseInt(a.target.getAttribute("data-book-id")),d=l.find(c=>c.id===i);if(d){let c;a.target.classList.contains("btn-increment")?c=d.handedOver+1:a.target.classList.contains("btn-decrement")&&(c=Math.max(0,d.handedOver-1)),c!==void 0&&(await f(d.id,c),await v(),e(),m())}}};o&&o.addEventListener("click",s),t&&t.addEventListener("click",s),r.addEventListener("keypress",async a=>{if(a.key==="Enter"){const i=r.value.trim();if(!i)return;const d=l.find(c=>c.isbns&&c.isbns.some(h=>h===i));if(d&&d.handedOver<d.quantity){const c=d.handedOver+1;await f(d.id,c),await v(),n.innerHTML=`
          <div style="background: rgba(35, 134, 54, 0.2); border: 1px solid var(--success-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--success-color); font-weight: 600;">✅ 點交成功！</p>
            <p style="margin-top: 0.5rem;">${d.title}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">已點交: ${c}/${d.quantity}</p>
          </div>
        `,e(),m()}else d&&d.handedOver>=d.quantity?n.innerHTML=`
          <div style="background: rgba(210, 153, 34, 0.2); border: 1px solid var(--warning-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--warning-color); font-weight: 600;">⚠️ 此書已全部點交完成</p>
            <p style="margin-top: 0.5rem;">${d.title}</p>
          </div>
        `:n.innerHTML=`
          <div style="background: rgba(248, 81, 73, 0.2); border: 1px solid var(--danger-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--danger-color); font-weight: 600;">❌ 找不到符合的書籍</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">ISBN: ${i}</p>
          </div>
        `;r.value="",setTimeout(()=>{n.innerHTML=""},2e3)}})},g=(r,n=!1,o="pending")=>{if(r.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let t='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th>';return n&&(t+="<th>手動點交</th>"),t+="</tr></thead><tbody>",r.forEach(e=>{let s="查無 ISBN";e.isbns&&e.isbns.length>0&&(s=e.isbns.join(", ")),t+=`
      <tr>
        <td>${e.title}</td>
        <td>${e.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${s}</td>
        <td><span style="color: ${e.handedOver>=e.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${e.handedOver}/${e.quantity}</span></td>`,n&&(t+='<td><div class="btn-group">',o==="completed"?t+=`<button class="btn-handover btn-decrement" data-book-id="${e.id}">-1</button>`:t+=`<button class="btn-handover btn-decrement" data-book-id="${e.id}">-1</button>
                         <button class="btn-handover btn-increment" data-book-id="${e.id}">+1</button>`,t+="</div></td>"),t+="</tr>"}),t+="</tbody></table>",t},b=(r,n=!1)=>{if(r.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let o='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th></tr></thead><tbody>';return r.forEach(t=>{let e="查無 ISBN";!n&&t.isbns&&t.isbns.length>0&&(e=t.isbns.join(", ")),o+=`
      <tr>
        <td>${t.title}</td>
        <td>${t.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${e}</td>
        <td><span style="color: ${t.handedOver>=t.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${t.handedOver}/${t.quantity}</span></td>
      </tr>
    `}),o+="</tbody></table>",o};
