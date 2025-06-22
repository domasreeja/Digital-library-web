// SMS notification service using Twilio API simulation

interface SmsMessage {
  to: string
  message: string
  timestamp: Date
  status: "sent" | "delivered" | "failed"
}

// Simulated message log
const messageLog: SmsMessage[] = []

// Simulated Twilio configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || "demo_account_sid",
  authToken: process.env.TWILIO_AUTH_TOKEN || "demo_auth_token",
  fromNumber: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
}

export const sendSmsNotification = async (phoneNumber: string, message: string): Promise<boolean> => {
  try {
    // In a real implementation, this would use the Twilio SDK
    // For demo purposes, we'll simulate the API call

    console.log(`📱 SMS Notification:`)
    console.log(`To: ${phoneNumber}`)
    console.log(`Message: ${message}`)
    console.log(`Timestamp: ${new Date().toISOString()}`)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Log the message
    const smsRecord: SmsMessage = {
      to: phoneNumber,
      message,
      timestamp: new Date(),
      status: "sent",
    }

    messageLog.push(smsRecord)

    // Simulate success/failure (95% success rate)
    const success = Math.random() > 0.05

    if (success) {
      smsRecord.status = "delivered"
      console.log(`✅ SMS sent successfully to ${phoneNumber}`)
      return true
    } else {
      smsRecord.status = "failed"
      console.log(`❌ SMS failed to send to ${phoneNumber}`)
      return false
    }
  } catch (error) {
    console.error("SMS sending error:", error)
    return false
  }
}

// Send bulk SMS notifications
export const sendBulkSms = async (
  recipients: Array<{ phone: string; message: string }>,
): Promise<{ sent: number; failed: number }> => {
  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    const success = await sendSmsNotification(recipient.phone, recipient.message)
    if (success) {
      sent++
    } else {
      failed++
    }

    // Add delay between messages to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  return { sent, failed }
}

// Get SMS message history
export const getSmsHistory = (): SmsMessage[] => {
  return [...messageLog].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Predefined SMS templates
export const SMS_TEMPLATES = {
  BOOK_BORROWED: (bookTitle: string, dueDate: string) =>
    `You have borrowed "${bookTitle}". Please return by ${dueDate}. Thank you!`,

  BOOK_RETURNED: (bookTitle: string) =>
    `You have successfully returned "${bookTitle}". Thank you for using our library!`,

  DUE_REMINDER: (bookTitle: string, daysLeft: number) =>
    `Reminder: "${bookTitle}" is due in ${daysLeft} day(s). Please return on time to avoid late fees.`,

  OVERDUE_NOTICE: (bookTitle: string, daysOverdue: number) =>
    `OVERDUE: "${bookTitle}" was due ${daysOverdue} day(s) ago. Please return immediately to avoid additional fees.`,

  BOOK_AVAILABLE: (bookTitle: string) =>
    `Good news! "${bookTitle}" is now available for borrowing. Visit the library to collect it.`,

  ACCOUNT_CREATED: (name: string) =>
    `Welcome ${name}! Your library account has been created successfully. Happy reading!`,
}
