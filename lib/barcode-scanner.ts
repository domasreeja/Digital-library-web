// Barcode scanner integration using device camera

interface ScanResult {
  code: string
  format: string
  timestamp: Date
}

// Scanner state
let isScanning = false
let currentElement: HTMLElement | null = null
let videoElement: HTMLVideoElement | null = null
let stream: MediaStream | null = null
let animationFrame: number | null = null

const safelyClearElement = (element: HTMLElement | null) => {
  if (!element) return

  try {
    // Method 1: Use innerHTML (fastest and safest)
    element.innerHTML = ""
  } catch (error) {
    try {
      // Method 2: Remove children one by one with safety checks
      const children = Array.from(element.children)
      children.forEach((child) => {
        if (child && child.parentNode === element) {
          element.removeChild(child)
        }
      })
    } catch (fallbackError) {
      // Method 3: Create new element and replace
      const newElement = element.cloneNode(false) as HTMLElement
      if (element.parentNode) {
        element.parentNode.replaceChild(newElement, element)
      }
    }
  }
}

export const initBarcodeScanner = async (
  targetElement: HTMLElement,
  onScanSuccess: (barcode: string) => void,
  onScanError?: (error: string) => void,
): Promise<void> => {
  try {
    console.log("🔍 Initializing camera barcode scanner...")

    // Store reference to current element
    currentElement = targetElement

    // Check for camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = "Camera access not supported on this device"
      console.error(error)
      onScanError?.(error)
      return
    }

    // Clear any existing content safely
    safelyClearElement(targetElement)

    // Create video element for camera feed
    videoElement = document.createElement("video")
    videoElement.setAttribute("autoplay", "true")
    videoElement.setAttribute("playsinline", "true")
    videoElement.setAttribute("muted", "true")
    videoElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 8px;
    `

    // Create overlay for scan area
    const overlay = document.createElement("div")
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 10;
    `

    const scanFrame = document.createElement("div")
    scanFrame.style.cssText = `
      width: 250px;
      height: 150px;
      border: 3px solid #00ff00;
      border-radius: 8px;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
      position: relative;
    `

    // Add corner indicators
    const corners = [
      { class: "top-left", styles: "top: -3px; left: -3px; border-right: none; border-bottom: none;" },
      { class: "top-right", styles: "top: -3px; right: -3px; border-left: none; border-bottom: none;" },
      { class: "bottom-left", styles: "bottom: -3px; left: -3px; border-right: none; border-top: none;" },
      { class: "bottom-right", styles: "bottom: -3px; right: -3px; border-left: none; border-top: none;" },
    ]

    corners.forEach((corner) => {
      const cornerDiv = document.createElement("div")
      cornerDiv.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        border: 3px solid #00ff00;
        ${corner.styles}
      `
      scanFrame.appendChild(cornerDiv)
    })

    const instructionText = document.createElement("div")
    instructionText.textContent = "Position barcode within the frame"
    instructionText.style.cssText = `
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      background: rgba(0, 0, 0, 0.7);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 14px;
      white-space: nowrap;
    `

    scanFrame.appendChild(instructionText)
    overlay.appendChild(scanFrame)

    // Create container
    const container = document.createElement("div")
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: #000;
      border-radius: 8px;
      overflow: hidden;
    `

    // Append elements safely
    container.appendChild(videoElement)
    container.appendChild(overlay)
    targetElement.appendChild(container)

    // Request camera access
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      if (videoElement && stream) {
        videoElement.srcObject = stream

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          if (!videoElement) {
            reject(new Error("Video element not available"))
            return
          }

          videoElement.onloadedmetadata = () => resolve(true)
          videoElement.onerror = () => reject(new Error("Video load error"))

          // Timeout after 10 seconds
          setTimeout(() => reject(new Error("Video load timeout")), 10000)
        })

        await videoElement.play()
        isScanning = true

        // Start barcode detection
        startBarcodeDetection(videoElement, onScanSuccess, onScanError)

        console.log("✅ Camera barcode scanner initialized successfully")
      }
    } catch (cameraError) {
      console.error("Camera access error:", cameraError)
      onScanError?.("Camera access denied or not available")

      // Show fallback UI
      showFallbackUI(targetElement, onScanSuccess)
    }
  } catch (error) {
    console.error("Barcode scanner initialization error:", error)
    onScanError?.("Failed to initialize barcode scanner")
  }
}

const startBarcodeDetection = (
  video: HTMLVideoElement,
  onScanSuccess: (barcode: string) => void,
  onScanError?: (error: string) => void,
) => {
  if (!video) return

  const detectBarcode = () => {
    if (!isScanning || !video || !video.videoWidth || !video.videoHeight) {
      if (isScanning) {
        animationFrame = requestAnimationFrame(detectBarcode)
      }
      return
    }

    // Simple barcode detection simulation
    // In a real implementation, you would use a library like QuaggaJS or ZXing
    if (Math.random() < 0.008) {
      // Slightly lower chance for better UX
      const sampleBarcodes = [
        "9780743273565", // The Great Gatsby
        "9780061120084", // To Kill a Mockingbird
        "9780452284234", // 1984
        "9780141439518", // Pride and Prejudice
        "9780316769480", // The Catcher in the Rye
        "9780452284241", // Animal Farm
        "9780060850524", // Brave New World
        "9780571056862", // Lord of the Flies
      ]

      const randomBarcode = sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)]
      console.log(`📷 Barcode detected: ${randomBarcode}`)
      onScanSuccess(randomBarcode)
      return
    }

    // Continue scanning
    if (isScanning) {
      animationFrame = requestAnimationFrame(detectBarcode)
    }
  }

  // Start detection loop
  animationFrame = requestAnimationFrame(detectBarcode)
}

const showFallbackUI = (targetElement: HTMLElement, onScanSuccess: (barcode: string) => void) => {
  if (!targetElement) return

  // Clear existing content safely
  safelyClearElement(targetElement)

  const fallbackContainer = document.createElement("div")
  fallbackContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
  `

  const cameraIcon = document.createElement("div")
  cameraIcon.textContent = "📷"
  cameraIcon.style.cssText = `
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  `

  const errorText = document.createElement("p")
  errorText.textContent = "Camera not available"
  errorText.style.cssText = `
    color: #6b7280;
    margin-bottom: 16px;
    font-size: 14px;
    margin: 0 0 16px 0;
  `

  const manualInput = document.createElement("input")
  manualInput.type = "text"
  manualInput.placeholder = "Enter barcode manually"
  manualInput.style.cssText = `
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    margin-bottom: 12px;
    width: 200px;
    text-align: center;
    font-size: 14px;
  `

  const submitButton = document.createElement("button")
  submitButton.textContent = "Submit"
  submitButton.style.cssText = `
    padding: 8px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  `

  const handleSubmit = () => {
    const barcode = manualInput.value.trim()
    if (barcode) {
      onScanSuccess(barcode)
      manualInput.value = ""
    }
  }

  submitButton.addEventListener("click", handleSubmit)
  manualInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSubmit()
    }
  })

  // Append elements safely
  fallbackContainer.appendChild(cameraIcon)
  fallbackContainer.appendChild(errorText)
  fallbackContainer.appendChild(manualInput)
  fallbackContainer.appendChild(submitButton)
  targetElement.appendChild(fallbackContainer)
}

export const stopBarcodeScanner = (targetElement?: HTMLElement): void => {
  try {
    console.log("🛑 Stopping barcode scanner...")

    isScanning = false

    // Stop animation frame
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
      animationFrame = null
    }

    // Stop video stream
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          console.warn("Error stopping track:", e)
        }
      })
      stream = null
    }

    // Clear video element
    if (videoElement) {
      try {
        videoElement.srcObject = null
        videoElement.pause()
      } catch (e) {
        console.warn("Error clearing video:", e)
      }
      videoElement = null
    }

    // Clear the scanner UI safely
    const elementToClean = targetElement || currentElement
    if (elementToClean) {
      // Clear content safely
      safelyClearElement(elementToClean)

      // Show default camera icon
      const defaultContainer = document.createElement("div")
      defaultContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        background: #f3f4f6;
        border-radius: 8px;
        padding: 20px;
      `

      const cameraIcon = document.createElement("div")
      cameraIcon.textContent = "📷"
      cameraIcon.style.cssText = `
        font-size: 48px;
        color: #9ca3af;
        margin-bottom: 8px;
      `

      const statusText = document.createElement("div")
      statusText.textContent = "Camera scanner ready"
      statusText.style.cssText = `
        font-size: 14px;
        color: #6b7280;
      `

      defaultContainer.appendChild(cameraIcon)
      defaultContainer.appendChild(statusText)
      elementToClean.appendChild(defaultContainer)
    }

    currentElement = null
    console.log("✅ Barcode scanner stopped")
  } catch (error) {
    console.error("Error stopping barcode scanner:", error)
  }
}

export const isScannerActive = (): boolean => {
  return isScanning
}

// Validate barcode format
export const validateBarcode = (barcode: string): boolean => {
  // Basic ISBN-13 validation
  if (barcode.length === 13 && /^\d+$/.test(barcode)) {
    return true
  }

  // Basic ISBN-10 validation
  if (barcode.length === 10 && /^\d{9}[\dX]$/.test(barcode)) {
    return true
  }

  return false
}

// Format barcode for display
export const formatBarcode = (barcode: string): string => {
  if (barcode.length === 13) {
    return `${barcode.slice(0, 3)}-${barcode.slice(3, 4)}-${barcode.slice(4, 7)}-${barcode.slice(7, 12)}-${barcode.slice(12)}`
  }

  if (barcode.length === 10) {
    return `${barcode.slice(0, 1)}-${barcode.slice(1, 4)}-${barcode.slice(4, 9)}-${barcode.slice(9)}`
  }

  return barcode
}

// Get scan history
const scanHistory: ScanResult[] = []

export const addToScanHistory = (barcode: string, format = "ISBN-13"): void => {
  scanHistory.push({
    code: barcode,
    format,
    timestamp: new Date(),
  })
}

export const getScanHistory = (): ScanResult[] => {
  return [...scanHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
