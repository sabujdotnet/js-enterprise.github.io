// netlify/functions/send-invoice.js
const nodemailer = require('nodemailer'); // Import nodemailer

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Adjust if needed for security
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }

  try {
    // Parse the request body (contains recipient, subject, body, and invoiceData)
    const body = JSON.parse(event.body);
    const { to, subject, text, html, invoiceData, invoiceName = 'invoice.pdf' } = body;

    console.log('Received request to send email to:', to);

    if (!to || !invoiceData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, invoiceData' }),
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
      };
    }

    // --- Configure Nodemailer Transport (Example using Gmail SMTP) ---
    // You need to set these environment variables in your Netlify dashboard
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // e.g., smtp.gmail.com
      port: parseInt(process.env.SMTP_PORT || 587),   // e.g., 587 or 465
      secure: process.env.SMTP_SECURE === 'true',     // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // Your email address
        pass: process.env.SMTP_PASS, // Your app password (recommended) or password
      },
    });

    // Define the email options, including the attachment
    const mailOptions = {
      from: process.env.SMTP_USER || '"Invoice Sender" <noreply@yourdomain.com>', // Sender address
      to: to, // List of receivers
      subject: subject || 'Your Invoice', // Subject line
      text: text || 'Please find the attached invoice.', // Plain text body
      html: html || '<p>Please find the attached invoice.</p>', // HTML body
      attachments: [
        {
          filename: invoiceName, // Name of the file
          content: Buffer.from(invoiceData, 'base64'), // Decode the base64 string to binary
          contentType: 'application/pdf', // Specify the MIME type
        },
      ],
    };

    console.log('Attempting to send email...');

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Invoice sent successfully!' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send invoice. Please check the logs.' }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    };
  }
};