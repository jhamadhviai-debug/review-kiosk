// Every email uses the same star mark and accent color as the app itself,
// so the signup page, dashboard, and inbox all feel like one product.
// Adjust ACCENT to match your actual site's accent color if it differs.
const ACCENT = '#f5b301';

function wrapper(bodyHtml) {
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #222;">
    <div style="font-size: 28px; margin-bottom: 4px;">⭐</div>
    <h2 style="margin: 0 0 16px; color: #111;">Review Kiosk</h2>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 12px; color: #888;">
      You're receiving this because this email is on file for a Review
      Kiosk business dashboard. Questions? Just reply to this email.
    </p>
  </div>`;
}

function button(url, label) {
  return `<p><a href="${url}" style="display:inline-block;background:${ACCENT};color:#111;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">${label}</a></p>`;
}

export function dashboardLinkEmail({ businessName, dashboardUrl, isNew }) {
  return {
    subject: isNew
      ? `Your Review Kiosk dashboard for ${businessName}`
      : 'Your Review Kiosk dashboard link',
    html: wrapper(`
      <p>Hi,</p>
      <p>${
        isNew
          ? `Your QR code for <strong>${businessName}</strong> is ready.`
          : `Here's your dashboard link for <strong>${businessName}</strong>, as requested.`
      }</p>
      ${button(dashboardUrl, 'Open my dashboard')}
      <p style="font-size:13px;color:#555;">Bookmark this link — it's your private key. Anyone with this link can see your feedback, so don't share it publicly. There's no password to remember.</p>
      <p style="font-size:12px;color:#999;word-break:break-all;">${dashboardUrl}</p>
    `),
  };
}

export function trialEndingEmail({ businessName, dashboardUrl, daysLeft }) {
  return {
    subject: `Your ${businessName} trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
    html: wrapper(`
      <p>Hi,</p>
      <p>Your 15-day trial for <strong>${businessName}</strong> ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p>
      <p>After that, customers will still get a review to post — it'll just switch from AI-personalized to a simple template, until you upgrade. Your QR code never stops working either way.</p>
      ${button(dashboardUrl, 'View dashboard & upgrade')}
    `),
  };
}

export function trialEndedEmail({ businessName, dashboardUrl }) {
  return {
    subject: `${businessName} is now on simple templates`,
    html: wrapper(`
      <p>Hi,</p>
      <p>Your 15-day trial for <strong>${businessName}</strong> has ended. Customers can still post reviews from your QR code — they now get a simple template instead of an AI-personalized one.</p>
      <p>Upgrade any time to bring AI-personalized reviews back, with no interruption for customers.</p>
      ${button(dashboardUrl, 'Upgrade to Pro')}
    `),
  };
}

export function paymentIssueEmail({ businessName, dashboardUrl }) {
  return {
    subject: `Payment issue with your ${businessName} Pro plan`,
    html: wrapper(`
      <p>Hi,</p>
      <p>We couldn't process your latest payment for <strong>${businessName}</strong>'s Pro plan. Your dashboard and QR code keep working normally — please update your payment method to avoid losing Pro features.</p>
      ${button(dashboardUrl, 'Update payment on my dashboard')}
    `),
  };
}
