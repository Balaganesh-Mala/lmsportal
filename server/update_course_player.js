const fs = require('fs');
const path = 'e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update autoMarkTopicComplete
const oldAutoMark = /const autoMarkTopicComplete = async \(topicId\) => \{[\s\S]*?\};/;
const newAutoMark = `const autoMarkTopicComplete = async (topicId, type) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser || !topicId) return;

        const payload = {
            studentId: storedUser._id,
            courseId,
            topicId,
            watchedDuration: 0
        };

        if (type === 'quiz') payload.quizCompleted = true;
        if (type === 'assignment') payload.assignmentCompleted = true;

        try {
            const res = await axios.post(\`\${import.meta.env.VITE_API_URL}/api/student/progress/update\`, payload);
            if (res.data.success) {
                setProgress(prev => ({ ...prev, [topicId]: res.data.progress }));
                window.dispatchEvent(new CustomEvent('finwise-activity-sync'));
            }
        } catch (err) {
            console.error('Auto progress sync failed', err);
        }
    };`;

content = content.replace(oldAutoMark, newAutoMark);

// 2. Update submitQuiz calls
content = content.replace(/await autoMarkTopicComplete\(activeTopic\._id\);/g, "await autoMarkTopicComplete(activeTopic._id, 'quiz');");

// 3. Update updateProgress
const oldUpdateProgress = /const updateProgress = async \(completed, watchedDuration\) => \{[\s\S]*?await axios\.post\(`\${import\.meta\.env\.VITE_API_URL}\/api\/student\/progress\/update`, \{[\s\S]*?\}\);[\s\S]*?setProgress\(prev => \(\{ \.\.\.prev, \[activeTopic\._id\]: \{ \.\.\.prev\[activeTopic\._id\], completed, watchedDuration \} \}\)\);/;
const newUpdateProgressPart = `const updateProgress = async (completed, watchedDuration) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser || !activeTopic) return;

        // Ensure we only block when transitioning from uncompleted -> completed
        if (completed && !progress[activeTopic._id]?.completed) {
            const req = checkTopicCompletionRequirements();
            if (!req.allowed) {
                toast.error(req.message);
                return;
            }
        }

        try {
            const res = await axios.post(\`\${import.meta.env.VITE_API_URL}/api/student/progress/update\`, {
                studentId: storedUser._id,
                courseId: courseId,
                topicId: activeTopic._id,
                completed: completed,
                videoCompleted: completed,
                watchedDuration: watchedDuration
            });
            if (res.data.success) {
                setProgress(prev => ({ ...prev, [activeTopic._id]: res.data.progress }));
            }
`;

// This one is trickier with regex, let's just find and replace a specific block.
content = content.replace(/await axios\.post\(`\${import\.meta\.env\.VITE_API_URL}\/api\/student\/progress\/update`, \{[\s\S]*?studentId: storedUser\._id,[\s\S]*?courseId: courseId,[\s\S]*?topicId: activeTopic\._id,[\s\S]*?completed: completed,[\s\S]*?watchedDuration: watchedDuration[\s\S]*?\}\);[\s\S]*?setProgress\(prev => \(\{ \.\.\.prev, \[activeTopic\._id\]: \{ \.\.\.prev\[activeTopic\._id\], completed, watchedDuration \} \}\)\);/, 
`const res = await axios.post(\`\${import.meta.env.VITE_API_URL}/api/student/progress/update\`, {
                studentId: storedUser._id,
                courseId: courseId,
                topicId: activeTopic._id,
                completed: completed,
                videoCompleted: completed,
                watchedDuration: watchedDuration
            });
            if (res.data.success) {
                setProgress(prev => ({ ...prev, [activeTopic._id]: res.data.progress }));
            }`);

// 4. Update handleAssignmentSubmit call (Wait, I need to check where it is)
// Actually I'll just search and replace all instances of await autoMarkTopicComplete(activeTopic._id);
// But I already did that for quiz. I need to distinguish.

// Let's find handleAssignmentSubmit
content = content.replace(/toast\.success\('Assignment uploaded! Topic marked as complete.'\);\s+\/\/ ✅ Auto-mark topic as complete when assignment is submitted\s+await autoMarkTopicComplete\(activeTopic\._id\);/,
`toast.success('Assignment uploaded! Topic marked as complete.');
            // ✅ Auto-mark topic as complete when assignment is submitted
            await autoMarkTopicComplete(activeTopic._id, 'assignment');`);

// 5. Update Sidebar Progress logic
const sidebarProgressLogic = `let total = 0, comp = 0;
                                    modules.forEach(m => {
                                        (m.topics || []).forEach(t => {
                                            const content = topicContentMap[t._id] || {};
                                            const p = progress[t._id] || {};
                                            
                                            // 1. Video Activity (Each topic has a video)
                                            total++;
                                            if (p.videoCompleted || p.completed) comp++;
                                            
                                            // 2. Quiz Activity (If enabled)
                                            if (content.mcqTest?.enabled) {
                                                total++;
                                                if (p.quizCompleted) comp++;
                                            }
                                            
                                            // 3. Assignment Activity (If exists)
                                            if (content.assignments?.length > 0) {
                                                total++;
                                                if (p.assignmentCompleted) comp++;
                                            }
                                        });
                                    });
                                    return total > 0 ? Math.round((comp / total) * 100) : 0;`;

content = content.replace(/let total = 0, comp = 0;[\s\S]*?modules\.forEach\(m => \{[\s\S]*?total \+= \(m\.topics \|\| \[\]\)\.length;[\s\S]*?comp \+= \(m\.topics \|\| \[\]\)\.filter\(t => progress\[t\._id\]\?\.completed\)\.length;[\s\S]*?\}\);[\s\S]*?return total > 0 \? Math\.round\(\(comp \/ total\) \* 100\) : 0;/, sidebarProgressLogic);

// Repeat for the width calculation which is identical
content = content.replace(/let total = 0, comp = 0;[\s\S]*?modules\.forEach\(m => \{[\s\S]*?total \+= \(m\.topics \|\| \[\]\)\.length;[\s\S]*?comp \+= \(m\.topics \|\| \[\]\)\.filter\(t => progress\[t\._id\]\?\.completed\)\.length;[\s\S]*?\}\);[\s\S]*?return total > 0 \? Math\.round\(\(comp \/ total\) \* 100\) : 0;/g, sidebarProgressLogic);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated CoursePlayer.jsx');
