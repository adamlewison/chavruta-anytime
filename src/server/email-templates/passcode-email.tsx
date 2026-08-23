import { Button, Section, Text } from "@react-email/components";
import { EmailLayout } from "./email-layout";

const BASE_URL =
  process.env.NEXTAUTH_URL ?? "https://chavrutaanytime.com";

interface PasscodeEmailProps {
  code: string;
  expiresInMinutes?: number;
}

const colors = {
  brandBlue: "#3D85C6",
  brandOrange: "#F69240",
  slate800: "#1E293B",
  slate600: "#64748B",
  slate200: "#E2E8F0",
  white: "#FFFFFF",
};

export function PasscodeEmail({
  code,
  expiresInMinutes = 10,
}: PasscodeEmailProps) {
  const digits = code.split("");

  return (
    <EmailLayout preview={`Your ChavrutaAnytime sign-in code: ${code}`}>
      {/* Greeting */}
      <Text
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: colors.slate800,
          margin: "0 0 8px",
          lineHeight: "1.3",
        }}
      >
        Your sign-in code ✨
      </Text>
      <Text
        style={{
          fontSize: "15px",
          color: colors.slate600,
          margin: "0 0 32px",
          lineHeight: "1.6",
        }}
      >
        Use the code below to sign in to ChavrutaAnytime. It&apos;s ready when
        you are!
      </Text>

      {/* Code block */}
      <Section
        style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #FFF7ED 100%)",
          borderRadius: "12px",
          padding: "28px 24px",
          textAlign: "center",
          marginBottom: "32px",
          border: `2px solid ${colors.slate200}`,
        }}
      >
        <Text
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: colors.slate600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            margin: "0 0 12px",
          }}
        >
          One-time passcode
        </Text>
        {/* Digit row */}
        <table
          style={{ margin: "0 auto", borderCollapse: "separate", borderSpacing: "8px" }}
        >
          <tbody>
            <tr>
              {digits.map((digit, i) => (
                <td
                  key={i}
                  style={{
                    width: "48px",
                    height: "56px",
                    backgroundColor: colors.white,
                    border: `2px solid ${colors.brandBlue}`,
                    borderRadius: "10px",
                    fontSize: "28px",
                    fontWeight: "800",
                    color: colors.brandBlue,
                    textAlign: "center",
                    verticalAlign: "middle",
                    boxShadow: "0 2px 8px rgba(61,133,198,0.15)",
                  }}
                >
                  {digit}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <Text
          style={{
            fontSize: "12px",
            color: colors.slate600,
            margin: "16px 0 0",
          }}
        >
          ⏱ Expires in {expiresInMinutes} minutes
        </Text>
      </Section>

      {/* CTA */}
      <Section style={{ textAlign: "center", marginBottom: "32px" }}>
        <Button
          href={`${BASE_URL}/sign-in`}
          style={{
            backgroundColor: colors.brandOrange,
            color: colors.white,
            borderRadius: "10px",
            fontSize: "15px",
            fontWeight: "700",
            padding: "14px 32px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Open ChavrutaAnytime →
        </Button>
      </Section>

      {/* Security note */}
      <Section
        style={{
          backgroundColor: "#FFF7ED",
          borderRadius: "8px",
          padding: "14px 18px",
          borderLeft: `3px solid ${colors.brandOrange}`,
        }}
      >
        <Text
          style={{
            fontSize: "13px",
            color: colors.slate600,
            margin: 0,
            lineHeight: "1.6",
          }}
        >
          <strong style={{ color: colors.slate800 }}>Didn&apos;t request this?</strong>{" "}
          You can safely ignore this email. Someone may have entered your email
          address by mistake.
        </Text>
      </Section>
    </EmailLayout>
  );
}
