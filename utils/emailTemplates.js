const transporter = require('../config/mail');


const welcomeTemplate = (firstName) => {
  return {
    subject: "You’re in 🤍 Welcome to WingMann",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
        <h2>Hey ${firstName},</h2>

        <p>
          We’re happy to let you know that your profile has been accepted into <b>WingMann</b>.
        </p>

        <p>
          WingMann isn’t about endless swipes or casual intent. It’s built for people who are clear,
          respectful, and genuinely looking to build something real.
        </p>

        <h3>Now that you’re in, here’s what to do next:</h3>

        <ul>
          <li>Log in to your account and complete your profile thoughtfully.</li>
          <li><b>Take the Compatibility Quiz</b> — this helps us match you with people aligned to your values and intent.</li>
          <li><b>Check your Facial Attractiveness</b> — because attraction matters, but alignment matters more.</li>
        </ul>

        <p>
          The more intentional you are, the better your matches will be.
        </p>

        <p>We’re excited to have you inside.</p>

        <p>
          Welcome aboard,<br/>
          <b>Team WingMann</b><br/>
          <i>Date with Intent</i>
        </p>
      </div>
    `,
  };
};


const getAcceptedTemplate = (name) => {
  return {
    subject: "Update on your WingMann application",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        
        <h2>Hey ${name},</h2>

        <p>
          Thank you so much for taking the time to apply to WingMann.
          We genuinely appreciate your interest in being part of our community.
        </p>

        <p>
          After carefully reviewing your profile, we feel that WingMann be the right fit for you at this moment.
        </p>

       
        <p>
          Wishing you clarity, meaningful connections, and the very best ahead.
        </p>

        <br/>

        <p>
          Warmly,<br/>
          <strong>Team WingMann</strong><br/>
          Date with Intent
        </p>

      </div>
    `,
  };
};


const getRejectedTemplate = (name, reason) => {
  return {
    subject: "Update on your WingMann application",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        
        <h2>Hey ${name},</h2>

        <p>
          Thank you so much for taking the time to apply to WingMann.
          We genuinely appreciate your interest in being part of our community.
        </p>

        <p>
          After carefully reviewing your profile, we feel that WingMann may not be the right fit for you at this moment.
        </p>

        <p>
          <strong>Reason:</strong> ${reason || "Not specified"}
        </p>

        <p>
          This decision is not a reflection of your values or intentions. 
          WingMann is a thoughtfully curated experience and our selections 
          are based on maintaining a specific balance within the community.
        </p>

        <p>
          We know putting yourself out there isn’t easy and we respect that you did. 
          You’re welcome to reapply in the future if circumstances change.
        </p>

        <p>
          Wishing you clarity, meaningful connections, and the very best ahead.
        </p>

        <br/>

        <p>
          Warmly,<br/>
          <strong>Team WingMann</strong><br/>
          Date with Intent
        </p>

      </div>
    `,
  };
};

 const emailInterviewData  =(name,date,time,meetlink)=>{
  return{
    subject: "Reminder: Your WingMate interview is scheduled",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Hey ${name},</p>

        <p>
          Just a gentle reminder that your <b>WingMate interview</b> has been scheduled.
        </p>

        <p>🗓 <b>Date:</b> ${date}</p>
        <p>⏰ <b>Time:</b> ${time}</p>
        <p>📍 <b>Mode:</b> Video</p>

        <p>
          This conversation is meant to be relaxed and meaningful, a space for us
          to understand you better and ensure WingMann is the right fit for you.
        </p>

        <p>
          Please make sure you’re available a few minutes prior to the scheduled time.
        </p>

        <p>
          <a href="${meetlink}" target="_blank" 
            style="display:inline-block; padding:10px 15px; background:#6c5ce7; color:#fff; text-decoration:none; border-radius:5px;">
            Join Interview
          </a>
        </p>

        <p>
          If you need to reschedule or have any questions, feel free to reply to this email.
        </p>

        <br/>

        <p>Looking forward to connecting with you.</p>

        <p>
          Warmly,<br/>
          <b>Team WingMann</b><br/>
          <i>Date with Intent</i>
        </p>
      </div>
    `,
    }
  };

const sendEmailonInterview = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"WingMann" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = {
  welcomeTemplate,getAcceptedTemplate,getRejectedTemplate,sendEmailonInterview,emailInterviewData
};