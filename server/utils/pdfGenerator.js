const PDFDocument = require("pdfkit");

exports.generateInterviewPDF = (data, res) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 45,
        bufferPages: true,
      });

      /* ---------------- RESPONSE HEADERS ---------------- */
      const fileName = `Interview_Report_${(data.studentName || "Student")
        .replace(/\s+/g, "_")
        .trim()}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      doc.pipe(res);

      /* ---------------- COLORS ---------------- */
      const primary = "#4f46e5";
      const dark = "#0f172a";
      const text = "#334155";
      const gray = "#64748b";
      const light = "#f8fafc";
      const border = "#e2e8f0";
      const green = "#16a34a";
      const red = "#dc2626";

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 90;

      /* ---------------- HELPERS ---------------- */

      const checkPageBreak = (spaceNeeded = 80) => {
        if (doc.y + spaceNeeded > doc.page.height - 60) {
          doc.addPage();
        }
      };

      const sectionTitle = (title) => {
        checkPageBreak(60);

        doc
          .fillColor(dark)
          .font("Helvetica-Bold")
          .fontSize(13)
          .text(title, 45, doc.y);

        doc.moveDown(0.6);
      };

      const label = (txt, x, y) => {
        doc
          .fillColor(gray)
          .font("Helvetica-Bold")
          .fontSize(7)
          .text(txt, x, y);
      };

      const value = (txt, x, y, width = 150) => {
        doc
          .fillColor(text)
          .font("Helvetica")
          .fontSize(10)
          .text(txt || "N/A", x, y, { width });
      };

      const footer = () => {
        doc
          .fillColor(gray)
          .font("Helvetica")
          .fontSize(7)
          .text(
            "This is a computer-generated report based on your mock interview performance evaluated by Smart Aspirants.",
            45,
            doc.page.height - 28,
            {
              width: contentWidth,
              align: "center",
            }
          );
      };

      /* ---------------- HEADER ---------------- */

      doc
        .fillColor(primary)
        .font("Helvetica-Bold")
        .fontSize(22)
        .text("SMART ASPIRANTS", 45, 45);

      doc
        .fillColor(gray)
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Official Mock Interview Performance Report | ${new Date().toLocaleDateString(
            "en-GB"
          )}`,
          45,
          72
        );

      doc.moveDown(2.3);

      /* ---------------- INFO GRID ---------------- */

      const drawInfoGrid = () => {
        const startY = doc.y;

        // Row 1
        label("CANDIDATE NAME", 45, startY);
        label("INTERVIEW TYPE", 255, startY);

        value(data.studentName, 45, startY + 12, 180);
        value(data.interviewType, 255, startY + 12, 280);

        // Row 2
        const row2 = startY + 38;

        label("TRAINER NAME", 45, row2);
        label("ATTEMPT DATE", 255, row2);
        label("DURATION", 420, row2);

        value(data.trainerName || "Trainer", 45, row2 + 12, 180);
        value(data.interviewDate || "N/A", 255, row2 + 12, 130);
        value(data.duration || "15 Mins", 420, row2 + 12, 100);

        doc.y = row2 + 38;
      };

      /* ---------------- SCORE CARD ---------------- */

      const drawScoreCard = () => {
        sectionTitle("OVERALL PERFORMANCE");

        const boxY = doc.y;

        const verdict =
          data.overallRemark || "No overall remark provided.";

        const verdictHeight = doc.heightOfString(verdict, {
          width: 320,
          lineGap: 2,
        });

        const boxHeight = Math.max(78, verdictHeight + 34);

        // Outer box
        doc
          .rect(45, boxY, contentWidth, boxHeight)
          .fillAndStroke("#ffffff", border);

        // Left score box
        doc
          .rect(45, boxY, 145, boxHeight)
          .fill("#f8fafc");

        // Score
        doc
          .fillColor(primary)
          .font("Helvetica-Bold")
          .fontSize(42)
          .text(`${data.overallScore || 0}`, 58, boxY + 22, {
            continued: true,
          })
          .fillColor("#94a3b8")
          .font("Helvetica")
          .fontSize(16)
          .text("/10");

        // Verdict title
        doc
          .fillColor(gray)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("VERDICT", 210, boxY + 12);

        // Verdict text
        doc
          .fillColor(text)
          .font("Helvetica-Bold")
          .fontSize(11)
          .text(verdict, 210, boxY + 28, {
            width: 320,
            lineGap: 3,
          });

        doc.y = boxY + boxHeight + 22;
      };

      /* ---------------- FEEDBACK ---------------- */

      const drawFeedback = () => {
        sectionTitle("CRITICAL FEEDBACK");

        const startY = doc.y;

        const leftText = data.strengths || "N/A";
        const rightText = data.weaknesses || "N/A";

        const leftHeight = doc.heightOfString(leftText, {
          width: 215,
        });

        const rightHeight = doc.heightOfString(rightText, {
          width: 215,
        });

        const cardHeight = Math.max(leftHeight, rightHeight) + 35;

        // Left card
        doc
          .roundedRect(45, startY, 240, cardHeight, 6)
          .fillAndStroke("#f0fdf4", border);

        doc
          .fillColor(green)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("CORE STRENGTHS", 58, startY + 12);

        doc
          .fillColor(text)
          .font("Helvetica")
          .fontSize(10)
          .text(leftText, 58, startY + 26, {
            width: 214,
          });

        // Right card
        doc
          .roundedRect(300, startY, 240, cardHeight, 6)
          .fillAndStroke("#fef2f2", border);

        doc
          .fillColor(red)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("IMPROVEMENT AREAS", 313, startY + 12);

        doc
          .fillColor(text)
          .font("Helvetica")
          .fontSize(10)
          .text(rightText, 313, startY + 26, {
            width: 214,
          });

        doc.y = startY + cardHeight + 20;
      };

      /* ---------------- TOPIC TABLE ---------------- */

      const drawTopicTable = () => {
        sectionTitle("SUBJECT PROFICIENCY BREAKDOWN");

        const topics =
          data.topicScores?.length
            ? data.topicScores
            : data.topics || [];

        if (!topics.length) {
          doc
            .fillColor(text)
            .fontSize(10)
            .text("No topic data available.");
          doc.moveDown(1);
          return;
        }

        let y = doc.y;

        const drawHeader = () => {
          doc
            .rect(45, y, contentWidth, 24)
            .fillAndStroke("#eef2ff", border);

          doc
            .fillColor(dark)
            .font("Helvetica-Bold")
            .fontSize(8)
            .text("TOPIC", 55, y + 8)
            .text("SCORE", 240, y + 8)
            .text("REMARK / SUGGESTION", 305, y + 8);

          y += 24;
        };

        drawHeader();

        topics.forEach((item) => {
          const remark = item.remark || "-";

          const remarkHeight = doc.heightOfString(remark, {
            width: 220,
          });

          const topicHeight = doc.heightOfString(
            item.topic || "N/A",
            {
              width: 160,
            }
          );

          const rowHeight = Math.max(
            32,
            remarkHeight + 10,
            topicHeight + 10
          );

          if (y + rowHeight > doc.page.height - 55) {
            doc.addPage();
            y = 45;
            drawHeader();
          }

          doc.rect(45, y, contentWidth, rowHeight).stroke(border);

          doc
            .fillColor(text)
            .font("Helvetica")
            .fontSize(10)
            .text(item.topic || "N/A", 55, y + 8, {
              width: 160,
            });

          doc.text(`${item.score || 0}/10`, 240, y + 8);

          doc
            .fillColor(gray)
            .fontSize(9)
            .text(remark, 305, y + 8, {
              width: 220,
            });

          y += rowHeight;
        });

        doc.y = y + 18;
      };

      /* ---------------- ROADMAP ---------------- */

      const drawRoadmap = () => {
        if (!data.improvementPlanText) return;

        checkPageBreak(140);

        sectionTitle("IMPROVEMENT ROADMAP");

        doc
          .fillColor(text)
          .font("Helvetica")
          .fontSize(10)
          .text(data.improvementPlanText, 45, doc.y + 5, {
            width: contentWidth,
            lineGap: 4,
            align: "left",
          });

        doc.moveDown(2);
      };

      /* ---------------- DRAW CONTENT ---------------- */

      drawInfoGrid();
      drawScoreCard();
      drawFeedback();
      drawTopicTable();
      drawRoadmap();

      /* ---------------- FOOTER ON ALL PAGES ---------------- */

      const range = doc.bufferedPageRange();

for (let i = 0; i < range.count; i++) {
  doc.switchToPage(i);

  const oldY = doc.y; // save current cursor position

  doc
    .fillColor(gray)
    .font("Helvetica")
    .fontSize(7)
    .text(
      "This is a computer-generated report based on your mock interview performance evaluated by Smart Aspirants.",
      45,
      doc.page.height - 28,
      {
        width: contentWidth,
        align: "center",
        lineBreak: false
      }
    );

  doc.y = oldY; // restore cursor position
}

      /* ---------------- EVENTS ---------------- */

      doc.on("end", resolve);
      doc.on("error", reject);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

exports.generateTrainerReportPDF = (studentsData, res) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 30,
        bufferPages: true,
      });

      const fileName = `Trainer_Mock_Interview_Report.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      doc.pipe(res);

      /* ---------------- COLORS ---------------- */
      const primary = "#4f46e5";
      const dark = "#0f172a";
      const text = "#334155";
      const gray = "#64748b";
      const border = "#e2e8f0";
      const green = "#16a34a";
      const red = "#dc2626";

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 60;

      /* ---------------- HEADER ---------------- */
      doc
        .fillColor(primary)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("SMART ASPIRANTS", 30, 30);

      doc
        .fillColor(gray)
        .font("Helvetica")
        .fontSize(9)
        .text(
          `Trainer Mock Interview Report | Generated on: ${new Date().toLocaleDateString("en-GB")}`,
          30,
          54
        );

      doc.moveDown(2);

      /* ---------------- TABLE ---------------- */
      // Landscape columns width distribution
      const colLines = [30, 160, 230, 280, 380, 580, 30 + contentWidth];

      const drawHeader = (yPos) => {
        doc.rect(30, yPos, contentWidth, 24).fillAndStroke("#eef2ff", border);

        doc
          .fillColor(dark)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("STUDENT", 35, yPos + 8)
          .text("DATE", 165, yPos + 8)
          .text("SCORE", 235, yPos + 8)
          .text("STATUS", 285, yPos + 8)
          .text("WEAKNESSES", 385, yPos + 8)
          .text("OVERALL REMARK", 585, yPos + 8);

        // Draw vertical lines for header
        colLines.forEach(x => {
            doc.moveTo(x, yPos).lineTo(x, yPos + 24).stroke(border);
        });

        return yPos + 24;
      };

      let y = drawHeader(doc.y);

      if (!studentsData || studentsData.length === 0) {
        doc
          .fillColor(text)
          .font("Helvetica")
          .fontSize(10)
          .text("No data available for the selected filters.", 35, y + 15);
      } else {
        studentsData.forEach((item) => {
          const name = item.studentId ? item.studentId.name : "N/A";
          const dateStr = item.interviewDate ? new Date(item.interviewDate).toLocaleDateString("en-GB") : new Date(item.createdAt).toLocaleDateString("en-GB");
          const score = `${item.overallScore || 0}/10`;
          const status = item.status || item.performanceStatus || "N/A";
          const weaknesses = item.weaknesses || "None recorded";
          const remark = item.overallRemark || "No remark";

          // Calculate max height for this row
          const h1 = doc.heightOfString(name, { width: 120, fontSize: 8 });
          const h2 = doc.heightOfString(weaknesses, { width: 190, fontSize: 8 });
          const h3 = doc.heightOfString(remark, { width: 190, fontSize: 8 });

          const rowHeight = Math.max(24, h1 + 10, h2 + 10, h3 + 10);

          // Landscape height is shorter (approx 595 - margin = ~555)
          if (y + rowHeight > doc.page.height - 40) {
            doc.addPage();
            y = 30;
            y = drawHeader(y);
          }

          // Background Highlight for Critical Risk / Needs Improvement
          const isPoor = status === "Needs Improvement" || status === "Critical Risk";
          const bgColor = isPoor ? "#fef2f2" : "#ffffff";
          
          doc.rect(30, y, contentWidth, rowHeight).fillAndStroke(bgColor, border);

          doc
            .fillColor(dark)
            .font("Helvetica-Bold")
            .fontSize(8)
            .text(name, 35, y + 8, { width: 120 });

          doc
            .fillColor(gray)
            .font("Helvetica")
            .fontSize(8)
            .text(dateStr, 165, y + 8, { width: 60 });

          doc
            .fillColor(primary)
            .font("Helvetica-Bold")
            .text(score, 235, y + 8, { width: 40 });

          // Status Color
          let statusColor = dark;
          if (status === "Job Ready" || status === "Highly Capable") statusColor = green;
          if (isPoor) statusColor = red;

          doc
            .fillColor(statusColor)
            .font("Helvetica-Bold")
            .text(status, 285, y + 8, { width: 90 });

          doc
            .fillColor(text)
            .font("Helvetica")
            .text(weaknesses, 385, y + 8, { width: 190 });

          doc
            .fillColor(gray)
            .text(remark, 585, y + 8, { width: 190 });

          // Draw vertical lines for row
          colLines.forEach(x => {
              doc.moveTo(x, y).lineTo(x, y + rowHeight).stroke(border);
          });

          y += rowHeight;
        });
      }

      /* ---------------- FOOTER ON ALL PAGES ---------------- */
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        const oldY = doc.y;
        doc
          .fillColor(gray)
          .font("Helvetica")
          .fontSize(7)
          .text(
            "Smart Aspirants - Trainer Report",
            30,
            doc.page.height - 20,
            {
              width: contentWidth,
              align: "center",
              lineBreak: false
            }
          );
        doc.y = oldY;
      }

      doc.on("end", resolve);
      doc.on("error", reject);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

exports.generateReceiptPDF = (data, res) => {
  return new Promise((resolve, reject) => {
    try {
      const { installment, payment, settings, feeSummary, batchName } = data;
      const doc = new PDFDocument({
        size: "A4",
        margin: 45,
        bufferPages: true,
      });

      const receiptId = `REC-${installment._id.toString().slice(-6).toUpperCase()}`;
      const fileName = `Receipt_${receiptId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${fileName}"`
      );

      doc.pipe(res);

      // Colors
      const primary = "#1e3a8a"; // dark-blue (school style)
      const secondary = "#10b981"; // emerald-500
      const dark = "#0f172a";
      const text = "#334155";
      const gray = "#64748b";
      const border = "#e2e8f0";

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 90;

      // Draw Top decorative bar
      doc.rect(45, 30, contentWidth, 5).fill(primary);

      // Logo or School Title
      const title = settings?.siteTitle || 'LMS ACADEMY';
      doc
        .fillColor(primary)
        .font("Helvetica-Bold")
        .fontSize(20)
        .text(title.toUpperCase(), 45, 55);

      const subtitle = "ACADEMIC EXCELLENCE & STUDENT GROWTH";
      doc
        .fillColor(gray)
        .font("Helvetica-Bold")
        .fontSize(7)
        .text(subtitle, 45, 80, { characterSpacing: 1.5 });

      // Receipt details (Right side)
      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`RECEIPT #: ${receiptId}`, 380, 55, { align: "right", width: 170 });

      const displayDate = payment?.paid_at || installment.paid_date || new Date();
      const formattedDate = new Date(displayDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc
        .fillColor(gray)
        .font("Helvetica")
        .fontSize(8)
        .text(`DATE: ${formattedDate}`, 380, 70, { align: "right", width: 170 });

      doc.moveTo(45, 100).lineTo(pageWidth - 45, 100).lineWidth(0.5).stroke(border);

      // Watermark
      const watermarkText = title.toUpperCase();

      // Info Grid (Card boxes)
      const gridY = 115;
      const cardWidth = 242;
      const cardHeight = 82;

      // Draw elegant rounded card boxes with a light gray border and soft slate tint
      doc.save();
      // Left Card
      doc
        .roundedRect(45, gridY, cardWidth, cardHeight, 6)
        .fillAndStroke("#f8fafc", "#f1f5f9");
      // Right Card
      doc
        .roundedRect(302, gridY, cardWidth, cardHeight, 6)
        .fillAndStroke("#f8fafc", "#f1f5f9");
      doc.restore();

      // Left side: Student Info text inside card
      doc
        .fillColor(gray)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("STUDENT DETAILS", 57, gridY + 10);

      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(11)
        .text(installment.student_id?.name || "N/A", 57, gridY + 22, { width: cardWidth - 24 });

      doc
        .fillColor(text)
        .font("Helvetica")
        .fontSize(8)
        .text(`Email: ${installment.student_id?.email || "N/A"}`, 57, gridY + 37, { width: cardWidth - 24 })
        .text(`Phone: ${installment.student_id?.phone || "N/A"}`, 57, gridY + 47, { width: cardWidth - 24 });

      if (batchName) {
        doc
          .fillColor(primary)
          .font("Helvetica-Bold")
          .fontSize(8.5)
          .text(`Class/Grade: ${batchName}`, 57, gridY + 61, { width: cardWidth - 24 });
      }

      // Right side: Payment Details text inside card
      doc
        .fillColor(gray)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("PAYMENT INFORMATION", 314, gridY + 10);

      doc
        .fillColor(text)
        .font("Helvetica")
        .fontSize(8)
        .text(`Method: ${payment?.payment_mode || "Online"}`, 314, gridY + 25, { width: cardWidth - 24 })
        .text(`Status: Paid & Verified`, 314, gridY + 37, { width: cardWidth - 24 })
        .text(`Reference ID: ${payment?.reference_id || "N/A"}`, 314, gridY + 49, { width: cardWidth - 24 });

      doc.moveTo(45, 210).lineTo(pageWidth - 45, 210).lineWidth(0.5).stroke(border);

      // Table Particulars of Settlement
      let tableY = 222;
      doc
        .rect(45, tableY, contentWidth, 25)
        .fillAndStroke("#eef2ff", border);

      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("PARTICULARS OF TUITION & SYLLABUS SETTLEMENT", 55, tableY + 9)
        .text("AMOUNT (INR)", 450, tableY + 9, { align: "right", width: 90 });

      // Table row
      const isSub = installment.installment_no === 99;
      const particularsTitle = isSub 
        ? "Smart Learning Premium Plan Subscription" 
        : `Tuition Fee Installment #${installment.installment_no}`;
      const programLabel = isSub 
        ? "All Grade Subjects & Learning Portal Access" 
        : `Grade Syllabus Course Program`;

      const rowY = tableY + 25;
      doc
        .rect(45, rowY, contentWidth, 70)
        .stroke(border);

      // Draw subtle vertical grid line separating details from the amount
      doc
        .moveTo(440, rowY)
        .lineTo(440, rowY + 70)
        .lineWidth(0.5)
        .stroke(border);

      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(particularsTitle, 55, rowY + 15);

      doc
        .fillColor(primary)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text(programLabel, 55, rowY + 30);

      const italicText = isSub
        ? "Access enabled for interactive digital worksheets, quizzes, progress reports and parent updates."
        : "Standard fee installment paid towards the assigned class grade and associated subjects.";

      doc
        .fillColor(gray)
        .font("Helvetica-Oblique")
        .fontSize(8)
        .text(italicText, 55, rowY + 45, { width: 350 });

      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`INR ${installment.amount.toLocaleString('en-IN')}`, 450, rowY + 25, { align: "right", width: 90 });

      // Total Row
      const totalY = rowY + 70;
      doc
        .rect(345, totalY, 205, 30)
        .fillAndStroke(primary, primary);

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(`INR ${installment.amount.toLocaleString('en-IN')}`, 450, totalY + 10, { align: "right", width: 90 });

      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(7)
        .text("TOTAL AMOUNT PAID", 355, totalY + 11);

      // Fee Breakdown Summary
      let breakdownY = totalY + 45;
      if (feeSummary && !isSub) {
        doc
          .fillColor(gray)
          .font("Helvetica-Bold")
          .fontSize(8)
          .text("ACADEMIC LEDGER SUMMARY", 45, breakdownY);

        doc
          .fillColor(text)
          .font("Helvetica")
          .fontSize(8)
          .text(`Total Course Fee: INR ${feeSummary.total.toLocaleString('en-IN')}`, 45, breakdownY + 15);

        if (feeSummary.previousPaid > 0) {
          doc.text(`Previously Settled: INR ${feeSummary.previousPaid.toLocaleString('en-IN')}`, 45, breakdownY + 27);
        }

        doc.text(`This Installment Payment: INR ${installment.amount.toLocaleString('en-IN')}`, 45, breakdownY + 39);

        doc
          .fillColor("#dc2626")
          .font("Helvetica-Bold")
          .text(`Remaining Balance: INR ${feeSummary.pending.toLocaleString('en-IN')}`, 45, breakdownY + 51);
      }

      // Terms & Conditions (Left side) and Signatory (Right side)
      const sigY = breakdownY + 15;
      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .text("TERMS & CONDITIONS", 45, sigY);

      const terms = [
        "1. All tuition and subscription fee payments are strictly non-refundable.",
        "2. Service access is subject to timely payment of academic installments.",
        "3. This is a secure digital record and does not require a physical signature.",
        "4. For support or billing disputes, contact school support via email."
      ];

      let termY = sigY + 12;
      terms.forEach(term => {
        doc
          .fillColor(gray)
          .font("Helvetica")
          .fontSize(6.5)
          .text(term, 45, termY, { width: 300 });
        termY += 9;
      });

      // Authorized Signatory
      const sigX = 380;
      doc.moveTo(sigX, sigY + 35).lineTo(pageWidth - 45, sigY + 35).lineWidth(0.5).stroke(border);
      
      doc
        .fillColor(dark)
        .font("Helvetica-Bold")
        .fontSize(8)
        .text("AUTHORIZED OFFICIAL", sigX, sigY + 42, { align: "center", width: 170 })
        .fillColor(gray)
        .font("Helvetica")
        .fontSize(7)
        .text("Seal & Signature Verified", sigX, sigY + 50, { align: "center", width: 170 });

      // Footer
      const companyAddress = settings?.contact?.address || "Digital School Portal Address";
      const companyPhone = settings?.contact?.phone || "";
      const companyEmail = settings?.contact?.email || "";
      
      const footerLines = [
        `* Verified Digital Record of ${title.toUpperCase()}.`,
        `* Support & Queries: ${companyEmail} | Phone: ${companyPhone}`,
        `* Office Address: ${companyAddress}`
      ];

      // Draw watermark and footer on all pages
      const rangeAfter = doc.bufferedPageRange();
      for (let i = 0; i < rangeAfter.count; i++) {
        doc.switchToPage(i);

        // Watermark in background
        doc.save();
        doc.opacity(0.015);
        doc.fillColor("#000000");
        doc.font("Helvetica-Bold");
        doc.fontSize(45);
        doc.translate(pageWidth / 2, doc.page.height / 2);
        doc.rotate(-30);
        doc.text(watermarkText, -250, 0, { width: 500, align: "center" });
        doc.restore();

        // Footer lines
        doc
          .fillColor(gray)
          .font("Helvetica")
          .fontSize(7)
          .text(footerLines.join("   *   "), 45, doc.page.height - 35, {
            width: contentWidth,
            align: "center",
            lineBreak: false
          });
      }

      doc.on("end", resolve);
      doc.on("error", reject);
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};