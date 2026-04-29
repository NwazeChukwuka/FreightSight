"use client"

import { Download, FileSpreadsheet, FileText } from "lucide-react"
import { generateCSVExport, generatePDFExport, formatTrackingDataForExport, formatParcelDataForExport } from "@/services/export"

interface ExportButtonsProps {
  data: any[]
  filename: string
  type?: "tracking" | "parcels"
  className?: string
}

export function ExportButtons({ data, filename, type = "tracking", className = "" }: ExportButtonsProps) {
  const handleCSVExport = () => {
    try {
      const formattedData = type === "tracking" 
        ? formatTrackingDataForExport(data)
        : formatParcelDataForExport(data)
      
      generateCSVExport(formattedData, filename)
    } catch (error) {
      console.error("CSV export failed:", error)
      alert("Failed to export CSV. Please try again.")
    }
  }

  const handlePDFExport = async () => {
    try {
      const formattedData = type === "tracking" 
        ? formatTrackingDataForExport(data)
        : formatParcelDataForExport(data)
      
      await generatePDFExport(formattedData, filename)
    } catch (error) {
      console.error("PDF export failed:", error)
      alert("Failed to export PDF. Please try again.")
    }
  }

  const isDisabled = !data || data.length === 0

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handleCSVExport}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        title="Export as CSV"
      >
        <FileSpreadsheet size={16} />
        CSV
      </button>
      
      <button
        onClick={handlePDFExport}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        title="Export as PDF"
      >
        <FileText size={16} />
        PDF
      </button>
    </div>
  )
}
