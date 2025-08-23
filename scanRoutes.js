const fs = require('fs');
const path = require('path');

const routeDir = path.join(__dirname, 'src/routes');

function scanFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) return scanFiles(fullPath);

        if (fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const matches = content.match(/(app|router)\.(use|get|post|put|delete)\(['"`](https?:\/\/[^'"`]+)['"`]/g);
            if (matches) {
                console.log(`⚠️  Full URL used in routes: ${fullPath}`);
                matches.forEach(m => console.log('   ', m));
            }
        }
    });
}

scanFiles(routeDir);
