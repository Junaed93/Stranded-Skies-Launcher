const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = 3000;
const ROOT = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
    '.data': 'application/octet-stream'
};

const server = http.createServer((req, res) => {
    // Normalize path
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/' || urlPath === '/login') urlPath = '/index.html';
    
    const safePath = path.normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT, safePath);

    // Try to find the file
    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            // File exists exactly as requested
            serveFile(filePath, res, urlPath);
        } else {
            // File not found, try looking for a .br version
            const brPath = filePath + '.br';
            fs.stat(brPath, (errBr, statsBr) => {
                if (!errBr && statsBr.isFile()) {
                    // Found .br version! Serve it decompressed.
                    serveDecompressed(brPath, res, urlPath);
                } else {
                    // Not found anywhere
                    res.writeHead(404, {'Content-Type': 'text/plain'});
                    res.end('404 Not Found: ' + urlPath);
                }
            });
        }
    });
});

function serveFile(filePath, res, urlPath) {
    const ext = path.extname(filePath);
    
    // Handle .br files - Unity expects Content-Encoding: br
    if (ext === '.br') {
        // Get the actual extension (e.g., .js from .js.br)
        const actualExt = path.extname(filePath.slice(0, -3));
        const contentType = MIME_TYPES[actualExt] || 'application/octet-stream';
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Encoding': 'br',
            'Access-Control-Allow-Origin': '*'
        });
        
        fs.createReadStream(filePath).pipe(res);
        console.log(`Served (Brotli): ${urlPath}`);
        return;
    }
    
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
    });
    
    fs.createReadStream(filePath).pipe(res);
    console.log(`Served: ${urlPath}`);
}

function serveDecompressed(brPath, res, originalUrl) {
    // Determine content type based on the ORIGINAL requested request (stripping .br is implied since we added it)
    const ext = path.extname(originalUrl); 
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
    });

    const readStream = fs.createReadStream(brPath);
    const decompress = zlib.createBrotliDecompress();

    readStream.pipe(decompress).pipe(res);
    console.log(`Served (Decompressed .br -> plain): ${originalUrl}`);
}

server.listen(PORT, () => {
    console.log(`\n--- Stranded Skies Magic Server ---`);
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Features: Auto-resolves missing files to their .br versions and decompresses them.`);
    console.log(`-----------------------------------\n`);
});
