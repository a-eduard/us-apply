import CampaignDetailClient from "./CampaignDetailClient";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const resolvedParams = await params;
  
  return <CampaignDetailClient campaignId={resolvedParams.campaignId} />;
}