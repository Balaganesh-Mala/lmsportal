import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a professional Receipt PDF as a Base64 string.
 * @param {Object} data - The data needed for the receipt
 * @param {Object} data.installment - The installment object
 * @param {Object} data.payment - The payment details
 * @param {Object} data.settings - Site settings for branding
 * @param {Object} data.feeSummary - Summary values (total, pending, previousPaid)
 * @returns {Promise<string>} - Base64 string of the PDF
 */
export const generateReceiptPdfBase64 = async ({ installment, payment, settings, feeSummary }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const student = installment.student_id;
            const receiptId = `REC-${installment._id.toString().slice(-6).toUpperCase()}`;
            const displayDate = payment?.paid_at || installment.paid_date || new Date();
            const formattedDate = new Date(displayDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Colors
            const primaryColor = [37, 99, 235]; // blue-600
            const secondaryColor = [16, 185, 129]; // emerald-500
            const darkColor = [15, 23, 42]; // slate-900
            const lightColor = [148, 163, 184]; // slate-400

            // -- Header Branding --
            // Border Top
            doc.setDrawColor(...darkColor);
            doc.setLineWidth(1.5);
            doc.line(15, 15, 195, 15);

            // Watermark (RECEIPT)
            doc.setTextColor(241, 245, 249);
            doc.setFontSize(80);
            doc.setFont('helvetica', 'bold');
            doc.text('RECEIPT', 105, 80, { align: 'center', angle: -30 });

            // Logo Placeholder / Site Title
            doc.setTextColor(...darkColor);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(settings?.siteTitle || 'SMART ASPIRANTS', 15, 30);
            
            doc.setTextColor(...lightColor);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('ACADEMIC EXCELLENCE • CAREER SUCCESS', 15, 35);

            // Receipt Info (Right Side)
            doc.setTextColor(...darkColor);
            doc.setFontSize(10);
            doc.text(`RECEIPT #: ${receiptId}`, 195, 30, { align: 'right' });
            doc.setFontSize(8);
            doc.setTextColor(...lightColor);
            doc.text(`DATE: ${formattedDate}`, 195, 35, { align: 'right' });

            // Space
            let currY = 55;

            // -- Information Grid --
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.5);
            doc.line(15, currY, 195, currY);
            currY += 10;

            // Bill To
            doc.setTextColor(...lightColor);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('BILL TO:', 15, currY);
            
            currY += 5;
            doc.setTextColor(...darkColor);
            doc.setFontSize(14);
            doc.text(student?.name?.toUpperCase() || 'STUDENT NAME', 15, currY);

            currY += 5;
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(student?.email?.toLowerCase() || '', 15, currY);

            // Payment Details (Right Side)
            let detailY = 65;
            doc.setTextColor(...lightColor);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('PAYMENT DETAILS:', 130, detailY);

            detailY += 5;
            doc.setTextColor(...darkColor);
            doc.setFontSize(9);
            doc.text(`METHOD: ${payment?.payment_mode || 'ONLINE'}`, 195, detailY, { align: 'right' });
            
            detailY += 5;
            doc.setTextColor(...secondaryColor);
            doc.text('STATUS: VERIFIED', 195, detailY, { align: 'right' });

            if (payment?.reference_id) {
                detailY += 5;
                doc.setTextColor(100, 116, 139);
                doc.setFontSize(8);
                doc.text(`REF ID: ${payment.reference_id}`, 195, detailY, { align: 'right' });
            }

            currY = 90;

            // -- Particulars Table --
            doc.autoTable({
                startY: currY,
                head: [['PARTICULARS OF SETTLEMENT', 'AMOUNT (INR)']],
                body: [
                    [
                        { 
                            content: `TRAINING FEE INSTALLMENT #${installment.installment_no}\nProgram: ${student?.courseName || 'Career Training Program'}\nStatus: Professional Academic Record`, 
                            styles: { cellPadding: 8 } 
                        },
                        { 
                            content: `INR ${installment.amount.toLocaleString('en-IN')}`, 
                            styles: { halign: 'right', valign: 'middle', fontStyle: 'bold', fontSize: 12 } 
                        }
                    ]
                ],
                styles: {
                    font: 'helvetica',
                    fontSize: 10,
                    cellPadding: 5,
                },
                headStyles: {
                    fillColor: [248, 250, 252],
                    textColor: [100, 116, 139],
                    fontSize: 8,
                    fontStyle: 'bold',
                    lineWidth: 0.1,
                    lineColor: [241, 245, 249]
                },
                columnStyles: {
                    1: { cellWidth: 50 }
                },
                theme: 'grid'
            });

            currY = doc.lastAutoTable.finalY + 0;

            // -- Total Row --
            doc.setFillColor(...primaryColor);
            doc.rect(145, currY, 50, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`INR ${installment.amount.toLocaleString('en-IN')}`, 190, currY + 10, { align: 'right' });
            
            doc.setTextColor(...darkColor);
            doc.setFontSize(8);
            doc.text('TOTAL AMOUNT COLLECTED', 140, currY + 9, { align: 'right' });

            currY += 30;

            // -- Footer Summary & Signature --
            if (feeSummary) {
                doc.setFontSize(8);
                doc.setTextColor(...lightColor);
                doc.text(`TOTAL COURSE FEE: INR ${feeSummary.total.toLocaleString('en-IN')}`, 15, currY);
                
                let yOffset = 5;
                if (feeSummary.previousPaid > 0) {
                    doc.text(`PREVIOUSLY PAID: INR ${feeSummary.previousPaid.toLocaleString('en-IN')}`, 15, currY + yOffset);
                    yOffset += 5;
                }
                
                doc.text(`THIS INSTALLMENT: INR ${installment.amount.toLocaleString('en-IN')}`, 15, currY + yOffset);
                yOffset += 5;
                
                doc.setTextColor(...primaryColor);
                doc.setFont('helvetica', 'bold');
                doc.text(`REMAINING BALANCE: INR ${feeSummary.pending.toLocaleString('en-IN')}`, 15, currY + yOffset);
            }

            // Signature Line
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(140, currY + 15, 195, currY + 15);
            
            doc.setTextColor(...darkColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('AUTHORIZED SIGNATORY', 167.5, currY + 20, { align: 'center' });
            
            doc.setTextColor(...lightColor);
            doc.setFontSize(7);
            doc.text(`FOR ${settings?.siteTitle?.toUpperCase() || 'SMART ASPIRANTS'}`, 167.5, currY + 24, { align: 'center' });

            // Final Footer Line
            doc.setFillColor(...primaryColor);
            doc.rect(15, 280, 180, 1, 'F');
            
            doc.setTextColor(...lightColor);
            doc.setFontSize(7);
            doc.text('THIS IS A COMPUTER GENERATED OFFICIAL RECORD. VERIFY AT SMARTASPIRANTS.COM', 105, 285, { align: 'center' });

            // Convert to Base64
            const base64String = doc.output('datauristring');
            resolve(base64String);

        } catch (error) {
            console.error('PDF Generation Error:', error);
            reject(error);
        }
    });
};
