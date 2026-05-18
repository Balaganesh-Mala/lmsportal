const fs = require('fs');
const content = fs.readFileSync('e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx', 'utf8');
const lines = content.split('\n');

console.log('Line 112:', JSON.stringify(lines[111]));
console.log('Line 113:', JSON.stringify(lines[112]));

const insertion = [
    '',
    '    const handleNextQuestion = () => {',
    "        if (quizPhase !== 'active') return;",
    '        const isLastQuestion = currentQIdx >= shuffledQuestions.length - 1;',
    '        if (isLastQuestion) {',
    '            submitQuiz();',
    '        } else {',
    '            setCurrentQIdx(prev => prev + 1);',
    '            setTimeLeft(30);',
    '        }',
    '    };',
    '',
    '    // Auto-advance when timer hits zero',
    '    useEffect(() => {',
    "        if (quizPhase === 'active' && timeLeft === 0) {",
    '            handleNextQuestion();',
    '        }',
    '    // eslint-disable-next-line react-hooks/exhaustive-deps',
    '    }, [timeLeft, quizPhase]);',
    '',
];

lines.splice(112, 0, ...insertion);
fs.writeFileSync('e:/Projects_IT/LMS_Project1/student/src/pages/CoursePlayer.jsx', lines.join('\n'), 'utf8');
console.log('Done. Total lines:', lines.length);
