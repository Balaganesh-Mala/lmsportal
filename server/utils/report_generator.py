import sys
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing, Rect
from datetime import datetime

def generate_pdf(data):
    # Setup document
    doc = SimpleDocTemplate(sys.stdout.buffer, pagesize=A4, 
                            rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor("#4f46e5"), # Indigo-600
        spaceAfter=10,
        fontName="Helvetica-Bold",
        alignment=0
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=30,
        alignment=0
    )

    section_header_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor("#1e293b"), # Slate-800
        spaceBefore=15,
        spaceAfter=10,
        fontName="Helvetica-Bold"
    )

    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.grey,
        fontName="Helvetica-Bold",
        textTransform='uppercase'
    )

    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#475569"), # Slate-600
        leading=14
    )

    elements = []

    # --- Header Section ---
    elements.append(Paragraph("SMART ASPIRANTS", title_style))
    elements.append(Paragraph(f"Official Mock Interview Performance Report | {datetime.now().strftime('%d %b %Y')}", subtitle_style))
    
    # --- Candidate Info Table ---
    user_data = [
        [Paragraph("Candidate Name", label_style), Paragraph("Interview Type", label_style), Paragraph("Attempt Date", label_style)],
        [Paragraph(data.get('studentName', 'Student'), content_style), 
         Paragraph(data.get('interviewType', 'N/A'), content_style), 
         Paragraph(data.get('interviewDate', datetime.now().strftime('%d/%m/%Y')), content_style)]
    ]
    t = Table(user_data, colWidths=[180, 150, 150])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,0), 0),
        ('TOPPADDING', (0,1), (-1,1), 5),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 40))

    # --- Score Section ---
    elements.append(Paragraph("OVERALL PERFORMANCE", section_header_style))
    
    score_table_data = [
        [
            Paragraph(f"<font size='48' color='#4f46e5'><b>{data.get('overallScore', '0')}</b></font><font size='14' color='#94a3b8'>/10</font>", styles['Normal']),
            [
                Paragraph("VERDICT", label_style),
                Paragraph(f"<b>{data.get('overallRemark', 'No remark provided.')}</b>", content_style)
            ]
        ]
    ]
    st = Table(score_table_data, colWidths=[150, 340])
    st.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.whitesmoke),
        ('BACKGROUND', (0,0), (0,0), colors.HexColor("#f8fafc")),
        ('LEFTPADDING', (1,0), (1,0), 20),
    ]))
    elements.append(st)
    elements.append(Spacer(1, 30))

    # --- Strengths & Improvement Section ---
    elements.append(Paragraph("CRITICAL FEEDBACK", section_header_style))
    
    feedback_data = [
        [
            [Paragraph("CORE STRENGTHS", ParagraphStyle('GreenLabel', parent=label_style, textColor=colors.HexColor("#10b981"))), Spacer(1, 5), Paragraph(data.get('strengths', 'N/A'), content_style)],
            [Paragraph("IMPROVEMENT AREAS", ParagraphStyle('RedLabel', parent=label_style, textColor=colors.HexColor("#ef4444"))), Spacer(1, 5), Paragraph(data.get('weaknesses', 'N/A'), content_style)]
        ]
    ]
    ft = Table(feedback_data, colWidths=[245, 245])
    ft.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(ft)
    elements.append(Spacer(1, 30))

    # --- Subject Proficiency Table ---
    elements.append(Paragraph("SUBJECT PROFICIENCY BREAKDOWN", section_header_style))
    
    topic_data = [[Paragraph("TOPIC", label_style), Paragraph("SCORE", label_style), Paragraph("REMARK / SUGGESTION", label_style)]]
    
    # Check both fields as they might vary
    topics = data.get('topicScores', data.get('topics', []))
    for topic in topics:
        topic_data.append([
            Paragraph(topic.get('topic', 'N/A'), content_style),
            Paragraph(f"{topic.get('score', '0')}/10", content_style),
            Paragraph(topic.get('remark', '-'), ParagraphStyle('SmallContent', parent=content_style, fontSize=8, italic=True))
        ])
    
    if len(topics) > 0:
        tt = Table(topic_data, colWidths=[150, 70, 270])
        tt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor("#1e293b")),
            ('ALIGN', (0,0), (-1,0), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(tt)
    else:
        elements.append(Paragraph("No topic data recorded.", content_style))

    elements.append(Spacer(1, 30))

    # --- Roadmap Section ---
    if data.get('improvementPlanText'):
        elements.append(Paragraph("IMPROVEMENT ROADMAP", section_header_style))
        elements.append(Paragraph(data.get('improvementPlanText'), content_style))

    # --- Footer ---
    elements.append(Spacer(1, 50))
    elements.append(Paragraph("This is a computer-generated report based on your mock interview performance evaluated by our expert trainers at Smart Aspirants. For any queries, reach out to info@smartaspirants.com", 
                             ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=colors.grey, alignment=1)))

    # Finalize
    doc.build(elements)

if __name__ == "__main__":
    # Ensure stdout is in binary mode on Windows to avoid CRLF translation
    if sys.platform == "win32":
        import os, msvcrt
        msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)

    if len(sys.argv) > 1:
        # Load from argument if provided
        try:
            raw_data = json.loads(sys.argv[1])
            generate_pdf(raw_data)
        except Exception as e:
            # Simple error output for Node to catch
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)
    else:
        # Or read from stdin
        try:
            line = sys.stdin.read()
            if line:
                data = json.loads(line)
                # Ensure topics is a list
                if not isinstance(data.get('topicScores'), list) and not isinstance(data.get('topics'), list):
                    if 'topicScores' in data: data['topicScores'] = []
                    if 'topics' in data: data['topics'] = []
                generate_pdf(data)
        except Exception as e:
            print(f"Error: {str(e)}", file=sys.stderr)
            sys.exit(1)
