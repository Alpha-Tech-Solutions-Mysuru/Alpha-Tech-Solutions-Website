const nodemailer = require('nodemailer');

function parseRequestBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (error) {
      return {};
    }
  }
  return body;
}

function getMailErrorMessage(error) {
  const code = error && (error.code || error.responseCode);

  if (code === 'EAUTH' || code === 535) {
    return 'Mail authentication failed. Check SMTP username, password, and app-password settings.';
  }

  if (code === 'ECONNECTION' || code === 'ESOCKET' || code === 'ETIMEDOUT') {
    return 'Mail server connection failed. Check SMTP host, port, and provider access rules.';
  }

  return 'Internal server error processing mail request.';
}

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' });
  }

  try {
    const payload = parseRequestBody(req.body);
    const { name, email, phone, businessName, serviceRequired, preferredContact, message, honeypot } = payload;

    // 1. Honeypot Spam Protection
    if (honeypot && honeypot.trim() !== '') {
      console.warn('Spam submission detected and blocked via honeypot.');
      return res.status(200).json({
        success: true,
        message: 'Enquiry received. (Spam filtered)'
      });
    }

    // 2. Input Validation
    if (!name || !name.trim() || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a valid name (minimum 2 characters).' });
    }

    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!email || !email.trim() || !emailRegex.test(email.trim().toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    const sanitizedPhone = phone ? phone.trim().replace(/\s+/g, '') : '';
    if (!phone || !sanitizedPhone || !phoneRegex.test(sanitizedPhone)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit Indian phone number.' });
    }

    if (!businessName || !businessName.trim() || businessName.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a valid business name.' });
    }

    const validServices = [
      'Website Development',
      'E-Commerce Development',
      'SEO Optimization',
      'Website Maintenance',
      'Cybersecurity Services',
      'UI/UX Design'
    ];
    if (!serviceRequired || !validServices.includes(serviceRequired)) {
      return res.status(400).json({ success: false, message: 'Please select a valid service from the options.' });
    }

    const validContacts = ['Email', 'Phone', 'WhatsApp'];
    if (!preferredContact || !validContacts.includes(preferredContact)) {
      return res.status(400).json({ success: false, message: 'Please select a valid preferred contact method.' });
    }

    if (!message || !message.trim() || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please write a message with at least 10 characters.' });
    }

    // 3. Dynamic Lead Reference ID Generation
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit unique random index
    const leadId = `ATS-2026-${randomSuffix}`;

    // 4. IP Capture & Timestamp
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' (IST)';

    // 5. Future MongoDB Lead Storage Hook
    /*
    // Future MongoDB Lead Storage
    try {
      const MongoClient = require('mongodb').MongoClient;
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db('alphatech');
      const lead = {
        leadId,
        name: name.trim(),
        email: email.trim(),
        phone: sanitizedPhone,
        businessName: businessName.trim(),
        serviceRequired,
        preferredContact,
        message: message.trim(),
        ipAddress,
        date: new Date()
      };
      await db.collection('leads').insertOne(lead);
      await client.close();
      console.log(`Lead ${leadId} successfully written to MongoDB.`);
    } catch (dbErr) {
      console.error('Failed to write to MongoDB:', dbErr);
    }
    */

    // 6. Setup mail bodies
    // Admin enquiry details email content
    const adminMailOptions = {
      from: `"ATS Server" <${process.env.SMTP_USER || 'no-reply@alphatechsolutions.in'}>`,
      to: 'alphatechsolutions.in@gmail.com',
      replyTo: email.trim(),
      subject: `🚀 New Website Enquiry - ${leadId}`,
      text: `New Website Enquiry Details:\n\nReference ID: ${leadId}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nBusiness Name: ${businessName}\nService Required: ${serviceRequired}\nPreferred Contact: ${preferredContact}\nMessage: ${message}\nSubmitted At: ${formattedDate}\nIP Address: ${ipAddress}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px;">
            <span style="font-size: 24px; font-weight: 700; color: #0f172a;">Alpha Tech <span style="color: #2563eb;">Solutions</span></span>
            <div style="font-size: 12px; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.1em;">Design. Develop. Grow.</div>
          </div>
          <h2 style="color: #2563eb; font-size: 20px; margin-top: 0; text-align: center;">🚀 New Lead: ${leadId}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 180px; color: #475569;">Reference ID</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #2563eb;">${leadId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Client Name</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Email Address</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Phone Number</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Business Name</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${businessName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Service Required</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${serviceRequired}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Preferred Contact</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #06b6d4; font-weight: 600;">${preferredContact}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569; vertical-align: top;">Message</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; white-space: pre-line;">${message}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #475569;">Submitted At</td>
              <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 0.9em;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #475569;">Client IP</td>
              <td style="padding: 10px; color: #475569; font-size: 0.9em;">${ipAddress}</td>
            </tr>
          </table>
        </div>
      `
    };

    // Client auto-reply thank-you email content
    const clientMailOptions = {
      from: `"Alpha Tech Solutions" <${process.env.SMTP_USER || 'no-reply@alphatechsolutions.in'}>`,
      to: email.trim(),
      subject: `Thank You for Contacting Alpha Tech Solutions - ${leadId}`,
      text: `Hello ${name},\n\nThank you for contacting Alpha Tech Solutions.\n\nWe have received your enquiry (Reference ID: ${leadId}) and will review your requirements shortly.\n\nOur team will contact you within 24 hours via your preferred contact method: ${preferredContact}.\n\nRegards,\nAlpha Tech Solutions\nDesign. Develop. Grow.\nEmail: alphatechsolutions.in@gmail.com\nPhone: +91 8431698587`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px;">
            <div style="font-size: 24px; font-weight: 700; color: #0f172a;">Alpha Tech <span style="color: #2563eb;">Solutions</span></div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Design. Develop. Grow.</div>
          </div>
          <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 15px;">Thank you for contacting <strong>Alpha Tech Solutions</strong>. We have successfully received your enquiry and created a project profile for you.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold; margin-bottom: 6px;">Your Reference ID</div>
            <div style="font-size: 22px; font-weight: 700; color: #2563eb; letter-spacing: 0.05em;">${leadId}</div>
            <div style="font-size: 13px; color: #475569; margin-top: 10px;">Our team will get back to you shortly via <strong>${preferredContact}</strong>.</div>
          </div>

          <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Our Core Offerings</h3>
          <ul style="padding-left: 20px; margin: 0 0 24px 0; font-size: 14px; color: #475569;">
            <li style="margin-bottom: 6px;"><strong>Website Development</strong>: High-performing business websites & custom applications.</li>
            <li style="margin-bottom: 6px;"><strong>E-Commerce Solutions</strong>: Feature-rich digital storefronts with secure payment routes.</li>
            <li style="margin-bottom: 6px;"><strong>SEO Optimization</strong>: Strategic optimization to rank highly and generate organic growth.</li>
            <li style="margin-bottom: 6px;"><strong>Cybersecurity Services</strong>: Rigorous defense blueprints and compliance audits to guard systems.</li>
            <li style="margin-bottom: 6px;"><strong>UI/UX Design</strong>: Modern, conversion-focused interfaces structured around user flows.</li>
          </ul>

          <h3 style="color: #0f172a; font-size: 16px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Contact Information</h3>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 100px; color: #64748b;">Phone</td>
              <td style="padding: 4px 0; color: #0f172a;">+91 8431698587 (WhatsApp Available)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #64748b;">Email</td>
              <td style="padding: 4px 0;"><a href="mailto:alphatechsolutions.in@gmail.com" style="color: #2563eb; text-decoration: none;">alphatechsolutions.in@gmail.com</a></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold; color: #64748b;">Address</td>
              <td style="padding: 4px 0; color: #0f172a;">Mysuru, Karnataka, India</td>
            </tr>
          </table>

          <p style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center;">
            This is an automated response to confirm receipt of your contact form.<br>
            &copy; 2026 Alpha Tech Solutions. All Rights Reserved.
          </p>
        </div>
      `
    };

    // 7. Check for SMTP credentials and verify production flags
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_SERVICE
    } = process.env;

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

    if ((!SMTP_SERVICE && !SMTP_HOST) || !SMTP_USER || !SMTP_PASS) {
      if (isProduction) {
        // Crash immediately in production if variables are missing
        console.error('CRITICAL: SMTP environment variables are missing in production environment.');
        return res.status(500).json({
          success: false,
          message: 'Mail server configuration missing. Submission failed.'
        });
      }

      // Simulation/Preview Mode in local development
      console.log('--- [SMTP DEVELOPMENT SIMULATION MODE] ---');
      console.log('Lead ID generated:', leadId);
      console.log('Sending Admin Notification Alert:');
      console.log('To:', adminMailOptions.to);
      console.log('Subject:', adminMailOptions.subject);
      console.log('Reply-To:', adminMailOptions.replyTo);
      console.log('Body Text:', adminMailOptions.text);
      console.log('-------------------------------------------------------------------------');
      console.log('Sending Customer Confirmation:');
      console.log('To:', clientMailOptions.to);
      console.log('Subject:', clientMailOptions.subject);
      console.log('Body Text:', clientMailOptions.text);
      console.log('----------------------- [SIMULATION END] ---------------------------------');

      return res.status(200).json({
        success: true,
        leadId,
        message: 'Enquiry submitted successfully. (SMTP Simulation Mode: Emails logged to console)'
      });
    }

    // 8. Create Nodemailer Transport
    const transporterConfig = {
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    };

    if (SMTP_SERVICE) {
      transporterConfig.service = SMTP_SERVICE;
    } else {
      transporterConfig.host = SMTP_HOST;
      transporterConfig.port = parseInt(SMTP_PORT || '587', 10);
      transporterConfig.secure = parseInt(SMTP_PORT || '587', 10) === 465;
    }

    const transporter = nodemailer.createTransport(transporterConfig);

    await transporter.verify();

    // Send the admin notification first. If the client auto-reply fails,
    // the lead should still be accepted because the business notification succeeded.
    await transporter.sendMail(adminMailOptions);

    try {
      await transporter.sendMail(clientMailOptions);
    } catch (clientMailError) {
      console.error('Client confirmation mail failed:', clientMailError);
    }

    // 10. Return Success payload
    return res.status(200).json({
      success: true,
      leadId,
      message: 'Enquiry submitted successfully. Confirmation email sent.'
    });

  } catch (error) {
    console.error('Server Side Mail Submission Error:', error);
    return res.status(500).json({
      success: false,
      message: getMailErrorMessage(error)
    });
  }
};
