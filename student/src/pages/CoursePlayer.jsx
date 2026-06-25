import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    PlayCircle, CheckCircle, FileText, MessageSquare, Star,
    ChevronDown, ChevronRight, ArrowRight, Download, Menu, ArrowLeft, Clock,
    Edit2, Trash2, Lock, AlertCircle, Upload, BookOpen,
    Trophy, XCircle, SkipForward, RotateCcw, Award, Check, X,
    Play, Pause, Volume2, VolumeX, Maximize2, Globe, ShieldCheck, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedViewer from '../components/ProtectedViewer';
import toast from 'react-hot-toast';
import { fireSuccessBlast } from '../utils/confetti';

const CoursePlayer = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [activeTopic, setActiveTopic] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [activeView, setActiveView] = useState({ type: 'video', topicId: null });
    const [expandedModules, setExpandedModules] = useState({});
    const [selectedDocument, setSelectedDocument] = useState(null);
    const storedUser = localStorage.getItem('studentUser');
    const studentUser = storedUser ? JSON.parse(storedUser) : null;

    // --- Subscription Tier Logic ---
    const TIER_LEVELS = {
        'Platinum': 4,
        'Full': 4,
        'Gold': 3,
        'Intermediate': 3,
        'Premium': 2,
        'Basic': 1
    };

    const getStudentTierLevel = () => {
        if (!studentUser?.isSubscribed) return 0;
        // Case-insensitive mapping
        const tier = (studentUser.planTier || '').charAt(0).toUpperCase() + (studentUser.planTier || '').slice(1).toLowerCase();
        return TIER_LEVELS[tier] || 0;
    };

    const hasTierAccess = (requiredTier) => {
        const req = (requiredTier || 'Basic').trim().toLowerCase();
        const isTrialActive = studentUser?.trialEndsAt && new Date() < new Date(studentUser.trialEndsAt);
        
        if (req === 'free trial' || req === 'trial') {
            return !!(isTrialActive || studentUser?.isSubscribed);
        }

        const studentLevel = getStudentTierLevel();
        const reqTierName = (requiredTier || 'Basic').charAt(0).toUpperCase() + (requiredTier || 'Basic').slice(1).toLowerCase();
        const requiredLevel = TIER_LEVELS[reqTierName] || 1; 
        return studentLevel >= requiredLevel;
    };

    // Drip Unlock State
    // null = no restriction (before API loads, or drip not configured)
    const [unlockedTopicIds, setUnlockedTopicIds] = useState(null);
    const [dripLoaded, setDripLoaded] = useState(false);

    // Topic Content (MCQ, Tasks, Assignments)
    const [topicContent, setTopicContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(false);
    const [mySubmissions, setMySubmissions] = useState({ tasks: [], assignments: [], mcq: null });
    const [topicContentMap, setTopicContentMap] = useState({}); // pre-fetched for sidebar badges

    // MCQ Quiz State – one-by-one timed mode
    const [mcqAnswers, setMcqAnswers] = useState({});        // { qIdx: string | string[] }
    const [mcqSubmitting, setMcqSubmitting] = useState(false);
    const [quizPhase, setQuizPhase] = useState('idle');      // idle | active | submitted
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [quizResult, setQuizResult] = useState(null);
    const [showDetailedReview, setShowDetailedReview] = useState(false);
    const [shuffledQuestions, setShuffledQuestions] = useState([]); // questions with shuffled options
    const [activeQuizIndex, setActiveQuizIndex] = useState(null);
    const timerRef = useRef(null);

    // Task Submission State
    const [taskText, setTaskText] = useState({});
    const [taskFile, setTaskFile] = useState({});
    const [taskSubmitting, setTaskSubmitting] = useState({});

    // Assignment Upload State
    const [assignFile, setAssignFile] = useState({});
    const [assignSubmitting, setAssignSubmitting] = useState({});

    // Progress State
    const [progress, setProgress] = useState({});
    const videoRef = useRef(null);

    // ─── YouTube Custom Player State ─────────────────────────────
    const [ytReady, setYtReady] = useState(false);
    const [ytPlaying, setYtPlaying] = useState(false);
    const [ytCurrentTime, setYtCurrentTime] = useState(0);
    const [ytDuration, setYtDuration] = useState(0);
    const [ytVolume, setYtVolume] = useState(80);
    const [ytMuted, setYtMuted] = useState(false);
    const ytPlayerRef = useRef(null);
    const ytPollRef = useRef(null);
    const playerWrapRef = useRef(null);

    // ─── Quiz Timer ───────────────────────────────────────────────
    useEffect(() => {
        if (quizPhase !== 'active') return;

        // Timer countdown
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [currentQIdx, quizPhase]);

    // Fisher-Yates shuffle
    const shuffle = (arr) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    const buildShuffledQuestions = (questions) =>
        questions.map(q => ({ ...q, options: shuffle(q.options || []) }));

    const startQuiz = () => {
        const test = activeQuizIndex !== null ? topicContent?.mcqTests?.[activeQuizIndex]?.testId : topicContent?.mcqTest?.testId;
        const qs = test?.questions || [];
        setShuffledQuestions(buildShuffledQuestions(qs));
        setMcqAnswers({});
        setCurrentQIdx(0);
        setTimeLeft(30);
        setQuizPhase('active');
    };

    const retakeQuiz = () => {
        const activeTest = activeQuizIndex !== null ? topicContent?.mcqTests?.[activeQuizIndex]?.testId : topicContent?.mcqTest?.testId;
        setQuizResult(null);
        if (activeTest) {
            setMySubmissions(prev => ({
                ...prev,
                mcq: prev.mcq?.testId === activeTest._id || prev.mcq?.testId?._id === activeTest._id ? null : prev.mcq,
                mcqs: (prev.mcqs || []).filter(x => x.testId !== activeTest._id && x.testId?._id !== activeTest._id)
            }));
        }
        startQuiz();
    };

    const handleNextQuestion = () => {
        if (quizPhase !== 'active') return;
        const isLastQuestion = currentQIdx >= shuffledQuestions.length - 1;
        if (isLastQuestion) {
            submitQuiz();
        } else {
            setCurrentQIdx(prev => prev + 1);
            setTimeLeft(30);
        }
    };

    // Auto-advance when timer hits zero
    useEffect(() => {
        if (quizPhase === 'active' && timeLeft === 0) {
            handleNextQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, quizPhase]);


    // ✅ Auto-mark topic complete when quiz or assignment is submitted
    const autoMarkTopicComplete = async (topicId, type, setStatusValue = true, assignmentId = null) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser || !topicId) return;

        const payload = {
            studentId: storedUser._id,
            courseId,
            topicId,
            watchedDuration: 0
        };

        if (type === 'quiz') payload.quizCompleted = setStatusValue;
        if (type === 'assignment') {
            payload.assignmentCompleted = setStatusValue;
            if (assignmentId) {
                payload.assignmentId = assignmentId;
            }
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/student/progress/update`, payload);
            if (res.data.success) {
                setProgress(prev => ({ ...prev, [topicId]: res.data.progress }));
                window.dispatchEvent(new CustomEvent('smart-aspirants-activity-sync'));
            }
        } catch (err) {
            console.error('Auto progress sync failed', err);
        }
    };

    // Helper to check if all accessible quizzes in the active topic are passed
    const checkIfAllAccessibleQuizzesPassed = (updatedAttempts = null) => {
        if (!topicContent) return false;
        const attemptsToUse = updatedAttempts || mySubmissions?.mcqs || [];

        // 1. If multiple quizzes are configured
        if (topicContent.mcqTests && topicContent.mcqTests.length > 0) {
            const accessibleQuizzes = topicContent.mcqTests.filter(quizItem => {
                if (!quizItem.enabled) return false;
                return hasTierAccess(quizItem.requiredTier || 'Basic');
            });

            if (accessibleQuizzes.length === 0) return false;

            return accessibleQuizzes.every(quizItem => {
                const testIdStr = quizItem.testId?._id?.toString() || quizItem.testId?.toString();
                const attempt = attemptsToUse.find(sub => {
                    const subIdStr = sub.testId?._id?.toString() || sub.testId?.toString();
                    return subIdStr === testIdStr;
                });
                if (!attempt) return false;
                const scorePct = Math.round((attempt.score / (attempt.total || 1)) * 100);
                return scorePct >= 75;
            });
        }

        // 2. Legacy single quiz fallback
        if (topicContent.mcqTest?.enabled && topicContent.mcqTest?.testId) {
            const testIdStr = topicContent.mcqTest.testId?._id?.toString() || topicContent.mcqTest.testId?.toString();
            const attempt = attemptsToUse.find(sub => {
                const subIdStr = sub.testId?._id?.toString() || sub.testId?.toString();
                return subIdStr === testIdStr;
            }) || mySubmissions.mcq;

            if (!attempt) return false;
            const scorePct = Math.round((attempt.score / (attempt.total || 1)) * 100);
            return scorePct >= 75;
        }

        return false;
    };

    const submitQuiz = async () => {
        if (quizPhase === 'submitted' || mcqSubmitting) return;

        setQuizPhase('submitted');
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        const activeTest = activeQuizIndex !== null ? topicContent?.mcqTests?.[activeQuizIndex]?.testId : topicContent?.mcqTest?.testId;
        if (!storedUser || !activeTest) return;

        setMcqSubmitting(true);
        try {
            const answers = Object.entries(mcqAnswers).map(([questionId, selected]) => ({
                questionId,
                selected: Array.isArray(selected) ? selected : [selected]
            }));

            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/topic-content/${activeTopic._id}/attempt-mcq`,
                { studentId: storedUser._id, testId: activeTest._id, answers }
            );

            setQuizResult(res.data.attempt);
            setMySubmissions(prev => {
                const filtered = (prev.mcqs || []).filter(x => x.testId !== activeTest._id && x.testId?._id !== activeTest._id);
                return { 
                    ...prev, 
                    mcq: res.data.attempt,
                    mcqs: [...filtered, res.data.attempt]
                };
            });

            const attempt = res.data.attempt;
            const scorePct = Math.round((attempt.score / (attempt.total || 1)) * 100);

            const updatedAttemptsList = [
                ...(mySubmissions.mcqs || []).filter(x => {
                    const xIdStr = x.testId?._id?.toString() || x.testId?.toString();
                    const activeIdStr = activeTest._id?.toString();
                    return xIdStr !== activeIdStr;
                }),
                attempt
            ];

            if (scorePct >= 75) {
                const allPassed = checkIfAllAccessibleQuizzesPassed(updatedAttemptsList);
                fireSuccessBlast(); // 🎉 Trigger beautiful paper blast for successfully passing this quiz!
                if (allPassed) {
                    toast.success(`Congratulations! You passed all quizzes in this session! Topic marked as complete.`);
                    await autoMarkTopicComplete(activeTopic._id, 'quiz', true);
                } else {
                    toast.success(`Quiz passed with ${scorePct}%! Complete all remaining quizzes to finish this topic.`);
                    await autoMarkTopicComplete(activeTopic._id, 'quiz', false);
                }
            } else {
                toast.error(`You scored ${scorePct}%. Passing score is 75%. Please retake.`);
                await autoMarkTopicComplete(activeTopic._id, 'quiz', false);
            }
        } catch (err) {
            // Already attempted or failed
            if (err.response?.data?.attempt) {
                const attempt = err.response.data.attempt;
                setQuizResult(attempt);
                setMySubmissions(prev => {
                    const filtered = (prev.mcqs || []).filter(x => x.testId !== activeTest._id && x.testId?._id !== activeTest._id);
                    return { 
                        ...prev, 
                        mcq: attempt,
                        mcqs: [...filtered, attempt]
                    };
                });

                const scorePct = Math.round((attempt.score / (attempt.total || 1)) * 100);
                const updatedAttemptsList = [
                    ...(mySubmissions.mcqs || []).filter(x => {
                        const xIdStr = x.testId?._id?.toString() || x.testId?.toString();
                        const activeIdStr = activeTest._id?.toString();
                        return xIdStr !== activeIdStr;
                    }),
                    attempt
                ];

                if (scorePct >= 75) {
                    const allPassed = checkIfAllAccessibleQuizzesPassed(updatedAttemptsList);
                    await autoMarkTopicComplete(activeTopic._id, 'quiz', allPassed);
                } else {
                    await autoMarkTopicComplete(activeTopic._id, 'quiz', false);
                }
            } else {
                toast.error(err.response?.data?.message || 'Failed to submit quiz');
                setQuizPhase('idle');
            }
        } finally {
            setMcqSubmitting(false);
        }
    };

    // Helper to get YouTube ID
    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const courseRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses/${courseId}`);
                setCourse(courseRes.data);

                const modulesListRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/modules/${courseId}`);

                const modulesWithTopics = await Promise.all(modulesListRes.data.modules.map(async (mod) => {
                    const topicsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/topics/${mod._id}`);
                    return { ...mod, topics: topicsRes.data.topics };
                }));
                setModules(modulesWithTopics);
                if (modulesWithTopics.length > 0) {
                    setExpandedModules({ [modulesWithTopics[0]._id]: true });
                }

                const storedUser = JSON.parse(localStorage.getItem('studentUser'));
                if (storedUser) {
                    // Fetch progress
                    const progressRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/progress/${courseId}/${storedUser._id}`);
                    const progressMap = {};
                    progressRes.data.progress.forEach(p => {
                        progressMap[p.topicId] = p;
                    });
                    setProgress(progressMap);

                    // Fetch drip unlock status
                    try {
                        const dripRes = await axios.get(
                            `${import.meta.env.VITE_API_URL}/api/drip/unlocked/${storedUser._id}/${courseId}`
                        );
                        const ids = dripRes.data.unlockedTopicIds;
                        if (!ids || ids.length === 0) {
                            setUnlockedTopicIds(null); // no restriction
                        } else {
                            setUnlockedTopicIds(new Set(ids));
                        }
                    } catch (e) {
                        console.warn('Drip fetch failed, defaulting to show all', e);
                        setUnlockedTopicIds(null); // null = no restriction
                    }
                    setDripLoaded(true);
                }

                // Batch-fetch topic content for all topics (sidebar badges)
                const allTopics = modulesWithTopics.flatMap(m => m.topics);
                const contentMap = {};
                await Promise.allSettled(allTopics.map(async (t) => {
                    try {
                        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/topic-content/${t._id}`);
                        contentMap[t._id] = res.data.content || {};
                    } catch (_) { contentMap[t._id] = {}; }
                }));
                setTopicContentMap(contentMap);

                if (modulesWithTopics.length > 0 && modulesWithTopics[0].topics.length > 0) {
                    const firstTopic = modulesWithTopics[0].topics[0];
                    setActiveTopic(firstTopic);
                    setActiveView({ type: 'video', topicId: firstTopic._id });
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load course content');
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    // Fetch topic content + my submissions when activeTopic changes
    useEffect(() => {
        if (!activeTopic) return;
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        setTopicContent(null);
        setMcqAnswers({});
        setActiveQuizIndex(null);
        setQuizResult(null);
        setQuizPhase('idle');
        setCurrentQIdx(0);
        setContentLoading(true);

        const loadContent = async () => {
            try {
                const [contentRes, submissionsRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/topic-content/${activeTopic._id}`),
                    storedUser
                        ? axios.get(`${import.meta.env.VITE_API_URL}/api/topic-content/${activeTopic._id}/my-submissions/${storedUser._id}`)
                        : Promise.resolve({ data: { submissions: { tasks: [], assignments: [], mcq: null } } })
                ]);
                const content = contentRes.data.content || {};
                setTopicContent(content);
                setTopicContentMap(prev => ({ ...prev, [activeTopic._id]: content }));
                setMySubmissions(submissionsRes.data.submissions);
            } catch (e) {
                console.error('Content fetch failed', e);
            } finally {
                setContentLoading(false);
            }
        };
        loadContent();
    }, [activeTopic?._id]);

    // ─── Load YouTube IFrame API script once ──────────────────────────
    useEffect(() => {
        if (document.getElementById('yt-api-script')) return;
        const s = document.createElement('script');
        s.id = 'yt-api-script';
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
    }, []);

    // ─── Init YouTube Player when activeTopic changes ─────────────────
    const destroyYtPlayer = useCallback(() => {
        clearInterval(ytPollRef.current);
        if (ytPlayerRef.current) {
            try { ytPlayerRef.current.destroy(); } catch (_) { }
            ytPlayerRef.current = null;
        }
        setYtReady(false);
        setYtPlaying(false);
        setYtCurrentTime(0);
        setYtDuration(0);
    }, []);

    useEffect(() => {
        if (!activeTopic?.videoUrl) return;
        const isYT = activeTopic.videoUrl.includes('youtube.com') || activeTopic.videoUrl.includes('youtu.be');
        if (!isYT) return;

        destroyYtPlayer();

        let cancelled = false;
        let attempts = 0;

        const tryInit = () => {
            if (cancelled) return;
            const container = document.getElementById('yt-player-container');
            if (!container || !window.YT?.Player) {
                if (attempts++ < 30) setTimeout(tryInit, 300);
                return;
            }
            const videoId = getYouTubeVideoId(activeTopic.videoUrl);
            if (!videoId) return;
            ytPlayerRef.current = new window.YT.Player('yt-player-container', {
                width: '100%',
                height: '100%',
                videoId,
                playerVars: {
                    controls: 0,
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1,
                    iv_load_policy: 3,
                    origin: window.location.origin,
                },
                events: {
                    onReady: (e) => {
                        if (cancelled) return;
                        setYtReady(true);
                        setYtDuration(e.target.getDuration());
                        e.target.setVolume(80);
                    },
                    onStateChange: (e) => {
                        if (cancelled) return;
                        const playing = e.data === window.YT?.PlayerState?.PLAYING;
                        setYtPlaying(playing);
                        const d = e.target.getDuration?.() || 0;
                        if (d > 0) setYtDuration(d);

                        // Auto-complete when video ends
                        if (e.data === window.YT?.PlayerState?.ENDED) {
                            updateProgress(true, d);
                        }
                    },
                },
            });
        };

        // Give iframe a frame to render, then try
        const t = setTimeout(tryInit, 400);
        return () => {
            cancelled = true;
            clearTimeout(t);
            destroyYtPlayer();
        };
    }, [activeTopic?._id, destroyYtPlayer]);

    // ─── Poll current time while playing ────────────────────────────
    useEffect(() => {
        if (ytPlaying) {
            ytPollRef.current = setInterval(() => {
                const ct = ytPlayerRef.current?.getCurrentTime?.();
                if (ct !== undefined) {
                    setYtCurrentTime(ct);
                    // Automatic progress update when > 90% watched
                    if (ytDuration > 0 && (ct / ytDuration) > 0.9 && (!progress[activeTopic._id] || !progress[activeTopic._id].completed)) {
                        updateProgress(true, ct);
                    }
                }
            }, 1000);
        } else {
            clearInterval(ytPollRef.current);
        }
        return () => clearInterval(ytPollRef.current);
    }, [ytPlaying, ytDuration, activeTopic?._id, progress]);

    // ─── YouTube player helpers ─────────────────────────────────
    const ytFormatTime = (s) => {
        if (!s || isNaN(s)) return '0:00';
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };
    const ytTogglePlay = () => {
        if (!ytPlayerRef.current) return;
        if (ytPlaying) ytPlayerRef.current.pauseVideo();
        else ytPlayerRef.current.playVideo();
    };
    const ytSeek = (e) => {
        const v = parseFloat(e.target.value);
        setYtCurrentTime(v);
        ytPlayerRef.current?.seekTo(v, true);
    };
    const ytHandleVolume = (e) => {
        const v = parseInt(e.target.value);
        setYtVolume(v);
        setYtMuted(v === 0);
        ytPlayerRef.current?.setVolume(v);
        if (v === 0) ytPlayerRef.current?.mute();
        else ytPlayerRef.current?.unMute();
    };
    const ytToggleMute = () => {
        if (ytMuted) {
            ytPlayerRef.current?.unMute();
            ytPlayerRef.current?.setVolume(ytVolume || 80);
            setYtMuted(false);
        } else {
            ytPlayerRef.current?.mute();
            setYtMuted(true);
        }
    };
    const ytFullscreen = () => {
        const el = playerWrapRef.current;
        if (!el) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else el.requestFullscreen?.();
    };

    const isTopicUnlocked = (topic) => {
        if (unlockedTopicIds === null) return true; // No drip configured or not yet loaded
        if (!topic.unlockOrder) return true; // No unlock order = not part of drip = always accessible
        return unlockedTopicIds.has(topic._id.toString());
    };

    const handleVideoProgress = async () => {
        if (!videoRef.current || !activeTopic) return;
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const progressPercent = (currentTime / duration) * 100;
        if (progressPercent > 90 && (!progress[activeTopic._id] || !progress[activeTopic._id].completed)) {
            await updateProgress(true, currentTime);
        }
    };

    // Simple check — video Mark Complete has no gate (quiz/assignment are separate tracks)
    const checkTopicCompletionRequirements = () => {
        if (contentLoading || topicContent === null)
            return { allowed: false, message: 'Please wait for lesson content to load.' };
        return { allowed: true };
    };

    const updateProgress = async (completed, watchedDuration) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser || !activeTopic) return;

        // Prevent unmarking
        if (progress[activeTopic._id]?.completed && !completed) return;

        // Ensure we only block when transitioning from uncompleted -> completed
        if (completed && !progress[activeTopic._id]?.completed) {
            const req = checkTopicCompletionRequirements();
            if (!req.allowed) {
                toast.error(req.message);
                return;
            }
        }

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/student/progress/update`, {
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
            if (completed && !progress[activeTopic._id]?.completed) {
                toast.success('Lesson Completed!');
                fireSuccessBlast();
                // Dispatch global sync event for real-time Navbar update
                window.dispatchEvent(new CustomEvent('smart-aspirants-activity-sync'));
            }
        } catch (err) {
            console.error('Progress sync failed', err);
        }
    };

    // Task submission
    const handleTaskSubmit = async (taskIndex) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser) return;
        setTaskSubmitting(prev => ({ ...prev, [taskIndex]: true }));
        const formData = new FormData();
        formData.append('studentId', storedUser._id);
        formData.append('taskIndex', taskIndex);
        if (taskText[taskIndex]) formData.append('answerText', taskText[taskIndex]);
        if (taskFile[taskIndex]) formData.append('file', taskFile[taskIndex]);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/topic-content/${activeTopic._id}/submit/task`,
                formData, { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setMySubmissions(prev => {
                const newTasks = [...prev.tasks];
                const existIdx = newTasks.findIndex(t => t.taskIndex === taskIndex);
                if (existIdx >= 0) newTasks[existIdx] = res.data.submission;
                else newTasks.push(res.data.submission);
                return { ...prev, tasks: newTasks };
            });
            toast.success('Task submitted successfully!');
        } catch (err) {
            toast.error('Failed to submit task');
        } finally {
            setTaskSubmitting(prev => ({ ...prev, [taskIndex]: false }));
        }
    };

    // Assignment upload
    const handleAssignmentSubmit = async (assignmentIndex) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser || !assignFile[assignmentIndex]) {
            toast.error('Please select a file to upload');
            return;
        }
        setAssignSubmitting(prev => ({ ...prev, [assignmentIndex]: true }));
        const formData = new FormData();
        formData.append('studentId', storedUser._id);
        formData.append('assignmentIndex', assignmentIndex);
        formData.append('file', assignFile[assignmentIndex]);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/topic-content/${activeTopic._id}/submit/assignment`,
                formData, { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setMySubmissions(prev => {
                const newAssign = [...prev.assignments];
                const existIdx = newAssign.findIndex(a => a.assignmentIndex === assignmentIndex);
                if (existIdx >= 0) newAssign[existIdx] = res.data.submission;
                else newAssign.push(res.data.submission);
                return { ...prev, assignments: newAssign };
            });
            toast.success('Assignment uploaded! Topic marked as complete.');
            fireSuccessBlast();
            // ✅ Auto-mark topic as complete when assignment is submitted
            await autoMarkTopicComplete(activeTopic._id, 'assignment');
        } catch (err) {
            toast.error('Failed to upload assignment');
        } finally {
            setAssignSubmitting(prev => ({ ...prev, [assignmentIndex]: false }));
        }
    };

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editMessage, setEditMessage] = useState('');

    useEffect(() => {
        if (activeTab === 'discussion' && activeTopic) {
            fetchComments();
        }
    }, [activeTab, activeTopic]);

    const fetchComments = async () => {
        try {
            setCommentLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/student/comment/${activeTopic._id}`);
            setComments(res.data.comments);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        if (!storedUser) return toast.error('Please login to comment');

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/student/comment/add`, {
                topicId: activeTopic._id,
                studentId: storedUser._id,
                message: newComment
            });

            setComments([res.data.comment, ...comments]);
            setNewComment('');
            toast.success('Comment posted!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to post comment');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/comment/${commentId}`, {
                data: { studentId: storedUser._id }
            });
            setComments(comments.filter(c => c._id !== commentId));
            toast.success("Comment deleted");
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const startEditing = (comment) => {
        setEditingCommentId(comment._id);
        setEditMessage(comment.message);
    };

    const cancelEditing = () => {
        setEditingCommentId(null);
        setEditMessage('');
    };

    const handleUpdateComment = async (commentId) => {
        const storedUser = JSON.parse(localStorage.getItem('studentUser'));
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/comment/${commentId}`, {
                studentId: storedUser._id,
                message: editMessage
            });

            // Update local state
            setComments(comments.map(c => c._id === commentId ? res.data.comment : c));
            setEditingCommentId(null);
            toast.success("Comment updated");
        } catch (err) {
            toast.error("Failed to update");
        }
    };

    // Get current user for permission check
    const currentUser = JSON.parse(localStorage.getItem('studentUser'));

    if (loading) return <div className="h-screen flex items-center justify-center text-indigo-600 font-medium">Loading Course...</div>;

    if (selectedDocument) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[999] w-screen h-screen flex flex-col bg-slate-50 overflow-hidden"
            >
                {/* Premium Glassmorphic Viewer Header */}
                <div className="w-full h-auto min-h-[4rem] py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 flex items-center justify-between gap-4 z-[100]">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <button
                            onClick={() => setSelectedDocument(null)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-all shrink-0"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-xs md:text-sm font-black text-slate-900 tracking-tight leading-tight truncate">{selectedDocument.title}</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="flex h-1 w-1 rounded-full bg-emerald-500"></span>
                                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Secured Instance · Finwise Shield</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-2.5 py-1 rounded-full">
                            <Shield size={10} className="text-indigo-600" />
                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Secure</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-full text-white">
                            <Lock size={10} className="text-amber-400" />
                            <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Protected</span>
                        </div>
                        {activeTopic && !progress[activeTopic._id]?.completedAssignments?.includes(selectedDocument._id) && (
                            <button
                                onClick={() => {
                                    autoMarkTopicComplete(activeTopic._id, 'assignment', true, selectedDocument._id);
                                    toast.success('Document marked as completed!');
                                    fireSuccessBlast();
                                    setSelectedDocument(null);
                                }}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-full text-white transition-colors"
                            >
                                <CheckCircle size={12} className="text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Mark as Completed</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 w-full bg-slate-100 overflow-hidden">
                    <ProtectedViewer
                        type="document"
                        url={selectedDocument.questionUrl}
                        title={selectedDocument.title}
                        studentInfo={studentUser}
                    />
                </div>
            </motion.div>
        );
    }

    return (
        <div className="flex h-screen bg-[#f3f4f6] flex-col md:flex-row overflow-hidden relative">
            {/* Sidebar Code (Timeline / Platform Flat UI Style) */}
            <div className={`
                w-full md:w-[320px] lg:w-[320px]
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                bg-[#1B2538] border-r border-[#152040] flex-shrink-0 transition-transform duration-300 flex flex-col z-30 absolute md:static h-full overflow-hidden shadow-2xl font-sans
            `}>
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
                                {(() => {
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
                                })()}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-[#0F172A] overflow-hidden shadow-inner relative border border-[#1e293b] rounded-full">
                            <div className="h-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#6EE7B7] rounded-full transition-all duration-700 relative shadow-[0_0_16px_rgba(52,211,153,0.8)]" style={{
                                width: `${(() => {
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
                                })()}%`
                            }}>
                                <div className="absolute top-0 right-0 w-8 h-full bg-white blur-[2px] opacity-80 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0 opacity-50 w-full animate-pulse mix-blend-overlay"></div>
                            </div>
                            <div className="absolute inset-0 bg-[#34D399] blur-[8px] opacity-25 select-none pointer-events-none transition-all duration-700" style={{
                                width: `${(() => {
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
                                })()}%`
                            }}></div>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 pb-10 m-0 space-y-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#1B2538]">

                    {modules.length === 0 && (
                        <div className="p-8 mt-10 text-center text-[#9CA3AF]">
                            <BookOpen size={24} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No curriculum available.</p>
                        </div>
                    )}
                    {modules.map((module, mIdx) => {
                        const isExpanded = expandedModules[module._id];
                        // Calculate module progress
                        const modTopics = module.topics || [];
                        let modComp = 0;
                        let modTotal = 0;
                        modTopics.forEach(t => {
                            const content = topicContentMap[t._id] || {};
                            const p = progress[t._id] || {};
                            modTotal++;
                            if (p.videoCompleted || p.completed) modComp++;
                            if (content.mcqTest?.enabled || (content.mcqTests?.length || 0) > 0) {
                                modTotal++;
                                if (p.quizCompleted) modComp++;
                            }
                            if (content.assignments?.length > 0) {
                                modTotal++;
                                if (p.assignmentCompleted) modComp++;
                            }
                        });

                        return (
                            <div key={module._id} className="transition-all duration-0 outline-none">
                                {/* Accordion Header (Flat dark or blue based on image) */}
                                <button
                                    onClick={() => setExpandedModules(prev => prev[module._id] ? {} : { [module._id]: true })}
                                    className={`w-full flex items-start justify-between px-5 py-4 transition-colors focus:outline-none group ${isExpanded ? 'bg-[#436BB5] hover:bg-[#436BB5] border-b border-[#3b5e9e]' : 'bg-[#1B2538] hover:bg-[#25324b] border-b border-[#2d3a54]'}`}
                                >
                                    <div className="flex-1 text-left pr-3 min-w-0">
                                        <h3 className={`text-[15px] transition-colors leading-tight ${isExpanded ? 'text-white font-semibold' : 'text-[#e2e8f0] font-medium'}`}>
                                            {module.title}
                                        </h3>
                                        <div className="mt-1.5 flex items-center gap-1.5 opacity-90">
                                            <Clock size={12} className={isExpanded ? 'text-white/80' : 'text-[#94a3b8]'} />
                                            <span className={`text-[12px] font-normal ${isExpanded ? 'text-white/90' : 'text-[#94a3b8]'}`}>{modComp}/{modTotal} activities</span>
                                        </div>
                                    </div>
                                    <div className={`transition-transform duration-300 ease-in-out p-1 pt-0 ${isExpanded ? 'rotate-180 text-white' : 'text-[#94a3b8]'}`}>
                                        <ChevronDown size={18} strokeWidth={2} />
                                    </div>
                                </button>

                                {/* Accordion Content: Timeline Style */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out bg-[#1B2538] ${isExpanded ? 'max-h-[3000px] opacity-100 border-b-4 border-[#0F1522]' : 'max-h-0 opacity-0 border-transparent'}`}>
                                    <div className="flex flex-col pt-3 pb-3 relative">
                                        {module.topics.map((topic, tIdx) => {
                                            const dripUnlocked = isTopicUnlocked(topic);
                                            const tierUnlocked = hasTierAccess(topic.requiredTier);
                                            const unlocked = dripUnlocked && tierUnlocked;

                                            // Determine lock type for better feedback
                                            const lockType = !tierUnlocked ? 'tier' : !dripUnlocked ? 'drip' : null;

                                            const isActive = activeTopic?._id === topic._id;
                                            const isCompleted = progress[topic._id]?.completed;
                                            const isLast = tIdx === module.topics.length - 1;
                                            const hasMcq = topicContentMap[topic._id]?.mcqTest?.enabled || (topicContentMap[topic._id]?.mcqTests?.length || 0) > 0;
                                            const hasAssignment = (topicContentMap[topic._id]?.assignments?.length || 0) > 0;
                                            const isQuizActive = activeView?.type === 'quiz' && activeView?.topicId === topic._id;
                                            const isAssignActive = activeView?.type === 'assignment' && activeView?.topicId === topic._id;
                                            const isVideoActive = isActive && activeView?.type === 'video';

                                            return (
                                                <React.Fragment key={topic._id}>

                                                    {/* ── Video Topic Row ── */}
                                                    <div
                                                        onClick={() => {
                                                            if (!unlocked) {
                                                                if (lockType === 'tier') {
                                                                    toast.error(`Subscribe to unlock ${topic.requiredTier} content`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                    navigate('/subscription');
                                                                } else {
                                                                    toast.error('This lesson is locked', { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                }
                                                                return;
                                                            }
                                                            setActiveTopic(topic);
                                                            setActiveView({ type: 'video', topicId: topic._id });
                                                            setActiveTab('description');
                                                            if (window.innerWidth < 768) setSidebarOpen(false);
                                                        }}
                                                        className={`relative flex items-center px-4 py-3 cursor-pointer transition-colors group
                                                            ${!unlocked ? 'opacity-40 cursor-not-allowed' : isVideoActive ? 'bg-[#1e345e]/40' : 'hover:bg-[#202b40]'}`}
                                                    >
                                                        {/* Vertical line down */}
                                                        <div className="absolute left-[27px] top-[36px] bottom-[-1px] w-[2px] bg-[#1e2d45] z-0"></div>

                                                        {/* Node — circle */}
                                                        <div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                                            {!unlocked ? (
                                                                <div className="w-5 h-5 rounded-full border-2 border-[#3d4f6e] bg-[#111827] flex items-center justify-center">
                                                                    <Lock size={8} className="text-[#475569]" />
                                                                </div>
                                                            ) : isCompleted ? (
                                                                <div className="w-5 h-5 rounded-full bg-[#10B981] flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                                                                    <CheckCircle size={12} className="text-white" strokeWidth={2.5} />
                                                                </div>
                                                            ) : isVideoActive ? (
                                                                <div className="w-5 h-5 rounded-full border-2 border-[#10B981] bg-[#10B981]/20 flex items-center justify-center">
                                                                    <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
                                                                </div>
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border-2 border-[#2d4470] bg-[#111827]"></div>
                                                            )}
                                                        </div>

                                                        {/* Text */}
                                                        <div className="ml-3 flex-1 min-w-0 pr-7">
                                                            <p className={`text-[13px] leading-snug ${isVideoActive ? 'text-white font-semibold' : 'text-[#94a3b8] group-hover:text-[#cbd5e1]'}`}>
                                                                {topic.title}
                                                                {lockType === 'tier' && <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-black uppercase tracking-widest">{topic.requiredTier}</span>}
                                                            </p>
                                                            <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${isVideoActive ? 'text-[#5a8ac4]' : 'text-[#3d5070]'}`}>
                                                                <Clock size={9} /> {topic.duration} mins
                                                            </span>
                                                        </div>

                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                            <PlayCircle size={14} className={isVideoActive ? 'text-[#60A5FA]' : 'text-[#2d4470]'} />
                                                        </div>
                                                    </div>

                                                    {/* ── MCQ Practice Row (same level as video) ── */}
                                                    {hasMcq && (
                                                        <div
                                                            onClick={() => {
                                                                if (!unlocked) {
                                                                    if (lockType === 'tier') {
                                                                        toast.error(`Subscribe to unlock MCQ Practice`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                        navigate('/subscription');
                                                                    } else {
                                                                        toast.error('This lesson is locked', { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                    }
                                                                    return;
                                                                }
                                                                setActiveTopic(topic);
                                                                setActiveView({ type: 'quiz', topicId: topic._id });
                                                                if (window.innerWidth < 768) setSidebarOpen(false);
                                                            }}
                                                            className={`relative flex items-center px-4 py-3 cursor-pointer transition-colors group
                                                                ${isQuizActive ? 'bg-[#1a2d50]' : 'hover:bg-[#181f2e]'}`}
                                                        >
                                                            {/* Vertical line continues */}
                                                            <div className="absolute left-[27px] top-[-1px] bottom-[-1px] w-[2px] bg-[#1e2d45] z-0"></div>

                                                            {/* Node — diamond / square rotated */}
                                                            <div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                                                {!unlocked ? (
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${lockType === 'tier' ? 'border-amber-500 bg-amber-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
                                                                        <Lock size={8} className={lockType === 'tier' ? 'text-amber-500' : 'text-rose-500'} />
                                                                    </div>
                                                                ) : progress[topic._id]?.quizCompleted ? (
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
                                                                <p className={`text-[12.5px] leading-snug font-medium ${progress[topic._id]?.quizCompleted ? 'text-[#10B981]' : isQuizActive ? 'text-[#93c5fd]' : 'text-[#64748b] group-hover:text-[#94a3b8]'}`}>

                                                                    MCQ Practice
                                                                </p>
                                                                <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${isQuizActive ? 'text-[#4a7ab5]' : 'text-[#2d3f55]'}`}>
                                                                    <Clock size={9} /> 20 mins
                                                                </span>
                                                            </div>

                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                <Edit2 size={13} className={isQuizActive ? 'text-[#60A5FA]' : 'text-[#2d4470]'} />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Assignment Row (same level as video) ── */}
                                                    {hasAssignment && (
                                                        <div
                                                            onClick={() => {
                                                                if (!unlocked) {
                                                                    if (lockType === 'tier') {
                                                                        toast.error(`Subscribe to unlock Study Materials`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                        navigate('/subscription');
                                                                    } else {
                                                                        toast.error('This lesson is locked', { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                    }
                                                                    return;
                                                                }
                                                                setActiveTopic(topic);
                                                                setActiveView({ type: 'assignment', topicId: topic._id });
                                                                if (window.innerWidth < 768) setSidebarOpen(false);
                                                            }}
                                                            className={`relative flex items-center px-4 py-3 cursor-pointer transition-colors group
                                                                ${isAssignActive ? 'bg-[#1a2d50]' : 'hover:bg-[#181f2e]'}`}
                                                        >
                                                            {/* Vertical line continues */}
                                                            <div className="absolute left-[27px] top-[-1px] bottom-[-1px] w-[2px] bg-[#1e2d45] z-0"></div>

                                                            {/* Node — diamond */}
                                                            <div className="relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center">
                                                                {!unlocked ? (
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${lockType === 'tier' ? 'border-amber-500/50 bg-amber-500/10' : 'border-[#3d4f6e] bg-[#111827]'}`}>
                                                                        <Lock size={8} className="text-amber-500" />
                                                                    </div>
                                                                ) : progress[topic._id]?.assignmentCompleted ? (
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
                                                                <p className={`text-[12.5px] leading-snug font-medium ${progress[topic._id]?.assignmentCompleted ? 'text-[#10B981]' : isAssignActive ? 'text-[#fdba74]' : 'text-[#64748b] group-hover:text-[#94a3b8]'}`}>

                                                                    Document / PDF
                                                                </p>
                                                                <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${isAssignActive ? 'text-[#9a5a30]' : 'text-[#2d3f55]'}`}>
                                                                    <FileText size={9} /> View file
                                                                </span>
                                                            </div>

                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                                <FileText size={13} className={isAssignActive ? 'text-[#f97316]' : 'text-[#2d4470]'} />
                                                            </div>
                                                        </div>
                                                    )}

                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-gray-50 overflow-hidden relative w-full">

                {/* Top Bar */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                            <Menu size={20} />
                        </button>
                        <h1 className="font-semibold text-gray-800 line-clamp-1 hidden md:block">
                            {activeTopic?.title || 'Course Player'}
                        </h1>
                    </div>
                    <button onClick={() => navigate('/courses')} className="text-sm font-medium text-gray-500 hover:text-gray-800">
                        Back to Dashboard
                    </button>
                </div>

                {/* Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-0 md:p-6 w-full">
                    {activeTopic ? (
                        <div className="max-w-4xl mx-auto space-y-6">

                            {/* --- Tier Gating Content Guard --- */}
                            {!hasTierAccess(activeTopic.requiredTier) ? (
                                <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
                                    <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-lg">
                                        <Lock size={44} className="text-amber-600" />
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-2">Subscribe to unlock</h2>
                                    <p className="text-slate-500 font-bold mb-8 max-w-sm mx-auto uppercase tracking-widest text-[10px]">
                                        This lesson is exclusive to {activeTopic.requiredTier} subscribers
                                    </p>
                                    <button
                                        onClick={() => navigate('/subscription')}
                                        className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black transition-all transform hover:scale-105 shadow-xl shadow-slate-900/10 flex items-center gap-3"
                                    >
                                        Upgrade My Plan <ArrowRight size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* ── VIDEO VIEW ── */}
                                    {(!activeView || activeView.type === 'video') && (
                                        <>
                                            {(activeTopic.videoUrl?.includes('youtube.com') || activeTopic.videoUrl?.includes('youtu.be')) ? (
                                                <div ref={playerWrapRef} className="rounded-none md:rounded-xl overflow-hidden shadow-xl sticky top-0 md:static z-10 bg-black">
                                                    {/* Video area — div placeholder: YT API creates the iframe here */}
                                                    <div className="relative w-full aspect-video bg-black overflow-hidden group">

                                                        {/* Scale iframe vertically to push YouTube UI into hidden overflow area */}
                                                        <div className="absolute top-1/2 left-0 w-full h-[300%] -translate-y-1/2 pointer-events-none z-0">
                                                            <div
                                                                id="yt-player-container"
                                                                className="w-full h-full"
                                                            />
                                                        </div>

                                                        {/* Transparent overlay to catch clicks for play/pause */}
                                                        <div
                                                            className="absolute inset-0 z-10 cursor-pointer"
                                                            onClick={ytTogglePlay}
                                                        />

                                                        {/* Branded play icon — covers everything before video starts / when paused */}
                                                        {!ytPlaying && (
                                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">

                                                                {/* Floating Glow Ring */}
                                                                <div className="absolute w-24 h-24 rounded-full bg-orange-500/30 animate-ping"></div>

                                                                {/* Floating Play Button */}
                                                                <div className="w-20 h-20 rounded-full bg-orange-500 flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.35)] animate-[float_3s_ease-in-out_infinite]">
                                                                    <Play size={30} className="text-white ml-1" fill="white" />
                                                                </div>

                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Custom Control Bar */}
                                                    <div className="bg-gray-950 px-4 pt-2 pb-3 space-y-2">
                                                        {/* Seek bar */}
                                                        <div className="relative group/seek">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max={ytDuration || 100}
                                                                step="0.5"
                                                                value={ytCurrentTime}
                                                                onChange={ytSeek}
                                                                disabled={!ytReady}
                                                                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-gray-700 accent-indigo-500"
                                                                style={{
                                                                    background: ytDuration
                                                                        ? `linear-gradient(to right, #6366f1 ${(ytCurrentTime / ytDuration) * 100}%, #374151 ${(ytCurrentTime / ytDuration) * 100}%)`
                                                                        : '#374151'
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Controls row */}
                                                        <div className="flex items-center justify-between">
                                                            {/* Left: play, volume, time */}
                                                            <div className="flex items-center gap-3">
                                                                {/* Play / Pause */}
                                                                <button
                                                                    onClick={ytTogglePlay}
                                                                    disabled={!ytReady}
                                                                    className="text-white hover:text-indigo-400 transition-colors disabled:opacity-40"
                                                                    title={ytPlaying ? 'Pause' : 'Play'}
                                                                >
                                                                    {ytPlaying
                                                                        ? <Pause size={20} />
                                                                        : <Play size={20} />}
                                                                </button>

                                                                {/* Mute toggle */}
                                                                <button
                                                                    onClick={ytToggleMute}
                                                                    disabled={!ytReady}
                                                                    className="text-white hover:text-indigo-400 transition-colors disabled:opacity-40"
                                                                    title={ytMuted ? 'Unmute' : 'Mute'}
                                                                >
                                                                    {ytMuted || ytVolume === 0
                                                                        ? <VolumeX size={18} />
                                                                        : <Volume2 size={18} />}
                                                                </button>

                                                                {/* Volume slider */}
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="100"
                                                                    value={ytMuted ? 0 : ytVolume}
                                                                    onChange={ytHandleVolume}
                                                                    disabled={!ytReady}
                                                                    className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-indigo-500 hidden sm:block disabled:opacity-40"
                                                                />

                                                                {/* Time display */}
                                                                <span className="text-xs text-gray-400 tabular-nums select-none">
                                                                    {ytFormatTime(ytCurrentTime)}
                                                                    <span className="text-gray-600 mx-1">/</span>
                                                                    {ytFormatTime(ytDuration)}
                                                                </span>
                                                            </div>

                                                            {/* Right: fullscreen */}
                                                            <button
                                                                onClick={ytFullscreen}
                                                                className="text-white hover:text-indigo-400 transition-colors"
                                                                title="Fullscreen"
                                                            >
                                                                <Maximize2 size={17} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : activeTopic.videoUrl ? (
                                                <div className="bg-black aspect-video w-full rounded-none md:rounded-xl overflow-hidden shadow-lg sticky top-0 md:static z-10">
                                                    <video
                                                        ref={videoRef}
                                                        src={activeTopic.videoUrl}
                                                        controls
                                                        controlsList="nodownload"
                                                        onContextMenu={(e) => e.preventDefault()}
                                                        className="w-full h-full"
                                                        onTimeUpdate={handleVideoProgress}
                                                        onEnded={() => updateProgress(true, videoRef.current.duration)}
                                                    >
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            ) : (
                                                <div className="bg-black aspect-video w-full rounded-none md:rounded-xl overflow-hidden shadow-lg flex items-center justify-center text-gray-500">
                                                    <p>No video available for this lesson.</p>
                                                </div>
                                            )}

                                            {/* Lesson Controls Toolbar */}
                                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-800 line-clamp-1">{activeTopic.title}</h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">Lesson {modules.findIndex(m => m.topics.some(t => t._id === activeTopic._id)) + 1}.{modules.find(m => m.topics.some(t => t._id === activeTopic._id))?.topics.findIndex(t => t._id === activeTopic._id) + 1}</p>
                                                </div>
                                                <button
                                                    onClick={() => { if (!progress[activeTopic._id]?.completed) updateProgress(true, 1800); }}
                                                    disabled={progress[activeTopic._id]?.completed}
                                                    className={`
                                        px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-2
                                        ${progress[activeTopic._id]?.completed
                                                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'}
                                    `}
                                                >
                                                    {progress[activeTopic._id]?.completed ? (
                                                        <>
                                                            <CheckCircle size={16} className="fill-current" /> Completed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle size={16} /> Mark Complete
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                        </>)}

                                    {/* ── QUIZ FULL VIEW ── */}
                                    {activeView?.type === 'quiz' && activeTopic && (
                                        <div className="px-4 md:px-0 pb-10 space-y-6">
                                            {/* Header */}
                                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                <div className="p-2.5 bg-indigo-50 rounded-xl">
                                                    <Edit2 size={20} className="text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h2 className="font-bold text-gray-900">MCQ Practice</h2>
                                                    <p className="text-xs text-gray-500 mt-0.5">{activeTopic.title}</p>
                                                </div>
                                                {activeQuizIndex !== null && topicContent?.mcqTests?.length > 0 ? (
                                                    <button onClick={() => {
                                                        setActiveQuizIndex(null);
                                                        setQuizResult(null);
                                                        setQuizPhase('idle');
                                                    }} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"><ArrowLeft size={14} /> Back to Quiz List</button>
                                                ) : (
                                                    <button onClick={() => setActiveView({ type: 'video', topicId: activeTopic._id })} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"><ArrowLeft size={14} /> Back to video</button>
                                                )}
                                            </div>
                                            {/* Quiz Content - same as existing quiz tab */}
                                            <div className="min-h-[200px]">
                                                {/* ─── Quiz Logic (same engine as old quiz tab) ─── */}
                                                {(() => {
                                                    const test = activeQuizIndex !== null ? topicContent?.mcqTests?.[activeQuizIndex]?.testId : topicContent?.mcqTest?.testId;
                                                    const rawQuestions = test?.questions || [];
                                                    const activeQuestions = quizPhase === 'active' ? shuffledQuestions : rawQuestions;
                                                    const q = activeQuestions[currentQIdx];

                                                    if (contentLoading) return (
                                                        <div className="flex items-center justify-center py-16 text-gray-400">
                                                            <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
                                                        </div>
                                                    );

                                                    if (activeQuizIndex === null && topicContent?.mcqTests?.length > 0) {
                                                         return (
                                                             <div className="space-y-4">
                                                                 <div className="flex items-center justify-between">
                                                                     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Available Quizzes</h3>
                                                                     <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                                                                         {topicContent.mcqTests.length} practice tests
                                                                     </span>
                                                                 </div>
                                                                 <div className="grid gap-4 sm:grid-cols-2">
                                                                     {topicContent.mcqTests.map((quizItem, idx) => {
                                                                         const test = quizItem.testId;
                                                                         if (!test) return null;
                                                                         const hasAccess = hasTierAccess(quizItem.requiredTier || 'Basic');
                                                                         
                                                                         const attempt = (mySubmissions.mcqs || []).find(x => x.testId === test._id || x.testId?._id === test._id);
                                                                         const scorePct = attempt ? Math.round((attempt.score / (attempt.total || 1)) * 100) : null;
                                                                         const isPass = scorePct !== null && scorePct >= 75;

                                                                         return (
                                                                             <div 
                                                                                 key={idx} 
                                                                                 onClick={() => {
                                                                                     if (!hasAccess) {
                                                                                         toast.error(`Upgrade to ${quizItem.requiredTier} to unlock this quiz`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } });
                                                                                         return;
                                                                                     }
                                                                                     setActiveQuizIndex(idx);
                                                                                     setQuizResult(attempt || null);
                                                                                     setQuizPhase(attempt ? 'submitted' : 'idle');
                                                                                 }}
                                                                                 className={`group relative overflow-hidden rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                                                                                     !hasAccess 
                                                                                         ? 'border-gray-100 bg-gray-50/50 opacity-75' 
                                                                                         : isPass 
                                                                                             ? 'border-emerald-100 bg-emerald-50/30 hover:border-emerald-200' 
                                                                                             : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'
                                                                                 }`}
                                                                             >
                                                                                 <div className="flex items-start justify-between">
                                                                                     <div className="space-y-1.5 pr-6">
                                                                                         <div className="flex items-center gap-2">
                                                                                             <span className="text-[10px] font-bold text-slate-400">QUIZ {idx + 1}</span>
                                                                                             {!hasAccess ? (
                                                                                                 <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold uppercase tracking-wider">
                                                                                                     {quizItem.requiredTier}
                                                                                                 </span>
                                                                                             ) : (
                                                                                                 <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-bold uppercase tracking-wider">
                                                                                                     Unlocked
                                                                                                 </span>
                                                                                             )}
                                                                                         </div>
                                                                                         <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">{test.title}</h4>
                                                                                         <p className="text-[11px] text-gray-500">{test.questions?.length || 0} Questions • 30s per question</p>
                                                                                     </div>
                                                                                     <div className="flex-shrink-0">
                                                                                         {!hasAccess ? (
                                                                                             <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                                                                                                 <Lock size={14} />
                                                                                             </div>
                                                                                         ) : scorePct !== null ? (
                                                                                             <div className={`text-right ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                                 <div className="text-sm font-black">{scorePct}%</div>
                                                                                                 <div className="text-[8px] font-bold uppercase tracking-wider leading-none mt-0.5">{isPass ? 'Passed' : 'Failed'}</div>
                                                                                             </div>
                                                                                         ) : (
                                                                                             <div className="w-8 h-8 rounded-full bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-indigo-600 transition-all">
                                                                                                 <Play size={13} className="ml-0.5 fill-current" />
                                                                                             </div>
                                                                                         )}
                                                                                     </div>
                                                                                 </div>
                                                                             </div>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             </div>
                                                         );
                                                     }

                                                     if (!test || (activeQuizIndex === null && !topicContent?.mcqTest?.enabled)) return (
                                                         <div className="text-center py-14 text-gray-400">
                                                             <BookOpen size={44} className="mx-auto mb-3 opacity-30" />
                                                             <p className="font-medium">No quiz assigned to this lesson.</p>
                                                         </div>
                                                     );

                                                    const toggleCheckbox = (opt) => {
                                                        setMcqAnswers(prev => {
                                                            const cur = prev[String(currentQIdx)];
                                                            const arr = Array.isArray(cur) ? cur : [];
                                                            return { ...prev, [String(currentQIdx)]: arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt] };
                                                        });
                                                    };

                                                    const activeTest = activeQuizIndex !== null ? topicContent?.mcqTests?.[activeQuizIndex]?.testId : topicContent?.mcqTest?.testId;
                                                    const attempt = quizResult || (activeTest ? (mySubmissions.mcqs || []).find(x => {
                                                        const xId = x.testId?._id?.toString() || x.testId?.toString();
                                                        const activeId = activeTest._id?.toString() || activeTest.toString();
                                                        return xId === activeId;
                                                    }) : null) || (activeQuizIndex === null ? mySubmissions.mcq : null);
                                                    if (attempt || quizPhase === 'submitted') {
                                                          const score = attempt?.score ?? 0;
                                                          const total = attempt?.total ?? rawQuestions.length;
                                                          const scorePct = Math.round((score / (total || 1)) * 100);
                                                          const isPerfect = scorePct === 100;
                                                          const isPass = scorePct >= 75;
                                                          const answerLookup = {};
                                                          (attempt?.answers || []).forEach(a => { answerLookup[a.questionId] = Array.isArray(a.selected) ? a.selected : [a.selected]; });

                                                          // Calculate unanswered
                                                          const unanswered = Math.max(0, total - (attempt?.answers?.length || 0));

                                                          return (
                                                              <div className="space-y-6 max-w-4xl mx-auto animate-[fadeIn_0.4s_ease-out] font-outfit antialiased relative">
                                                                  
                                                                  {/* NxtWave Results Centered Modal Overlay */}
                                                                  {(!showDetailedReview) && (
                                                                      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-[fadeIn_0.25s_ease-out]">
                                                                          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-6 md:p-8 space-y-6 border border-slate-100 animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)] relative">
                                                                              
                                                                              {/* Modal Title */}
                                                                              <div className="text-center space-y-1.5">
                                                                                  <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
                                                                                      {isPerfect 
                                                                                          ? "Congrats! Perfect Score!" 
                                                                                          : isPass 
                                                                                              ? "Congrats! You did well in the practice." 
                                                                                              : "Keep practicing to improve!"
                                                                                      }
                                                                                  </h3>
                                                                                  
                                                                                  {/* Divider Row: Date & Duration */}
                                                                                  <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-b border-slate-100 py-3 my-2">
                                                                                      <span>{new Date(attempt?.attemptedAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                                                                                      <span>30S / QUESTION</span>
                                                                                  </div>
                                                                              </div>

                                                                              {/* Split Info Grid */}
                                                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                                                                                  
                                                                                  {/* Left circular gauge */}
                                                                                  <div className="flex flex-col items-center justify-center space-y-3">
                                                                                      <div className="relative w-40 h-22 flex items-end justify-center">
                                                                                          <svg className="absolute top-0 left-0 w-full h-full -rotate-180" viewBox="0 0 100 50">
                                                                                              <path 
                                                                                                  d="M 15 45 A 30 30 0 0 1 85 45" 
                                                                                                  fill="none" 
                                                                                                  stroke="#f1f5f9" 
                                                                                                  strokeWidth="8" 
                                                                                                  strokeLinecap="round" 
                                                                                              />
                                                                                              <path 
                                                                                                  d="M 15 45 A 30 30 0 0 1 85 45" 
                                                                                                  fill="none" 
                                                                                                  stroke="#0066cc" 
                                                                                                  strokeWidth="8" 
                                                                                                  strokeLinecap="round" 
                                                                                                  strokeDasharray="110" 
                                                                                                  strokeDashoffset={110 - (110 * scorePct) / 100}
                                                                                                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                                                                              />
                                                                                          </svg>
                                                                                          <div className="text-center z-10 pb-0.5 select-none">
                                                                                              <p className="text-2xl font-black text-slate-800 leading-none">
                                                                                                  {score}<span className="text-xs font-bold text-slate-400">/{total}</span>
                                                                                              </p>
                                                                                              <div className="mt-1.5">
                                                                                                  <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                                                                                      isPass ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                                                                  }`}>
                                                                                                      {isPass ? 'PASSED' : 'FAILED'}
                                                                                                  </span>
                                                                                              </div>
                                                                                          </div>
                                                                                      </div>
                                                                                      {/* Gauge Legends */}
                                                                                      <div className="flex flex-col gap-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest text-left">
                                                                                          <div className="flex items-center gap-1.5">
                                                                                              <span className="w-2 h-2 bg-[#0066cc] rounded-xs"></span>
                                                                                              <span>Your Score ({scorePct}%)</span>
                                                                                          </div>
                                                                                          <div className="flex items-center gap-1.5">
                                                                                              <span className="w-2 h-2 bg-slate-200 rounded-xs"></span>
                                                                                              <span>Pass Score (75%)</span>
                                                                                          </div>
                                                                                      </div>
                                                                                  </div>

                                                                                  {/* Right list checklist */}
                                                                                  <div className="space-y-3.5 text-left border-l-0 sm:border-l border-slate-100 sm:pl-6 font-semibold text-[11px]">
                                                                                      <div className="flex items-center gap-2 text-emerald-600">
                                                                                          <span className="w-4 h-4 rounded-full bg-emerald-50 flex items-center justify-center text-[10px] font-bold">✓</span>
                                                                                          <span><strong>{score}</strong> Correct Answers</span>
                                                                                      </div>
                                                                                      <div className="flex items-center gap-2 text-rose-600">
                                                                                          <span className="w-4 h-4 rounded-full bg-rose-50 flex items-center justify-center text-[10px] font-bold">✕</span>
                                                                                          <span><strong>{total - score - unanswered}</strong> Wrong Answers</span>
                                                                                      </div>
                                                                                      <div className="flex items-center gap-2 text-amber-600">
                                                                                          <span className="w-4 h-4 rounded-full bg-amber-50 flex items-center justify-center text-[10px] font-bold">•</span>
                                                                                          <span><strong>{unanswered}</strong> Unanswered</span>
                                                                                      </div>

                                                                                      <button 
                                                                                          onClick={() => setShowDetailedReview(true)}
                                                                                          className="pt-2 text-[9px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest flex items-center gap-1 border-t border-slate-50 w-full"
                                                                                      >
                                                                                          Review Mistakes &gt;
                                                                                      </button>
                                                                                  </div>

                                                                              </div>

                                                                              {/* Modal Buttons */}
                                                                              <div className="flex gap-3 pt-2">
                                                                                  <button 
                                                                                      onClick={retakeQuiz}
                                                                                      className="flex-1 py-3 px-4 bg-white border border-blue-600 hover:bg-blue-50/10 text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center shadow-xs"
                                                                                  >
                                                                                      Practice Again
                                                                                  </button>
                                                                                  <button 
                                                                                      onClick={() => {
                                                                                          if (activeQuizIndex !== null && topicContent?.mcqTests?.length > 0) {
                                                                                              setActiveQuizIndex(null);
                                                                                              setQuizResult(null);
                                                                                              setQuizPhase('idle');
                                                                                          } else {
                                                                                              setActiveView({ type: 'video', topicId: activeTopic._id });
                                                                                          }
                                                                                      }}
                                                                                      className="flex-1 py-3 px-4 bg-[#ff6600] hover:bg-[#e65c00] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-center shadow-md shadow-orange-100"
                                                                                  >
                                                                                      Proceed to Next &gt;
                                                                                  </button>
                                                                              </div>

                                                                          </div>
                                                                      </div>
                                                                  )}

                                                                  {/* Backdrop Question Reviews */}
                                                                  <div className="space-y-6">
                                                                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                                                          <h3 className="font-black text-slate-800 text-lg">Detailed Review</h3>
                                                                          <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest select-none">
                                                                              <span className="flex items-center gap-1 text-emerald-650">
                                                                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Correct
                                                                              </span>
                                                                              <span className="flex items-center gap-1 text-rose-650">
                                                                                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> Incorrect
                                                                              </span>
                                                                          </div>
                                                                      </div>

                                                                      <div className="grid gap-6">
                                                                          {rawQuestions.map((question, qIdx) => {
                                                                              const userSelected = answerLookup[question._id] || [];
                                                                              const correctAnswers = question.correctAnswers || (Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer]) || [];
                                                                              const isCorrect = userSelected.length === correctAnswers.length && userSelected.every(val => correctAnswers.includes(val));

                                                                              return (
                                                                                  <div key={qIdx} className={`p-6 rounded-[2rem] border transition-all bg-white shadow-sm space-y-4 ${
                                                                                      isCorrect ? 'border-emerald-100 bg-emerald-50/5' : 'border-rose-100 bg-rose-50/5'
                                                                                  }`}>
                                                                                      <div className="flex items-start gap-4">
                                                                                          {/* Status circle badge on the left */}
                                                                                          <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                                                                                              isCorrect ? 'bg-emerald-500 shadow-md shadow-emerald-100' : 'bg-rose-500 shadow-md shadow-rose-100'
                                                                                          }`}>
                                                                                              {isCorrect ? <Check size={16} className="stroke-[3]" /> : <X size={16} className="stroke-[3]" />}
                                                                                          </div>
                                                                                          
                                                                                          <div className="flex-1 min-w-0 space-y-3">
                                                                                              <p className="font-extrabold text-slate-800 text-xs md:text-sm leading-relaxed">
                                                                                                  {qIdx + 1}. {question.questionText || question.question}
                                                                                              </p>

                                                                                              <div className="grid gap-3 pt-1">
                                                                                                  {question.options.map((opt, oIdx) => {
                                                                                                      const isUserChoice = userSelected.includes(opt);
                                                                                                      const isRightChoice = correctAnswers.includes(opt);
                                                                                                      
                                                                                                      let optionStyle = "bg-white border-slate-100 text-slate-650 hover:border-slate-200";
                                                                                                      let letterStyle = "bg-slate-50 border border-slate-200 text-slate-450";
                                                                                                      
                                                                                                      if (isRightChoice) {
                                                                                                          optionStyle = "bg-emerald-50/40 border-emerald-500 text-emerald-800 font-bold";
                                                                                                          letterStyle = "bg-emerald-500 text-white";
                                                                                                      } else if (isUserChoice) {
                                                                                                          optionStyle = "bg-rose-50/40 border-rose-500 text-rose-800 font-bold";
                                                                                                          letterStyle = "bg-rose-500 text-white";
                                                                                                      }

                                                                                                      return (
                                                                                                          <div key={oIdx} className={`w-full flex items-center justify-between gap-4 px-5 py-3 rounded-2xl border-2 transition-all text-xs ${optionStyle}`}>
                                                                                                              <div className="flex items-center gap-3">
                                                                                                                  <span className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${letterStyle}`}>
                                                                                                                      {String.fromCharCode(65 + oIdx)}
                                                                                                                  </span>
                                                                                                                  <span className="flex-1 leading-relaxed">{opt}</span>
                                                                                                              </div>
                                                                                                              {isRightChoice && (
                                                                                                                  <span className="flex items-center gap-1 bg-white border border-emerald-200 text-emerald-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs select-none">
                                                                                                                      ✓ Correct Answer
                                                                                                                  </span>
                                                                                                              )}
                                                                                                              {!isRightChoice && isUserChoice && (
                                                                                                                  <span className="flex items-center gap-1 bg-white border border-rose-200 text-rose-600 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-xs select-none">
                                                                                                                      ✕ Your Choice
                                                                                                                  </span>
                                                                                                              )}
                                                                                                          </div>
                                                                                                      );
                                                                                                  })}
                                                                                              </div>
                                                                                          </div>
                                                                                      </div>
                                                                                  </div>
                                                                              );
                                                                          })}
                                                                      </div>
                                                                  </div>

                                                                  {/* Bottom Nav Action Row for mistakes review backdrop */}
                                                                  {showDetailedReview && (
                                                                      <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center max-w-md mx-auto">
                                                                          <button 
                                                                              onClick={() => {
                                                                                  setShowDetailedReview(false);
                                                                                  retakeQuiz();
                                                                              }}
                                                                              className="flex-1 py-3 px-6 bg-white border-2 border-blue-600 hover:bg-blue-50/10 text-blue-600 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all text-center shadow-sm"
                                                                          >
                                                                              Practice Again
                                                                          </button>
                                                                          <button 
                                                                              onClick={() => {
                                                                                  setShowDetailedReview(false);
                                                                                  if (activeQuizIndex !== null && topicContent?.mcqTests?.length > 0) {
                                                                                      setActiveQuizIndex(null);
                                                                                      setQuizResult(null);
                                                                                      setQuizPhase('idle');
                                                                                  } else {
                                                                                      setActiveView({ type: 'video', topicId: activeTopic._id });
                                                                                  }
                                                                              }}
                                                                              className="flex-1 py-3 px-6 bg-[#ff6600] hover:bg-[#e65c00] text-white rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all text-center shadow-md shadow-orange-100"
                                                                          >
                                                                              Proceed to Next &gt;
                                                                          </button>
                                                                      </div>
                                                                  )}

                                                              </div>
                                                          );
                                                      }

                                                      if (quizPhase === 'idle') {
                                                          return (
                                                              <div className="max-w-3xl mx-auto animate-[fadeIn_0.4s_ease-out] font-outfit antialiased">
                                                                  
                                                                  {/* Clean, high-fidelity Instructions Card matching Screenshot 1 */}
                                                                  <div className="bg-white border border-slate-200/80 shadow-md rounded-[2rem] p-6 md:p-8 space-y-6 text-left relative overflow-hidden">
                                                                      
                                                                      {/* Card Title Header */}
                                                                      <h3 className="text-lg md:text-xl font-extrabold text-[#0f2e5c] tracking-tight">
                                                                          Instructions:
                                                                      </h3>

                                                                      {/* List of high-fidelity instructions */}
                                                                      <ol className="space-y-4 text-xs md:text-[13px] text-slate-655 leading-relaxed list-decimal pl-5">
                                                                          <li>
                                                                              <strong>Number of Questions:</strong> {rawQuestions.length} Items
                                                                          </li>
                                                                          <li>
                                                                              <strong>Types of Questions:</strong> Multiple Choice Questions (MCQs)
                                                                          </li>
                                                                          <li>
                                                                              <strong>Duration:</strong> 30 seconds / Question
                                                                          </li>
                                                                          <li>
                                                                              <strong>Marking Scheme:</strong> All questions have equal weightage. Every correct response gets <strong>+1 marks</strong>.
                                                                          </li>
                                                                          <li>
                                                                              <strong>Negative Marking:</strong> No negative markings in case of incorrect or unattempted responses.
                                                                          </li>
                                                                          <li>
                                                                              <strong>Attempts:</strong> You can take this practice assessment as many times as you like to perfect your score.
                                                                          </li>
                                                                          <li>
                                                                              <strong>Cutoff Marks:</strong> You need to score a minimum threshold of <strong>75% Marks</strong> to clear this set.
                                                                          </li>
                                                                          <li>
                                                                              <strong>Skip a Question:</strong> You can navigate forward and backward between questions freely to check or change your selections.
                                                                          </li>
                                                                      </ol>

                                                                      {/* Elegant Purple points card matching Screenshot 1 exactly */}
                                                                      <div className="bg-[#f3f0ff] border border-[#d8b4fe] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#581c87] text-xs font-bold shadow-xs select-none">
                                                                          <span>Points will be awarded based on your score in practice questions.</span>
                                                                          <span className="flex items-center gap-1.5 bg-[#e9e3ff] px-3.5 py-1.5 rounded-xl border border-[#c084fc] tracking-wider uppercase text-[10px] text-indigo-700 font-extrabold">
                                                                              1 Score = <span className="text-amber-500">✪</span> 1 Point
                                                                          </span>
                                                                      </div>

                                                                      {/* Bottom start trigger row with bottom-right aligned Orange button matching Screenshot 1 */}
                                                                      <div className="flex justify-end pt-4 border-t border-slate-100">
                                                                          <button 
                                                                              onClick={() => {
                                                                                  setShowDetailedReview(false);
                                                                                  startQuiz();
                                                                              }} 
                                                                              className="inline-flex items-center justify-center px-8 py-3 bg-[#ff6600] hover:bg-[#e65c00] text-white rounded-xl font-extrabold text-xs uppercase tracking-widest shadow-md shadow-orange-100 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                                                          >
                                                                              <span className="mr-2">Start Assessment</span>
                                                                              <span>&gt;</span>
                                                                          </button>
                                                                      </div>

                                                                  </div>

                                                              </div>
                                                          );
                                                      }

                                                      const timerPct = (timeLeft / 30) * 100;
                                                      const timerColor = timeLeft > 20 ? '#0066cc' : timeLeft > 10 ? '#f59e0b' : '#ef4444';
                                                      const isMultiple = q?.isMultiple;
                                                      const currentAnswers = mcqAnswers[String(currentQIdx)];
                                                      const selectedArr = Array.isArray(currentAnswers) ? currentAnswers : currentAnswers ? [currentAnswers] : [];

                                                      return (
                                                          <div className="space-y-6 max-w-4xl mx-auto animate-[fadeIn_0.3s_ease-out] font-outfit antialiased">
                                                              
                                                              {/* Premium Active Top Navigation Bar matching Screenshot 2 */}
                                                              <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-4 md:px-6 flex flex-wrap items-center justify-between gap-4 text-xs md:text-sm font-bold text-slate-700">
                                                                  
                                                                  {/* Left navigation arrow */}
                                                                  <button 
                                                                      onClick={() => {
                                                                          if (activeQuizIndex !== null && topicContent?.mcqTests?.length > 0) {
                                                                              setActiveQuizIndex(null);
                                                                              setQuizResult(null);
                                                                              setQuizPhase('idle');
                                                                          } else {
                                                                              setActiveView({ type: 'video', topicId: activeTopic._id });
                                                                          }
                                                                      }} 
                                                                      className="text-[#0066cc] hover:text-[#004fa3] transition-colors flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-extrabold"
                                                                  >
                                                                      ← MCQ Practice
                                                                  </button>

                                                                  {/* Center Dynamic score tracking */}
                                                                  <div className="flex items-center gap-1 select-none">
                                                                      <span className="text-[10px] tracking-wider text-slate-400 uppercase font-black">Score:</span>
                                                                      <span className="text-[#0066cc] font-black text-sm md:text-base">
                                                                          {Object.keys(mcqAnswers).length}
                                                                      </span>
                                                                  </div>

                                                                  {/* Right items attempted tracking */}
                                                                  <div className="text-[10px] tracking-wider text-slate-400 uppercase font-black">
                                                                      Questions Attempted: <span className="text-slate-800 font-extrabold">{Object.keys(mcqAnswers).length}/{activeQuestions.length}</span>
                                                                  </div>

                                                              </div>

                                                              {/* Sub bar instructions details */}
                                                              <div className="flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">
                                                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span> Practice Instructions Active</span>
                                                                  <button onClick={retakeQuiz} className="text-[#ef4444] hover:underline uppercase tracking-wider font-black">End Practice</button>
                                                              </div>

                                                              {/* Split grid main container */}
                                                              <div className="grid grid-cols-12 gap-6 items-start">
                                                                  
                                                                  {/* Question and Option choices panel */}
                                                                  <div className="col-span-12 lg:col-span-8 space-y-6">
                                                                      
                                                                      <div className="bg-white border border-slate-200/80 shadow-md rounded-3xl p-6 md:p-8 space-y-6">
                                                                          
                                                                          {/* Question Text */}
                                                                          <div className="space-y-1.5 text-left">
                                                                              <span className="text-[10px] font-black tracking-widest text-[#0066cc] bg-blue-50 px-2.5 py-1 rounded-lg uppercase">
                                                                                  Question {currentQIdx + 1} of {activeQuestions.length}
                                                                              </span>
                                                                              <p className="font-extrabold text-slate-800 text-sm md:text-base leading-relaxed pt-2">
                                                                                  {q?.questionText || q?.question}
                                                                              </p>
                                                                          </div>

                                                                          {/* Option items with circle checkbox radio indicators */}
                                                                          <div className="grid gap-3 pt-1">
                                                                              {q?.options?.map((opt, oIdx) => {
                                                                                  const selected = isMultiple ? selectedArr.includes(opt) : currentAnswers === opt;
                                                                                  return (
                                                                                      <button 
                                                                                          key={oIdx} 
                                                                                          onClick={() => isMultiple ? toggleCheckbox(opt) : setMcqAnswers(prev => ({ ...prev, [String(currentQIdx)]: opt }))}
                                                                                          className={`w-full text-left flex items-start gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all transform hover:scale-[1.002] active:scale-[0.998] ${
                                                                                              selected 
                                                                                                  ? 'border-blue-600 bg-blue-50/20 text-blue-800 shadow-sm' 
                                                                                                  : 'border-slate-100 bg-slate-50/20 hover:border-blue-200 text-slate-655'
                                                                                          }`}
                                                                                      >
                                                                                          {/* Radio Circle selector */}
                                                                                          <span className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                                              selected 
                                                                                                  ? 'border-blue-600 bg-blue-600 text-white text-[9px] font-bold' 
                                                                                                  : 'border-slate-300 bg-white'
                                                                                          }`}>
                                                                                              {selected && "✓"}
                                                                                          </span>
                                                                                          <span className="flex-1 text-xs md:text-sm font-semibold leading-relaxed pt-0.5">
                                                                                              {opt}
                                                                                          </span>
                                                                                      </button>
                                                                                  );
                                                                              })}
                                                                          </div>

                                                                      </div>

                                                                      {/* Navigation control bar */}
                                                                      <div className="flex gap-4">
                                                                          {currentQIdx > 0 && (
                                                                              <button 
                                                                                  onClick={() => {
                                                                                      setCurrentQIdx(prev => prev - 1);
                                                                                      setTimeLeft(30);
                                                                                  }}
                                                                                  className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xs flex items-center gap-1.5"
                                                                              >
                                                                                  <ArrowLeft size={15} /> Back
                                                                              </button>
                                                                          )}
                                                                          <button 
                                                                              onClick={handleNextQuestion} 
                                                                              disabled={mcqSubmitting} 
                                                                              className="flex-1 py-3.5 bg-[#ff6600] hover:bg-[#e65c00] text-white rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 transition-all shadow-md shadow-orange-100 flex items-center justify-center gap-2"
                                                                          >
                                                                              {currentQIdx < activeQuestions.length - 1 ? (
                                                                                  <>Next Question <ArrowRight size={15} /></>
                                                                              ) : (
                                                                                  mcqSubmitting ? 'Submitting...' : <>Submit Assessment ✓</>
                                                                              )}
                                                                          </button>
                                                                      </div>

                                                                  </div>

                                                                  {/* Stopwatch and statistics panel */}
                                                                  <div className="col-span-12 lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                                                                      
                                                                      <div className="bg-white border border-slate-200/80 shadow-md rounded-3xl p-6 space-y-6 text-center">
                                                                          
                                                                          {/* Timer countdown stopwatch */}
                                                                          <div className="flex flex-col items-center justify-center space-y-2">
                                                                              <div className="relative w-20 h-20">
                                                                                  <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                                                                      <circle cx="24" cy="24" r="20" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                                                                                      <circle cx="24" cy="24" r="20" fill="none" stroke={timerColor} strokeWidth="3" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPct / 100)}`} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} />
                                                                                  </svg>
                                                                                  <span className="absolute inset-0 flex items-center justify-center text-lg font-black tracking-tight" style={{ color: timerColor }}>
                                                                                      {timeLeft}
                                                                                  </span>
                                                                              </div>
                                                                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                                                                                  Seconds Remaining
                                                                              </p>
                                                                          </div>

                                                                          {/* Progress matrix grid dots */}
                                                                          <div className="border-t border-slate-100 pt-4 space-y-3 text-left">
                                                                              <p className="text-[10px] text-slate-450 font-black uppercase tracking-widest">
                                                                                  Practice Progress Map
                                                                              </p>
                                                                              <div className="flex flex-wrap items-center gap-2">
                                                                                  {activeQuestions.map((_, idx) => {
                                                                                      const isCurrent = idx === currentQIdx;
                                                                                      const isAnswered = mcqAnswers[String(idx)] !== undefined;
                                                                                      
                                                                                      let dotStyle = "bg-slate-50 text-slate-400 border-slate-100";
                                                                                      if (isCurrent) dotStyle = "bg-blue-600 text-white border-blue-600 scale-105 shadow-sm ring-4 ring-blue-50";
                                                                                      else if (isAnswered) dotStyle = "bg-emerald-500 text-white border-emerald-500";

                                                                                      return (
                                                                                          <div 
                                                                                              key={idx} 
                                                                                              className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center text-[10px] font-black transition-all ${dotStyle}`}
                                                                                          >
                                                                                              {idx + 1}
                                                                                          </div>
                                                                                      );
                                                                                  })}
                                                                              </div>
                                                                          </div>

                                                                          {/* passing target reminder card box */}
                                                                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-1">
                                                                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                                                                  Cutoff Marks Metric
                                                                              </span>
                                                                              <p className="text-xs font-bold text-slate-700 leading-normal">
                                                                                  You need to score a minimum threshold of <span className="text-[#0066cc] font-black">75% Marks</span> to successfully clear this practice set.
                                                                              </p>
                                                                          </div>

                                                                      </div>

                                                                  </div>

                                                              </div>

                                                          </div>
                                                      );
})()}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── ASSIGNMENT FULL VIEW ── */}
                                    {activeView?.type === 'assignment' && activeTopic && (
                                        <div className="px-4 md:px-0 pb-10 space-y-6">
                                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                <div className="p-2.5 bg-orange-50 rounded-xl"><Upload size={20} className="text-orange-600" /></div>
                                                <div className="flex-1">
                                                    <h2 className="font-bold text-gray-900">Document</h2>
                                                    <p className="text-xs text-gray-500 mt-0.5">{activeTopic.title}</p>
                                                </div>
                                                <button onClick={() => setActiveView({ type: 'video', topicId: activeTopic._id })} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1"><ArrowLeft size={14} /> Back to video</button>
                                            </div>
                                            <div className="space-y-6">
                                                {contentLoading ? (
                                                    <div className="flex items-center justify-center py-16 text-gray-400"><div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" /></div>
                                                ) : !topicContent?.assignments || topicContent.assignments.length === 0 ? (
                                                    <div className="text-center py-10 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-40" /><p>No documents for this lesson.</p></div>
                                                ) : (
                                                    topicContent.assignments.map((assign, idx) => {
                                                        const isDone = progress[activeTopic._id]?.completedAssignments?.includes(assign._id);
                                                         const hasAccess = hasTierAccess(assign.requiredTier || 'Basic');
                                                        return (
                                                            <div key={idx} className={`bg-white border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-colors ${!hasAccess ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 hover:border-indigo-200'}`}>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center flex-wrap gap-1">
                                                                         <h4 className="font-semibold text-gray-800 truncate">{assign.title}</h4>
                                                                         {!hasAccess && (
                                                                             <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                                                                 {assign.requiredTier}
                                                                             </span>
                                                                         )}
                                                                     </div>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold uppercase tracking-widest">Document</span>
                                                                        {isDone && (
                                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                                                <CheckCircle size={10} /> Completed
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                                    {!hasAccess ? (
                                                                        <button
                                                                            onClick={() => toast.error(`Upgrade to ${assign.requiredTier} to unlock this document`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } })}
                                                                            className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-lg text-sm font-bold hover:bg-amber-100 transition-all shadow-sm flex items-center justify-center gap-2"
                                                                        >
                                                                            <Lock size={15} /> Locked
                                                                        </button>
                                                                    ) : (
                                                                        <>
                                                                            {assign.questionUrl && (
                                                                                <button
                                                                                    onClick={() => setSelectedDocument(assign)}
                                                                                    className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-sm font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                                                                                >
                                                                                    <FileText size={16} /> Open
                                                                                </button>
                                                                            )}
                                                                            {!isDone && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        autoMarkTopicComplete(activeTopic._id, 'assignment', true, assign._id);
                                                                                        toast.success('Document marked as completed!');
                                                                                        fireSuccessBlast();
                                                                                    }}
                                                                                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-sm font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                                                                                >
                                                                                    <CheckCircle size={16} /> Mark Done
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── VIDEO TABS (Description / Notes / Discussion) ── */}
                                    {(!activeView || activeView.type === 'video') && (
                                        <div className="px-4 md:px-0 pb-10">
                                            <div className="border-b border-gray-200 mb-6 flex gap-6 overflow-x-auto">
                                                {['Description', 'Notes', 'Discussion'].map((tab) => (
                                                    <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
                                                        className={`pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.toLowerCase() ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="min-h-[200px]">
                                                {activeTab === 'description' && (
                                                    <div className="prose prose-indigo max-w-none">
                                                        <h2 className="text-xl font-bold text-gray-900 mb-2">{activeTopic.title}</h2>
                                                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{activeTopic.description || 'No description provided.'}</p>
                                                    </div>
                                                )}
                                                {activeTab === 'notes' && (
                                                    <div className="space-y-3">
                                                        <h3 className="font-semibold text-gray-800 mb-4">Lesson Materials</h3>
                                                        {activeTopic.notes && activeTopic.notes.length > 0 ? (
                                                            activeTopic.notes.map((note, idx) => {
                                                                const hasAccess = hasTierAccess(note.requiredTier || 'Basic');
                                                                if (note.type === 'google_doc' || note.type === 'google_ppt') {
                                                                    return (
                                                                        <div key={idx} className="mt-4 space-y-4">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={`p-2 rounded-lg ${note.type === 'google_ppt' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                                                        <Globe size={20} />
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className="font-bold text-slate-800 leading-none">{note.name || `Note ${idx + 1}`}</p>
                                                                                            {!hasAccess && (
                                                                                                <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[9px] font-bold uppercase tracking-wider ml-1">
                                                                                                    {note.requiredTier}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                                                                                            {note.type === 'google_ppt' ? 'Presentation Preview' : 'Document Preview'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                {hasAccess ? (
                                                                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100">
                                                                                        <Lock size={12} />
                                                                                        <span className="text-[10px] font-bold uppercase">View Only</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100">
                                                                                        <Lock size={12} />
                                                                                        <span className="text-[10px] font-bold uppercase">{note.requiredTier} Lock</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="relative w-full aspect-video md:h-[600px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner select-none" onContextMenu={(e) => e.preventDefault()}>
                                                                                {hasAccess ? (
                                                                                    <iframe src={(() => { try { let url = note.url; if (note.type === 'google_ppt') { if (url.includes('/edit')) url = url.split('/edit')[0] + '/embed'; else if (url.includes('/view')) url = url.split('/view')[0] + '/embed'; else if (!url.includes('/embed')) { url = url.endsWith('/') ? url + 'embed' : url + '/embed'; } } else { if (url.includes('/edit')) url = url.split('/edit')[0] + '/preview'; else if (url.includes('/view')) url = url.split('/view')[0] + '/preview'; else if (!url.includes('/preview')) { url = url.endsWith('/') ? url + 'preview' : url + '/preview'; } } return url; } catch (e) { return note.url; } })()} className="w-full h-full border-none" title={note.name} allowFullScreen={note.type === 'google_ppt'} loading="lazy"></iframe>
                                                                                ) : (
                                                                                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-3 z-20">
                                                                                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                                                            <Lock size={28} />
                                                                                        </div>
                                                                                        <h4 className="text-white font-extrabold text-lg">Gated Premium Material</h4>
                                                                                        <p className="text-slate-400 text-sm max-w-md">Upgrade your subscription to the <span className="text-amber-400 font-bold uppercase">{note.requiredTier}</span> tier to unlock this resource and power up your learning journey.</p>
                                                                                        <button onClick={() => toast.error(`Upgrade to ${note.requiredTier} to unlock this material`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } })} className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-amber-400 transition-all shadow-lg">Upgrade Now</button>
                                                                                    </div>
                                                                                )}
                                                                                {hasAccess && (
                                                                                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur shadow-sm px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 font-bold text-[10px] uppercase pointer-events-none">
                                                                                        <ShieldCheck size={12} className={note.type === 'google_ppt' ? 'text-orange-600' : 'text-indigo-600'} />
                                                                                        Protected Content
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                } else {
                                                                    return (
                                                                        <div key={idx} className={`flex items-center justify-between p-4 bg-white border rounded-xl transition-colors ${!hasAccess ? 'border-gray-100 bg-gray-50/50' : 'border-gray-200 hover:border-indigo-200'}`}>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                                                    <FileText size={20} />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="font-medium text-gray-700 line-clamp-1">{note.name || `Note ${idx + 1}`}</p>
                                                                                        {!hasAccess && (
                                                                                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-md text-[9px] font-bold uppercase tracking-wider">
                                                                                                {note.requiredTier}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-400">PDF Document</p>
                                                                                </div>
                                                                            </div>
                                                                            {hasAccess ? (
                                                                                <a href={note.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                                                                                    <Download size={16} /> Download
                                                                                </a>
                                                                            ) : (
                                                                                <button onClick={() => toast.error(`Upgrade to ${note.requiredTier} to download this PDF document`, { icon: '🔒', style: { background: '#1c263c', color: '#fff' } })} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-600 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-all">
                                                                                    <Lock size={15} /> Locked
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                            })
                                                        ) : (
                                                            <div className="text-gray-500 italic p-4 bg-gray-50 rounded-lg text-sm text-center">No notes attached to this lesson.</div>
                                                        )}
                                                    </div>
                                                )}
                                                {activeTab === 'discussion' && (
                                                    <div className="space-y-6">
                                                        <form onSubmit={handlePostComment} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Ask a question or leave a comment</label>
                                                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Type your question here..." className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-shadow" rows="3"></textarea>
                                                            <div className="flex justify-end mt-2"><button type="submit" disabled={!newComment.trim()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Post Comment</button></div>
                                                        </form>
                                                        <div className="space-y-4">
                                                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">Discussion <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{comments.length}</span></h3>
                                                            {commentLoading ? (<div className="text-center py-8 text-gray-400">Loading comments...</div>) : comments.length === 0 ? (
                                                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200"><p className="text-gray-500 text-sm">No comments yet. Be the first to ask!</p></div>
                                                            ) : (
                                                                comments.map((comment) => (
                                                                    <div key={comment._id} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm group">
                                                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">{comment.studentId?.name?.charAt(0) || 'S'}</div>
                                                                        <div className="flex-1">
                                                                            <div className="flex justify-between items-start">
                                                                                <h4 className="font-semibold text-gray-900 text-sm">{comment.studentId?.name || 'Student'}</h4>
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                                                    {currentUser && currentUser._id === comment.studentId?._id && !editingCommentId && (
                                                                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            <button onClick={() => startEditing(comment)} className="p-1 text-gray-400 hover:text-indigo-600" title="Edit"><Edit2 size={16} /></button>
                                                                                            <button onClick={() => handleDeleteComment(comment._id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {editingCommentId === comment._id ? (
                                                                                <div className="mt-2">
                                                                                    <textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} className="w-full p-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" rows="2"></textarea>
                                                                                    <div className="flex justify-end gap-2 mt-2">
                                                                                        <button onClick={cancelEditing} className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                                                                        <button onClick={() => handleUpdateComment(comment._id)} className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded">Save</button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{comment.message}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <PlayCircle size={48} className="mb-4 opacity-50" />
                            <p>Select a lesson from the sidebar to start learning.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
