import { initDB, getAllBooks, saveBooks, updateBookHandedOver, clearAllBooks } from './db.js';
import { searchISBNByTitle } from './api.js';
import { parseCSV, downloadJSON } from './utils.js';

let currentView = 'convert';
let booksData = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    await loadBooksData();
    setupNavigation();
    renderView('convert');
    updateProgress();
});

// Setup navigation
const setupNavigation = () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.getAttribute('data-view');
            renderView(view);
        });
    });
};

// Load books from IndexedDB
const loadBooksData = async () => {
    booksData = await getAllBooks();
    updateProgress();
};

// Update overall progress
const updateProgress = () => {
    const totalBooks = booksData.reduce((sum, book) => sum + book.quantity, 0);
    const handedOverBooks = booksData.reduce((sum, book) => sum + book.handedOver, 0);
    const percentage = totalBooks > 0 ? Math.round((handedOverBooks / totalBooks) * 100) : 0;
    document.getElementById('overall-progress').textContent = percentage;
};

// Render different views
const renderView = (view) => {
    currentView = view;
    const container = document.getElementById('view-container');

    // Update navigation active state
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.getAttribute('data-view') === view) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    switch (view) {
        case 'convert':
            container.innerHTML = renderConvertView();
            setupConvertHandlers();
            break;
        case 'upload':
            container.innerHTML = renderUploadView();
            setupUploadHandlers();
            break;
        case 'with-isbn':
            container.innerHTML = renderWithISBNView();
            break;
        case 'without-isbn':
            container.innerHTML = renderWithoutISBNView();
            break;
        case 'handover':
            container.innerHTML = renderHandoverView();
            setupHandoverHandlers();
            break;
    }
};

// ===== VIEW 1: Convert CSV to JSON =====
const renderConvertView = () => {
    const apiKey = localStorage.getItem('google_books_api_key');
    const apiKeyHtml = apiKey
        ? `
        <div class="api-key-section" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: rgba(35, 134, 54, 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p style="color: var(--success-color); font-weight: 600;">✅ API Key 已設定</p>
                <button class="btn btn-secondary" id="clear-api-key-btn" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">清除 API Key</button>
            </div>
        </div>`
        : `
        <div class="api-key-section" style="margin-bottom: 2rem; padding: 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-color);">
            <p style="margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">設定 Google Books API Key (選填，可增加查詢配額)</p>
            <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="api-key-input" placeholder="輸入 API Key..." style="flex: 1; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--panel-bg); color: var(--text-primary);">
                <button class="btn" id="save-api-key-btn" style="padding: 0.5rem 1rem;">儲存</button>
            </div>
        </div>`;

    return `
    <div class="view-card">
      <h2>📄 轉換書單 → 點交系統書單</h2>
      <p class="description">上傳 CSV 書單，系統會自動使用 Google Books API 查詢 ISBN，並產生點交系統專用的 JSON 檔案。</p>
      
      ${apiKeyHtml}

      <div class="upload-box" id="csv-upload-box">
        <p style="font-size: 2rem; margin-bottom: 1rem;">📤</p>
        <p>點擊或拖曳 CSV 檔案至此處</p>
        <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
      </div>
      
      <div id="convert-result" style="margin-top: 2rem;"></div>
    </div>
  `;
};

const setupConvertHandlers = () => {
    const uploadBox = document.getElementById('csv-upload-box');
    const fileInput = document.getElementById('csv-file-input');

    // API Key Handlers
    const saveKeyBtn = document.getElementById('save-api-key-btn');
    const clearKeyBtn = document.getElementById('clear-api-key-btn');
    const apiKeyInput = document.getElementById('api-key-input');

    if (saveKeyBtn) {
        saveKeyBtn.addEventListener('click', () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('google_books_api_key', key);
                renderView('convert'); // Refresh view
            }
        });
    }

    if (clearKeyBtn) {
        clearKeyBtn.addEventListener('click', () => {
            if (confirm('確定要清除 API Key 嗎？')) {
                localStorage.removeItem('google_books_api_key');
                renderView('convert'); // Refresh view
            }
        });
    }

    uploadBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await processCSVFile(file);
        }
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--accent-color)';
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = 'var(--border-color)';
    });

    uploadBox.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            await processCSVFile(file);
        }
    });
};

const processCSVFile = async (file) => {
    const resultDiv = document.getElementById('convert-result');
    resultDiv.innerHTML = '<div class="spinner"></div><p>正在讀取 CSV 並查詢 ISBN...</p>';

    const text = await file.text();
    const books = parseCSV(text);

    if (books.length === 0) {
        resultDiv.innerHTML = '<p style="color: var(--danger-color);">❌ CSV 檔案格式錯誤或無資料</p>';
        return;
    }

    // Search ISBN for each book
    const results = [];
    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        resultDiv.innerHTML = `<div class="spinner"></div><p>正在查詢 ISBN... (${i + 1}/${books.length})</p>`;

        const isbns = await searchISBNByTitle(book.title);
        results.push({
            title: book.title,
            quantity: book.quantity,
            isbns: isbns
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Display results
    let html = '<h3>✅ 轉換完成</h3>';
    html += '<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th></tr></thead><tbody>';
    results.forEach(book => {
        const isbnDisplay = book.isbns.length > 0 ? book.isbns.join(', ') : '查無 ISBN';
        html += `<tr><td>${book.title}</td><td>${book.quantity}</td><td>${isbnDisplay}</td></tr>`;
    });
    html += '</tbody></table>';
    html += '<div style="margin-top: 1.5rem;">';
    html += '<button class="btn" id="download-json-btn" style="margin-right: 1rem;">💾 下載 JSON 檔案</button>';
    html += '<button class="btn btn-primary" id="import-db-btn">📥 直接匯入資料庫</button>';
    html += '</div>';

    resultDiv.innerHTML = html;

    document.getElementById('download-json-btn').addEventListener('click', () => {
        const timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(results, `book-handover-list-${timestamp}.json`);
    });

    document.getElementById('import-db-btn').addEventListener('click', async () => {
        const transformedBooks = results.map(item => ({
            title: item.title,
            quantity: parseInt(item.quantity) || 0,
            isbns: Array.isArray(item.isbns) ? item.isbns : [],
            handedOver: 0
        }));
        await saveBooks(transformedBooks);
        await loadBooksData();
        renderView('upload'); // Navigate to upload view to show the updated data
    });
};

// ===== VIEW 2: Upload JSON =====
const renderUploadView = () => {
    const hasData = booksData.length > 0;

    return `
    <div class="view-card">
      <h2>📥 上傳點交系統書單</h2>
      <p class="description">上傳先前產生的 JSON 書單檔案，系統會將資料儲存至本地資料庫。</p>
      
      ${hasData ? `
        <div style="background: rgba(88, 166, 255, 0.1); border: 1px solid var(--accent-color); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <p style="color: var(--accent-color);">📊 資料庫中已有 ${booksData.length} 筆書籍資料</p>
          <div style="margin-top: 0.5rem;">
            <button class="btn" id="download-db-btn" style="margin-right: 0.5rem;">💾 下載書單</button>
            <button class="btn btn-danger" id="clear-db-btn">🗑️ 清空現有資料</button>
          </div>
        </div>
      ` : ''}
      
      <div class="upload-box" id="json-upload-box">
        <p style="font-size: 2rem; margin-bottom: 1rem;">📤</p>
        <p>點擊或拖曳 JSON 檔案至此處</p>
        <input type="file" id="json-file-input" accept=".json" style="display: none;">
      </div>
      
      <div id="upload-result" style="margin-top: 2rem;"></div>
    </div>
  `;
};

const setupUploadHandlers = () => {
    const uploadBox = document.getElementById('json-upload-box');
    const fileInput = document.getElementById('json-file-input');
    const clearBtn = document.getElementById('clear-db-btn');
    const downloadBtn = document.getElementById('download-db-btn');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            // Export current booklist from IndexedDB
            const exportData = booksData.map(book => ({
                title: book.title,
                quantity: book.quantity,
                isbns: book.isbns
            }));
            const timestamp = new Date().toISOString().split('T')[0];
            downloadJSON(exportData, `book-handover-list-${timestamp}.json`);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('確定要清空所有書籍資料嗎？此操作無法復原！')) {
                await clearAllBooks();
                await loadBooksData();
                renderView('upload');
            }
        });
    }

    uploadBox.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await processJSONFile(file);
        }
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--accent-color)';
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.style.borderColor = 'var(--border-color)';
    });

    uploadBox.addEventListener('drop', async (e) => {
        e.preventDefault();
        uploadBox.style.borderColor = 'var(--border-color)';
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.json')) {
            await processJSONFile(file);
        }
    });
};

const processJSONFile = async (file) => {
    const resultDiv = document.getElementById('upload-result');

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
            throw new Error('JSON 格式錯誤：必須是陣列');
        }

        // Transform data to match our schema
        const books = data.map(item => ({
            title: item.title,
            quantity: parseInt(item.quantity) || 0,
            isbns: Array.isArray(item.isbns) ? item.isbns : [],
            handedOver: 0
        }));

        await saveBooks(books);
        await loadBooksData();

        resultDiv.innerHTML = `<p style="color: var(--success-color);">✅ 成功上傳 ${books.length} 筆書籍資料！</p>`;

        // Refresh the view to show the clear button
        setTimeout(() => renderView('upload'), 1500);
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: var(--danger-color);">❌ 上傳失敗: ${error.message}</p>`;
    }
};

// ===== VIEW 3: Books with ISBN =====
const renderWithISBNView = () => {
    const booksWithISBN = booksData.filter(book => book.isbns && book.isbns.length > 0);
    const pending = booksWithISBN.filter(book => book.handedOver < book.quantity);
    const completed = booksWithISBN.filter(book => book.handedOver >= book.quantity);

    // Calculate total quantities
    const pendingTotal = pending.reduce((sum, book) => sum + (book.quantity - book.handedOver), 0);
    const completedTotal = completed.reduce((sum, book) => sum + book.handedOver, 0);

    return `
    <div class="view-card">
      <h2>✅ 有 ISBN 的書籍</h2>
      <p class="description">顯示所有已查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${pending.length} 款 / 共 ${pendingTotal} 本)
          </span>
        </h3>
        ${renderBookTable(pending)}
      </div>
      
      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>
          ✅ 已點交的書
          <span style="color: var(--success-color); font-size: 0.9em;">
            (${completed.length} 款 / 共 ${completedTotal} 本)
          </span>
        </h3>
        ${renderBookTable(completed)}
      </div>
    </div>
  `;
};

// ===== VIEW 4: Books without ISBN =====
const renderWithoutISBNView = () => {
    const booksWithoutISBN = booksData.filter(book => !book.isbns || book.isbns.length === 0);
    const pending = booksWithoutISBN.filter(book => book.handedOver < book.quantity);
    const completed = booksWithoutISBN.filter(book => book.handedOver >= book.quantity);

    // Calculate total quantities
    const pendingTotal = pending.reduce((sum, book) => sum + (book.quantity - book.handedOver), 0);
    const completedTotal = completed.reduce((sum, book) => sum + book.handedOver, 0);

    return `
    <div class="view-card">
      <h2>❌ 沒有 ISBN 的書籍</h2>
      <p class="description">顯示所有未查詢到 ISBN 的書籍資料</p>
      
      <div class="book-list-section">
        <h3>
          📋 未點交的書
          <span style="color: var(--warning-color); font-size: 0.9em;">
            (${pending.length} 款 / 共 ${pendingTotal} 本)
          </span>
        </h3>
        ${renderBookTable(pending, true)}
      </div>

      <div class="book-list-section" style="margin-top: 1.5rem;">
        <h3>
          ✅ 已點交的書
          <span style="color: var(--success-color); font-size: 0.9em;">
            (${completed.length} 款 / 共 ${completedTotal} 本)
          </span>
        </h3>
        ${renderBookTable(completed, true)}
      </div>
    </div>
  `;
};

// ===== VIEW 5: Handover System =====
const renderHandoverView = () => {
    const pending = booksData.filter(book => book.handedOver < book.quantity);
    const completed = booksData.filter(book => book.handedOver >= book.quantity);

    // Calculate total quantities
    const pendingTotal = pending.reduce((sum, book) => sum + (book.quantity - book.handedOver), 0);
    const completedTotal = completed.reduce((sum, book) => sum + book.handedOver, 0);

    return `
    <div class="handover-view">
      <div class="split-left">
        <div class="book-list-section">
          <h3>
            📋 未點交的書
            <span id="pending-stats" style="color: var(--warning-color); font-size: 0.9em;">
              (${pending.length} 款 / 共 ${pendingTotal} 本)
            </span>
          </h3>
          <div id="pending-books">${renderHandoverBookTable(pending, true, 'pending')}</div>
        </div>
        
        <div class="book-list-section">
          <h3>
            ✅ 已點交的書
            <span id="completed-stats" style="color: var(--success-color); font-size: 0.9em;">
              (${completed.length} 款 / 共 ${completedTotal} 本)
            </span>
          </h3>
          <div id="completed-books">${renderHandoverBookTable(completed, true, 'completed')}</div>
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
  `;
};

const setupHandoverHandlers = () => {
    const isbnInput = document.getElementById('isbn-input');
    const matchResult = document.getElementById('match-result');
    const pendingBooksContainer = document.getElementById('pending-books');
    const completedBooksContainer = document.getElementById('completed-books');

    // Helper function to refresh book lists
    const refreshBookLists = () => {
        const pending = booksData.filter(book => book.handedOver < book.quantity);
        const completed = booksData.filter(book => book.handedOver >= book.quantity);

        document.getElementById('pending-books').innerHTML = renderHandoverBookTable(
            pending,
            true,
            'pending'
        );
        document.getElementById('completed-books').innerHTML = renderHandoverBookTable(
            completed,
            true,
            'completed'
        );

        // Update stats
        const pendingTotal = pending.reduce((sum, book) => sum + (book.quantity - book.handedOver), 0);
        const completedTotal = completed.reduce((sum, book) => sum + book.handedOver, 0);

        const pendingStats = document.getElementById('pending-stats');
        const completedStats = document.getElementById('completed-stats');

        if (pendingStats) pendingStats.textContent = `(${pending.length} 款 / 共 ${pendingTotal} 本)`;
        if (completedStats) completedStats.textContent = `(${completed.length} 款 / 共 ${completedTotal} 本)`;
    };

    // Handler for button clicks
    const handleButtonClick = async (e) => {
        if (e.target.classList.contains('btn-handover')) {
            const bookId = parseInt(e.target.getAttribute('data-book-id'));
            const book = booksData.find(b => b.id === bookId);

            if (book) {
                let newHandedOver;
                if (e.target.classList.contains('btn-increment')) {
                    newHandedOver = book.handedOver + 1;
                } else if (e.target.classList.contains('btn-decrement')) {
                    newHandedOver = Math.max(0, book.handedOver - 1);
                }

                if (newHandedOver !== undefined) {
                    await updateBookHandedOver(book.id, newHandedOver);
                    await loadBooksData();
                    refreshBookLists();
                    updateProgress();
                }
            }
        }
    };

    // Add event listeners (delegation)
    if (pendingBooksContainer) {
        pendingBooksContainer.addEventListener('click', handleButtonClick);
    }
    if (completedBooksContainer) {
        completedBooksContainer.addEventListener('click', handleButtonClick);
    }

    isbnInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const isbn = isbnInput.value.trim();
            if (!isbn) return;

            // Find matching book (exact match only - ISBN-13 is 13 digits)
            const matchedBook = booksData.find(book =>
                book.isbns && book.isbns.some(bookIsbn => bookIsbn === isbn)
            );

            if (matchedBook && matchedBook.handedOver < matchedBook.quantity) {
                // Increment by 1
                const newHandedOver = matchedBook.handedOver + 1;
                await updateBookHandedOver(matchedBook.id, newHandedOver);
                await loadBooksData();

                // Show success message
                matchResult.innerHTML = `
          <div style="background: rgba(35, 134, 54, 0.2); border: 1px solid var(--success-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--success-color); font-weight: 600;">✅ 點交成功！</p>
            <p style="margin-top: 0.5rem;">${matchedBook.title}</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">已點交: ${newHandedOver}/${matchedBook.quantity}</p>
          </div>
        `;

                // Refresh the lists
                refreshBookLists();
                updateProgress();
            } else if (matchedBook && matchedBook.handedOver >= matchedBook.quantity) {
                matchResult.innerHTML = `
          <div style="background: rgba(210, 153, 34, 0.2); border: 1px solid var(--warning-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--warning-color); font-weight: 600;">⚠️ 此書已全部點交完成</p>
            <p style="margin-top: 0.5rem;">${matchedBook.title}</p>
          </div>
        `;
            } else {
                matchResult.innerHTML = `
          <div style="background: rgba(248, 81, 73, 0.2); border: 1px solid var(--danger-color); border-radius: 8px; padding: 1rem;">
            <p style="color: var(--danger-color); font-weight: 600;">❌ 找不到符合的書籍</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">ISBN: ${isbn}</p>
          </div>
        `;
            }

            // Clear input and result after 2 seconds
            isbnInput.value = '';
            setTimeout(() => {
                matchResult.innerHTML = '';
            }, 2000);
        }
    });
};

// Helper: Render book table for handover view (with manual handover buttons)
const renderHandoverBookTable = (books, showHandoverButton = false, buttonType = 'pending') => {
    if (books.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';
    }

    let html = '<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th>';
    if (showHandoverButton) {
        html += '<th>手動點交</th>';
    }
    html += '</tr></thead><tbody>';

    books.forEach(book => {
        let isbnDisplay = '查無 ISBN';
        let titleHtml = book.title;

        if (book.isbns && book.isbns.length > 0) {
            isbnDisplay = book.isbns.join(', ');
        } else {
            // Add search link for books without ISBN
            const searchUrl = `https://search.books.com.tw/search/query/key/${encodeURIComponent(book.title)}/cat/all`;
            titleHtml += ` <a href="${searchUrl}" target="_blank" style="text-decoration: none; font-size: 0.8rem; margin-left: 0.5rem;" title="在博客來搜尋">🔍</a>`;
        }

        html += `
      <tr>
        <td>${titleHtml}</td>
        <td>${book.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${isbnDisplay}</td>
        <td><span style="color: ${book.handedOver >= book.quantity ? 'var(--success-color)' : 'var(--warning-color)'}; font-weight: 600;">${book.handedOver}/${book.quantity}</span></td>`;

        if (showHandoverButton) {
            html += `<td><div class="btn-group">`;
            if (buttonType === 'completed') {
                html += `<button class="btn-handover btn-decrement" data-book-id="${book.id}">-1</button>`;
            } else {
                html += `<button class="btn-handover btn-decrement" data-book-id="${book.id}">-1</button>
                         <button class="btn-handover btn-increment" data-book-id="${book.id}">+1</button>`;
            }
            html += `</div></td>`;
        }
        html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
};

// Helper: Render book table
const renderBookTable = (books, showNoISBN = false) => {
    if (books.length === 0) {
        return '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">目前沒有資料</p>';
    }

    let html = '<table class="data-table"><thead><tr><th>書名</th><th>數量</th><th>ISBN</th><th>已點交</th></tr></thead><tbody>';
    books.forEach(book => {
        let isbnDisplay = '查無 ISBN';
        let titleHtml = book.title;

        if (!showNoISBN && book.isbns && book.isbns.length > 0) {
            isbnDisplay = book.isbns.join(', ');
        } else if (showNoISBN) {
            // Add search link for books without ISBN
            const searchUrl = `https://search.books.com.tw/search/query/key/${encodeURIComponent(book.title)}/cat/all`;
            titleHtml += ` <a href="${searchUrl}" target="_blank" style="text-decoration: none; font-size: 0.8rem; margin-left: 0.5rem;" title="在博客來搜尋">🔍</a>`;
        }

        html += `
      <tr>
        <td>${titleHtml}</td>
        <td>${book.quantity}</td>
        <td style="font-size: 0.85rem; color: var(--text-secondary);">${isbnDisplay}</td>
        <td><span style="color: ${book.handedOver >= book.quantity ? 'var(--success-color)' : 'var(--warning-color)'}; font-weight: 600;">${book.handedOver}/${book.quantity}</span></td>
      </tr>
    `;
    });
    html += '</tbody></table>';
    return html;
};
