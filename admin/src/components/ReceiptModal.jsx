import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    X, 
    Printer, 
    IndianRupee, 
    Building2, 
    MapPin, 
    Phone, 
    Mail, 
    Download, 
    CheckCircle2, 
    ShieldCheck, 
    Loader,
    Globe
} from 'lucide-react';
import logoImg from '../assets/logo.jpeg';
import sigImg from '../assets/sig.jpeg';

export default function ReceiptModal({ isOpen, onClose, installment }) {
    const [settings, setSettings] = useState(null);
    const [payment, setPayment] = useState(null);
    const [feeSummary, setFeeSummary] = useState({ total: 0, pending: 0, previousPaid: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

                const [settingsRes, paymentRes, installmentsRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/settings`),
                    installment?.status === 'Paid'
                        ? axios.get(`${apiUrl}/api/finance/installments/${installment._id}/payment`).catch(() => ({ data: null }))
                        : Promise.resolve({ data: null }),
                    axios.get(`${apiUrl}/api/finance/installments?student_id=${installment.student_id._id || installment.student_id}`)
                ]);

                const allInst = installmentsRes.data;
                const totalPaidAtTime = allInst
                    .filter(i => (i.status === 'Paid' || i._id === installment._id) && i.installment_no <= installment.installment_no)
                    .reduce((sum, i) => sum + i.amount, 0);
                const totalFee = allInst.reduce((sum, i) => sum + i.amount, 0);
                const previousPaid = totalPaidAtTime - installment.amount;

                setFeeSummary({ total: totalFee, pending: totalFee - totalPaidAtTime, previousPaid });

                setSettings(settingsRes.data);
                if (paymentRes.data) setPayment(paymentRes.data);
            } catch (error) {
                console.error("Failed to fetch receipt data", error);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && installment) {
            fetchData();
        }
    }, [isOpen, installment]);

    if (!isOpen || !installment) return null;

    const handlePrint = () => {
        const originalTitle = document.title;
        const receiptId = installment._id.substring(18).toUpperCase();
        document.title = `Receipt_#REC-${receiptId}`;
        window.print();
        document.title = originalTitle;
    };

    const student = installment.student_id;
    const { amount, paid_date, installment_no } = installment;

    const displayDate = payment?.paid_at || paid_date || new Date();
    const formattedDate = new Date(displayDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white overflow-hidden">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[96vh] print:shadow-none print:max-h-none print:w-full print:rounded-none">

                {/* Navbar Header - Hidden in print */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white print:hidden shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Official Receipt Viewer</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100">
                        <X size={20} />
                    </button>
                </div>

                {/* Receipt Content */}
                <div className="overflow-y-auto flex-1 bg-slate-50/30 print:bg-white p-0 md:p-8" id="receipt-content">
                    {loading ? (
                         <div className="flex flex-col items-center justify-center py-48 bg-white rounded-xl">
                             <Loader className="w-10 h-10 animate-spin text-slate-200" />
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6">Generating secure copy...</p>
                         </div>
                    ) : (
                        <div className="bg-white mx-auto shadow-sm print:shadow-none border border-slate-100 print:border-none relative">
                            
                            {/* Watermark Section */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.015] select-none print:opacity-[0.02] z-0 overflow-hidden">
                                <h1 className="text-[3.2rem] md:text-[3.5rem] font-black -rotate-12 uppercase tracking-[0.2em] text-center whitespace-nowrap">
                                    SMART ASPIRANTS
                                </h1>
                            </div>

                            {/* Modern "Fitted" Header - Light gray with subtle branding */}
                            <div className="bg-gray-50 px-8 py-6 md:px-12 md:py-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 relative border-t-4 border-gray-900">
                                <div className="flex items-center gap-5 relative z-10 text-center md:text-left">
                                    <div className="p-1 bg-white rounded-lg shadow-sm border border-gray-200">
                                        <img src={settings?.logoUrl || logoImg} alt="Logo" className="h-12 w-auto object-contain" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold tracking-tight uppercase text-gray-900">
                                            Smart Aspirants
                                        </h1>
                                        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">Academic Excellence • Career Success</p>
                                    </div>
                                </div>

                                <div className="text-center md:text-right relative z-10">
                                    <h2 className="text-4xl font-black text-gray-200/60 absolute -top-4 -right-2 uppercase leading-none select-none -z-10">RECEIPT</h2>
                                    <p className="font-mono text-sm font-semibold text-gray-600 tracking-tight">
                                        #{installment._id.substring(18).toUpperCase()}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Date: {formattedDate}</p>
                                </div>
                            </div>

                            {/* Main Body - Table Format for Info */}
                            <div className="px-8 py-6 md:px-12 md:py-8 relative z-10">
                                
                                {/* Unified Info Table */}
                                {/* Unified Info Sections */}
                                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
                                    <div className="py-6 align-top pr-0 md:pr-8 border-b md:border-b-0 md:border-r border-gray-100">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Bill To:</span>
                                        <h3 className="text-xl font-bold text-gray-900 uppercase mb-1">{student?.name}</h3>
                                        <p className="text-xs font-semibold text-gray-500 lowercase">{student?.email}</p>
                                    </div>
                                    <div className="py-6 align-top pl-0 md:pl-8">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-3">Payment Details:</span>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-gray-400 font-semibold uppercase tracking-wide">Method:</span>
                                                <span className="font-bold text-gray-800 uppercase">{payment?.payment_mode || 'Online'}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px]">
                                                <span className="text-gray-400 font-semibold uppercase tracking-wide">Status:</span>
                                                <span className="text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <CheckCircle2 size={10} /> Paid
                                                </span>
                                            </div>
                                            {payment?.reference_id && (
                                                <div className="flex justify-between text-[11px] pt-1 border-t border-gray-100">
                                                    <span className="text-gray-400 font-semibold uppercase tracking-wide">Ref ID:</span>
                                                    <span className="font-mono text-[9px] text-gray-500 truncate max-w-[120px]">{payment.reference_id}</span>
                                                </div>
                                            )}

                                            {/* Fee Summary Stats */}
                                            <div className="flex justify-between text-[11px] pt-3 border-t-2 border-slate-100">
                                                <span className="text-slate-400 font-bold uppercase tracking-wide">Total Course Fee:</span>
                                                <span className="font-bold text-slate-800">₹{feeSummary.total.toLocaleString('en-IN')}</span>
                                            </div>
                                            {feeSummary.previousPaid > 0 && (
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wide">Amount Previously Paid:</span>
                                                    <span className="font-bold text-slate-600">₹{feeSummary.previousPaid.toLocaleString('en-IN')}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-[11px] pb-1 border-b border-slate-100">
                                                <span className="text-slate-400 font-bold uppercase tracking-wide">This Installment:</span>
                                                <span className="font-bold text-indigo-600">₹{installment.amount.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between text-[11px] pt-1">
                                                <span className="text-slate-400 font-bold uppercase tracking-wide">Remaining Balance:</span>
                                                <span className="font-bold text-rose-500">₹{feeSummary.pending.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table - Simplified & Professional */}
                                <div className="mb-6 overflow-x-auto">
                                    <table className="w-full min-w-[500px]">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em] border-y border-gray-100">
                                                <th className="px-6 py-4 font-bold text-left">Particulars of Settlement</th>
                                                <th className="px-6 py-4 text-right font-bold">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            <tr>
                                                <td className="px-6 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-xs font-bold text-gray-300">#{installment_no}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 uppercase">Training Fee Installment</p>
                                                            <p className="text-[9px] text-indigo-600 mt-1 font-bold uppercase tracking-wider">{student?.courseName || 'Career Training Program'}</p>
                                                            <p className="text-[9px] text-gray-400 mt-0.5 font-medium italic">Standard payment towards selected career coaching program.</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-8 text-right">
                                                    <div className="text-lg font-bold text-gray-900">
                                                        <span className="text-gray-300 mr-1 text-sm font-normal">₹</span>
                                                        {amount.toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t-2 border-gray-900">
                                                <td className="px-6 py-5 text-[10px] font-bold text-gray-900 uppercase tracking-widest text-right">Total Amount Collected</td>
                                                <td className="px-6 py-5 text-right bg-gray-50">
                                                    <div className="text-xl font-bold text-gray-900 tracking-tight">
                                                        <span className="text-gray-400 mr-1 text-sm font-normal">₹</span>
                                                        {amount.toLocaleString('en-IN')}
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                {/* Simplified Footer Block */}
                                <div className="flex flex-col md:flex-row items-start justify-between gap-12 pt-6 border-t border-gray-100">
                                    <div className="max-w-xs">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
                                            * Fees are non-refundable.<br />
                                            * Official digital record of Smart Aspirants.<br />
                                            * Verify at smartaspirants.com
                                        </p>
                                    </div>

                                    <div className="text-center min-w-[180px]">
                                        <div className="h-16 flex items-center justify-center relative mb-2">
                                            {sigImg && (
                                                <img 
                                                    src={sigImg} 
                                                    alt="Signature" 
                                                    className="max-h-12 w-auto object-contain mix-blend-multiply opacity-80" 
                                                />
                                            )}
                                        </div>
                                        <div className="h-px bg-gray-200 w-full mb-2"></div>
                                        <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest leading-none">Authorized Official</p>
                                        <p className="text-[8px] font-semibold text-gray-400 uppercase tracking-tight mt-1">Seal & Signature</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls - Hidden in print */}
                <div className="px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white border-t border-slate-100 print:hidden shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <span>←</span> Back to Payments
                    </button>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest"
                        >
                            <Printer size={14} /> Print Receipt
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 text-[10px] font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all uppercase tracking-widest"
                        >
                            <Download size={14} /> Download PDF
                        </button>
                    </div>
                </div>

            </div>

            {/* Global Print Isolation Styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    /* Robust Visibility Isolation Strategy */
                    html, body { 
                        visibility: hidden !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                        height: auto !important;
                        background: white !important;
                    }

                    #receipt-content {
                        visibility: visible !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                        display: block !important;
                        height: auto !important;
                        background: white !important;
                        z-index: 99999 !important;
                        overflow: visible !important;
                    }

                    /* Ensure all descendants are visible */
                    #receipt-content * {
                        visibility: visible !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    /* Helper to hide UI elements that might still linger */
                    aside, header, navbar, .print\\:hidden, button, .shrink-0 { 
                        display: none !important; 
                    }

                    /* Force Background Styles */
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
                    .bg-white { background-color: white !important; }
                    .border-slate-900 { border-color: #0f172a !important; }
                    .border-slate-100 { border-color: #f1f5f9 !important; }
                    
                    /* Text Colors */
                    .text-slate-900 { color: #0f172a !important; }
                    .text-slate-400 { color: #94a3b8 !important; }
                    .text-slate-200 { color: #e2e8f0 !important; }
                    .text-slate-500 { color: #64748b !important; }
                                        /* Watermark */
                    .opacity-\\[0\\.015\\], .opacity-\\[0\\.02\\] { 
                        opacity: 0.03 !important; 
                    }

                    /* Page Break Control */
                    #receipt-content > div {
                        page-break-inside: avoid !important;
                        height: 297mm !important; /* Force A4 height */
                        overflow: hidden !important;
                    }
                }
            `}} />
        </div>
    );
}
