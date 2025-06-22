"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getFromLocalStorage, saveToLocalStorage } from "@/lib/storage-utils"

export default function StudentLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  // Check for stored credentials on component mount
  useEffect(() => {
    const storedUser = getFromLocalStorage("studentUser")
    if (storedUser) {
      setFormData({
        email: storedUser.email || "",
        password: storedUser.password || "",
      })
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) newErrors.email = "Email is required"
    if (!formData.password) newErrors.password = "Password is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      // Get the registered student data
      const storedUser = getFromLocalStorage("studentUser")

      if (storedUser && storedUser.email === formData.email && storedUser.password === formData.password) {
        // Check if student already exists in logged in students
        const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]")
        const existingStudent = loggedInStudents.find((student: any) => student.email === formData.email)

        // Preserve borrowed books if student exists
        const borrowedBooks = existingStudent?.borrowedBooks || []

        // Save login session with full user details
        saveToLocalStorage("currentUser", {
          email: formData.email,
          userType: "student",
          isLoggedIn: true,
          firstName: storedUser.firstName,
          lastName: storedUser.lastName,
          rollNo: storedUser.rollNo,
          mobileNo: storedUser.mobileNo,
          class: storedUser.class,
          year: storedUser.year,
          loginTime: new Date().toISOString(),
          borrowedBooks: borrowedBooks, // Include borrowed books in current user
        })

        // Add to logged in students list for librarian dashboard
        try {
          const studentData = {
            id: existingStudent?.id || Date.now(), // Use existing ID or create new one
            name: `${storedUser.firstName} ${storedUser.lastName}`,
            rollNo: storedUser.rollNo,
            email: formData.email,
            mobileNo: storedUser.mobileNo,
            class: storedUser.class,
            year: storedUser.year,
            borrowedBooks: borrowedBooks, // Preserve borrowed books
            overdueBooks: existingStudent?.overdueBooks || 0,
            loginTime: new Date().toISOString(),
            isActive: true,
          }

          // Check if student already exists in logged in list
          const existingIndex = loggedInStudents.findIndex((student: any) => student.email === formData.email)
          if (existingIndex >= 0) {
            // Update existing entry but preserve borrowed books
            loggedInStudents[existingIndex] = {
              ...loggedInStudents[existingIndex],
              ...studentData,
              borrowedBooks: borrowedBooks, // Make sure borrowed books are preserved
            }
          } else {
            // Add new entry
            loggedInStudents.push(studentData)
          }

          localStorage.setItem("loggedInStudents", JSON.stringify(loggedInStudents))
        } catch (error) {
          console.error("Error updating logged in students:", error)
        }

        router.push("/student/dashboard")
      } else {
        setErrors({ email: "Invalid email or password" })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-6">
          <Link href="/user-selection" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User Selection
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Student Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                {"Don't have an account? "}
                <Link href="/student/register" className="text-blue-600 hover:text-blue-800">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
