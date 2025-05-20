import type { Integration } from "@/app/data/integrations"
import IntegrationCard from "./IntegrationCard"

type IntegrationGridProps = {
  integrations: (Integration & { url?: string })[]
}

export default function IntegrationGrid({ integrations }: IntegrationGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {integrations.map((integration) => (
        <IntegrationCard key={integration.id} integration={integration} />
      ))}
    </div>
  )
}
