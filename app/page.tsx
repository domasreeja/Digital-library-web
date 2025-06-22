"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, Search, Award } from "lucide-react"
import Link from "next/link"

const slides = [
  {
    title: "Welcome to Digital Library",
    description: "Discover thousands of books and resources at your fingertips",
    image: "/placeholder.svg?height=400&width=600",
    icon: BookOpen,
  },
  {
    title: "Student Portal",
    description: "Search books, get recommendations, and manage your reading journey",
    image: "/placeholder.svg?height=400&width=600",
    icon: Users,
  },
  {
    title: "Advanced Search",
    description: "Find exactly what you're looking for with our powerful search tools",
    image: "/placeholder.svg?height=400&width=600",
    icon: Search,
  },
  {
    title: "Excellence in Learning",
    description: "Join thousands of students in their academic success journey",
    image: "/placeholder.svg?height=400&width=600",
    icon: Award,
  },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>
            </div>
            <nav className="flex space-x-4">
              <Link href="/user-selection">
                <Button variant="outline">Login</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Carousel */}
      <section className="relative h-96 overflow-hidden">
        {slides.map((slide, index) => {
          const Icon = slide.icon
          return (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="relative h-full bg-gradient-to-r from-blue-600 to-purple-700">
                <div className="absolute inset-0 bg-black bg-opacity-30" />
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                  <div className="text-white max-w-2xl">
                    <div className="flex items-center space-x-3 mb-4">
                      <Icon className="h-12 w-12" />
                      <h2 className="text-4xl font-bold">{slide.title}</h2>
                    </div>
                    <p className="text-xl mb-8">{slide.description}</p>
                    <Link href="/user-selection">
                      <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white bg-opacity-50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Portal</h2>
            <p className="text-lg text-gray-600">Access your personalized library experience</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Student Portal</h3>
                <p className="text-gray-600 mb-6">Search books, get recommendations, and manage your reading journey</p>
                <Link href="/user-selection">
                  <Button className="w-full">Access Student Portal</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-4">Librarian Portal</h3>
                <p className="text-gray-600 mb-6">
                  Manage student records, track book loans, and maintain library data
                </p>
                <Link href="/user-selection">
                  <Button className="w-full bg-green-600 hover:bg-green-700">Access Librarian Portal</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
