"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle, Info } from "lucide-react"
import Link from "next/link"
import { saveToLocalStorage } from "@/lib/storage-utils"
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/twilio-sms"
import { sendReliableSMS, SMS_TEMPLATES } from "@/lib/twilio-sms";
export default function StudentRegister() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    rollNo: "",
    mobileNo: "",
    class: "",
    year: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }

    // Real-time phone number formatting
    if (field === "mobileNo") {
      const formatted = formatPhoneNumber(value)
      if (formatted !== value) {
        setFormData((prev) => ({ ...prev, [field]: formatted }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.rollNo.trim()) newErrors.rollNo = "Roll number is required"
    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = "Mobile number is required"
    } else if (!validatePhoneNumber(formData.mobileNo)) {
      newErrors.mobileNo = "Please enter a valid mobile number (e.g., +919876543210 or 9876543210)"
    }
    if (!formData.class) newErrors.class = "Class is required"
    if (!formData.year) newErrors.year = "Year is required"
    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Format phone number before saving
      const formattedMobileNo = formatPhoneNumber(formData.mobileNo)

      // Save individual user data to local storage
      saveToLocalStorage("studentUser", {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        rollNo: formData.rollNo,
        mobileNo: formattedMobileNo,
        class: formData.class,
        year: formData.year,
        userType: "student",
      })

      // Also add to centralized students array for librarian access
      try {
        const existingStudents = JSON.parse(localStorage.getItem("allStudents") || "[]")
        const newStudent = {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          rollNo: formData.rollNo,
          mobileNo: formattedMobileNo,
          class: formData.class,
          year: formData.year,
          userType: "student",
          registeredAt: new Date().toISOString(),
        }

        // Check if student already exists
        const studentExists = existingStudents.some((student: any) => student.email === formData.email)
        if (!studentExists) {
          existingStudents.push(newStudent)
          localStorage.setItem("allStudents", JSON.stringify(existingStudents))
        }
      } catch (error) {
        console.error("Error saving to students array:", error)
      }
      await sendReliableSMS(
       formattedMobileNo,
       SMS_TEMPLATES.ACCOUNT_CREATED(formData.firstName)
      );
      setIsSubmitted(true);
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your student account has been created. You can now login to access the library.
            </p>
            <Link href="/student/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/user-selection" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Selection
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Student Registration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rollNo">Roll Number</Label>
                  <Input
                    id="rollNo"
                    value={formData.rollNo}
                    onChange={(e) => handleInputChange("rollNo", e.target.value)}
                    className={errors.rollNo ? "border-red-500" : ""}
                  />
                  {errors.rollNo && <p className="text-red-500 text-sm mt-1">{errors.rollNo}</p>}
                </div>
                <div>
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input
                    id="mobileNo"
                    value={formData.mobileNo}
                    onChange={(e) => handleInputChange("mobileNo", e.target.value)}
                    className={errors.mobileNo ? "border-red-500" : ""}
                    placeholder="+919876543210 or 9876543210"
                  />
                  {errors.mobileNo && <p className="text-red-500 text-sm mt-1">{errors.mobileNo}</p>}
                  {formData.mobileNo && !errors.mobileNo && (
                    <div className="flex items-center mt-1 text-xs text-blue-600">
                      <Info className="h-3 w-3 mr-1" />
                      Formatted: {formatPhoneNumber(formData.mobileNo)}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="class">Class</Label>
                  <Select onValueChange={(value) => handleInputChange("class", value)}>
                    <SelectTrigger className={errors.class ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                      <SelectItem value="undergraduate">Undergraduate</SelectItem>
                      <SelectItem value="postgraduate">Postgraduate</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class}</p>}
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select onValueChange={(value) => handleInputChange("year", value)}>
                    <SelectTrigger className={errors.year ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <div className="bg-blue-50 p-3 rounded-md">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">SMS Notifications</p>
                    <p>
                      You'll receive SMS alerts for book borrowing, due dates, and overdue notices. Make sure your
                      mobile number is correct.
                    </p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
