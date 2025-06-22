"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UserSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Portal</h1>
          <p className="text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Student</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">Access your student account to search books and get recommendations</p>
              <div className="space-y-2">
                <Link href="/student/register" className="block">
                  <Button className="w-full">Register as Student</Button>
                </Link>
                <Link href="/student/login" className="block">
                  <Button variant="outline" className="w-full">
                    Student Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <BookOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl">Librarian</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">Manage library operations and student records</p>
              <div className="space-y-2">
                <Link href="/librarian/register" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700">Register as Librarian</Button>
                </Link>
                <Link href="/librarian/login" className="block">
                  <Button variant="outline" className="w-full">
                    Librarian Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
