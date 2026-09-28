export interface InquiryPayload {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  selectedPackage?: {
    id: string;
    name: string;
    category?: string;
    priceInr?: number | null;
  };
  projectDetails?: string;
  sourceUrl?: string;
  sourceComponent?: string;
}

export async function submitInquiry(payload: InquiryPayload) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://workspace.devlooperstudio.com";

  const response = await fetch(`${backendUrl}/api/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}
