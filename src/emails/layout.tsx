import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";

export interface EmailBlock {
  heading: string;
  paragraphs: string[];
  amount?: string;
  amountLabel?: string;
  cta?: { label: string; url: string };
  footnote?: string;
}

const ink = "#0E0F0C";
const paper = "#F5F3EE";
const signal = "#D4FF3F";
const muted = "#6B6E66";
const line = "#E2DFD7";

const sans = "'Geist', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const mono = "'Geist Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

export function EmailLayout({ preview, block, locale }: { preview: string; block: EmailBlock; locale: string }) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: paper, margin: 0, padding: "32px 0", fontFamily: sans, color: ink }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", backgroundColor: "#FFFFFF", border: `1px solid ${line}`, borderRadius: 6 }}>
          <Section style={{ padding: "20px 28px", borderBottom: `1px solid ${line}` }}>
            <Text style={{ margin: 0, fontFamily: mono, fontSize: 12, letterSpacing: "0.14em", fontWeight: 600 }}>
              FINDERSARMY
            </Text>
          </Section>
          <Section style={{ padding: "28px 28px 8px" }}>
            <Text style={{ margin: "0 0 16px", fontSize: 24, lineHeight: "28px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {block.heading}
            </Text>
            {block.amount ? (
              <Section style={{ margin: "4px 0 20px" }}>
                {block.amountLabel ? (
                  <Text style={{ margin: "0 0 6px", fontFamily: mono, fontSize: 11, letterSpacing: "0.12em", color: muted, textTransform: "uppercase" }}>
                    {block.amountLabel}
                  </Text>
                ) : null}
                <Text style={{ margin: 0, display: "inline-block", backgroundColor: signal, padding: "4px 8px", fontFamily: mono, fontSize: 28, fontWeight: 600 }}>
                  {block.amount}
                </Text>
              </Section>
            ) : null}
            {block.paragraphs.map((p, i) => (
              <Text key={i} style={{ margin: "0 0 14px", fontSize: 15, lineHeight: "24px" }}>
                {p}
              </Text>
            ))}
            {block.cta ? (
              <Section style={{ margin: "20px 0 24px" }}>
                <Button
                  href={block.cta.url}
                  style={{ backgroundColor: ink, color: paper, padding: "12px 18px", borderRadius: 6, fontSize: 15, fontWeight: 600, textDecoration: "none" }}
                >
                  {block.cta.label}
                </Button>
              </Section>
            ) : null}
            {block.footnote ? (
              <Text style={{ margin: "0 0 20px", fontSize: 13, lineHeight: "20px", color: muted }}>{block.footnote}</Text>
            ) : null}
          </Section>
          <Hr style={{ borderColor: line, margin: 0 }} />
          <Section style={{ padding: "16px 28px" }}>
            <Text style={{ margin: 0, fontSize: 12, lineHeight: "18px", color: muted }}>
              {locale === "en"
                ? "FindersArmy connects people who know someone with local businesses. You receive this email because of activity on your account or request."
                : "FindersArmy koppelt mensen die iemand kennen aan lokale bedrijven. Je krijgt deze e-mail door activiteit op je account of aanvraag."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
