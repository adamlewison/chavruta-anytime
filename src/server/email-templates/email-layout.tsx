import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Hr,
} from "@react-email/components";

const BASE_URL =
  process.env.NEXTAUTH_URL ?? "https://chavrutaanytime.com";

const colors = {
  brandBlue: "#3D85C6",
  brandOrange: "#F69240",
  slate800: "#1E293B",
  slate600: "#64748B",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  white: "#FFFFFF",
};

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          style={{
            backgroundColor: colors.slate100,
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            margin: 0,
            padding: "32px 16px",
          }}
        >
          <Container
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              backgroundColor: colors.white,
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <Section
              style={{
                background: `linear-gradient(135deg, ${colors.brandBlue} 0%, #2563a8 100%)`,
                padding: "32px 40px 24px",
                textAlign: "center",
              }}
            >
              <Img
                src={`${BASE_URL}/ca-logo.png`}
                alt="ChavrutaAnytime"
                height="60"
                style={{ display: "inline-block" }}
              />
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: "13px",
                  margin: "8px 0 0",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                ChavrutaAnytime
              </Text>
            </Section>

            {/* Content */}
            <Section style={{ padding: "40px 40px 32px" }}>
              {children}
            </Section>

            {/* Footer */}
            <Hr style={{ borderColor: colors.slate200, margin: "0 40px" }} />
            <Section style={{ padding: "24px 40px 32px", textAlign: "center" }}>
              <Text
                style={{
                  color: colors.slate600,
                  fontSize: "12px",
                  margin: "0 0 4px",
                  lineHeight: "1.6",
                }}
              >
                You&apos;re receiving this because you signed in to{" "}
                <Link
                  href={BASE_URL}
                  style={{ color: colors.brandBlue, textDecoration: "none" }}
                >
                  chavrutaanytime.com
                </Link>
              </Text>
              <Text
                style={{
                  color: colors.slate600,
                  fontSize: "12px",
                  margin: 0,
                  lineHeight: "1.6",
                }}
              >
                &copy; {new Date().getFullYear()} ChavrutaAnytime. All rights
                reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
