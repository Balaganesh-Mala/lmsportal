const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(walk(filePath));
            }
        } else {
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(filePath);
            }
        }
    });
    return results;
};

const run = () => {
    const files = walk(path.join(__dirname, '..'));
    console.log(`Scanning ${files.length} JS/JSX files...`);
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('Batch') && content.includes('courseId')) {
            console.log(`Found Batch and courseId in: ${file}`);
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes('courseId') && (line.includes('Batch') || line.includes('batch'))) {
                    console.log(`  Line ${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
};

run();
