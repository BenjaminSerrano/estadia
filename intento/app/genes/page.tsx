import { Suspense } from 'react'
import GenesClient from './genes-client'

// /genes/?dataset=<id>&section=<A|AB|...>&dir=<up|down>&pathway=<name>
// Query params, not route segments: the static export only has pages known at build time
export default function GenesPage() {
  return (
    <Suspense fallback={null}>
      <GenesClient />
    </Suspense>
  )
}
