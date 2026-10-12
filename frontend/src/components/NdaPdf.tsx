import { Document, Link, Page, Text, View } from "@react-pdf/renderer";
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
import { PdfSignatureTable, styles } from "./pdf-parts";

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
        <PdfSignatureTable headers={PARTY_HEADERS} rows={signatureRows(data)} />
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
