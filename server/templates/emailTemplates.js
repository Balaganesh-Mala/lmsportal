// Shared styles and helpers
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const STUDENT_URL = process.env.STUDENT_URL || 'http://localhost:5174';
const TRAINER_URL = process.env.TRAINER_URL || 'http://localhost:5176';
const BRAND_COLOR = '#1e3a8a'; // Professional Navy Blue for Finance
const ACCENT_COLOR = '#f8fafc';

// Helper to get branding
const getBranding = (settings) => ({
    name: settings?.siteTitle || 'Smart Aspirants',
    logo: settings?.logoUrl || '',
    email: settings?.contact?.email || 'info@smartaspirants.com',
    phone: settings?.contact?.phone || '+91-XXXXXXXXXX',
    address: settings?.contact?.address || ''
});

const baseLayout = (content, settings) => {
    const brand = getBranding(settings);
    
    // Modern CSS text header for full dynamic branding and robustness
    const headerContent = `<div style="text-align: center; padding: 30px 20px; background-color: #1e3a8a; border-top-left-radius: 12px; border-top-right-radius: 12px; margin: 0 auto; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">
             ${brand.name}
           </div>`;

    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; }
  .wrapper { width: 100%; table-layout: fixed; background-color: #f1f5f9; padding-bottom: 40px; padding-top: 20px; }
  .main-table { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
  .header { padding: 0; text-align: center; background-color: #ffffff; }
  .content { padding: 45px 35px; }
  .footer { background-color: #0f172a; padding: 30px 20px; text-align: center; font-size: 13px; color: #94a3b8; }
  .footer a { color: #38bdf8; text-decoration: none; }
  .btn { display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 25px 0; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); transition: background-color 0.3s; }
  .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 5px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 6px; }
  .feature-list { background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 25px; margin-top: 30px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); }
  .feature-item { margin-bottom: 12px; font-size: 15px; color: #475569; display: flex; align-items: start; }
  .feature-icon { margin-right: 10px; font-size: 16px; color: #2563eb; }
  @media screen and (max-width: 600px) {
    .content { padding: 25px 20px; }
    .btn { display: block; width: 100%; text-align: center; box-sizing: border-box; }
  }
</style>
</head>
<body>
  <center class="wrapper">
    <table class="main-table" width="100%">
      <!-- Header -->
      <tr>
        <td class="header">
          ${headerContent}
        </td>
      </tr>
      
      <!-- Body -->
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td class="footer">
          <p style="margin: 0 0 12px; font-weight: 600; color: #f8fafc; font-size: 15px;">${brand.name}</p>
          <p style="margin: 0 0 8px;">Email: <a href="mailto:${brand.email}">${brand.email}</a> ${brand.phone ? `| Phone: <span style="color: #cbd5e1;">${brand.phone}</span>` : ''}</p>
          ${brand.address ? `<p style="margin: 0 0 12px; color: #cbd5e1;">${brand.address}</p>` : ''}
          <div style="height: 1px; background-color: #334155; margin: 15px 0;"></div>
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${brand.name}. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
`;
};

const studentRegistrationTemplate = (name, email, password, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 26px; font-weight: 800;">Welcome to ${brandName}!</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear <strong>${name}</strong>,<br><br>
      We are delighted to welcome you to our professional learning community. Your student portal access has been successfully provisioned, granting you entry to our premier finance and accounting resources.
    </p>

    <!-- Credentials -->
    <div class="info-box">
      <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Portal Login Email</p>
      <p style="margin: 0 0 20px; font-size: 18px; color: #0f172a; font-weight: 600;">${email}</p>
      
      <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Temporary Password</p>
      <p style="margin: 0; font-size: 18px; font-family: 'Courier New', Courier, monospace; color: #0f172a; font-weight: 600; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block;">${password}</p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-top: 10px;">
      <a href="${STUDENT_URL}" class="btn">Access Student Portal</a>
    </div>
    
    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: -5px; margin-bottom: 25px;">
      <em>* For security purposes, please update your password upon first login.</em>
    </p>
  `;
  return baseLayout(content, settings);
};

const trainerRegistrationTemplate = (name, email, password, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 26px; font-weight: 800;">Welcome to ${brandName}!</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear <strong>${name}</strong>,<br><br>
      We are thrilled to welcome you to our team as a professional trainer. Your trainer portal access has been successfully provisioned. You can now log in to manage your classes, students, and schedules.
    </p>

    <!-- Credentials -->
    <div class="info-box">
      <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Portal Login Email</p>
      <p style="margin: 0 0 20px; font-size: 18px; color: #0f172a; font-weight: 600;">${email}</p>
      
      <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Temporary Password</p>
      <p style="margin: 0; font-size: 18px; font-family: 'Courier New', Courier, monospace; color: #0f172a; font-weight: 600; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; display: inline-block;">${password}</p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-top: 10px;">
      <a href="${TRAINER_URL}/login" class="btn">Access Trainer Portal</a>
    </div>
    
    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: -5px; margin-bottom: 25px;">
      <em>* For security purposes, please update your password upon first login.</em>
    </p>
  `;
  return baseLayout(content, settings);
};

const resetPasswordTemplate = (name, link, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 800;">Password Reset Request</h1>
    <p style="margin: 0 0 25px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear ${name},<br><br>
      We received a request to reset the password associated with your ${brandName} portal account.
    </p>

    <div style="text-align: center;">
      <a href="${link}" class="btn" style="background-color: #0f172a;">Reset My Password</a>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 25px;">
      This secure link will expire in <strong>30 minutes</strong>.
    </p>
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 30px; border-radius: 4px;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        If you did not request a password reset, please ignore this email or contact support immediately if you have concerns about your account security.
      </p>
    </div>
  `;
  return baseLayout(content, settings);
};

// Course Enrollment Template
const courseEnrolledTemplate = (name, course, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 800;">Enrollment Confirmed</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear ${name},<br><br>
      Congratulations! Your enrollment has been successfully processed for the following professional program:
    </p>
    
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 25px; border-radius: 8px; text-align: center; font-weight: 700; font-size: 20px; margin-bottom: 30px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      ${course}
    </div>

    <p style="margin: 0 0 25px; color: #475569; line-height: 1.6; font-size: 16px;">
      You can now access your comprehensive syllabus, professional resources, and lecture schedules through the student portal.
    </p>

    <div style="text-align: center;">
      <a href="${CLIENT_URL}/my-courses" class="btn">Access the Program</a>
    </div>
  `;
  return baseLayout(content, settings);
};

// Brochure Download Template
const brochureDownloadTemplate = (name, courseName, brochureUrl, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 800;">Your Course Brochure</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear ${name},<br><br>
      Thank you for your interest in our professional programs at ${brandName}. As requested, we have provided the official brochure for the following course:
    </p>
    
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; padding: 25px; border-radius: 8px; text-align: center; font-weight: 700; font-size: 20px; margin-bottom: 30px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      ${courseName}
    </div>

    <p style="margin: 0 0 25px; color: #475569; line-height: 1.6; font-size: 16px;">
      Click the button below to securely download the complete curriculum, fee structure, and syllabus details from the brochure.
    </p>

    <div style="text-align: center; margin-bottom: 25px;">
      ${brochureUrl 
        ? `<a href="${brochureUrl}" class="btn">Download Brochure Now</a>` 
        : `<p style="color: #64748b;">The digital brochure for this course is currently being updated. Please reply to this email to receive it directly from our counselor.</p>`
      }
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 5px;">
      If you have any further questions or would like to speak with an admission counselor, simply reply to this email.
    </p>
  `;
  return baseLayout(content, settings);
};

// Syllabus Download Template
const syllabusDownloadTemplate = (name, courseName, syllabusUrl, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 800;">Your Course Syllabus</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear ${name},<br><br>
      Thank you for reaching out to ${brandName}. We have prepared the detailed syllabus for the following course for you:
    </p>
    
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; padding: 25px; border-radius: 8px; text-align: center; font-weight: 700; font-size: 20px; margin-bottom: 30px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      ${courseName}
    </div>

    <p style="margin: 0 0 25px; color: #475569; line-height: 1.6; font-size: 16px;">
      Click the button below to securely download the comprehensive course syllabus document.
    </p>

    <div style="text-align: center; margin-bottom: 25px;">
      ${syllabusUrl 
        ? `<a href="${syllabusUrl}" class="btn">Download Syllabus Now</a>` 
        : `<p style="color: #64748b;">The detailed syllabus for this course is currently being updated. Please reply to this email for the latest version.</p>`
      }
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 5px;">
      If you have any further questions regarding the modules or schedule, please reply to this email.
    </p>
  `;
  return baseLayout(content, settings);
};

// Fee & Curriculum Template
const feeAndCurriculumTemplate = (name, courseName, courseFee, curriculumUrl, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 800;">Course Information</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear ${name},<br><br>
      Thank you for requesting information from ${brandName}. Here are the fee and curriculum details you requested for the following program:
    </p>
    
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; color: #1e3a8a; padding: 25px; border-radius: 8px; text-align: center; font-weight: 700; font-size: 20px; margin-bottom: 5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      ${courseName}
    </div>
    
    <div style="background: white; border: 1px solid #bfdbfe; border-top: 0; color: #475569; padding: 15px 25px; border-radius: 0 0 8px 8px; text-align: center; font-size: 16px; margin-bottom: 30px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); grid-template-columns: 1fr; display: grid; gap: 10px;">
       <div>Total Fee: <strong style="color: #0f172a; font-size: 18px;">${courseFee || 'Contact for details'}</strong></div>
    </div>

    <p style="margin: 0 0 25px; color: #475569; line-height: 1.6; font-size: 16px;">
      Click the button below to download the official curriculum syllabus to explore all the subjects and modules covered in this program.
    </p>

    <div style="text-align: center; margin-bottom: 25px;">
      ${curriculumUrl 
        ? `<a href="${curriculumUrl}" class="btn">Download Curriculum</a>` 
        : `<p style="color: #64748b;">The curriculum document for this course is currently being updated. Our team will send it to you shortly.</p>`
      }
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 5px;">
      If you would like to proceed with enrollment, simply reply to this email or visit our website.
    </p>
  `;
  return baseLayout(content, settings);
};
// Interview Schedule Template
const interviewScheduleTemplate = (name, details, settings = {}) => {
  const brandName = settings?.siteTitle || 'Smart Aspirants';
  const { date, time, platform, link, passcode, instructions, requiredDocs } = details;
  
  const content = `
    <h1 style="margin: 0 0 20px; color: #0f172a; font-size: 24px; font-weight: 800;">Interview Scheduled</h1>
    <p style="margin: 0 0 20px; color: #475569; line-height: 1.6; font-size: 16px;">
      Dear ${name},<br><br>
      Your upcoming mock interview with ${brandName} has been successfully scheduled. Please review the following appointment details:
    </p>
    
    <div class="info-box" style="margin-bottom: 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px; color: #334155;">
        <tr>
          <td style="padding-bottom: 10px; font-weight: 700; width: 100px;">Date:</td>
          <td style="padding-bottom: 10px;">${date}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; font-weight: 700;">Time:</td>
          <td style="padding-bottom: 10px;">${time}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 10px; font-weight: 700;">Platform:</td>
          <td style="padding-bottom: 10px;">${platform}</td>
        </tr>
        ${passcode ? `
        <tr>
          <td style="padding-bottom: 10px; font-weight: 700;">Passcode:</td>
          <td style="padding-bottom: 10px;"><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${passcode}</code></td>
        </tr>` : ''}
      </table>
    </div>

    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${link}" class="btn">Join Interview Meeting</a>
    </div>

    ${instructions ? `
    <div style="margin-top: 30px;">
      <h4 style="margin: 0 0 10px; color: #0f172a; font-size: 16px;">Important Instructions:</h4>
      <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${instructions}</p>
    </div>` : ''}

    ${requiredDocs && requiredDocs.length > 0 ? `
    <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <h4 style="margin: 0 0 10px; color: #0f172a; font-size: 16px;">Please keep these ready:</h4>
      <p style="margin: 0; color: #475569; font-size: 14px;">${requiredDocs.join(', ')}</p>
    </div>` : ''}

    <p style="margin-top: 35px; color: #64748b; font-size: 14px; font-style: italic; text-align: center;">
      Please ensure you join at least 5 minutes before the scheduled time for a technical check.
    </p>
  `;
  return baseLayout(content, settings);
};

module.exports = {
  studentRegistrationTemplate,
  trainerRegistrationTemplate,
  resetPasswordTemplate,
  courseEnrolledTemplate,
  brochureDownloadTemplate,
  syllabusDownloadTemplate,
  feeAndCurriculumTemplate,
  interviewScheduleTemplate
};
