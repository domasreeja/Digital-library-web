// Local Storage utility functions

export const saveToLocalStorage = (key: string, data: any) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data))
    }
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

export const getFromLocalStorage = (key: string) => {
  try {
    if (typeof window !== "undefined") {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    }
    return null
  } catch (error) {
    console.error("Error reading from localStorage:", error)
    return null
  }
}

export const removeFromLocalStorage = (key: string) => {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  } catch (error) {
    console.error("Error removing from localStorage:", error)
  }
}

export const clearLocalStorage = () => {
  try {
    if (typeof window !== "undefined") {
      localStorage.clear()
    }
  } catch (error) {
    console.error("Error clearing localStorage:", error)
  }
}
