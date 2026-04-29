import { getDirections } from "@/services/google-maps"

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json()

    const directions = await getDirections(origin, destination)

    if (!directions) {
      return Response.json({ error: "Could not get directions" }, { status: 400 })
    }

    return Response.json(directions)
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
