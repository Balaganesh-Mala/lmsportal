const fs = require('fs');
let lines = fs.readFileSync('student/src/pages/CoursePlayer.jsx', 'utf8').split(/\r?\n/);

let start = 1388;
let end = 1413;

let newBlock = `                                            topicContent.assignments.map((assign, idx) => {
                                                return (
                                                    <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-800">{assign.title}</h4>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-widest">Document</span>
                                                            </div>
                                                        </div>
                                                        {assign.questionUrl && (
                                                            <button 
                                                                onClick={() => setSelectedDocument(assign)}
                                                                className="px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-100 flex items-center gap-2"
                                                            >
                                                                <FileText size={16} /> Open Document
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })`;

lines.splice(start, end - start + 1, newBlock);
fs.writeFileSync('student/src/pages/CoursePlayer.jsx', lines.join('\n'));
console.log('Replaced successfully');
