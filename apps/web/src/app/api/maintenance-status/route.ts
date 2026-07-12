import { NextResponse } from 'next/server'
import { getStoreConfig } from '@vps/database'

// Cachear la respuesta 60 s en el CDN / ISR
export const revalidate = 60

export async function GET() {
  try {
    const config = await getStoreConfig()
    return NextResponse.json({ maintenance_mode: config.maintenance_mode })
  } catch {
    return NextResponse.json({ maintenance_mode: false })
  }
}
