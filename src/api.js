export const searchISBNByTitle = async (title) => {
    try {
        const apiKey = localStorage.getItem('google_books_api_key');
        let url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=5`;
        if (apiKey) {
            url += `&key=${apiKey}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            return [];
        }

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

        return Array.from(isbns);
    } catch (error) {
        console.error(`Error searching ISBN for "${title}":`, error);
        return [];
    }
};
