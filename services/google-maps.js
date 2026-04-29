import axios from "axios"

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

export const getCoordinatesFromAddress = async (address, city, country) => {
  try {
    const fullAddress = `${address}, ${city}, ${country}`

    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: fullAddress,
        key: GOOGLE_MAPS_API_KEY,
      },
    })

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng,
      }
    }

    return null
  } catch (error) {
    console.error("Google Maps Geocoding error:", error.message)
    return null
  }
}

export const getDistanceMatrix = async (origins, destinations) => {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
      params: {
        origins: origins.map((o) => `${o.lat},${o.lng}`).join("|"),
        destinations: destinations.map((d) => `${d.lat},${d.lng}`).join("|"),
        key: GOOGLE_MAPS_API_KEY,
      },
    })

    return response.data
  } catch (error) {
    console.error("Google Maps Distance Matrix error:", error.message)
    return null
  }
}

export const getDirections = async (origin, destination) => {
  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    })

    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0]
      const polylinePoints = route.overview_polyline.points

      return {
        distance: route.legs[0].distance.text,
        duration: route.legs[0].duration.text,
        polyline: polylinePoints,
        steps: route.legs[0].steps.map((step) => ({
          instruction: step.html_instructions,
          distance: step.distance.text,
          duration: step.duration.text,
        })),
      }
    }

    return null
  } catch (error) {
    console.error("Google Maps Directions error:", error.message)
    return null
  }
}
