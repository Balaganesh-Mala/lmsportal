const fs = require('fs');

let c = fs.readFileSync('student/src/pages/CoursePlayer.jsx', 'utf8');

c = c.replace(
    /<h2 className="font-bold text-gray-900">Assignment<\/h2>/g,
    '<h2 className="font-bold text-gray-900">Document</h2>'
);

c = c.replace(
    /<p>No assignments for this lesson\.<\/p><\/div>/g,
    '<p>No documents for this lesson.</p></div>'
);

c = c.replace(
    /const existing = mySubmissions\.assignments\.find\(s => s\.assignmentIndex === idx\);[\s\S]*?(?=\}\);\s*\n\s*\n\s*\}\))/m,
`return (
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
                                            });`
);

fs.writeFileSync('student/src/pages/CoursePlayer.jsx', c);
console.log('Replaced successfully');
