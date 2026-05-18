const fs = require('fs');
const path = 'e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx';
let content = fs.readFileSync(path, 'utf8');

const quizReplacement = `                                                            {/* Node circle */}
                                                            <div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                                                {progress[topic._id]?.quizCompleted ? (
                                                                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                                                                        <CheckCircle size={12} className="text-white" strokeWidth={2.5} />
                                                                    </div>
                                                                ) : isQuizActive ? (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-[#3b82f6] bg-[#3b82f6]/20 flex items-center justify-center">
                                                                        <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-[#2d4470] bg-[#111827]"></div>
                                                                )}
                                                            </div>

                                                            {/* Text */}
                                                            <div className="ml-3 flex-1 min-w-0 pr-7">
                                                                <p className={\`text-[12.5px] leading-snug font-medium \${progress[topic._id]?.quizCompleted ? 'text-[#10B981]' : isQuizActive ? 'text-[#93c5fd]' : 'text-[#64748b] group-hover:text-[#94a3b8]'}\`}>`;

const assignmentReplacement = `                                                            {/* Node circle */}
                                                            <div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                                                {progress[topic._id]?.assignmentCompleted ? (
                                                                    <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                                                                        <CheckCircle size={12} className="text-white" strokeWidth={2.5} />
                                                                    </div>
                                                                ) : isAssignActive ? (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-[#f97316] bg-[#f97316]/20 flex items-center justify-center">
                                                                        <div className="w-2 h-2 rounded-full bg-[#f97316]"></div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-[#2d4470] bg-[#111827]"></div>
                                                                )}
                                                            </div>

                                                            {/* Text */}
                                                            <div className="ml-3 flex-1 min-w-0 pr-7">
                                                                <p className={\`text-[12.5px] leading-snug font-medium \${progress[topic._id]?.assignmentCompleted ? 'text-[#10B981]' : isAssignActive ? 'text-[#fdba74]' : 'text-[#64748b] group-hover:text-[#94a3b8]'}\`}>`;

// More relaxed regex to match the diamond node and the following paragraph tag
const quizRegex = /\/\* Node - diamond .*? \*\/\s+<div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">[\s\S]*?<p className={\`text-\[12\.5px\] leading-snug font-medium \${isQuizActive \? 'text-\[#93c5fd\]' : 'text-\[#64748b\] group-hover:text-\[#94a3b8\]'}\`}>/;
const assignRegex = /\/\* Node - diamond \*\/\s+<div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">[\s\S]*?<p className={\`text-\[12\.5px\] leading-snug font-medium \${isAssignActive \? 'text-\[#fdba74\]' : 'text-\[#64748b\] group-hover:text-\[#94a3b8\]'}\`}>/;

content = content.replace(quizRegex, quizReplacement);
content = content.replace(assignRegex, assignmentReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Updated icons and completion styles in CoursePlayer.jsx');
