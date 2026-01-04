# Book Handover System (圖書點交系統)

這是一個純前端的圖書點交與管理系統，專為處理大量書籍的 ISBN 查詢、清單轉換與點交流程而設計。

## ✨ 主要功能

-   **📄 書單轉換**：上傳 CSV 書單，自動透過 Google Books API 查詢 ISBN。
-   **🗄️ 本地儲存**：使用 IndexedDB 儲存資料，關閉瀏覽器資料不會遺失。
-   **📦 點交系統**：
    -   支援掃描槍或手動輸入 ISBN 進行點交。
    -   提供「+1 / -1」手動調整按鈕。
    -   即時顯示點交進度（未點交 / 已點交）。
-   **📤 匯入/匯出**：支援 JSON 格式的備份與還原。

## 🚀 開始使用

### 1. 線上版 (GitHub Pages)
[點擊這裡開啟系統](https://edwardshao.github.io/book-handover-fast/)

### 2. CSV 上傳格式
請準備一個 `.csv` 檔案，編碼建議為 `UTF-8`。  
您也可以參考專案根目錄中的 [sample-booklist.csv](sample-booklist.csv) 範例檔案。
格式如下（第一列標題會被忽略，請確保順序正確）：

| 欄位 1 (Column A) | 欄位 2 (Column B) |
| :--- | :--- |
| **書名** | **數量** |

**範例內容：**
```csv
書名,數量
爺爺教我唱的歌,10
人間佛教佛陀本懷,5
星雲大師全集,1
```

### 3. 使用流程
1.  **轉換書單**：在首頁上傳 CSV，等待系統自動查詢 ISBN。
2.  **匯入資料**：查詢完成後，點擊「📥 直接匯入資料庫」。
3.  **開始點交**：切換到「5. 點交系統」，開始使用 ISBN 掃描槍或手動點擊進行點交。
4.  **備份資料**：隨時可以到「2. 上傳/管理書單」下載目前的 JSON 備份。

## 🛠️ 開發與部署

### 安裝依賴
```bash
npm install
```

### 本地開發 (Local Dev)
```bash
npm run dev
```

### 部署 (Deploy)
部署到 GitHub Pages：
```bash
npm run deploy
```

## ⚙️ 設定

### 1. Google Books API Key (選填)
可在「1. 轉換書單」頁面設定 Google Books API Key。設定後可以增加查詢配額，提高自動識別 ISBN 的成功率。

### 2. CORS Proxy URL (選填)
由於部分圖書資訊來源（如「博客來 Books.com.tw」）有跨域限制，如果您需要使用這些來源作為備份查詢，請設定自定義的 CORS Proxy URL。
- **格式**：請輸入完整的 URL，例如 `https://proxy.example.com/api`。
- **運作方式**：系統會直接使用該 URL 並以 `?` 接上目標網址，即 `${proxy_url}?${target_url}`。
- **注意**：如果沒有設定 Proxy URL，系統將只會使用 [Google Books API](https://developers.google.com/books) 進行查詢，並略過需要代理的來源，以節省等待時間。

## 📊 搜尋回饋
在轉換書單的查詢進程中，系統會即時顯示目前正在使用的查詢來源（Google Books 或 Books.com.tw），方便您了解目前的進度與來源。
