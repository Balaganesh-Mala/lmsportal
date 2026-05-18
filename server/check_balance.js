const fs = require('fs');
const path = 'e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx';
const content = fs.readFileSync(path, 'utf8');

let balance = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let opens = (line.match(/<div/g) || []).length;
    let closes = (line.match(/<\/div>/g) || []).length;
    balance += opens;
    balance -= closes;
    if (balance < 0) {
        console.log(`Balance went negative at line ${i + 1}: ${balance}`);
    }
}
console.log(`Final balance: ${balance}`);
