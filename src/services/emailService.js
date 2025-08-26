const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Store your key in .env

const sendPasswordResetEmail = async (to, newPassword) => {
    const msg = {
        to,
        from: 'your_verified_sender@example.com', // Must be verified in SendGrid
        subject: 'Your Password Has Been Reset',
        text: `Hi, your new password is: ${newPassword}. Please log in and change it.`,
        html: `<p>Hi,</p><p>Your new password is: <strong>${newPassword}</strong></p><p>Please log in and change it immediately.</p>`
    };

    await sgMail.send(msg);
};