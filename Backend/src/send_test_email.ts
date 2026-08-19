import { sendEmail, generateMilestoneCompletedHtml } from './services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const targetEmail = process.argv[2] || process.env.GMAIL_USER;

  if (!targetEmail) {
    console.log('Usage: npx tsx src/send_test_email.ts <your_email@gmail.com>');
    console.log('Or set GMAIL_USER and GMAIL_APP_PASSWORD in Backend/.env');
    return;
  }

  console.log(`Sending real test milestone completed email to: ${targetEmail}...`);

  const html = generateMilestoneCompletedHtml({
    investorName: 'Valued Investor',
    projectName: 'Redhill Signature Towers (Project A)',
    projectLocation: 'Whitefield, Bangalore',
    projectImageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=2070',
    projectId: 1,
    milestoneName: 'Pillar Work & Structural Columns (25-Day Cycle)',
    milestoneCategory: 'construction',
    completionDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dayNumber: 25,
    targetDays: 25,
    notes: 'Day 25: All structural pillar columns completed. Quality inspection approved.',
  });

  const success = await sendEmail({
    to: targetEmail,
    subject: '🎉 Milestone Completed: Pillar Work & Structural Columns (25-Day Cycle) — Redhill Signature Towers',
    html,
  });

  if (success) {
    console.log(`✅ Test email dispatched successfully to ${targetEmail}! Check your Gmail inbox (and Spam/Promotions folder if it's your first time).`);
  } else {
    console.log(`❌ Failed to send email. Please check your credentials in Backend/.env.`);
  }
}

main().catch(console.error);
