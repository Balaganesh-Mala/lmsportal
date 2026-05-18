const fs = require('fs');
const path = 'e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx';
let content = fs.readFileSync(path, 'utf8');

// The logic we want to use
const logicBody = `
                                    let total = 0, comp = 0;
                                    modules.forEach(m => {
                                        (m.topics || []).forEach(t => {
                                            const content = topicContentMap[t._id] || {};
                                            const p = progress[t._id] || {};
                                            total++;
                                            if (p.videoCompleted || p.completed) comp++;
                                            if (content.mcqTest?.enabled) {
                                                total++;
                                                if (p.quizCompleted) comp++;
                                            }
                                            if (content.assignments?.length > 0) {
                                                total++;
                                                if (p.assignmentCompleted) comp++;
                                            }
                                        });
                                    });
                                    return total > 0 ? Math.round((comp / total) * 100) : 0;
                                `;

// 1. Fix the first instance (Text display)
const firstInstance = `{(() => {${logicBody}})()}%`;
// Replace the broken part
content = content.replace(/\{(\(\) => \{[\s\S]*?return total > 0 \? Math\.round\(\(comp \/ total\) \* 100\) : 0;)[\s\S]*?\}\)\(\)\}%`/, firstInstance);

// Actually, I'll just rewrite the whole Sidebar Progress Bar section to be safe.
const progressBarSectionRegex = /\{(\/\* Overall Progress Bar \*\/)\}[\s\S]*?(<div className="mt-4">[\s\S]*?Overall Progress[\s\S]*?<div className="h-2 w-full[\s\S]*?style=\{\{[\s\S]*?\}\}>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>)/;

// Let's find the whole block from line 688 to 750 approx
const newProgressBarSection = `
                    {/* Overall Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[12px] text-[#9ca3af]">Overall Progress</span>
                            <span className="text-[12px] font-bold text-[#60A5FA]">
                                {(() => {
                                    ${logicBody}
                                })()}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-[#0F172A] overflow-hidden shadow-inner relative border border-[#1e293b] rounded-full">
                            {/* The filled bar with gradient and glow */}
                            <div className="h-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#6EE7B7] rounded-full transition-all duration-700 relative shadow-[0_0_16px_rgba(52,211,153,0.8)]" style={{
                                width: \`\${(() => {
                                    ${logicBody}
                                })()}%\`
                            }}>
                                {/* Intense glowing animated head */}
                                <div className="absolute top-0 right-0 w-8 h-full bg-white blur-[2px] opacity-80 rounded-full animate-pulse"></div>
                                {/* Shimmer Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 opacity-50 w-full animate-pulse mix-blend-overlay"></div>
                            </div>

                            {/* Ambient bar glow (track fill effect) */}
                            <div className="absolute inset-0 bg-[#34D399] blur-[8px] opacity-25 select-none pointer-events-none transition-all duration-700" style={{
                                width: \`\${(() => {
                                    ${logicBody}
                                })()}%\`
                            }}></div>
                        </div>
                    </div>
`;

// Replace the block from lines 688 to 755 roughly
content = content.replace(/\{\/\* Overall Progress Bar \*\/\}[\s\S]*?<div className="mt-4">[\s\S]*?Overall Progress[\s\S]*?<\/div>\s+<\/div>/, newProgressBarSection);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed syntax errors in CoursePlayer.jsx');
