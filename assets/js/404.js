        // Redirect old WordPress URLs to the main site
        const oldUrls = ['/gallery/', '/hello-world/', '/category/uncategorized/', '/2024/11/'];
        const currentPath = window.location.pathname;
        
        if (oldUrls.includes(currentPath) || oldUrls.some(url => currentPath.startsWith(url))) {
            window.location.replace('https://hernandezlandscapeservices.com/#gallery');
        } else {
            // For other 404s, redirect to home after 3 seconds
            setTimeout(() => {
                window.location.replace('https://hernandezlandscapeservices.com');
            }, 3000);
        }
