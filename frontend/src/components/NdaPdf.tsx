import { Document, Font, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  coverSections,
  NDA_TITLE,
  PARTY_HEADERS,
  signatureRows,
  SIGNING_STATEMENT,
  STANDARD_TERMS_TITLE,
  type NdaData,
} from "@/lib/nda";
import { refValue, type MndaTemplate, type Segment } from "@/lib/template";

const FONT_FAMILY = "Noto Serif";

/**
 * Registers the bundled Unicode font (public/fonts). The built-in PDF fonts only cover
 * Latin-1, which would garble names such as "Özer Şirketi". `resolve` maps a font file
 * name to a URL (browser) or file path (Node).
 */
export function registerPdfFonts(resolve: (file: string) => string) {
  Font.register({
    family: FONT_FAMILY,
    fonts: [
      { src: resolve("NotoSerif-Regular.ttf") },
      { src: resolve("NotoSerif-Bold.ttf"), fontWeight: "bold" },
    ],
  });
}

const styles = StyleSheet.create({
  page: { padding: 56, paddingBottom: 72, fontFamily: FONT_FAMILY, fontSize: 10, lineHeight: 1.45 },
  title: { fontWeight: "bold", fontSize: 15, textAlign: "center", marginBottom: 12 },
  heading: { fontWeight: "bold", marginTop: 10, marginBottom: 2 },
  paragraph: { marginBottom: 6 },
  bold: { fontWeight: "bold" },
  link: { color: "#3730a3" },
  table: { marginTop: 8, borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#a1a1aa" },
  row: { flexDirection: "row" },
  cell: { flex: 1, minHeight: 24, padding: 5, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#a1a1aa", textAlign: "center" },
  signCell: { minHeight: 40 },
  labelCell: { flex: 0.8, textAlign: "left", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 28, left: 56, right: 56, fontSize: 8, color: "#52525b", flexDirection: "row", justifyContent: "space-between" },
});

type Props = { template: MndaTemplate; data: NdaData };

/** PDF rendering of the completed Mutual NDA; mirrors NdaPreview. Call registerPdfFonts first. */
export function NdaPdf({ template, data }: Props) {
  const footer = (
    <View style={styles.footer} fixed>
      <Text style={{ flex: 1 }}>
        <Segments segments={template.attribution} data={data} />
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  return (
    <Document title={NDA_TITLE} author="prelegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{NDA_TITLE}</Text>
        <Text style={styles.paragraph}>
          <Segments segments={template.coverIntro} data={data} />
        </Text>

        {coverSections(data).map((section) => (
          <View key={section.heading} wrap={false}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.lines.map((line, i) => (
              <Text key={i}>
                {line.label ? `${line.label}: ` : ""}
                {line.value.text}
              </Text>
            ))}
          </View>
        ))}

        <Text style={[styles.paragraph, { marginTop: 12 }]}>{SIGNING_STATEMENT}</Text>
        <View style={styles.table} wrap={false}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.labelCell]} />
            {PARTY_HEADERS.map((header) => (
              <Text key={header} style={[styles.cell, styles.bold]}>
                {header}
              </Text>
            ))}
          </View>
          {signatureRows(data).map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={[styles.cell, styles.labelCell, row.toSign ? styles.signCell : {}]}>{row.label}</Text>
              {row.values.map((value, i) => (
                <Text key={i} style={[styles.cell, row.toSign ? styles.signCell : {}]}>
                  {value}
                </Text>
              ))}
            </View>
          ))}
        </View>
        {footer}
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{STANDARD_TERMS_TITLE}</Text>
        {template.clauses.map((clause) => (
          <Text key={clause.number} style={styles.paragraph}>
            {clause.number}. <Text style={styles.bold}>{clause.title}</Text>.{" "}
            <Segments segments={clause.body} data={data} />
          </Text>
        ))}
        {footer}
      </Page>
    </Document>
  );
}

function Segments({ segments, data }: { segments: Segment[]; data: NdaData }) {
  return segments.map((segment, i) => {
    switch (segment.kind) {
      case "text":
        return segment.bold ? (
          <Text key={i} style={styles.bold}>
            {segment.text}
          </Text>
        ) : (
          segment.text
        );
      case "link":
        return (
          <Link key={i} src={segment.href} style={styles.link}>
            {segment.text}
          </Link>
        );
      case "ref":
        return refValue(segment.name, data)?.text ?? segment.name;
    }
  });
}
