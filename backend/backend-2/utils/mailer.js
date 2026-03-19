const nodemailer = require('nodemailer');

const getTransporter = () => {
    // const host = process.env.SMTP_HOST;
    // const port = Number(process.env.SMTP_PORT || 587);
    // const user = process.env.SMTP_USER;
    // const pass = process.env.SMTP_PASS;

    // if (!host || !user || !pass) {
    //     return null;
    // }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "madasamyi2000@gmail.com",
            pass: "guyh mmxu qihf uzozz"
        }
    })
    return transporter;
};

exports.sendPasswordResetEmail = async ({ to, resetUrl }) => {
    const transporter = getTransporter();

    if (!transporter) {
        throw new Error('SMTP is not configured');
    }

    // const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
        from: "madasamyi2000@gmail.com",
        to,
        subject: 'Movie Guesser Password Reset',
        text: `You requested a password reset. Use this link to reset your password: ${resetUrl}. This link expires soon.`,
        html: `<p>You requested a password reset.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`
    });
};
