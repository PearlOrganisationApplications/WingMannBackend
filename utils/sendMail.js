const transporter = require('../config/mail');

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"WingMan" <${process.env.SMTP_MAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;