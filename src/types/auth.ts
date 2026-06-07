import { z } from "zod";

const phoneRegex = /^\+977[0-9]{10}$/;

function normalizeNepalPhone(value: string) {
  const cleaned = value.replace(/[\s()-]/g, "");

  if (cleaned.startsWith("+977")) return cleaned;
  if (cleaned.startsWith("977")) return `+${cleaned}`;
  if (/^(97|98)[0-9]{8}$/.test(cleaned)) return `+977${cleaned}`;

  return cleaned;
}

export const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string().min(8),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  role: z.enum(["donor", "recipient"]),
  captchaToken: z.string().min(1, { message: "Please complete the CAPTCHA." }),
  phone: z
    .string()
    .trim()
    .transform(normalizeNepalPhone)
    .refine((value) => value === "" || phoneRegex.test(value), {
      message: "Valid Nepali number: +977xxxxxxxxxx",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type SignupSchema = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
  captchaToken: z.string().min(1, { message: "Please complete the CAPTCHA." }),
});

export type LoginSchema = z.infer<typeof loginSchema>;
