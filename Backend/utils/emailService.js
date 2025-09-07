import nodemailer from 'nodemailer';

export const sendOTP = async (email, otp) => {
  try {
    // Verify environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured in environment variables');
    }

    // console.log('Using Gmail account:', process.env.GMAIL_USER);
    
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      debug: true,
      logger: true
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Gym Management" <noreply@gymmanagement.com>',
      to: email,
      subject: 'Verify Your Email',
      text: `Your OTP for email verification is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering with Gym Management. Please use the following OTP to verify your email:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    // console.log('Email sent successfully to:', email);
    return true;
  } catch (error) {
    // console.error('Error sending email:', error);
    return false;
  }
};

export const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendExpirationNotification = async (email, daysRemaining = null) => {
  try {
    // Verify environment variables
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured in environment variables');
    }

    // console.log('Sending expiration notification to:', email);
    
    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      debug: true,
      logger: true
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Gym Management" <noreply@gymmanagement.com>',
      to: email,
      subject: 'Membership Expiration Notice',
      text: `Your membership is going to expire ${daysRemaining !== null ? `in ${daysRemaining} days` : 'soon'}. Please renew to continue enjoying our services.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Membership Expiration Notice</h2>
          <p>Dear Member,</p>
          <p>This is to inform you that your gym membership is going to expire ${daysRemaining !== null ? `<strong>in ${daysRemaining} days</strong>` : '<strong>soon</strong>'}.</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; font-size: 18px;">
            <strong>Please renew your membership to continue enjoying our services.</strong>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for being a valued member!</p>
        </div>
      `,
    });

    // console.log('Expiration notification sent successfully to:', email);
    return true;
  } catch (error) {
    // console.error('Error sending expiration notification:', error);
    return false;
  }
};
