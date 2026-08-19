import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
const FROM_EMAIL = process.env.FROM_EMAIL || GMAIL_USER || 'noreply@redhillinfra.com';
const PORTAL_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Setup Nodemailer Transporter for Gmail / Custom SMTP
let smtpTransporter: nodemailer.Transporter | null = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  smtpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
} else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  // 1. If Gmail / SMTP is configured, deliver directly to actual Gmail inboxes!
  if (smtpTransporter) {
    try {
      const realRecipients = recipients.filter(r => !r.endsWith('@example.com') && !r.endsWith('@test.com'));
      const mockRecipients = recipients.filter(r => r.endsWith('@example.com') || r.endsWith('@test.com'));

      if (mockRecipients.length > 0) {
        console.log(`[EMAIL DISPATCH - MOCK ACCOUNT] Sent to test accounts: ${mockRecipients.join(', ')}`);
      }

      if (realRecipients.length > 0) {
        await smtpTransporter.sendMail({
          from: `"Redhill Infra" <${GMAIL_USER || FROM_EMAIL}>`,
          to: realRecipients,
          subject: options.subject,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
          html: options.html,
        });
        console.log(`[EMAIL DISPATCH - GMAIL SMTP SUCCESS] Sent to: ${realRecipients.join(', ')}`);
      }
      return true;
    } catch (smtpError) {
      console.error('Error sending email via Gmail SMTP:', smtpError);
    }
  }

  // 2. If SendGrid is configured
  if (SENDGRID_API_KEY) {
    try {
      const msg = {
        to: options.to,
        from: FROM_EMAIL,
        subject: options.subject,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        html: options.html,
      };
      await sgMail.send(msg);
      console.log(`[EMAIL DISPATCH - SENDGRID SUCCESS] Sent to: ${recipients.join(', ')}`);
      return true;
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      return false;
    }
  }

  // 3. Fallback: Development Mock Logger when no credentials are in .env
  console.log('====================================================');
  console.log(`[EMAIL DISPATCH - DEV MOCK]`);
  console.log(`To: ${recipients.join(', ')}`);
  console.log(`Subject: ${options.subject}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Note: To send to actual Gmail inboxes, add GMAIL_USER and GMAIL_APP_PASSWORD to Backend/.env`);
  console.log('====================================================');
  return true;
};

export interface MilestoneEmailParams {
  investorName: string;
  projectName: string;
  projectLocation: string;
  projectImageUrl?: string;
  projectId: number;
  milestoneName: string;
  milestoneCategory: string;
  completionDate?: string;
  dayNumber?: number;
  targetDays?: number;
  notes?: string;
}

export const generateMilestoneCompletedHtml = (params: MilestoneEmailParams): string => {
  const {
    investorName,
    projectName,
    projectLocation,
    projectImageUrl,
    projectId,
    milestoneName,
    milestoneCategory,
    completionDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dayNumber,
    targetDays,
    notes,
  } = params;

  const categoryFormatted = milestoneCategory.charAt(0).toUpperCase() + milestoneCategory.slice(1);
  const portalLink = `${PORTAL_URL}/project/${projectId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Completed - ${milestoneName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0f12; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0f12; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #171a21; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 36px; background: linear-gradient(135deg, #1e222b 0%, #12141a 100%); border-bottom: 2px solid #D32F2F;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      REDHILL <span style="color: #D32F2F;">INFRA</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;">
                      Investor Portal Notification
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 14px; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 20px; font-size: 12px; font-weight: 700; color: #4ade80;">
                      ✓ Milestone Completed
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${projectImageUrl ? `
          <!-- Project Banner Image -->
          <tr>
            <td style="padding: 0; max-height: 180px; overflow: hidden;">
              <img src="${projectImageUrl}" alt="${projectName}" width="600" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
            </td>
          </tr>
          ` : ''}

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; font-family: Georgia, serif;">
                Milestone Completed: ${milestoneName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8;">
                Great news regarding your investment in <strong style="color: #f1f5f9;">${projectName}</strong> (${projectLocation}).
              </p>

              <div style="background-color: #1e232d; border-radius: 12px; padding: 20px 24px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #e2e8f0;">
                  Dear <strong>${investorName}</strong>,
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #cbd5e1; line-height: 1.7;">
                  We are pleased to inform you that our project engineering and site development team has officially completed the <strong>${milestoneName}</strong> phase.
                </p>

                <!-- Milestone Highlights Card -->
                <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color: #12141a; border-radius: 8px; margin-top: 12px; border: 1px solid rgba(255, 255, 255, 0.06);">
                  <tr>
                    <td width="35%" style="font-size: 13px; color: #94a3b8; font-weight: 600;">Project</td>
                    <td style="font-size: 14px; color: #ffffff; font-weight: 700;">${projectName}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Milestone</td>
                    <td style="font-size: 14px; color: #f87171; font-weight: 700;">${milestoneName}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Category</td>
                    <td style="font-size: 13px; color: #e2e8f0;">${categoryFormatted}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Progress Status</td>
                    <td style="font-size: 13px; color: #4ade80; font-weight: 700;">100% Completed</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Completion Date</td>
                    <td style="font-size: 13px; color: #e2e8f0;">${completionDate}</td>
                  </tr>
                  ${dayNumber ? `
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Construction Cycle</td>
                    <td style="font-size: 13px; color: #e2e8f0;">Day ${dayNumber}${targetDays ? ` of ${targetDays} days` : ''}</td>
                  </tr>
                  ` : ''}
                </table>

                ${notes ? `
                <div style="margin-top: 16px; padding: 14px; background-color: rgba(211, 47, 47, 0.08); border-left: 3px solid #D32F2F; border-radius: 4px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f87171; letter-spacing: 1px; margin-bottom: 4px;">Site Manager Work Log:</div>
                  <div style="font-size: 13px; color: #e2e8f0; font-style: italic;">"${notes}"</div>
                </div>
                ` : ''}
              </div>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${portalLink}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #D32F2F; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 15px rgba(211, 47, 47, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                      View Live Project Progress →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 8px;">
                You can view live site photos, CCTV stream, and updated timelines on your portal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #101217; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                You received this automated notification because you are a registered investor in <strong>${projectName}</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © ${new Date().getFullYear()} Redhill Infrastructure. All rights reserved. • Confidential Investor Communication
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
