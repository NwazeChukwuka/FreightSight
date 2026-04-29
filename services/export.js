export const generateCSVExport = (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // Extract headers from first object
  const headers = Object.keys(data[0])
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value || ''
      }).join(',')
    )
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const generatePDFExport = async (data, filename) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export')
  }

  // For PDF generation, we'll use a simple HTML to PDF conversion approach
  // In a production environment, you might want to use a library like jsPDF or Puppeteer
  
  const headers = Object.keys(data[0])
  
  // Create HTML table
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h1 { color: #333; }
        .date { color: #666; font-size: 14px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>${filename}</h1>
      <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
      <table>
        <thead>
          <tr>
            ${headers.map(header => `<th>${header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${headers.map(header => `
                <td>${row[header] || ''}</td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  // Create blob and download
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.html`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const formatTrackingDataForExport = (history) => {
  return history.map(item => ({
    'Tracking ID': item.trackingId,
    'Courier': item.courier || 'Unknown',
    'Status': item.parcelData?.status || 'Unknown',
    'Sender Name': item.parcelData?.sender?.name || 'N/A',
    'Sender Email': item.parcelData?.sender?.email || 'N/A',
    'Receiver Name': item.parcelData?.receiver?.name || 'N/A',
    'Receiver Email': item.parcelData?.receiver?.email || 'N/A',
    'Current Location': item.parcelData?.currentLocation?.city 
      ? `${item.parcelData.currentLocation.city}, ${item.parcelData.currentLocation.country}` 
      : 'Unknown',
    'Estimated Delivery': item.parcelData?.estimatedDelivery 
      ? new Date(item.parcelData.estimatedDelivery).toLocaleDateString()
      : 'N/A',
    'Weight': item.parcelData?.weight || 'N/A',
    'Dimensions': item.parcelData?.dimensions || 'N/A',
    'Contents': item.parcelData?.contents || 'N/A',
    'Search Date': new Date(item.searchedAt).toLocaleDateString(),
    'Search Time': new Date(item.searchedAt).toLocaleTimeString()
  }))
}

export const formatParcelDataForExport = (parcels) => {
  return parcels.map(parcel => ({
    'Tracking ID': parcel.trackingId,
    'Courier': parcel.courier,
    'Status': parcel.status,
    'Sender Name': parcel.sender?.name || 'N/A',
    'Sender Email': parcel.sender?.email || 'N/A',
    'Sender Phone': parcel.sender?.phone || 'N/A',
    'Sender Address': parcel.sender?.address || 'N/A',
    'Sender City': parcel.sender?.city || 'N/A',
    'Sender Country': parcel.sender?.country || 'N/A',
    'Receiver Name': parcel.receiver?.name || 'N/A',
    'Receiver Email': parcel.receiver?.email || 'N/A',
    'Receiver Phone': parcel.receiver?.phone || 'N/A',
    'Receiver Address': parcel.receiver?.address || 'N/A',
    'Receiver City': parcel.receiver?.city || 'N/A',
    'Receiver Country': parcel.receiver?.country || 'N/A',
    'Current Location': parcel.currentLocation?.city 
      ? `${parcel.currentLocation.city}, ${parcel.currentLocation.country}` 
      : 'Unknown',
    'Current Coordinates': parcel.currentLocation?.coordinates 
      ? `${parcel.currentLocation.coordinates.lat}, ${parcel.currentLocation.coordinates.lng}`
      : 'N/A',
    'Estimated Delivery': parcel.estimatedDelivery 
      ? new Date(parcel.estimatedDelivery).toLocaleDateString()
      : 'N/A',
    'Weight': parcel.weight || 'N/A',
    'Dimensions': parcel.dimensions || 'N/A',
    'Contents': parcel.contents || 'N/A',
    'Created Date': new Date(parcel.createdAt).toLocaleDateString(),
    'Created Time': new Date(parcel.createdAt).toLocaleTimeString(),
    'Last Updated': new Date(parcel.updatedAt).toLocaleDateString(),
    'Timeline Events': parcel.timeline?.length || 0
  }))
}
