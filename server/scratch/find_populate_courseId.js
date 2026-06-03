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
        if (content.includes("populate('courseId')") || content.includes('populate("courseId")')) {
            console.log(`Found in: ${file}`);
            // Find line numbers
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (line.includes("populate('courseId')") || line.includes('populate("courseId")')) {
                    console.log(`  Line ${idx + 1}: ${line.trim()}`);
                }
            });
        }
    }
};

run();
