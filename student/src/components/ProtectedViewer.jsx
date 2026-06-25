import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Shield, AlertTriangle, Eye, Lock, Loader2, ExternalLink,
    Pause, Play, Volume2, VolumeX, Maximize2, Youtube, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';

// Initialize the PDF.js worker.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ProtectedViewer = ({ type, url, title, studentInfo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isObscured, setIsObscured] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pdfError, setPdfError] = useState(false);
    const [containerWidth, setContainerWidth] = useState(null);
    const viewerRef = useRef(null);

    // YouTube Custom Player State
    const [ytReady, setYtReady] = useState(false);
    const [ytPlaying, setYtPlaying] = useState(false);
    const [ytCurrentTime, setYtCurrentTime] = useState(0);
    const [ytDuration, setYtDuration] = useState(0);
    const ytPlayerRef = useRef(null);
    const ytPollRef = useRef(null);
    const playerWrapRef = useRef(null);

    // Dynamic width tracking for responsiveness
    useEffect(() => {
        const handleResize = () => {
            if (viewerRef.current) {
                setContainerWidth(viewerRef.current.clientWidth);
            }
        };
        const timer = setTimeout(handleResize, 100);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, []);

    // Intercept security-sensitive events
    useEffect(() => {
        const handleContextMenu = (e) => e.preventDefault();
        const handleShortcuts = (e) => {
            if (e.ctrlKey && (['c', 'u', 's', 'p'].includes(e.key.toLowerCase()) || [67, 85, 83, 80].includes(e.keyCode))) { e.preventDefault(); return false; }
            if ((e.metaKey && e.shiftKey && (['s', '3', '4', '5'].includes(e.key.toLowerCase()))) || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's')) {
                navigator.clipboard.writeText(''); 
                setIsObscured(true);
                setTimeout(() => setIsObscured(false), 4000);
            }
        };
        const handleKeyUp = (e) => { if (e.key === 'PrintScreen') { navigator.clipboard.writeText(''); setIsObscured(true); setTimeout(() => setIsObscured(false), 4000); } };
        const handleVisibilityChange = () => { if (document.hidden || !document.hasFocus()) setIsObscured(true); else setIsObscured(false); };

        window.addEventListener('contextmenu', handleContextMenu); window.addEventListener('keydown', handleShortcuts);
        window.addEventListener('keyup', handleKeyUp); window.addEventListener('blur', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange); window.addEventListener('copy', (e) => e.preventDefault());

        return () => {
            window.removeEventListener('contextmenu', handleContextMenu); window.removeEventListener('keydown', handleShortcuts);
            window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('blur', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
        };
    }, []);

    // --- PREMIUM YOUTUBE PLAYER LOGIC (Dashboard Mirror) ---
    useEffect(() => {
        if (!document.getElementById('yt-api-script')) {
            const s = document.createElement('script');
            s.id = 'yt-api-script';
            s.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(s);
        }
    }, []);

    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

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
        const isYT = url && (url.includes('youtube.com') || url.includes('youtu.be'));
        if (!isYT || type !== 'video') return;

        destroyYtPlayer();
        let attemptsCount = 0;

        const tryInit = () => {
            const container = document.getElementById('yt-player-container');
            if (!container || !window.YT?.Player) {
                if (attemptsCount++ < 30) setTimeout(tryInit, 300);
                return;
            }
            const videoId = getYouTubeVideoId(url);
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
                        setYtReady(true);
                        setYtDuration(e.target.getDuration());
                        setIsLoading(false);
                    },
                    onStateChange: (e) => {
                        const playing = e.data === (window.YT?.PlayerState?.PLAYING || 1);
                        setYtPlaying(playing);
                    },
                },
            });
        };

        const t = setTimeout(tryInit, 400);
        return () => {
            clearTimeout(t);
            destroyYtPlayer();
        };
    }, [url, type, destroyYtPlayer]);

    useEffect(() => {
        if (ytPlaying) {
            ytPollRef.current = setInterval(() => {
                const ct = ytPlayerRef.current?.getCurrentTime?.();
                if (ct !== undefined) setYtCurrentTime(ct);
            }, 1000);
        } else {
            clearInterval(ytPollRef.current);
        }
        return () => clearInterval(ytPollRef.current);
    }, [ytPlaying]);

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

    const ytFullscreen = () => {
        if (playerWrapRef.current?.requestFullscreen) playerWrapRef.current.requestFullscreen();
    };

    const ytFormatTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

    // --- RENDERING CONFIG ---
    const isPdfType = type === 'document' || url.includes('docs.google.com') || url.includes('drive.google.com') || url.toLowerCase().includes('.pdf');
    const getProxyUrl = (sourceUrl) => {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${API_URL}/api/study-materials/proxy-pdf?url=${encodeURIComponent(sourceUrl)}`;
    };

    return (
        <div className="relative w-full h-full bg-[#f8fafc] overflow-y-auto overflow-x-hidden select-none custom-scrollbar" ref={viewerRef}>
            <AnimatePresence>
                {isLoading && (
                    <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-[120] bg-white flex flex-col items-center justify-center">
                        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">Initializing Secure Stream</h3>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isObscured && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center text-white text-center p-6 text-center">
                        <Shield size={64} className="text-red-500 mb-6 animate-pulse" />
                        <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">Content Protected</h2>
                        <p className="text-slate-400 max-w-sm font-medium">Session paused for security.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full h-full flex flex-col items-center py-6 md:py-10 px-4">
                {type === 'video' ? (
                    <div 
                        ref={playerWrapRef}
                        className="w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl relative z-50 aspect-video group 
                                   [&:-webkit-full-screen]:rounded-none [&:-webkit-full-screen]:border-none 
                                   [&:fullscreen]:rounded-none [&:fullscreen]:border-none"
                    >
                        {url.includes('youtube.com') || url.includes('youtu.be') ? (
                            <>
                                <div className="absolute top-1/2 left-0 w-full h-[300%] -translate-y-1/2 pointer-events-none z-0">
                                    <div id="yt-player-container" className="w-full h-full" />
                                </div>
                                <div className="absolute inset-0 z-10 cursor-pointer" onClick={ytTogglePlay} />
                                
                                {!ytPlaying && ytReady && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/20">
                                        <div className="absolute w-32 h-32 rounded-full bg-indigo-500/20 animate-ping"></div>
                                        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                                            <Play size={40} className="text-white fill-white ml-1.5" />
                                        </div>
                                    </div>
                                )}

                                <div className="absolute bottom-0 left-0 right-0 z-30 bg-slate-900/90 backdrop-blur-md p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-4">
                                    <button onClick={ytTogglePlay} className="text-white hover:text-indigo-400 transition-colors">
                                        {ytPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                    </button>
                                    <div className="text-[10px] font-black text-white w-20 text-center uppercase tracking-widest leading-none">
                                        {ytFormatTime(ytCurrentTime)} / {ytFormatTime(ytDuration)}
                                    </div>
                                    <div className="flex-1 flex items-center">
                                        <input
                                            type="range" min="0" max={ytDuration || 100} value={ytCurrentTime} onChange={ytSeek}
                                            style={{ background: `linear-gradient(to right, #6366f1 ${(ytCurrentTime / (ytDuration || 100)) * 100}%, #334155 ${(ytCurrentTime / (ytDuration || 100)) * 100}%)` }}
                                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-white"
                                        />
                                    </div>
                                    <button onClick={ytFullscreen} className="text-white hover:text-indigo-400">
                                        <Maximize2 size={16} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <video src={url} controls controlsList="nodownload" className="w-full h-full object-contain" onLoadedData={() => setIsLoading(false)} />
                        )}
                    </div>
                ) : isPdfType ? (
                    <div className="w-full max-w-4xl relative z-50">
                        <Document
                            file={{ url: getProxyUrl(url), httpHeaders: { Authorization: `Bearer ${localStorage.getItem('studentToken')}` } }}
                            onLoadSuccess={({ numPages }) => { setNumPages(numPages); setIsLoading(false); }}
                            onLoadError={() => { setPdfError(true); setIsLoading(false); }}
                            className="w-full flex flex-col items-center gap-6" loading={null}
                        >
                            {Array.from(new Array(numPages || 0), (el, index) => (
                                <div key={index} className="w-full bg-white shadow-lg md:shadow-2xl rounded-xl overflow-hidden border border-slate-200">
                                    <Page 
                                        pageNumber={index + 1} 
                                        width={containerWidth ? Math.min(containerWidth - (window.innerWidth < 768 ? 20 : 40), 900) : 300}
                                        renderTextLayer={false} renderAnnotationLayer={false} className="w-full"
                                    />
                                </div>
                            ))}
                        </Document>
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl flex flex-col items-center text-center mt-20 border border-slate-50 mx-4"
                        onViewportEnter={() => setIsLoading(false)}
                    >
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-8">
                            <ExternalLink size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 leading-tight">{title}</h2>
                        <p className="text-slate-500 mb-10 max-w-md font-medium">This resource is hosted externally. Click below to access the secure link.</p>
                        
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto bg-indigo-600 hover:bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-100 group"
                        >
                            <span>Access Resource</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                        
                        <div className="mt-12 flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            <Shield size={12} /> Smart Aspirants Secure Gateway
                        </div>
                    </motion.div>
                )}
            </div>

            <style>{`
                * { -webkit-user-select: none !important; user-select: none !important; -webkit-user-drag: none !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }
                @media print { body { display: none !important; } }
            `}</style>
        </div>
    );
};

export default ProtectedViewer;
