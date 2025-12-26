const fetchWithProxy = async (targetUrl) => {
    // Using corsproxy.io as a more reliable alternative
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) {
        throw new Error(`Proxy Error: ${response.status}`);
    }
    return await response.text();
};

const searchBooksDotComTw = async (title) => {
    try {
        console.log(`Searching Books.com.tw for: ${title}`);
        // 1. Search for the book
        const searchUrl = `https://search.books.com.tw/search/query/key/${encodeURIComponent(title)}/cat/all`;
        const searchHtml = await fetchWithProxy(searchUrl);

        const parser = new DOMParser();
        const searchDoc = parser.parseFromString(searchHtml, 'text/html');

        // Find the first result link
        // Based on analysis: <h4><a href="...">...</a></h4>
        const firstResultLink = searchDoc.querySelector('h4 a[href*="item/"]');

        if (!firstResultLink) {
            console.log('No results found on Books.com.tw');
            return [];
        }

        const href = firstResultLink.getAttribute('href');
        const itemMatch = href.match(/item\/([\w\d]+)/);

        if (!itemMatch || !itemMatch[1]) {
            console.log('Could not extract item ID from link:', href);
            return [];
        }

        const itemId = itemMatch[1];
        const detailUrl = `https://www.books.com.tw/products/${itemId}`;
        console.log(`Constructed detail URL: ${detailUrl}`);

        // 2. Fetch detail page
        const detailHtml = await fetchWithProxy(detailUrl);
        const detailDoc = parser.parseFromString(detailHtml, 'text/html');

        // 3. Extract ISBN
        // Look for text containing "ISBN：" or in meta tags
        // Usually in ul.li or similar text blocks
        const bodyText = detailDoc.body.textContent;
        // Regex to find ISBN-13 (usually starts with 97)
        const isbnMatch = bodyText.match(/ISBN：(\d{13})/);

        if (isbnMatch && isbnMatch[1]) {
            console.log(`Found ISBN on Books.com.tw: ${isbnMatch[1]}`);
            return [isbnMatch[1]];
        }

        return [];
    } catch (error) {
        console.error('Error searching Books.com.tw:', error);
        return [];
    }
};

export const searchISBNByTitle = async (title) => {
    try {
        const apiKey = localStorage.getItem('google_books_api_key');
        let url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=5`;
        if (apiKey) {
            url += `&key=${apiKey}`;
        }

        const response = await fetch(url);

        // Check for 429 Too Many Requests
        if (response.status === 429) {
            console.warn('Google Books API Rate Limit Exceeded. Trying fallback...');
            // Fallback immediately
        } else if (response.ok) {
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const isbns = new Set();
                data.items.forEach(item => {
                    const identifiers = item.volumeInfo?.industryIdentifiers;
                    if (identifiers) {
                        identifiers.forEach(id => {
                            if (id.type === 'ISBN_13') {
                                isbns.add(id.identifier);
                            }
                        });
                    }
                });

                if (isbns.size > 0) {
                    return Array.from(isbns);
                }
            }
        }

        // If we reached here, Google Books failed or returned no ISBNs. Try fallback.
        console.log('Google Books returned no results. Trying Books.com.tw fallback...');
        return await searchBooksDotComTw(title);

    } catch (error) {
        console.error(`Error searching ISBN for "${title}":`, error);
        // Try fallback on error
        return await searchBooksDotComTw(title);
    }
};
