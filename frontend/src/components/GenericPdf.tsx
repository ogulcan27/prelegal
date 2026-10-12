import { Document, Link, Page, Text, View } from "@react-pdf/renderer";
import { attribution, coverIntro, GENERIC_SIGNING_STATEMENT, type GenericData, type GenericDocument } from "@/lib/documents";
import type { GenericSegment } from "@/lib/generic-template";
import { signatureRows, valueOr } from "@/lib/nda";
import { PdfSignatureTable, styles } from "./pdf-parts";

type Props = { doc: GenericDocument; data: GenericData };

/** PDF rendering of any non-NDA document; mirrors GenericPreview. Call registerPdfFonts first. */
export function GenericPdf({ doc, data }: Props) {
  const footer = (
    <View style={styles.footer} fixed>
      <Text style={{ flex: 1 }}>{attribution(doc.name)}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );

  return (
    <Document title={doc.name} author="prelegal">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{doc.name}</Text>
        <Text style={styles.paragraph}>{coverIntro(doc.name)}</Text>
        <Text style={styles.heading}>Key Terms</Text>
        {doc.terms.map((term) => (
          <View key={term.key} style={{ flexDirection: "row", marginBottom: 3 }} wrap={false}>
            <Text style={[styles.bold, { flex: 2 }]}>{term.label}</Text>
            <Text style={{ flex: 3 }}>{valueOr(data.terms[term.key], term.label).text}</Text>
          </View>
        ))}
        <Text style={[styles.paragraph, { marginTop: 12 }]}>{GENERIC_SIGNING_STATEMENT}</Text>
        <PdfSignatureTable headers={doc.parties.map((role) => role.toUpperCase())} rows={signatureRows(data)} />
        {footer}
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Standard Terms</Text>
        {doc.standardTerms.blocks.map((block, i) => (
          <Text key={i} style={[styles.paragraph, { marginLeft: block.depth * 14 }]}>
            {block.marker && `${block.marker} `}
            {block.heading && <Text style={styles.bold}>{block.heading} </Text>}
            <Segments segments={block.body} />
          </Text>
        ))}
        {footer}
      </Page>
    </Document>
  );
}

function Segments({ segments }: { segments: GenericSegment[] }) {
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
        return segment.label;
    }
  });
}
