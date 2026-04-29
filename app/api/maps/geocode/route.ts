import { getCoordinatesFromAddress } from "@/services/google-maps"

export async function POST(request: Request) {
  try {
    const { address, city, country } = await request.json()

    const coordinates = await getCoordinatesFromAddress(address, city, country)

    if (!coordinates) {
      return Response.json({ error: "Could not geocode address" }, { status: 400 })
    }

    return Response.json(coordinates)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
