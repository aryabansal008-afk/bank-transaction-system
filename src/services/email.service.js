const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

transporter.verify((error,success)=>{
    if(error){
        console.error('Error connecting to email server:',error);
    }else{
        console.log('Email server is ready to send messages');
    }
});

const sendEmail = async(to, subject, text, html)=>{
    try {
        const info = await transporter.sendMail({
            from: `"Backend Ledger" <${process.env.EMAIL_USER}>`, // sender address
            to, // list of recipients
            subject, // subject line
            text, // plain text body
            html, // HTML body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    } catch (err) {
        console.error("Error while sending mail:", err);
    }
}

async function sendRegistrationEmail(userEmail,name){
    const subject = 'Welcome to Backend Ledger!';
    const text = `Hello ${name},\n\nThankyou for registering Backend Ledger. We are onboarding you by the time check our website for more ...`;
    const html = `<p>Hello ${name},</p><p>Thankyou for registering Backend Ledger. We are onboarding you by the time check our website for more ...</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, account, toAccount){
    const subject = 'Transaction Successful!';
    const text = `Hello ${name}, \n\nYour transaction of ${amount} to account ${toAccount} was successful.`;
    const html = `<p>Hello ${name},</p><p>Your transaction of ${amount} to account ${toAccount} was successful.</p>`

    await sendEmail(userEmail,subject,text,html);
}

async function sendTransactionFailureEmail(userEmail, name, account, toAccount){
    const subject = 'Transaction Failed!';
    const text = `Hello ${name}, \n\nWe regret to inform you that your transaction of ${amount} to account ${toAccount} is failed.`;
    const html = `<p>Hello ${name},</p><p>We regret to inform you that your transaction of ${amount} to account ${toAccount} is failed.</p>`

    await sendEmail(userEmail,subject,text,html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};