"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Zap, AlertCircle } from "lucide-react"

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onBarcodeDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const quaggaRef = useRef<any>(null)

  useEffect(() => {
    initializeScanner()
    return () => {
      cleanup()
    }
  }, [])

  const initializeScanner = async () => {
    try {
      setError(null)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera not supported on this device")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "user" }, // ✅ updated for laptop cameras
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      const QuaggaJS = await import("quagga")
      quaggaRef.current = QuaggaJS.default

      quaggaRef.current.init(
        {
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: { ideal: "user" }, // ✅ updated
            },
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "ean_8_reader",
              "code_39_reader",
              "upc_reader",
              "upc_e_reader",
            ],
          },
          locate: true,
          locator: {
            halfSample: true,
            patchSize: "medium",
          },
        },
        (err: any) => {
          if (err) {
            console.error("QuaggaJS initialization error:", err)
            setError("Failed to initialize barcode scanner")
            return
          }

          console.log("📱 Barcode scanner initialized successfully")
          quaggaRef.current.start()
          setIsScanning(true)
        },
      )

      quaggaRef.current.onDetected((data: any) => {
        const barcode = data.codeResult.code
        console.log("📱 Barcode detected:", barcode)

        if (barcode !== lastScanned) {
          setLastScanned(barcode)
          onBarcodeDetected(barcode)

          if (navigator.vibrate) {
            navigator.vibrate(200)
          }
        }
      })
    } catch (err: any) {
      console.error("Scanner initialization error:", err)
      switch (err.name) {
        case "NotAllowedError":
          setError("Camera permission denied. Please allow camera access and try again.")
          break
        case "NotFoundError":
          setError("No camera device found. Please connect a camera.")
          break
        case "AbortError":
          setError("Camera access aborted. Try again or check your device settings.")
          break
        case "NotReadableError":
          setError("Camera is already in use by another application.")
          break
        case "OverconstrainedError":
          setError("Camera constraints cannot be satisfied by available devices.")
          break
        default:
          setError("Failed to access camera. Please check your browser or device settings.")
      }
    }
  }

  const cleanup = () => {
    if (quaggaRef.current) {
      quaggaRef.current.stop()
      quaggaRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsScanning(false)
  }

  const handleClose = () => {
    cleanup()
    onClose()
  }

  const handleRetry = () => {
    cleanup()
    setTimeout(() => {
      initializeScanner()
    }, 500)
  }

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Scanner Error</h3>
            <p className="text-red-600 mb-4 text-sm">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRetry} variant="outline">
                🔄 Retry
              </Button>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-0">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video ref={videoRef} className="w-full h-64 object-cover" autoPlay playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="border-2 border-red-500 w-64 h-32 relative bg-transparent">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500"></div>
                {isScanning && <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div>}
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                {isScanning ? (
                  <div className="flex items-center text-white text-sm">
                    <Zap className="h-4 w-4 mr-1 animate-pulse" />
                    Scanning...
                  </div>
                ) : (
                  <div className="text-white text-sm">Initializing...</div>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
            <p className="text-center text-sm">📱 Position the barcode within the red frame</p>
            <p className="text-center text-xs text-gray-300 mt-1">Supports ISBN, UPC, EAN, and Code 128 formats</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}