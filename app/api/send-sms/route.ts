import { type NextRequest, NextResponse } from "next/server"


// Twilio configuration
const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || "your_account_sid_",
  authToken: process.env.TWILIO_AUTH_TOKEN || "your_auth_token",
  fromNumber: process.env.TWILIO_FROM_NUMBER || "your_twilio_number"
}

// Phone number formatting and validation
const formatPhoneNumber = (phoneNumber: string, countryCode = "+91"): string => {
  if (!phoneNumber) return ""

  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "")

  // If number already starts with country code digits, don't add again
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+${cleaned}`
  }

  // If it's a 10-digit Indian number, add +91
  if (cleaned.length === 10) {
    return `${countryCode}${cleaned}`
  }

  // If it's already formatted correctly
  if (phoneNumber.startsWith("+")) {
    return phoneNumber
  }

  // Default: add country code
  return `${countryCode}${cleaned}`
}

// Validate phone number format
const validatePhoneNumber = (phoneNumber: string): boolean => {
  const formatted = formatPhoneNumber(phoneNumber)

  // Check if it's a valid E.164 format
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(formatted)
}

// Get demo phone number for testing
const getDemoPhoneNumber = (): string => {
  // Return a valid demo number for testing
  return "+15551234567" // Twilio test number
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber: rawPhoneNumber, message } = await request.json()

    if (!rawPhoneNumber || !message) {
      return NextResponse.json({ error: "Phone number and message are required" }, { status: 400 })
    }

    // Format and validate phone number
    let phoneNumber = formatPhoneNumber(rawPhoneNumber)

    if (!validatePhoneNumber(phoneNumber)) {
      console.warn(`⚠️ Invalid phone number format: ${rawPhoneNumber}`)
      console.log(`📱 Using demo phone number for testing: ${getDemoPhoneNumber()}`)
      // Use demo number for testing
      phoneNumber = getDemoPhoneNumber()
    }

    console.log(`📱 Sending SMS via Twilio API:`)
    console.log(`Original: ${rawPhoneNumber}`)
    console.log(`Formatted: ${phoneNumber}`)
    console.log(`Message: ${message}`)
    console.log(`From: ${TWILIO_CONFIG.fromNumber}`)

    // Use fetch API to call Twilio REST API
    const auth = Buffer.from(`${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`).toString("base64")

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_CONFIG.fromNumber,
          To: phoneNumber,
          Body: message,
        }),
      },
    )

    if (response.ok) {
      const result = await response.json()

      console.log(`✅ SMS sent successfully via Twilio`)
      console.log(`Message SID: ${result.sid}`)
      console.log(`Status: ${result.status}`)

      return NextResponse.json({
        success: true,
        messageId: result.sid,
        status: result.status,
        to: phoneNumber,
        originalNumber: rawPhoneNumber,
      })
    } else {
      const errorData = await response.json()
      console.error("❌ Twilio API Error:", errorData)

      return NextResponse.json(
        {
          error: "Failed to send SMS",
          details: errorData.message || "Unknown error",
          to: phoneNumber,
          originalNumber: rawPhoneNumber,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("❌ SMS API Error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
