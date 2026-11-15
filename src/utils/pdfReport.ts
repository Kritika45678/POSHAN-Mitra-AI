import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import type { ChildRecord, Language, RiskAssessment, WorkerProfile } from '../types.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function renderHtmlToPdf(html: string, filename: string): Promise<void> {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.width = '794px';
  host.style.backgroundColor = '#ffffff';
  host.style.color = '#12372a';
  host.style.fontFamily = '"Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
  host.innerHTML = html;

  document.body.appendChild(host);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const printableWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * printableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, printableWidth, imgHeight);
    heightLeft -= pageHeight - margin * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, printableWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(host);
  }
}

export async function downloadChildPdfReport(
  child: ChildRecord,
  assessment: RiskAssessment,
  worker: WorkerProfile | null,
  language: Language
): Promise<void> {
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const childName = isDevanagari ? child.nameHi : child.nameEn;
  const motherName = isDevanagari ? child.motherNameHi : child.motherNameEn;
  const today = new Date().toLocaleDateString(isDevanagari ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const riskBadgeBg =
    assessment.level === 'high'
      ? '#FEF2F2'
      : assessment.level === 'rising'
      ? '#FFFBEB'
      : '#F0FDF4';
  const riskBadgeColor =
    assessment.level === 'high'
      ? '#B91C1C'
      : assessment.level === 'rising'
      ? '#B45309'
      : '#15803D';
  const riskLabel =
    assessment.level === 'high'
      ? pick('उच्च जोखिम · SAM संकेत', 'बेसी खतरा · SAM लछन', 'High Risk · SAM Alert')
      : assessment.level === 'rising'
      ? pick('बढ़ता जोखिम · MAM निगरानी', 'बढ़त खतरा · MAM निगरानी', 'Rising Risk · MAM Watch')
      : pick('सामान्य · स्वस्थ विकास', 'ठीक बा · बढ़िया बढ़त', 'Normal · Healthy Growth');

  const rationText =
    child.rationStatus === 'collected'
      ? pick('पूरा मिला', 'पूरा मिलल', 'Collected')
      : child.rationStatus === 'partial'
      ? pick('आंशिक', 'आधा-अधूरा', 'Partial')
      : pick('नहीं लिया', 'ना मिलल', 'Missed');

  const growthRows = (child.growthHistory || [])
    .map(
      (pt) => `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid #DCE4DB;">${escapeHtml(
          isDevanagari ? pt.monthHi : pt.monthEn
        )}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #DCE4DB;text-align:right;">${pt.weightKg} kg</td>
        <td style="padding:7px 10px;border-bottom:1px solid #DCE4DB;text-align:right;">${pt.heightCm} cm</td>
      </tr>`
    )
    .join('');

  const reasonRows = assessment.reasons
    .map(
      (r) =>
        `<li style="margin-bottom:4px;">• ${escapeHtml(pick(r.labelHi, r.labelBho, r.labelEn))}</li>`
    )
    .join('');

  const html = `
    <div style="padding:28px 32px;background:#ffffff;color:#12372A;line-height:1.5;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0F766E;padding-bottom:14px;margin-bottom:18px;">
        <div>
          <div style="font-size:22px;font-weight:700;color:#0F766E;">Poshan Mitra Ai</div>
          <div style="font-size:13px;color:#435C51;margin-top:2px;">
            ${escapeHtml(
              pick(
                'बाल पोषण एवं प्रारंभिक जोखिम मूल्यांकन रिपोर्ट',
                'लइका के पोषण आ शुरुआती खतरा जांच रपट',
                'Child Nutrition & Early Risk Assessment Report'
              )
            )}
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:#435C51;">
          <div><strong>${pick('दिनांक:', 'तारीख:', 'Date:')}</strong> ${escapeHtml(today)}</div>
          <div><strong>${pick('केंद्र:', 'केंद्र:', 'Center:')}</strong> ${escapeHtml(
            worker?.centerCode || 'केंद्र 042'
          )}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#F8FAF7;border:1px solid #DCE4DB;border-radius:10px;padding:14px;margin-bottom:18px;font-size:13px;">
        <div><strong>${pick('बच्चे का नाम:', 'लइका के नाम:', 'Child Name:')}</strong> ${escapeHtml(childName)}</div>
        <div><strong>${pick('उम्र व लिंग:', 'उमर आ लिंग:', 'Age & Gender:')}</strong> ${child.ageMonths} ${
    pick('माह', 'महीना', 'mo')
  } · ${
    child.gender === 'girl'
      ? pick('बालिका', 'बबुनी', 'Girl')
      : pick('बालक', 'बबुआ', 'Boy')
  }</div>
        <div><strong>${pick('माँ का नाम:', 'माई के नाम:', 'Mother Name:')}</strong> ${escapeHtml(motherName)}</div>
        <div><strong>${pick('वार्ड / संपर्क:', 'वार्ड / फोन:', 'Ward / Phone:')}</strong> ${escapeHtml(
    child.ward
  )} (${escapeHtml(child.phone)})</div>
      </div>

      <div style="background:${riskBadgeBg};border:1px solid ${riskBadgeColor}44;border-radius:10px;padding:16px;margin-bottom:18px;">
        <div style="font-size:13px;font-weight:700;color:${riskBadgeColor};margin-bottom:6px;">
          ${escapeHtml(riskLabel)} · ${escapeHtml(
    pick(assessment.urgencyHi, assessment.urgencyBho, assessment.urgencyEn)
  )}
        </div>
        <div style="font-size:16px;font-weight:700;color:#12372A;margin-bottom:8px;">
          ${escapeHtml(
            pick(assessment.oneClearActionHi, assessment.oneClearActionBho, assessment.oneClearActionEn)
          )}
        </div>
        ${
          reasonRows
            ? `<ul style="margin:8px 0 0 0;padding:0;list-style:none;font-size:12.5px;color:#12372A;">${reasonRows}</ul>`
            : ''
        }
      </div>

      <div style="font-size:14px;font-weight:700;margin-bottom:8px;">
        ${pick('4 प्रमुख संकेतों का सारांश', '4 गो मुख्य संकेत के सारांश', 'Unified 4 Signals Summary')}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:18px;border:1px solid #DCE4DB;">
        <tr style="background:#F1F5EF;">
          <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #DCE4DB;">${
            pick('संकेत', 'संकेत', 'Signal')
          }</th>
          <th style="text-align:left;padding:8px 10px;border-bottom:1px solid #DCE4DB;">${
            pick('वर्तमान स्थिति', 'अभी के हाल', 'Current Value')
          }</th>
        </tr>
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #DCE4DB;">${
            pick('केंद्र उपस्थिति', 'केंद्र आइल', 'Attendance')
          }</td>
          <td style="padding:8px 10px;border-bottom:1px solid #DCE4DB;">${child.attendanceDays} / ${
    child.totalDays
  } ${pick('दिन', 'दिन', 'days')}</td>
        </tr>
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #DCE4DB;">${
            pick('राशन / THR', 'राशन / THR', 'Ration / THR')
          }</td>
          <td style="padding:8px 10px;border-bottom:1px solid #DCE4DB;">${escapeHtml(rationText)}</td>
        </tr>
        <tr>
          <td style="padding:8px 10px;border-bottom:1px solid #DCE4DB;">${
            pick('वजन, लंबाई व MUAC', 'वजन, लंबाई आ MUAC', 'Weight, Height & MUAC')
          }</td>
          <td style="padding:8px 10px;border-bottom:1px solid #DCE4DB;">${child.weightKg} kg · ${
    child.heightCm
  } cm · MUAC ${child.muacMm} mm</td>
        </tr>
        <tr>
          <td style="padding:8px 10px;">${pick('टीकाकरण स्थिति', 'टीका के हाल', 'Immunization')}</td>
          <td style="padding:8px 10px;">${
            child.immunizationUpToDate
              ? pick('पूरा है', 'पूरा बा', 'Up to date')
              : pick('बाकी है', 'बाकी बा', 'Overdue')
          }</td>
        </tr>
      </table>

      ${
        growthRows
          ? `
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">
          ${pick('वजन एवं लंबाई इतिहास (Growth Record)', 'वजन आ लंबाई बढ़त के हिसाब', 'Weight & Height Growth History')}
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:18px;border:1px solid #DCE4DB;">
          <tr style="background:#F1F5EF;">
            <th style="text-align:left;padding:7px 10px;border-bottom:1px solid #DCE4DB;">${
              pick('माह', 'महीना', 'Month')
            }</th>
            <th style="text-align:right;padding:7px 10px;border-bottom:1px solid #DCE4DB;">${
              pick('वजन', 'वजन', 'Weight')
            }</th>
            <th style="text-align:right;padding:7px 10px;border-bottom:1px solid #DCE4DB;">${
              pick('लंबाई', 'लंबाई', 'Height')
            }</th>
          </tr>
          ${growthRows}
        </table>
      `
          : ''
      }

      <div style="background:#F8FAF7;border:1px solid #DCE4DB;border-radius:10px;padding:12px 14px;margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#0F766E;margin-bottom:4px;">
          ${pick('माँ के लिए परामर्श संदेश', 'माई से कहे वाला सलाह', 'Mother Counseling Script')}
        </div>
        <div style="font-size:13px;color:#12372A;">
          ${escapeHtml(
            pick(assessment.counselingHintHi, assessment.counselingHintBho, assessment.counselingHintEn)
          )}
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid #DCE4DB;padding-top:12px;font-size:12px;color:#435C51;">
        <div>
          <div><strong>${pick('आंगनवाड़ी कार्यकर्ता:', 'आंगनवाड़ी दीदी:', 'Anganwadi Worker:')}</strong> ${escapeHtml(
    worker?.displayName || 'कार्यकर्ता'
  )}</div>
          <div>${escapeHtml(worker?.phone || '')} ${
    worker?.email ? `· ${escapeHtml(worker.email)}` : ''
  }</div>
        </div>
        <div style="text-align:right;">
          <div>${escapeHtml(worker?.districtState || '')}</div>
          <div>Poshan Mitra Ai</div>
        </div>
      </div>
    </div>
  `;

  const cleanFileName = `Poshan_Report_${child.nameEn.replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;
  await renderHtmlToPdf(html, cleanFileName);
}

export async function downloadCenterPdfReport(
  items: { child: ChildRecord; assessment: RiskAssessment }[],
  worker: WorkerProfile | null,
  language: Language
): Promise<void> {
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const today = new Date().toLocaleDateString(isDevanagari ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const highCount = items.filter((i) => i.assessment.level === 'high').length;
  const risingCount = items.filter((i) => i.assessment.level === 'rising').length;
  const normalCount = items.filter((i) => i.assessment.level === 'normal').length;

  const rowsHtml = items
    .map(({ child, assessment }) => {
      const levelText =
        assessment.level === 'high'
          ? pick('उच्च जोखिम (SAM)', 'बेसी खतरा (SAM)', 'High (SAM)')
          : assessment.level === 'rising'
          ? pick('निगरानी (MAM)', 'निगरानी (MAM)', 'Watch (MAM)')
          : pick('स्वस्थ', 'स्वस्थ', 'Healthy');

      const levelColor =
        assessment.level === 'high'
          ? '#B91C1C'
          : assessment.level === 'rising'
          ? '#B45309'
          : '#15803D';

      return `
        <tr>
          <td style="padding:8px 8px;border-bottom:1px solid #DCE4DB;">
            <div style="font-weight:700;">${escapeHtml(isDevanagari ? child.nameHi : child.nameEn)}</div>
            <div style="font-size:11px;color:#435C51;">${escapeHtml(
              isDevanagari ? child.motherNameHi : child.motherNameEn
            )} · ${child.ageMonths}m</div>
          </td>
          <td style="padding:8px 8px;border-bottom:1px solid #DCE4DB;font-family:monospace;">
            ${child.weightKg}kg / ${child.heightCm}cm<br/>MUAC ${child.muacMm}mm
          </td>
          <td style="padding:8px 8px;border-bottom:1px solid #DCE4DB;font-weight:700;color:${levelColor};">
            ${escapeHtml(levelText)}
          </td>
          <td style="padding:8px 8px;border-bottom:1px solid #DCE4DB;font-size:11.5px;">
            ${escapeHtml(
              pick(assessment.oneClearActionHi, assessment.oneClearActionBho, assessment.oneClearActionEn)
            )}
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <div style="padding:26px 30px;background:#ffffff;color:#12372A;line-height:1.45;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0F766E;padding-bottom:12px;margin-bottom:16px;">
        <div>
          <div style="font-size:21px;font-weight:700;color:#0F766E;">Poshan Mitra Ai</div>
          <div style="font-size:13px;color:#435C51;">
            ${escapeHtml(
              pick(
                'आंगनवाड़ी केंद्र मासिक पोषण एवं फॉलो-अप रजिस्टर',
                'आंगनवाड़ी केंद्र के महीना वाला पोषण आ भेंट रजिस्टर',
                'Anganwadi Center Nutrition & Follow-Up Summary'
              )
            )}
          </div>
        </div>
        <div style="text-align:right;font-size:12px;color:#435C51;">
          <div><strong>${pick('दिनांक:', 'तारीख:', 'Date:')}</strong> ${escapeHtml(today)}</div>
          <div><strong>${pick('केंद्र:', 'केंद्र:', 'Center:')}</strong> ${escapeHtml(
    worker?.centerCode || 'केंद्र 042'
  )}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;font-size:12px;">
        <div style="background:#F8FAF7;border:1px solid #DCE4DB;border-radius:8px;padding:10px;">
          <div style="color:#435C51;">${pick('कुल बच्चे', 'कुल लइका', 'Total')}</div>
          <div style="font-size:18px;font-weight:700;">${items.length}</div>
        </div>
        <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px;">
          <div style="color:#B91C1C;">${pick('उच्च जोखिम', 'बेसी खतरा', 'High Risk')}</div>
          <div style="font-size:18px;font-weight:700;color:#B91C1C;">${highCount}</div>
        </div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:10px;">
          <div style="color:#B45309;">${pick('निगरानी', 'निगरानी', 'Watch')}</div>
          <div style="font-size:18px;font-weight:700;color:#B45309;">${risingCount}</div>
        </div>
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:10px;">
          <div style="color:#15803D;">${pick('स्वस्थ', 'स्वस्थ', 'Healthy')}</div>
          <div style="font-size:18px;font-weight:700;color:#15803D;">${normalCount}</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #DCE4DB;margin-bottom:16px;">
        <tr style="background:#F1F5EF;">
          <th style="text-align:left;padding:8px;border-bottom:1px solid #DCE4DB;">${
            pick('बच्चा / माँ', 'लइका / माई', 'Child / Mother')
          }</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #DCE4DB;">${
            pick('वजन / लंबाई / MUAC', 'वजन / लंबाई / MUAC', 'Measurements')
          }</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #DCE4DB;">${
            pick('जोखिम स्तर', 'खतरा के स्तर', 'Risk Tier')
          }</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #DCE4DB;">${
            pick('मुख्य फॉलो-अप कदम', 'मुख्य भेंट आ काम', 'Clear Next Step')
          }</th>
        </tr>
        ${rowsHtml}
      </table>

      <div style="display:flex;justify-content:space-between;font-size:12px;color:#435C51;border-top:1px solid #DCE4DB;padding-top:10px;">
        <span>${pick('कार्यकर्ता:', 'दीदी:', 'Worker:')} ${escapeHtml(
    worker?.displayName || 'कार्यकर्ता'
  )}</span>
        <span>${escapeHtml(worker?.villageWard || '')}</span>
      </div>
    </div>
  `;

  await renderHtmlToPdf(html, 'Poshan_Center_Nutrition_Report.pdf');
}
