// Enhanced book dataset with ISBN, Genre, Availability, and Barcode

export interface Book {
  id: number
  title: string
  author: string
  isbn: string
  genre: string
  available: boolean
  barcode: string
  publishedYear?: number
  description?: string
}
// lib/book-data.ts or lib/types.ts
export interface BorrowedBook {
  title: string;
  borrowDate?: string;
  dueDate?: string;
}


export const bookData: Book[] = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "978-0-7432-7356-5",
    genre: "Classic Literature",
    available: true,
    barcode: "9780743273565",
    publishedYear: 1925,
    description: "A classic American novel set in the Jazz Age",
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "978-0-06-112008-4",
    genre: "Classic Literature",
    available: true,
    barcode: "9780061120084",
    publishedYear: 1960,
    description: "A gripping tale of racial injustice and childhood innocence",
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    isbn: "978-0-452-28423-4",
    genre: "Dystopian Fiction",
    available: true,
    barcode: "9780452284234",
    publishedYear: 1949,
    description: "A dystopian social science fiction novel",
  },
  {
    id: 4,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "978-0-14-143951-8",
    genre: "Romance",
    available: true,
    barcode: "9780141439518",
    publishedYear: 1813,
    description: "A romantic novel of manners",
  },
  {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    isbn: "978-0-316-76948-0",
    genre: "Coming of Age",
    available: true,
    barcode: "9780316769480",
    publishedYear: 1951,
    description: "A controversial novel about teenage rebellion",
  },
  {
    id: 6,
    title: "Animal Farm",
    author: "George Orwell",
    isbn: "978-0-452-28424-1",
    genre: "Political Satire",
    available: true,
    barcode: "9780452284241",
    publishedYear: 1945,
    description: "An allegorical novella about farm animals",
  },
  {
    id: 7,
    title: "Brave New World",
    author: "Aldous Huxley",
    isbn: "978-0-06-085052-4",
    genre: "Dystopian Fiction",
    available: true,
    barcode: "9780060850524",
    publishedYear: 1932,
    description: "A dystopian novel about a technologically advanced future",
  },
  {
    id: 8,
    title: "Lord of the Flies",
    author: "William Golding",
    isbn: "978-0-571-05686-2",
    genre: "Adventure Fiction",
    available: true,
    barcode: "9780571056862",
    publishedYear: 1954,
    description: "A novel about British boys stranded on an uninhabited island",
  },
  {
    id: 9,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "978-0-547-92822-7",
    genre: "Fantasy",
    available: true,
    barcode: "9780547928227",
    publishedYear: 1937,
    description: "A fantasy adventure novel",
  },
  {
    id: 10,
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    isbn: "978-0-7475-3269-9",
    genre: "Fantasy",
    available: true,
    barcode: "9780747532699",
    publishedYear: 1997,
    description: "The first book in the Harry Potter series",
  },
]
