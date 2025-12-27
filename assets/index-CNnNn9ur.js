(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))n(t);new MutationObserver(t=>{for(const e of t)if(e.type==="childList")for(const s of e.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(t){const e={};return t.integrity&&(e.integrity=t.integrity),t.referrerPolicy&&(e.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?e.credentials="include":t.crossOrigin==="anonymous"?e.credentials="omit":e.credentials="same-origin",e}function n(t){if(t.ep)return;t.ep=!0;const e=a(t);fetch(t.href,e)}})();const L="BookHandoverDB",x=1,p="books",g=()=>new Promise((o,r)=>{const a=indexedDB.open(L,x);a.onerror=n=>{console.error("Database error:",n.target.error),r(n.target.error)},a.onsuccess=n=>{o(n.target.result)},a.onupgradeneeded=n=>{const t=n.target.result;t.objectStoreNames.contains(p)||t.createObjectStore(p,{keyPath:"id",autoIncrement:!0})}}),E=async o=>{const r=await g();return new Promise((a,n)=>{const t=r.transaction([p],"readwrite"),e=t.objectStore(p);t.oncomplete=()=>a(),t.onerror=s=>n(s.target.error),o.forEach(s=>{const i={title:s.title||"Unknown Title",quantity:parseInt(s.quantity)||0,isbns:Array.isArray(s.isbns)?s.isbns:s.isbn?[s.isbn]:[],handedOver:parseInt(s.handedOver)||0,createdAt:new Date().toISOString()};e.add(i)})})},k=async()=>{const o=await g();return new Promise((r,a)=>{const e=o.transaction([p],"readonly").objectStore(p).getAll();e.onsuccess=()=>r(e.result),e.onerror=s=>a(s.target.error)})},I=async(o,r)=>{const a=await g();return new Promise((n,t)=>{const s=a.transaction([p],"readwrite").objectStore(p),i=s.get(o);i.onsuccess=()=>{const d=i.result;d.handedOver=r;const c=s.put(d);c.onsuccess=()=>n(),c.onerror=y=>t(y.target.error)},i.onerror=d=>t(d.target.error)})},q=async()=>{const o=await g();return new Promise((r,a)=>{const e=o.transaction([p],"readwrite").objectStore(p).clear();e.onsuccess=()=>r(),e.onerror=s=>a(s.target.error)})},N=async o=>{try{const r=localStorage.getItem("google_books_api_key");let a=`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(o)}&maxResults=5`;r&&(a+=`&key=${r}`);const t=await(await fetch(a)).json();if(!t.items||t.items.length===0)return[];const e=new Set;return t.items.forEach(s=>{var d;const i=(d=s.volumeInfo)==null?void 0:d.industryIdentifiers;i&&i.forEach(c=>{c.type==="ISBN_13"&&e.add(c.identifier)})}),Array.from(e)}catch(r){return console.error(`Error searching ISBN for "${o}":`,r),[]}},T=o=>{const r=o.split(/\r?\n/).filter(a=>a.trim()!=="");return r.length===0?[]:(r[0].split(",").map(a=>a.trim().replace(/^"(.*)"$/,"$1")),r.slice(1).map(a=>{const n=[];let t="",e=!1;for(let s=0;s<a.length;s++){const i=a[s];i==='"'?e=!e:i===","&&!e?(n.push(t.trim().replace(/^"(.*)"$/,"$1")),t=""):t+=i}return n.push(t.trim().replace(/^"(.*)"$/,"$1")),{title:n[0]||"",quantity:parseInt(n[1])||0}}).filter(a=>a.title!==""))},O=(o,r)=>{const a=new Blob([JSON.stringify(o,null,2)],{type:"application/json"}),n=URL.createObjectURL(a),t=document.createElement("a");t.href=n,t.download=r,document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(n)};let l=[];document.addEventListener("DOMContentLoaded",async()=>{await g(),await m(),H(),v("convert"),b()});const H=()=>{const o=document.querySelectorAll(".nav-btn");o.forEach(r=>{r.addEventListener("click",()=>{o.forEach(n=>n.classList.remove("active")),r.classList.add("active");const a=r.getAttribute("data-view");v(a)})})},m=async()=>{l=await k(),b()},b=()=>{const o=l.reduce((n,t)=>n+t.quantity,0),r=l.reduce((n,t)=>n+t.handedOver,0),a=o>0?Math.round(r/o*100):0;document.getElementById("overall-progress").textContent=a},v=o=>{const r=document.getElementById("view-container");switch(document.querySelectorAll(".nav-btn").forEach(n=>{n.getAttribute("data-view")===o?n.classList.add("active"):n.classList.remove("active")}),o){case"convert":r.innerHTML=A(),D();break;case"upload":r.innerHTML=C(),j();break;case"with-isbn":r.innerHTML=M();break;case"without-isbn":r.innerHTML=P();break;case"handover":r.innerHTML=_(),z();break}},A=()=>`
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
  `,D=()=>{const o=document.getElementById("csv-upload-box"),r=document.getElementById("csv-file-input"),a=document.getElementById("save-api-key-btn"),n=document.getElementById("clear-api-key-btn"),t=document.getElementById("api-key-input");a&&a.addEventListener("click",()=>{const e=t.value.trim();e&&(localStorage.setItem("google_books_api_key",e),v("convert"))}),n&&n.addEventListener("click",()=>{confirm("確定要清除 API Key 嗎？")&&(localStorage.removeItem("google_books_api_key"),v("convert"))}),o.addEventListener("click",()=>r.click()),r.addEventListener("change",async e=>{const s=e.target.files[0];s&&await S(s)}),o.addEventListener("dragover",e=>{e.preventDefault(),o.style.borderColor="var(--accent-color)"}),o.addEventListener("dragleave",()=>{o.style.borderColor="var(--border-color)"}),o.addEventListener("drop",async e=>{e.preventDefault(),o.style.borderColor="var(--border-color)";const s=e.dataTransfer.files[0];s&&s.name.endsWith(".csv")&&await S(s)})},S=async o=>{const r=document.getElementById("convert-result");r.innerHTML='<div class="spinner"></div><p>正在讀取 CSV 並查詢 ISBN...</p>';const a=await o.text(),n=T(a);if(n.length===0){r.innerHTML='<p style="color: var(--danger-color);">❌ CSV 檔案格式錯誤或無資料</p>';return}const t=[];for(let s=0;s<n.length;s++){const i=n[s];r.innerHTML=`<div class="spinner"></div><p>正在查詢 ISBN... (${s+1}/${n.length})</p>`;const d=await N(i.title);t.push({title:i.title,quantity:i.quantity,isbns:d}),await new Promise(c=>setTimeout(c,300))}let e="<h3>✅ 轉換完成</h3>";e+='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th></tr></thead><tbody>',t.forEach(s=>{const i=s.isbns.length>0?s.isbns.join(", "):"查無 ISBN";e+=`<tr><td>${s.title}</td><td>${s.quantity}</td><td>${i}</td></tr>`}),e+="</tbody></table>",e+='<div style="margin-top: 1.5rem;">',e+='<button class="btn" id="download-json-btn" style="margin-right: 1rem;">💾 下載 JSON 檔案</button>',e+='<button class="btn btn-primary" id="import-db-btn">📥 直接匯入資料庫</button>',e+="</div>",r.innerHTML=e,document.getElementById("download-json-btn").addEventListener("click",()=>{const s=new Date().toISOString().split("T")[0];O(t,`book-handover-list-${s}.json`)}),document.getElementById("import-db-btn").addEventListener("click",async()=>{const s=t.map(i=>({title:i.title,quantity:parseInt(i.quantity)||0,isbns:Array.isArray(i.isbns)?i.isbns:[],handedOver:0}));await E(s),await m(),v("upload")})},C=()=>`
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
  `,j=()=>{const o=document.getElementById("json-upload-box"),r=document.getElementById("json-file-input"),a=document.getElementById("clear-db-btn"),n=document.getElementById("download-db-btn");n&&n.addEventListener("click",()=>{const t=l.map(s=>({title:s.title,quantity:s.quantity,isbns:s.isbns})),e=new Date().toISOString().split("T")[0];O(t,`book-handover-list-${e}.json`)}),a&&a.addEventListener("click",async()=>{confirm("確定要清空所有書籍資料嗎？此操作無法復原！")&&(await q(),await m(),v("upload"))}),o.addEventListener("click",()=>r.click()),r.addEventListener("change",async t=>{const e=t.target.files[0];e&&await $(e)}),o.addEventListener("dragover",t=>{t.preventDefault(),o.style.borderColor="var(--accent-color)"}),o.addEventListener("dragleave",()=>{o.style.borderColor="var(--border-color)"}),o.addEventListener("drop",async t=>{t.preventDefault(),o.style.borderColor="var(--border-color)";const e=t.dataTransfer.files[0];e&&e.name.endsWith(".json")&&await $(e)})},$=async o=>{const r=document.getElementById("upload-result");try{const a=await o.text(),n=JSON.parse(a);if(!Array.isArray(n))throw new Error("JSON 格式錯誤：必須是陣列");const t=n.map(e=>({title:e.title,quantity:parseInt(e.quantity)||0,isbns:Array.isArray(e.isbns)?e.isbns:[],handedOver:0}));await E(t),await m(),r.innerHTML=`<p style="color: var(--success-color);">✅ 成功上傳 ${t.length} 筆書籍資料！</p>`,setTimeout(()=>v("upload"),1500)}catch(a){r.innerHTML=`<p style="color: var(--danger-color);">❌ 上傳失敗: ${a.message}</p>`}},M=()=>{const o=l.filter(e=>e.isbns&&e.isbns.length>0),r=o.filter(e=>e.handedOver<e.quantity),a=o.filter(e=>e.handedOver>=e.quantity),n=r.reduce((e,s)=>e+(s.quantity-s.handedOver),0),t=a.reduce((e,s)=>e+s.handedOver,0);return`
    <div class="view-card">
      <h2>✅ 有 ISBN 的書籍</h2>
      <p class="description">顯示所有已查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${r.length} 款 / 共 ${n} 本)
          </span>
        </h3>
        ${w(r)}
      </div>
      
      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>
          ✅ 已點交的書
          <span style="color: var(--success-color); font-size: 0.9em;">
            (${a.length} 款 / 共 ${t} 本)
          </span>
        </h3>
        ${w(a)}
      </div>
    </div>
  `},P=()=>{const o=l.filter(e=>!e.isbns||e.isbns.length===0),r=o.filter(e=>e.handedOver<e.quantity),a=o.filter(e=>e.handedOver>=e.quantity),n=r.reduce((e,s)=>e+(s.quantity-s.handedOver),0),t=a.reduce((e,s)=>e+s.handedOver,0);return`
    <div class="view-card">
      <h2>❌ 沒有 ISBN 的書籍</h2>
      <p class="description">顯示所有未查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${r.length} 款 / 共 ${n} 本)
          </span>
        </h3>
        ${w(r,!0)}
      </div>

      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>
          ✅ 已點交的書
          <span style="color: var(--success-color); font-size: 0.9em;">
            (${a.length} 款 / 共 ${t} 本)
          </span>
        </h3>
        ${w(a,!0)}
      </div>
    </div>
  `},_=()=>{const o=l.filter(t=>t.handedOver<t.quantity),r=l.filter(t=>t.handedOver>=t.quantity),a=o.reduce((t,e)=>t+(e.quantity-e.handedOver),0),n=r.reduce((t,e)=>t+e.handedOver,0);return`
    <div class="handover-view">
      <div class="split-left">
        <div class="book-list-section">
          <h3>
            📋 未點交的書
            <span id="pending-stats" style="color: var(--warning-color); font-size: 0.9em;">
              (${o.length} 款 / 共 ${a} 本)
            </span>
          </h3>
          <div id="pending-books">${f(o,!0,"pending")}</div>
        </div>
        
        <div class="book-list-section">
          <h3>
            ✅ 已點交的書
            <span id="completed-stats" style="color: var(--success-color); font-size: 0.9em;">
              (${r.length} 款 / 共 ${n} 本)
            </span>
          </h3>
          <div id="completed-books">${f(r,!0,"completed")}</div>
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
  `},z=()=>{const o=document.getElementById("isbn-input"),r=document.getElementById("match-result"),a=document.getElementById("pending-books"),n=document.getElementById("completed-books"),t=()=>{const s=l.filter(u=>u.handedOver<u.quantity),i=l.filter(u=>u.handedOver>=u.quantity);document.getElementById("pending-books").innerHTML=f(s,!0,"pending"),document.getElementById("completed-books").innerHTML=f(i,!0,"completed");const d=s.reduce((u,h)=>u+(h.quantity-h.handedOver),0),c=i.reduce((u,h)=>u+h.handedOver,0),y=document.getElementById("pending-stats"),B=document.getElementById("completed-stats");y&&(y.textContent=`(${s.length} 款 / 共 ${d} 本)`),B&&(B.textContent=`(${i.length} 款 / 共 ${c} 本)`)},e=async s=>{if(s.target.classList.contains("btn-handover")){const i=parseInt(s.target.getAttribute("data-book-id")),d=l.find(c=>c.id===i);if(d){let c;s.target.classList.contains("btn-increment")?c=d.handedOver+1:s.target.classList.contains("btn-decrement")&&(c=Math.max(0,d.handedOver-1)),c!==void 0&&(await I(d.id,c),await m(),t(),b())}}};a&&a.addEventListener("click",e),n&&n.addEventListener("click",e),o.addEventListener("keypress",async s=>{if(s.key==="Enter"){const i=o.value.trim();if(!i)return;const d=l.find(c=>c.isbns&&c.isbns.some(y=>y===i));if(d&&d.handedOver<d.quantity){const c=d.handedOver+1;await I(d.id,c),await m(),r.innerHTML=`
          <div style="background: rgba(35, 134, 54, 0.2); border: 1px solid var(--success-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--success-color); font-weight: 600;">✅ 點交成功！</p>
            <p style="margin-top: 0.5rem;">${d.title}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">已點交: ${c}/${d.quantity}</p>
          </div>
        `,t(),b()}else d&&d.handedOver>=d.quantity?r.innerHTML=`
          <div style="background: rgba(210, 153, 34, 0.2); border: 1px solid var(--warning-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--warning-color); font-weight: 600;">⚠️ 此書已全部點交完成</p>
            <p style="margin-top: 0.5rem;">${d.title}</p>
          </div>
        `:r.innerHTML=`
          <div style="background: rgba(248, 81, 73, 0.2); border: 1px solid var(--danger-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--danger-color); font-weight: 600;">❌ 找不到符合的書籍</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">ISBN: ${i}</p>
          </div>
        `;o.value="",setTimeout(()=>{r.innerHTML=""},2e3)}})},f=(o,r=!1,a="pending")=>{if(o.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let n='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th>';return r&&(n+="<th>手動點交</th>"),n+="</tr></thead><tbody>",o.forEach(t=>{let e="查無 ISBN";t.isbns&&t.isbns.length>0&&(e=t.isbns.join(", ")),n+=`
      <tr>
        <td>${t.title}</td>
        <td>${t.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${e}</td>
        <td><span style="color: ${t.handedOver>=t.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${t.handedOver}/${t.quantity}</span></td>`,r&&(n+='<td><div class="btn-group">',a==="completed"?n+=`<button class="btn-handover btn-decrement" data-book-id="${t.id}">-1</button>`:n+=`<button class="btn-handover btn-decrement" data-book-id="${t.id}">-1</button>
                         <button class="btn-handover btn-increment" data-book-id="${t.id}">+1</button>`,n+="</div></td>"),n+="</tr>"}),n+="</tbody></table>",n},w=(o,r=!1)=>{if(o.length===0)return'<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';let a='<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th></tr></thead><tbody>';return o.forEach(n=>{let t="查無 ISBN";!r&&n.isbns&&n.isbns.length>0&&(t=n.isbns.join(", ")),a+=`
      <tr>
        <td>${n.title}</td>
        <td>${n.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${t}</td>
        <td><span style="color: ${n.handedOver>=n.quantity?"var(--success-color)":"var(--warning-color)"}; font-weight: 600;">${n.handedOver}/${n.quantity}</span></td>
      </tr>
    `}),a+="</tbody></table>",a};
