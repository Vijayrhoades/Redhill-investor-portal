import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@redhillinfra.com';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  if (!SENDGRID_API_KEY) {
    // Fallback to console log for development/testing when no API key is provided
    console.log('----------------------------------------------------');
    console.log(`[EMAIL MOCK] To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`[EMAIL MOCK] Subject: ${options.subject}`);
    console.log(`[EMAIL MOCK] Body: ${options.html.substring(0, 150)}...`);
    console.log('----------------------------------------------------');
    return true;
  }

  try {
    const msg = {
      to: options.to,
      from: FROM_EMAIL,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ''), // strip html tags for plaintext
      html: options.html,
    };
    
    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    return false;
  }
};
