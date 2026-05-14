import { Code2 } from "lucide-react";
import { SectionCard, SectionTitle } from "@/components/dashboard/section-card";

export function ClientApiCard() {
  return (
    <SectionCard>
      <SectionTitle icon={<Code2 />} title="Client activation API" />
      <pre className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950 p-5 text-sm text-slate-300">
{`POST /api/v1/licenses/activate
{
  "licenseKey": "KASA-ENTERPRISE-XXXXXX-XXXXXX-XXXXXX-XXXXXX",
  "productSlug": "kasa-enterprise",
  "instanceId": "server-or-installation-uuid",
  "instanceLabel": "Client production server",
  "productVersion": "1.0.0"
}

POST /api/v1/envato/activate
{
  "purchaseCode": "ENVATO-PURCHASE-CODE",
  "buyerName": "Buyer name",
  "buyerEmail": "buyer@email.com",
  "instanceId": "server-or-installation-uuid",
  "instanceLabel": "Client production server",
  "productVersion": "1.0.0"
}`}
      </pre>
    </SectionCard>
  );
}
