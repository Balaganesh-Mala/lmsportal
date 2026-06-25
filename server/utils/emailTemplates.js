// Helper to get branding
const getBranding = (settings) => ({
    name: settings?.siteTitle || 'Smart Aspirants',
    logo: settings?.logoUrl || '',
    email: settings?.contact?.email || 'info@smartaspirants.com',
    phone: settings?.contact?.phone || '+91-XXXXXXXXXX',
    address: settings?.contact?.address || ''
});

const generateFeeReminderTemplate = (studentName, amount, dueDate, installmentNo, settings = {}) => {
    const brand = getBranding(settings);
    const formattedAmount = amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const formattedDate = new Date(dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Fee Reminder</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #374151; line-height: 1.6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background-color: #4f46e5; padding: 30px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold; border-top-left-radius: 12px; border-top-right-radius: 12px; }
            .content { padding: 40px; }
            .content p { font-size: 16px; margin-bottom: 20px; }
            .highlight-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center; }
            .highlight-box h2 { margin: 0; font-size: 32px; color: #1e40af; }
            .highlight-box p { margin: 5px 0 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .details-table th, .details-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #f1f5f9; }
            .details-table th { color: #64748b; font-weight: 600; width: 40%; font-size: 14px; }
            .details-table td { font-weight: 500; font-size: 15px; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; text-align: center; font-size: 13px; color: #94a3b8; }
            .footer p { margin: 5px 0; }
            .action-button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${brand.name}
            </div>
            
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                <p>This is a friendly reminder that your upcoming fee installment for <strong>${brand.name}</strong> is due soon. Please ensure payment is made by the due date to avoid any late fees.</p>
                
                <div class="highlight-box">
                    <h2>${formattedAmount}</h2>
                    <p>Amount Due</p>
                </div>
                
                <table class="details-table">
                    <tr>
                        <th>Installment Info</th>
                        <td>Installment #${installmentNo}</td>
                    </tr>
                    <tr>
                        <th>Due Date</th>
                        <td style="color: #e11d48; font-weight: 600;">${formattedDate}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td><span style="background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">PENDING</span></td>
                    </tr>
                </table>
                
                <p>If you have already made the payment, please ignore this email or contact our administration regarding the update.</p>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://smartaspirants.com" class="action-button">Return to Portal</a>
                </p>
            </div>
            
            <div class="footer">
                <p style="color: #64748b; font-weight: 700; margin-bottom: 8px;">${brand.name}</p>
                ${brand.address ? `<p>${brand.address}</p>` : ''}
                <p>${brand.email} | ${brand.phone}</p>
                <p style="margin-top: 15px; font-size: 11px;">This is an automated email. Please do not reply directly to this message.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const generatePaymentConfirmationTemplate = (studentName, amount, installmentNo, settings = {}) => {
    const brand = getBranding(settings);
    const formattedAmount = amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; color: #374151; line-height: 1.6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
            .header { background-color: #10b981; padding: 30px; text-align: center; color: #ffffff; font-size: 24px; font-weight: bold; border-top-left-radius: 12px; border-top-right-radius: 12px; }
            .content { padding: 40px; }
            .highlight-box { background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center; }
            .highlight-box h2 { margin: 0; font-size: 32px; color: #166534; }
            .highlight-box p { margin: 5px 0 0; color: #15803d; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }
            .footer { background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 25px 40px; text-align: center; font-size: 13px; color: #94a3b8; }
            .action-button { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                Payment Received
            </div>
            <div class="content">
                <p>Dear <strong>${studentName}</strong>,</p>
                <p>We have successfully received your payment for <strong>Installment #${installmentNo}</strong>. Thank you for your continued commitment to your studies at Smart Aspirants.</p>
                
                <div class="highlight-box">
                    <h2>${formattedAmount}</h2>
                    <p>Payment Received on ${today}</p>
                </div>
                
                <p>You can find your official receipt at <a href="https://learning.smartaspirants.com" style="color: #2563eb; font-weight: 600; text-decoration: none;">learning.smartaspirants.com</a> under the <strong>Payments</strong> tab.</p>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://learning.smartaspirants.com/payments" class="action-button">View Receipt in Portal</a>
                </p>
            </div>
            <div class="footer">
                <p style="color: #64748b; font-weight: 700;">${brand.name}</p>
                <p>${brand.email} | ${brand.phone}</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = {
    generateFeeReminderTemplate,
    generatePaymentConfirmationTemplate
};
