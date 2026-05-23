import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckSquare, Square, List, Pencil, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const CATEGORIES = [
    'All', 'Accounting', 'Taxation', 'Financial Management',
    'Auditing', 'Economics for Finance', 'Business Law',
    'CA Foundation', 'CA Intermediate', 'CA Final'
];
const DIFFICULTIES = ['All', 'Basic', 'Moderate', 'Advanced'];

const ManageTests = () => {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    // Form State
    const [newTest, setNewTest] = useState({
        title: '',
        type: 'mcq', // default
        instructions: '',
        prompt: '',
        questions: [] // for mcq
    });


    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests?type=mcq`);
            setTests(res.data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonInput);
            const questionsArray = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.mcqs || []);
            
            if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
                toast.error('Invalid JSON format. Must be an array of questions or contain a "questions" key.');
                return;
            }

            const normalized = questionsArray.map((q, idx) => {
                const questionText = q.questionText || q.question || q.text || `Question ${idx + 1}`;
                
                let options = [];
                if (Array.isArray(q.options)) {
                    options = q.options;
                } else if (Array.isArray(q.choices)) {
                    options = q.choices;
                } else if (q.options && typeof q.options === 'object') {
                    options = Object.values(q.options);
                } else if (q.choices && typeof q.choices === 'object') {
                    options = Object.values(q.choices);
                }

                while (options.length < 4) {
                    options.push('');
                }
                options = options.slice(0, 4);

                let correctAnswers = [];
                const rawAnswers = q.correctAnswers || q.correctAnswer || q.answer || q.answers || [];
                if (Array.isArray(rawAnswers)) {
                    correctAnswers = rawAnswers.map(String);
                } else if (rawAnswers !== undefined && rawAnswers !== null) {
                    correctAnswers = [String(rawAnswers)];
                }

                if (correctAnswers.length > 0 && q.options && typeof q.options === 'object') {
                    correctAnswers = correctAnswers.map(ans => q.options[ans] || ans);
                }

                const isMultiple = q.isMultiple || correctAnswers.length > 1 || false;

                return {
                    questionText,
                    options,
                    correctAnswers,
                    isMultiple
                };
            });

            setNewTest(prev => ({
                ...prev,
                questions: [...prev.questions, ...normalized]
            }));

            toast.success(`Successfully imported ${normalized.length} questions!`);
            setShowJsonModal(false);
            setJsonInput('');
        } catch (error) {
            toast.error('Failed to parse JSON: ' + error.message);
        }
    };



    const handleEdit = (test) => {
        setIsEditing(true);
        setEditId(test._id);
        setNewTest({
            title: test.title,
            type: test.type,
            instructions: test.instructions || '',
            prompt: test.prompt || '',
            questions: test.questions || []
        });
        setShowCreate(true);
    };

    // --- MCQ Builder Logic ---
    const addQuestion = () => {
        setNewTest(prev => ({
            ...prev,
            questions: [...prev.questions, {
                questionText: '',
                options: ['', '', '', ''],
                correctAnswers: [],
                isMultiple: false
            }]
        }));
    };

    const updateQuestion = (index, field, value) => {
        const qs = [...newTest.questions];
        qs[index][field] = value;
        setNewTest(prev => ({ ...prev, questions: qs }));
    };

    const updateOption = (qIndex, oIndex, value) => {
        const qs = [...newTest.questions];
        qs[qIndex].options[oIndex] = value;
        setNewTest(prev => ({ ...prev, questions: qs }));
    };

    const toggleCorrectAnswer = (qIndex, optionValue) => {
        const qs = [...newTest.questions];
        const q = qs[qIndex];

        let newCorrect = [...q.correctAnswers];
        if (q.isMultiple) {
            // Checkbox logic
            if (newCorrect.includes(optionValue)) {
                newCorrect = newCorrect.filter(c => c !== optionValue);
            } else {
                newCorrect.push(optionValue);
            }
        } else {
            // Radio logic (single)
            newCorrect = [optionValue];
        }

        qs[qIndex].correctAnswers = newCorrect;
        setNewTest(prev => ({ ...prev, questions: qs }));
    };

    // --- Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = isEditing
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests/${editId}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests/create`;

            const method = isEditing ? axios.put : axios.post;

            await method(url, {
                ...newTest,
                type: 'mcq'
            });

            toast.success(isEditing ? 'Test updated!' : 'Test created!');
            setShowCreate(false);
            setNewTest({ title: '', type: 'mcq', instructions: '', prompt: '', questions: [] });
            setIsEditing(false);
            setEditId(null);
            fetchTests();
        } catch {
            toast.error('Error saving test');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Test?',
            text: 'Are you sure you want to delete this test? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it'
        });

        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/tests/${id}`);
            toast.success('Deleted');
            fetchTests();
        } catch {
            toast.error('Error deleting');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage MCQ Tests</h1>
                <button
                    onClick={() => {
                        setShowCreate(true);
                        setIsEditing(false);
                        setEditId(null);
                        setNewTest(prev => ({ ...prev, type: 'mcq', questions: [] }));
                    }}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
                >
                    <Plus size={20} /> Create New MCQ Test
                </button>
            </div>

            {/* Grid */}
            {loading ? <p>Loading...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tests.map(test => (
                        <div key={test._id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-lg mb-2">{test.title}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                {test.instructions || test.prompt || (test.questions?.length + ' Questions')}
                            </p>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Created: {new Date(test.createdAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(test)} className="text-blue-500 hover:bg-blue-50 p-1 rounded">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(test._id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {tests.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No tests found for this category.</p>}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-center">
                            <h2 className="text-xl font-bold">{isEditing ? 'Edit' : 'Create'} MCQ Test</h2>
                            <button onClick={() => { setShowCreate(false); setIsEditing(false); }} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Test Title</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2.5"
                                    placeholder="e.g. 12th Class Accounting Mock Test"
                                    value={newTest.title}
                                    onChange={e => setNewTest({ ...newTest, title: e.target.value })}
                                />
                            </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                                        <h3 className="font-semibold text-gray-700">Questions ({newTest.questions.length})</h3>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowJsonModal(true)}
                                                className="text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-indigo-100 flex items-center gap-1.5 transition-colors"
                                            >
                                                <Code size={16} /> Import from JSON
                                            </button>
                                            <button
                                                type="button"
                                                onClick={addQuestion}
                                                className="text-gray-600 bg-white border border-gray-200 shadow-sm px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                                            >
                                                <Plus size={16} /> Add Manual Question
                                            </button>
                                        </div>
                                    </div>

                                    {newTest.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="bg-gray-50 p-4 rounded-lg border relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const qs = [...newTest.questions];
                                                    qs.splice(qIdx, 1);
                                                    setNewTest({ ...newTest, questions: qs });
                                                }}
                                                className="absolute top-3 right-3 text-red-400 hover:text-red-600"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="mb-3 pr-8">
                                                <input
                                                    className="w-full border rounded p-2 text-sm"
                                                    placeholder={`Question ${qIdx + 1}`}
                                                    value={q.questionText}
                                                    onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={q.isMultiple}
                                                        onChange={e => updateQuestion(qIdx, 'isMultiple', e.target.checked)}
                                                    />
                                                    Allow Multiple Correct Answers (Checkbox)
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleCorrectAnswer(qIdx, opt)}
                                                            disabled={!opt}
                                                            className={`p-1 rounded ${q.correctAnswers.includes(opt) && opt
                                                                ? 'text-green-600 bg-green-50'
                                                                : 'text-gray-300 hover:text-gray-400'
                                                                }`}
                                                        >
                                                            {q.isMultiple
                                                                ? (q.correctAnswers.includes(opt) && opt ? <CheckSquare size={18} /> : <Square size={18} />)
                                                                : (q.correctAnswers.includes(opt) && opt ? <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />)
                                                            }
                                                        </button>
                                                        <input
                                                            className="flex-1 border rounded p-1.5 text-sm"
                                                            placeholder={`Option ${oIdx + 1}`}
                                                            value={opt}
                                                            onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            {q.correctAnswers.length === 0 && q.options.some(o => o) && <p className="text-[10px] text-red-400 mt-2">* Select at least one correct answer</p>}
                                        </div>
                                    ))}
                                </div>

                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => { setShowCreate(false); setIsEditing(false); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                    {isEditing ? 'Update Test' : 'Create Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {/* JSON Import Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Code className="text-indigo-600" /> Import Questions from JSON
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">Paste a JSON array of questions to bulk populate the test</p>
                            </div>
                            <button onClick={() => setShowJsonModal(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                                <span className="text-2xl leading-none">&times;</span>
                            </button>
                        </div>

                        {/* Text Area */}
                        <div className="p-6 flex-1 overflow-y-auto space-y-4">
                            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl">
                                <div className="text-xs text-indigo-800 font-medium">
                                    <span className="font-bold">Pro-Tip:</span> Use our optimized ChatGPT prompt template to get perfectly formatted questions instantly.
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const prompt = `Please generate a list of 10 multiple-choice questions (MCQs) about [INSERT TOPIC HERE]. Include both normal single-choice questions and multiple-choice questions (where more than one option is correct).\n\nReturn ONLY the raw JSON output in a single code block. Do not include any explanations or introductory text outside the JSON. The JSON must be a valid array of objects matching this exact structure:\n\n[\n  {\n    "question": "Which of the following is classified as a Real Account?",\n    "options": [\n      "Salary Account",\n      "Machinery Account",\n      "Capital Account",\n      "Sales Account"\n    ],\n    "correctAnswer": "Machinery Account",\n    "isMultiple": false\n  },\n  {\n    "question": "Which of the following are examples of Current Assets? (Select all that apply)",\n    "options": [\n      "Cash at Bank",\n      "Land and Building",\n      "Sundry Debtors",\n      "Goodwill"\n    ],\n    "correctAnswers": [\n      "Cash at Bank",\n      "Sundry Debtors"\n    ],\n    "isMultiple": true\n  }\n]`;
                                        navigator.clipboard.writeText(prompt);
                                        toast.success('ChatGPT Prompt Copied to Clipboard!');
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                                >
                                    Copy ChatGPT Prompt
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Paste JSON Here:</label>
                                <textarea
                                    className="w-full border border-gray-200 rounded-xl p-4 font-mono text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    rows="12"
                                    value={jsonInput}
                                    onChange={e => setJsonInput(e.target.value)}
                                    placeholder={`[
  {
    "question": "Which of the following is classified as a Real Account?",
    "options": ["Salary Account", "Machinery Account", "Capital Account", "Sales Account"],
    "correctAnswer": "Machinery Account",
    "isMultiple": false
  },
  {
    "question": "Which of the following are examples of Current Assets? (Select all that apply)",
    "options": ["Cash at Bank", "Land and Building", "Sundry Debtors", "Goodwill"],
    "correctAnswers": ["Cash at Bank", "Sundry Debtors"],
    "isMultiple": true
  }
]`}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-gray-100 bg-white shrink-0 flex justify-end gap-3 rounded-b-2xl">
                            <button onClick={() => setShowJsonModal(false)} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button
                                onClick={handleJsonImport}
                                disabled={!jsonInput.trim()}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-bold shadow-sm transition-colors"
                            >
                                Parse & Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default ManageTests;
