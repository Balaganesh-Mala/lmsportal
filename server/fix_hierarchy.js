const fs = require('fs');
const path = 'e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx';
let content = fs.readFileSync(path, 'utf8');

// The logic we want to use (properly escaped for template literal writing)
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

const cleanSidebarPart = `
            <div className={\`
                w-full md:w-[320px] lg:w-[320px]
                \${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                bg-[#1B2538] border-r border-[#152040] flex-shrink-0 transition-transform duration-300 flex flex-col z-30 absolute md:static h-full overflow-hidden shadow-2xl font-sans
            \`}>
                {/* Header Section */}
                <div className="px-5 py-5 border-b border-[#0f1523] bg-[#0E1524] shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-white text-[16px] leading-snug pr-2 tracking-wide font-sans" title={course?.title}>{course?.title || 'Course Player'}</h2>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-md hover:bg-[#1f2937] text-white/70 hover:text-white transition-colors shrink-0">
                            <ArrowLeft size={16} />
                        </button>
                    </div>
                    {/* Overall Progress Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between items-end mb-1.5">
                            <span className="text-[12px] text-[#9ca3af]">Overall Progress</span>
                            <span className="text-[12px] font-bold text-[#60A5FA]">
                                {(() => { ${logicBody} })()}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-[#0F172A] overflow-hidden shadow-inner relative border border-[#1e293b] rounded-full">
                            <div className="h-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#6EE7B7] rounded-full transition-all duration-700 relative shadow-[0_0_16px_rgba(52,211,153,0.8)]" style={{
                                width: \`\${(() => { ${logicBody} })()}%\`
                            }}>
                                <div className="absolute top-0 right-0 w-8 h-full bg-white blur-[2px] opacity-80 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 opacity-50 w-full animate-pulse mix-blend-overlay"></div>
                            </div>
                            <div className="absolute inset-0 bg-[#34D399] blur-[8px] opacity-25 select-none pointer-events-none transition-all duration-700" style={{
                                width: \`\${(() => { ${logicBody} })()}%\`
                            }}></div>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 pb-10 m-0 space-y-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#1B2538]">
`;

// Replace the entire Sidebar header and opening div
const startMarker = '            {/* Sidebar Code (Timeline / Platform Flat UI Style) */}';
const endMarker = '<div className="overflow-y-auto flex-1 pb-10 m-0 space-y-0';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex + startMarker.length) + 
                       cleanSidebarPart + 
                       content.substring(endIndex + endMarker.length);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log('Fixed CoursePlayer.jsx sidebar hierarchy');
} else {
    console.log('Markers not found', startIndex, endIndex);
}
