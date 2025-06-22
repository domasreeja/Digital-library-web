"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BookOpen, LogOut, Lightbulb, Camera, AlertTriangle } from "lucide-react"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { useRouter } from "next/navigation"
import { bookData, type Book } from "@/lib/book-data"
import { getRecommendations } from "@/lib/recommendation-engine"
import { sendReliableSMS, calculateDaysDifference, SMS_TEMPLATES } from "@/lib/twilio-sms"
import { saveToLocalStorage } from "@/lib/storage-utils"
import BarcodeScanner from "@/components/barcode-scanner"
import build from "next/dist/build"

// Define types for better TypeScript support
interface BorrowedBook extends Book {
  borrowDate?: string
  dueDate?: string
}

// Union type for handling legacy borrowed books (might be strings or objects)
type BorrowedBookItem = BorrowedBook | string

interface Student {
  id: number
  name: string
  rollNo: string
  email: string
  mobileNo: string
  class: string
  year: string
  borrowedBooks: BorrowedBookItem[]
  overdueBooks?: number
  loginTime: string
  isActive: boolean
}

interface User {
  email: string
  userType: string
  isLoggedIn: boolean
  firstName: string
  lastName: string
  rollNo: string
  mobileNo: string
  class: string
  year: string
  loginTime?: string
  borrowedBooks?: BorrowedBookItem[]
}

interface BookStatus {
  status: "normal" | "due-soon" | "overdue"
  message: string
}

export default function StudentDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Book[]>(bookData)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannedBook, setScannedBook] = useState<Book | null>(null)
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([])
  const [availableBooks, setAvailableBooks] = useState<Book[]>(bookData)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const currentUser = getFromLocalStorage("currentUser") as User | null
    if (!currentUser || !currentUser.isLoggedIn || currentUser.userType !== "student") {
      router.push("/student/login")
      return
    }

    setUser(currentUser)

    // Get personalized recommendations
    const recs = getRecommendations(currentUser.email)
    setRecommendations(recs)

    // First check if currentUser has borrowedBooks
    if (currentUser.borrowedBooks && Array.isArray(currentUser.borrowedBooks)) {
      setBorrowedBooks(currentUser.borrowedBooks as any)
    } else {
      // If not, load from loggedInStudents as fallback
      loadBorrowedBooks(currentUser.email)
    }

    // Update available books
    loadAvailableBooks()
  }, [router])

  const loadBorrowedBooks = (userEmail: string) => {
    try {
      const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]") as Student[]
      const currentStudent = loggedInStudents.find((student: Student) => student.email === userEmail)
      if (currentStudent && currentStudent.borrowedBooks) {
        setBorrowedBooks(currentStudent.borrowedBooks as any)
      }
    } catch (error) {
      console.error("Error loading borrowed books:", error)
    }
  }

  const loadAvailableBooks = () => {
    try {
      // Get all borrowed books from all students
      const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]") as Student[]
      const allBorrowedBooks: string[] = []

      loggedInStudents.forEach((student: Student) => {
        if (student.borrowedBooks) {
          student.borrowedBooks.forEach((book: BorrowedBookItem) => {
            const bookTitle = typeof book === "string" ? book : (book as BorrowedBook).title
            allBorrowedBooks.push(bookTitle)
          })
        }
      })

      // Update book availability
      const updatedBooks = bookData.map((book) => ({
        ...book,
        available: !allBorrowedBooks.includes(book.title),
        borrowedBy: allBorrowedBooks.includes(book.title)
          ? loggedInStudents.find((s: Student) =>
              s.borrowedBooks?.some((b: BorrowedBookItem) => {
                const bookTitle = typeof b === "string" ? b : (b as BorrowedBook).title
                return bookTitle === book.title
              }),
            )?.name || "Unknown"
          : null,
      }))

      setAvailableBooks(updatedBooks)
      setSearchResults(updatedBooks)
    } catch (error) {
      console.error("Error loading available books:", error)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const filtered = availableBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.isbn.includes(searchQuery),
      )
      setSearchResults(filtered)
    } else {
      setSearchResults(availableBooks)
    }
  }

  const handleBarcodeDetected = (barcode: string) => {
    console.log("Barcode detected:", barcode)

    // Find book by barcode
    const book = availableBooks.find((b) => b.barcode === barcode || b.isbn === barcode)
    if (book) {
      setScannedBook(book)
      setSearchQuery(book.title)
      setSearchResults([book])
      setShowScanner(false)
    } else {
      // If no book found, search by the barcode as ISBN
      const bookByIsbn = availableBooks.find((b) => b.isbn.replace(/-/g, "") === barcode.replace(/-/g, ""))
      if (bookByIsbn) {
        setScannedBook(bookByIsbn)
        setSearchQuery(bookByIsbn.title)
        setSearchResults([bookByIsbn])
        setShowScanner(false)
      } else {
        alert(`No book found with barcode: ${barcode}`)
        setShowScanner(false)
      }
    }
  }

  const borrowBook = async (bookId: number) => {
    const book = availableBooks.find((b) => b.id === bookId)
    if (book && user && book.available) {
      const currentDate = new Date()
      const dueDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000)

      const borrowedBookRecord: BorrowedBook = {
        ...book,
        borrowDate: currentDate.toISOString(),
        dueDate: dueDate.toISOString(),
      }

      // Update borrowed books in state
      const updatedBorrowedBooks = [...borrowedBooks, borrowedBookRecord]
      setBorrowedBooks(updatedBorrowedBooks as any)

      // Update logged in students data
      try {
        // Update loggedInStudents
        const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]") as Student[]
        const updatedStudents = loggedInStudents.map((student: Student) => {
          if (student.email === user.email) {
            return {
              ...student,
              borrowedBooks: updatedBorrowedBooks,
            }
          }
          return student
        })
        localStorage.setItem("loggedInStudents", JSON.stringify(updatedStudents))

        // Also update currentUser
        const currentUser = getFromLocalStorage("currentUser") as User | null
        if (currentUser) {
          currentUser.borrowedBooks = updatedBorrowedBooks
          saveToLocalStorage("currentUser", currentUser)
        }
      } catch (error) {
        console.error("Error updating borrowed books:", error)
      }

      // Update available books
      loadAvailableBooks()

      // Send SMS notification using reliable method
      try {
        const message = SMS_TEMPLATES.BOOK_BORROWED(book.title, dueDate.toLocaleDateString())
        await sendReliableSMS(user.mobileNo || "1234567890", message)
      } catch (error) {
        console.error("Error sending SMS:", error)
      }

      alert(`Book "${book.title}" has been borrowed successfully! Due date: ${dueDate.toLocaleDateString()}`)
    }
  }

  const returnBook = async (bookTitle: string) => {
    // Update borrowed books in state
    const updatedBorrowedBooks = borrowedBooks.filter((book) => {
      const title = typeof book === "string" ? book : (book as BorrowedBook).title
      return title !== bookTitle
    })
    setBorrowedBooks(updatedBorrowedBooks as any)

    // Update logged in students data
    try {
      // Update loggedInStudents
      const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]") as Student[]
      const updatedStudents = loggedInStudents.map((student: Student) => {
        if (student.email === user?.email) {
          return {
            ...student,
            borrowedBooks: updatedBorrowedBooks,
            overdueBooks: Math.max(0, (student.overdueBooks || 0) - 1), // Reduce overdue count
          }
        }
        return student
      })
      localStorage.setItem("loggedInStudents", JSON.stringify(updatedStudents))

      // Also update currentUser
      const currentUser = getFromLocalStorage("currentUser") as User | null
      if (currentUser) {
        currentUser.borrowedBooks = updatedBorrowedBooks
        saveToLocalStorage("currentUser", currentUser)
      }
    } catch (error) {
      console.error("Error updating borrowed books:", error)
    }

    // Update available books
    loadAvailableBooks()

    // Send SMS notification using reliable method
    try {
      const message = SMS_TEMPLATES.BOOK_RETURNED(bookTitle)
      if (user?.mobileNo) {
        await sendReliableSMS(user.mobileNo, message)
      }
    } catch (error) {
      console.error("Error sending SMS:", error)
    }

    alert(`Book "${bookTitle}" has been returned successfully.`)
  }

  const getBookStatus = (book: BorrowedBook): BookStatus => {
    if (!book.borrowDate) return { status: "normal", message: "" }

    const borrowDate = new Date(book.borrowDate)
    const currentDate = new Date()
    const daysBorrowed = calculateDaysDifference(borrowDate, currentDate)

    if (daysBorrowed >= 15) {
      const daysOverdue = daysBorrowed - 14
      return {
        status: "overdue",
        message: `${daysOverdue} days overdue`,
      }
    } else if (daysBorrowed >= 12) {
      const daysLeft = 14 - daysBorrowed
      return {
        status: "due-soon",
        message: `Due in ${daysLeft} day(s)`,
      }
    }

    return { status: "normal", message: "" }
  }

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barcode Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
          </div>
        )}

        <Tabs defaultValue="search">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="search">Search Books</TabsTrigger>
            <TabsTrigger value="scanner">Barcode Scanner</TabsTrigger>
            <TabsTrigger value="borrowed" className="relative">
              My Books ({borrowedBooks.length})
              {borrowedBooks.some((book) => {
                const status =
                  typeof book === "string"
                    ? { status: "normal" as const, message: "" }
                    : getBookStatus(book as BorrowedBook)
                return status.status === "overdue"
              }) && <AlertTriangle className="h-3 w-3 text-red-500 ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {/* Search Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Search Books
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search by title, author, genre, or ISBN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.length > 0 ? (
                    searchResults.map((book) => (
                      <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{book.title}</h3>
                          <p className="text-gray-600">by {book.author}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="secondary">{book.genre}</Badge>
                            <Badge variant="outline">ISBN: {book.isbn}</Badge>
                          </div>
                          {book.description && <p className="text-sm text-gray-500 mt-1">{book.description}</p>}
                        </div>
                        <div className="text-right">
                          {borrowedBooks.some((b) => {
                            const title = typeof b === "string" ? b : (b as BorrowedBook).title
                            return title === book.title
                          }) ? (
                            <Badge variant="secondary">You Borrowed This</Badge>
                          ) : (
                            <>
                              <Badge variant={book.available ? "default" : "destructive"}>
                                {book.available ? "Available" : `Borrowed by ${(book as any).borrowedBy}`}
                              </Badge>
                              {book.available && (
                                <Button size="sm" className="ml-2" onClick={() => borrowBook(book.id)}>
                                  Borrow
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500">No books found matching your search criteria.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scanner">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Barcode Scanner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Use your device camera to scan book barcodes for quick search
                    </p>
                    <Button onClick={() => setShowScanner(true)} className="mb-4">
                      <Camera className="h-4 w-4 mr-2" />
                      Open Camera Scanner
                    </Button>
                  </div>

                  {scannedBook && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h3 className="font-semibold">Last Scanned Book:</h3>
                      <p className="font-medium">{scannedBook.title}</p>
                      <p className="text-sm text-gray-600">by {scannedBook.author}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">{scannedBook.genre}</Badge>
                        <Badge variant="outline">ISBN: {scannedBook.isbn}</Badge>
                        <Badge variant="outline">Barcode: {scannedBook.barcode}</Badge>
                      </div>
                      <div className="mt-3">
                        {borrowedBooks.some((b) => {
                          const title = typeof b === "string" ? b : (b as BorrowedBook).title
                          return title === scannedBook.title
                        }) ? (
                          <Badge variant="secondary">You Borrowed This</Badge>
                        ) : (
                          <>
                            <Badge variant={scannedBook.available ? "default" : "destructive"}>
                              {scannedBook.available ? "Available" : `Borrowed by ${(scannedBook as any).borrowedBy}`}
                            </Badge>
                            {scannedBook.available && (
                              <Button size="sm" className="ml-2" onClick={() => borrowBook(scannedBook.id)}>
                                Borrow
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="borrowed">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  My Borrowed Books ({borrowedBooks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {borrowedBooks.length > 0 ? (
                    borrowedBooks.map((book, index) => {
                      const bookTitle = typeof book === "string" ? book : (book as BorrowedBook).title
                      const bookDetails = bookData.find((b) => b.title === bookTitle)
                      const status =
                        typeof book === "string"
                          ? { status: "normal" as const, message: "" }
                          : getBookStatus(book as BorrowedBook)

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 border rounded-lg ${
                            status.status === "overdue"
                              ? "bg-red-50 border-red-200"
                              : status.status === "due-soon"
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-yellow-50"
                          }`}
                        >
                          <div>
                            <h3 className="font-semibold">{bookTitle}</h3>
                            {bookDetails && (
                              <>
                                <p className="text-gray-600">by {bookDetails.author}</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <Badge variant="secondary">{bookDetails.genre}</Badge>
                                  <Badge variant="outline">ISBN: {bookDetails.isbn}</Badge>
                                </div>
                                {bookDetails.description && (
                                  <p className="text-sm text-gray-500 mt-1">{bookDetails.description}</p>
                                )}
                              </>
                            )}
                            {book.borrowDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                Borrowed: {new Date((book as BorrowedBook).borrowDate ?? "").toLocaleDateString()}

                                {(book as BorrowedBook).dueDate &&
                                  ` | Due: ${(book as BorrowedBook).dueDate
  ? new Date((book as BorrowedBook).dueDate!).toLocaleDateString()
  : "N/A"}
                                    new Date((book as BorrowedBook).dueDate).toLocaleDateString()}`
                                    }
                              </p>
                            )}
                            {status.message && (
                              <div className="flex items-center mt-2">
                                {status.status === "overdue" && <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />}
                                <Badge
                                  variant={status.status === "overdue" ? "destructive" : "outline"}
                                  className={status.status === "due-soon" ? "border-yellow-500 text-yellow-700" : ""}
                                >
                                  {status.message}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={status.status === "overdue" ? "destructive" : "secondary"}>Borrowed</Badge>
                            <Button size="sm" className="ml-2" variant="outline" onClick={() => returnBook(bookTitle)}>
                              Return
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 mb-2">No books borrowed yet</p>
                      <p className="text-sm text-gray-400">Search and borrow books to see them here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  These recommendations are personalized based on your borrowing history and reading preferences.
                </p>

                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-semibold">{rec.title}</h4>
                          <p className="text-sm text-gray-600">by {rec.author}</p>
                          <p className="text-xs text-blue-600 mt-1">{rec.reason}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">{rec.genre}</Badge>
                            <Badge variant="outline">ISBN: {rec.isbn}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          {borrowedBooks.some((b) => {
                            const title = typeof b === "string" ? b : (b as BorrowedBook).title
                            return title === rec.title
                          }) ? (
                            <Badge variant="secondary">You Borrowed This</Badge>
                          ) : (
                            <>
                              <Badge variant={rec.available ? "default" : "destructive"}>
                                {rec.available ? "Available" : "Borrowed"}
                              </Badge>
                              {rec.available && (
                                <Button size="sm" className="ml-2" onClick={() => borrowBook(rec.id)}>
                                  Borrow
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${rec.matchScore}%` }}></div>
                        </div>
                        <p className="text-xs text-right mt-1">{rec.matchScore}% match</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
