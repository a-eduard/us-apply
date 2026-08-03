import CampaignDetailClient from "./CampaignDetailClient";

export default function CampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  return <CampaignDetailClient campaignId={params.campaignId} />;
}