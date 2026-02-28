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

module.exports = {
  welcomeTemplate,
};