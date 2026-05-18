const fs = require('fs');
const path = 'e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx';
let content = fs.readFileSync(path, 'utf8');

// Update module progress display
content = content.replace(/const completedTopics = modTopics\.filter\(t => progress\[t\._id\]\?\.completed\)\.length;[\s\S]*?const totalTopics = modTopics\.length;/, 
`let modComp = 0;
                        let modTotal = 0;
                        modTopics.forEach(t => {
                            const content = topicContentMap[t._id] || {};
                            const p = progress[t._id] || {};
                            modTotal++;
                            if (p.videoCompleted || p.completed) modComp++;
                            if (content.mcqTest?.enabled) {
                                modTotal++;
                                if (p.quizCompleted) modComp++;
                            }
                            if (content.assignments?.length > 0) {
                                modTotal++;
                                if (p.assignmentCompleted) modComp++;
                            }
                        });`);

// Update the label display
content = content.replace(/\{completedTopics\}\/\{totalTopics\} lessons/, '{modComp}/{modTotal} activities');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated module progress in CoursePlayer.jsx');
