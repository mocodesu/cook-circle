import { Email } from "@convex-dev/auth/providers/Email";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { Resend as ResendAPI } from "resend";

export const ResendOTP = Email({
  id: "email", // ← was "resend-otp"
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15,

  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes as Uint8Array<ArrayBuffer>);
      },
    };
    const alphabet = "0123456789";
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },

  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "Cook Circle <onboarding@resend.dev>",
      to: [email],
      subject: "Your Cook Circle sign-in code",
      text: `Your code is ${token}. It expires in 15 minutes.`,
    });
    if (error) throw new Error(JSON.stringify(error));
  },
});
