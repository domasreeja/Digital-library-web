"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, BookOpen, Users, LogOut, RefreshCw, Camera, AlertTriangle, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { getFromLocalStorage } from "@/lib/storage-utils"
import { bookData, type Book } from "@/lib/book-data"
import {
  sendReliableSMS,
  checkOverdueBooks,
  sendOverdueAlert,
  calculateDaysDifference,
  SMS_TEMPLATES,
} from "@/lib/twilio-sms"
import BarcodeScanner from "@/components/barcode-scanner"

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

interface OverdueBook {
  studentName: string
  studentEmail: string
  studentMobile: string
  bookTitle: string
  daysOverdue: number
  borrowDate: string
}

export default function LibrarianDashboard() {
  const [students, setStudents] = useState<Student[]>([])
  const [books, setBooks] = useState<Book[]>(bookData)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingStudent, setEditingStudent] = useState<number | null>(null)
  const [selectedAction, setSelectedAction] = useState("")
  const [selectedBook, setSelectedBook] = useState("")
  //const [showScanner, setShowScanner] = useState(showScanner)
  const [showScanner, setShowScanner] = useState<boolean>(false)

  const [scannedBook, setScannedBook] = useState<Book | null>(null)
  const [overdueBooks, setOverdueBooks] = useState<OverdueBook[]>([])
  const [isCheckingOverdue, setIsCheckingOverdue] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const currentUser = getFromLocalStorage("currentUser")
    if (!currentUser || !currentUser.isLoggedIn || currentUser.userType !== "librarian") {
      router.push("/librarian/login")
      return
    }
  }, [router])

  const loadLoggedInStudents = () => {
    try {
      const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]") as Student[]
      // Filter only active students
      const activeStudents = loggedInStudents.filter((student: Student) => student.isActive)
      setStudents(activeStudents)

      // Calculate overdue books
      calculateOverdueBooks(activeStudents)
    } catch (error) {
      console.error("Error loading logged in students:", error)
      setStudents([])
    }
  }

  const calculateOverdueBooks = (studentList: Student[]) => {
    const currentDate = new Date()
    const overdueList: OverdueBook[] = []

    studentList.forEach((student) => {
      if (student.borrowedBooks && student.borrowedBooks.length > 0) {
        student.borrowedBooks.forEach((borrowedBook: BorrowedBookItem) => {
          const bookTitle = typeof borrowedBook === "string" ? borrowedBook : borrowedBook.title
          const borrowDate =
            typeof borrowedBook === "string"
              ? new Date(student.loginTime)
              : new Date(borrowedBook.borrowDate || student.loginTime)
          const daysBorrowed = calculateDaysDifference(borrowDate, currentDate)

          if (daysBorrowed >= 15) {
            const daysOverdue = daysBorrowed - 14
            overdueList.push({
              studentName: student.name,
              studentEmail: student.email,
              studentMobile: student.mobileNo,
              bookTitle,
              daysOverdue,
              borrowDate: borrowDate.toLocaleDateString(),
            })
          }
        })
      }
    })

    setOverdueBooks(overdueList)
  }

  useEffect(() => {
    // Load logged in students on component mount
    loadLoggedInStudents()

    // Set up automatic overdue checking (every hour)
    const overdueCheckInterval = setInterval(
      () => {
        checkOverdueBooks()
        loadLoggedInStudents() // Refresh data after checking
      },
      60 * 60 * 1000,
    ) // 1 hour

    // Initial overdue check
    checkOverdueBooks()

    return () => clearInterval(overdueCheckInterval)
  }, [])

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleBarcodeDetected = (barcode: string) => {
    console.log("Barcode detected:", barcode)

    // Find book by barcode
    const book = bookData.find((b) => b.barcode === barcode || b.isbn === barcode)
    if (book) {
      setScannedBook(book)
      setShowScanner(false)
    } else {
      // If no book found, search by the barcode as ISBN
      const bookByIsbn = bookData.find((b) => b.isbn.replace(/-/g, "") === barcode.replace(/-/g, ""))
      if (bookByIsbn) {
        setScannedBook(bookByIsbn)
        setShowScanner(false)
      } else {
        alert(`No book found with barcode: ${barcode}`)
        setShowScanner(false)
      }
    }
  }

  const handleBorrowReturn = async (studentId: number, action: "borrow" | "return", bookTitle: string) => {
    // Find the student
    const student = students.find((s) => s.id === studentId)
    if (!student) return

    const currentDate = new Date()

    setStudents((prev) =>
      prev.map((student) => {
        if (student.id === studentId) {
          if (action === "borrow") {
            const borrowedBookRecord: BorrowedBook = {
              ...bookData.find((b) => b.title === bookTitle)!,
              borrowDate: currentDate.toISOString(),
              dueDate: new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            }
            return {
              ...student,
              borrowedBooks: [...(student.borrowedBooks || []), borrowedBookRecord],
            }
          } else {
            return {
              ...student,
              borrowedBooks: (student.borrowedBooks || []).filter((book: BorrowedBookItem) => {
                const title = typeof book === "string" ? book : book.title
                return title !== bookTitle
              }),
              overdueBooks: Math.max(0, (student.overdueBooks || 0) - 1),
            }
          }
        }
        return student
      }),
    )

    setBooks((prev) =>
      prev.map((book) => {
        if (book.title === bookTitle) {
          if (action === "borrow") {
            return { ...book, available: false, borrowedBy: student.name || null } as any
          } else {
            return { ...book, available: true, borrowedBy: null } as any
          }
        }
        return book
      }),
    )

    // Update localStorage
    try {
      const loggedInStudents = JSON.parse(localStorage.getItem("loggedInStudents") || "[]") as Student[]
      const updatedStudents = loggedInStudents.map((s: Student) => {
        if (s.id === studentId) {
          if (action === "borrow") {
            const borrowedBookRecord: BorrowedBook = {
              ...bookData.find((b) => b.title === bookTitle)!,
              borrowDate: currentDate.toISOString(),
              dueDate: new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            }
            return {
              ...s,
              borrowedBooks: [...(s.borrowedBooks || []), borrowedBookRecord],
            }
          } else {
           
            return {
                     ...s,
  borrowedBooks: (s.borrowedBooks || []).filter(
     (book) => {
    const title = typeof book === "string" ? book : book.title;
    return title !== bookTitle;
    
     }

  ),
  overdueBooks: Math.max(0, s.overdueBooks || 0) - 1
}

          }
        }
        return s
      })
      localStorage.setItem("loggedInStudents", JSON.stringify(updatedStudents))
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }

    // Send SMS notification using reliable method
    if (student.mobileNo) {
      try {
        if (action === "borrow") {
          const dueDate = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()
          const message = SMS_TEMPLATES.BOOK_BORROWED(bookTitle, dueDate)
          await sendReliableSMS(student.mobileNo, message)
        } else {
          const message = SMS_TEMPLATES.BOOK_RETURNED(bookTitle)
          await sendReliableSMS(student.mobileNo, message)
        }
      } catch (error) {
        console.error("Error sending SMS:", error)
      }
    }

    // Refresh overdue calculations
    loadLoggedInStudents()
  }

  const executeAction = (studentId: number) => {
    if (selectedAction && selectedBook) {
      handleBorrowReturn(studentId, selectedAction as "borrow" | "return", selectedBook)
      setEditingStudent(null)
      setSelectedAction("")
      setSelectedBook("")
    }
  }

  const handleManualOverdueCheck = async () => {
    setIsCheckingOverdue(true)
    try {
      await checkOverdueBooks()
      loadLoggedInStudents()
      alert("Overdue check completed! SMS alerts sent to students with overdue books.")
    } catch (error) {
      console.error("Error during overdue check:", error)
      alert("Error occurred during overdue check.")
    } finally {
      setIsCheckingOverdue(false)
    }
  }

  const sendManualOverdueAlert = async (studentEmail: string, bookTitle: string) => {
    try {
      const success = await sendOverdueAlert(studentEmail, bookTitle)
      if (success) {
        alert(`Overdue alert sent successfully!`)
      } else {
        alert(`Failed to send overdue alert.`)
      }
    } catch (error) {
      console.error("Error sending manual alert:", error)
      alert(`Error sending alert.`)
    }
  }

  const handleLogout = () => {
    // Clear current user session
    localStorage.removeItem("currentUser")
    router.push("/")
  }

  const refreshStudentList = () => {
    loadLoggedInStudents()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Librarian Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleManualOverdueCheck} disabled={isCheckingOverdue}>
                <AlertTriangle className="h-4 w-4 mr-2" />
                {isCheckingOverdue ? "Checking..." : "Check Overdue"}
              </Button>
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

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Stats Cards */}
          <div className="lg:col-span-4 grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Students</p>
                    <p className="text-2xl font-bold">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Books</p>
                    <p className="text-2xl font-bold">{books.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Borrowed Books</p>
                    <p className="text-2xl font-bold">
                      {students.reduce((sum, student) => sum + (student.borrowedBooks?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Overdue Books</p>
                    <p className="text-2xl font-bold text-red-600">{overdueBooks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="students">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="students">Active Students</TabsTrigger>
                <TabsTrigger value="overdue" className="relative">
                  Overdue Books
                  {overdueBooks.length > 0 && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {overdueBooks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="scanner">Barcode Scanner</TabsTrigger>
              </TabsList>

              <TabsContent value="students">
                {/* Search Section */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Search className="h-5 w-5 mr-2" />
                        Search Active Students
                      </div>
                      <Button size="sm" variant="outline" onClick={refreshStudentList}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="Search by name, roll number, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Student Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div key={student.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{student.name}</h3>
                                <p className="text-sm text-gray-600">
                                  Roll No: {student.rollNo} | {student.email}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Mobile: {student.mobileNo} | Class: {student.class} | Year: {student.year}
                                </p>
                                <p className="text-xs text-blue-600">
                                  Last Login: {new Date(student.loginTime).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="default">Active</Badge>
                                {(student.overdueBooks || 0) > 0 && (
                                  <Badge variant="destructive">{student.overdueBooks} Overdue</Badge>
                                )}
                                <Button size="sm" variant="outline" onClick={() => setEditingStudent(student.id)}>
                                  Update
                                </Button>
                              </div>
                            </div>

                            {/* Borrowed Books */}
                            <div className="mt-2">
                              <p className="text-sm font-medium">Borrowed Books:</p>
                              {(student.borrowedBooks || []).length > 0 ? (
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {student.borrowedBooks.map((book: BorrowedBookItem, index: number) => {
                                    const bookTitle = typeof book === "string" ? book : book.title
                                    const borrowDate =
                                      typeof book === "string"
                                        ? new Date(student.loginTime)
                                        : new Date(book.borrowDate || student.loginTime)
                                    const daysBorrowed = calculateDaysDifference(borrowDate, new Date())
                                    const isOverdue = daysBorrowed >= 15

                                    return (
                                      <Badge
                                        key={index}
                                        variant={isOverdue ? "destructive" : "secondary"}
                                        className="relative"
                                      >
                                        {bookTitle}
                                        {isOverdue && (
                                          <span className="ml-1 text-xs">({daysBorrowed - 14} days overdue)</span>
                                        )}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">No books currently borrowed</p>
                              )}
                            </div>

                            {/* Edit Form */}
                            {editingStudent === student.id && (
                              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <label className="text-xs font-medium">Action</label>
                                    <select
                                      className="w-full p-2 border rounded-md text-sm"
                                      value={selectedAction}
                                      onChange={(e) => setSelectedAction(e.target.value)}
                                    >
                                      <option value="">Select Action</option>
                                      <option value="borrow">Borrow Book</option>
                                      <option value="return">Return Book</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium">Book</label>
                                    <select
                                      className="w-full p-2 border rounded-md text-sm"
                                      value={selectedBook}
                                      onChange={(e) => setSelectedBook(e.target.value)}
                                    >
                                      <option value="">Select Book</option>
                                      {selectedAction === "borrow"
                                        ? books
                                            .filter((book) => book.available)
                                            .map((book) => (
                                              <option key={book.id} value={book.title}>
                                                {book.title}
                                              </option>
                                            ))
                                        : (student.borrowedBooks || []).map((book: BorrowedBookItem, index: number) => {
                                            const bookTitle = typeof book === "string" ? book : book.title
                                            return (
                                              <option key={index} value={bookTitle}>
                                                {bookTitle}
                                              </option>
                                            )
                                          })}
                                    </select>
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => setEditingStudent(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => executeAction(student.id)}
                                    disabled={!selectedAction || !selectedBook}
                                  >
                                    Update Record
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-2">No active students found</p>
                          <p className="text-sm text-gray-400">
                            Students will appear here after they log in to the student portal
                          </p>
                          <Button size="sm" variant="outline" onClick={refreshStudentList} className="mt-4">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh List
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overdue">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        Overdue Books Management
                      </div>
                      <Button size="sm" onClick={handleManualOverdueCheck} disabled={isCheckingOverdue}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        {isCheckingOverdue ? "Sending..." : "Send Alerts"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {overdueBooks.length > 0 ? (
                        overdueBooks.map((overdue, index) => (
                          <div key={index} className="p-4 border rounded-lg bg-red-50 border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-red-800">{overdue.studentName}</h3>
                                <p className="text-sm text-gray-600">{overdue.studentEmail}</p>
                                <p className="text-sm text-gray-600">Mobile: {overdue.studentMobile}</p>
                                <div className="mt-2">
                                  <Badge variant="destructive" className="mr-2">
                                    {overdue.daysOverdue} days overdue
                                  </Badge>
                                  <span className="text-sm font-medium">"{overdue.bookTitle}"</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Borrowed on: {overdue.borrowDate}</p>
                              </div>
                              <div className="text-right">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => sendManualOverdueAlert(overdue.studentEmail, overdue.bookTitle)}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Send Alert
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 mb-2">No overdue books found</p>
                          <p className="text-sm text-gray-400">Books borrowed for more than 15 days will appear here</p>
                        </div>
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
                          Scan a book barcode to quickly find book details and update records.
                        </p>
                        <Button onClick={() => setShowScanner(true)} className="mb-4">
                          <Camera className="h-4 w-4 mr-2" />
                          Open Camera Scanner
                        </Button>
                      </div>

                      {/* Scanned book result */}
                      {scannedBook && (
                        <div className="p-4 border rounded-lg bg-green-50">
                          <h3 className="font-semibold">Scanned Book:</h3>
                          <p className="font-medium">{scannedBook.title}</p>
                          <p className="text-sm text-gray-600">by {scannedBook.author}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">{scannedBook.genre}</Badge>
                            <Badge variant="outline">ISBN: {scannedBook.isbn}</Badge>
                            <Badge variant="outline">Barcode: {scannedBook.barcode}</Badge>
                          </div>
                          <div className="mt-3">
                            <Badge variant={scannedBook.available ? "default" : "destructive"}>
                              {scannedBook.available ? "Available" : `Borrowed by ${(scannedBook as any).borrowedBy}`}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
