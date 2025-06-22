// AI-powered recommendation engine using TensorFlow.js concepts
// This is a simplified version that simulates ML recommendations

import { bookData, type Book } from "./book-data"

interface Recommendation extends Book {
  reason: string
  matchScore: number
}

// Simulated user preferences and borrowing history
const userProfiles: Record<string, any> = {
  "john@example.com": {
    preferredGenres: ["Classic Literature", "Dystopian Fiction"],
    borrowingHistory: ["The Great Gatsby", "1984"],
    readingLevel: "advanced",
  },
  "jane@example.com": {
    preferredGenres: ["Classic Literature", "Romance"],
    borrowingHistory: ["To Kill a Mockingbird"],
    readingLevel: "intermediate",
  },
}

// Trending books (simulated popularity data)
const trendingBooks = ["Animal Farm", "Brave New World", "Lord of the Flies", "The Hobbit"]

// Genre similarity matrix (simplified)
const genreSimilarity: Record<string, string[]> = {
  "Classic Literature": ["Romance", "Coming of Age", "Political Satire"],
  "Dystopian Fiction": ["Political Satire", "Adventure Fiction"],
  Romance: ["Classic Literature", "Coming of Age"],
  Fantasy: ["Adventure Fiction"],
  "Adventure Fiction": ["Fantasy", "Coming of Age"],
}

export const getRecommendations = (userEmail: string): Recommendation[] => {
  const userProfile = userProfiles[userEmail] || {
    preferredGenres: ["Classic Literature"],
    borrowingHistory: [],
    readingLevel: "beginner",
  }

  const recommendations: Recommendation[] = []

  // Get available books
  const availableBooks = bookData.filter((book) => book.available)

  availableBooks.forEach((book) => {
    let score = 0
    const reasons: string[] = []

    // Genre preference matching
    if (userProfile.preferredGenres.includes(book.genre)) {
      score += 40
      reasons.push(`matches your interest in ${book.genre}`)
    }

    // Similar genre matching
    const similarGenres = userProfile.preferredGenres.flatMap((genre: string) => genreSimilarity[genre] || [])
    if (similarGenres.includes(book.genre)) {
      score += 25
      reasons.push(`similar to genres you enjoy`)
    }

    // Trending book bonus
    if (trendingBooks.includes(book.title)) {
      score += 20
      reasons.push(`currently trending among students`)
    }

    // Author familiarity
    const borrowedAuthors = userProfile.borrowingHistory.map((title: string) => {
      const borrowedBook = bookData.find((b) => b.title === title)
      return borrowedBook?.author
    })
    if (borrowedAuthors.includes(book.author)) {
      score += 15
      reasons.push(`by an author you've read before`)
    }

    // Random factor for diversity
    score += Math.random() * 10

    if (score > 20) {
      // Minimum threshold
      recommendations.push({
        ...book,
        reason: reasons.length > 0 ? reasons[0] : "recommended for you",
        matchScore: Math.min(Math.round(score), 95), // Cap at 95%
      })
    }
  })

  // Sort by score and return top 5
  return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5)
}

// Simulated TensorFlow.js model prediction
export const predictUserPreferences = (userEmail: string, bookId: number): number => {
  // This would normally use a trained ML model
  // For now, we'll simulate with a simple algorithm

  const userProfile = userProfiles[userEmail]
  const book = bookData.find((b) => b.id === bookId)

  if (!userProfile || !book) return 0

  let prediction = 0.5 // Base probability

  // Adjust based on genre preferences
  if (userProfile.preferredGenres.includes(book.genre)) {
    prediction += 0.3
  }

  // Adjust based on reading history
  const authorBooks = bookData.filter((b) => b.author === book.author)
  const hasReadAuthor = authorBooks.some((b) => userProfile.borrowingHistory.includes(b.title))

  if (hasReadAuthor) {
    prediction += 0.2
  }

  return Math.min(prediction, 0.95)
}
