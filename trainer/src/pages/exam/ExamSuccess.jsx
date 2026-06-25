import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Send, ShieldCheck } from 'lucide-react';

import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

const ExamSuccess = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const hasSubmittedRef = React.useRef(false);
    const [countdown, setCountdown] = React.useState(5);

    React.useEffect(() => {
        const finalizeSubmission = async () => {
            if (hasSubmittedRef.current) return;
            hasSubmittedRef.current = true; // Prevent double firing

            try {
                const token = localStorage.getItem('trainerToken');
                const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                await axios.post(`${API_URL}/api/trainer/exam/submit`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Exam formally submitted.");

                toast.success('Exam Submitted Successfully!', {
                    icon: '👏',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                });

            } catch (error) {
                console.error("Final submission failed", error);
            }
        };

        finalizeSubmission();

        // Countdown to logout/redirect
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    logout();
                    navigate('/login');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [logout, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">

                {/* Success Animation Card */}
                <Card className="bg-white shadow-xl overflow-hidden border-t-4 border-green-500 mb-8">
                    <CardContent className="pt-10 pb-8 px-8 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6 animate-in zoom-in duration-500">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>

                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Submitted!</h1>
                        <p className="text-lg text-gray-600 mb-8">
                            Thank you for completing the assessment. Your responses have been securely recorded.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-6 text-left border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">What Happens Next?</h3>

                            <div className="space-y-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-green-500 bg-white">
                                            <span className="text-xs font-bold text-green-600">✓</span>
                                        </div>
                                    </div>
                                    <div className="ml-4 pb-1">
                                        <p className="text-sm font-medium text-gray-900">Submission Received</p>
                                        <p className="text-xs text-gray-500">Your answers are with our hiring team.</p>
                                    </div>
                                </div>

                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-500 bg-indigo-50">
                                            <Clock className="h-4 w-4 text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">Review Process</p>
                                        <p className="text-xs text-gray-500">Our experts will review your code & video (24-48 hrs).</p>
                                    </div>
                                </div>

                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                                            <Send className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-900">Final Decision</p>
                                        <p className="text-xs text-gray-500">You will receive an email update regarding your application status.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

                <div className="text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Secure Submission via Smart Aspirants Portal
                    </div>
                    <p className="text-gray-500 mt-2">
                        Redirecting to login in {countdown} seconds...
                    </p>
                    <Button variant="link" onClick={() => { logout(); navigate('/login'); }} className="text-indigo-600 h-auto p-0">
                        Return to Login Now
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default ExamSuccess;
