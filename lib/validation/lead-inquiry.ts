import { z } from "zod";
import { ValidationError } from "@/lib/errors";

const emptyToUndefined = (value: unknown) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
};

export const selectedPackageSchema = z.object({
  id: z.string().trim().min(1, "Package id is required"),
  name: z.string().trim().min(1, "Package name is required"),
  category: z.string().trim().optional(),
  priceInr: z.number().int().nonnegative().nullable().optional(),
});

export const leadInquirySchema = z
  .object({
    name: z.preprocess(
      emptyToUndefined,
      z.string().min(1, "Name is required"),
    ),
    email: z.preprocess(emptyToUndefined, z.string().optional()),
    phone: z.preprocess(emptyToUndefined, z.string().optional()),
    company: z.preprocess(emptyToUndefined, z.string().optional()),
    selectedPackage: selectedPackageSchema.nullish(),
    projectDetails: z.preprocess(emptyToUndefined, z.string().optional()),
    sourceUrl: z.preprocess(emptyToUndefined, z.string().optional()),
    sourceComponent: z.preprocess(emptyToUndefined, z.string().optional()),
    source: z.preprocess(emptyToUndefined, z.string().optional()),
    service: z.preprocess(emptyToUndefined, z.string().optional()),
    budget: z.preprocess(emptyToUndefined, z.string().optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
    assignedToId: z.preprocess(
      (value) => (value === "" ? null : value),
      z.string().nullable().optional(),
    ),
  })
  .superRefine((data, ctx) => {
    const email = typeof data.email === "string" ? data.email : undefined;
    const phone = typeof data.phone === "string" ? data.phone : undefined;

    if (!email && !phone) {
      ctx.addIssue({
        code: "custom",
        message:
          "Please provide either a valid email address or phone number for us to contact you.",
      });
    }

    if (email && !z.email().safeParse(email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Please provide a valid email address.",
      });
    }
  });

export type LeadInquiryInput = z.infer<typeof leadInquirySchema>;

export function parseLeadInquiry(payload: unknown): LeadInquiryInput {
  const result = leadInquirySchema.safeParse(payload);
  if (!result.success) {
    const details = result.error.issues.map((issue) => issue.message);
    throw new ValidationError([...new Set(details)]);
  }
  return result.data;
}
