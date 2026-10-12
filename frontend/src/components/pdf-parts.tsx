import { Font, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { DISCLAIMER } from "@/lib/documents";
import type { SignatureRow } from "@/lib/nda";

/** Font, styles, page footer and the signature table shared by NdaPdf and GenericPdf. */

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

export const styles = StyleSheet.create({
  page: { padding: 56, paddingBottom: 72, fontFamily: FONT_FAMILY, fontSize: 10, lineHeight: 1.45 },
  title: { fontWeight: "bold", fontSize: 15, textAlign: "center", marginBottom: 12 },
  heading: { fontWeight: "bold", marginTop: 10, marginBottom: 2 },
  paragraph: { marginBottom: 6 },
  bold: { fontWeight: "bold" },
  link: { color: "#209dd7" },
  table: { marginTop: 8, borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#a1a1aa" },
  row: { flexDirection: "row" },
  cell: { flex: 1, minHeight: 24, padding: 5, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#a1a1aa", textAlign: "center" },
  signCell: { minHeight: 40 },
  labelCell: { flex: 0.8, textAlign: "left", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 24, left: 56, right: 56, fontSize: 8, color: "#52525b" },
  disclaimer: { fontWeight: "bold", marginBottom: 2 },
});

/** Repeated on every page: the draft disclaimer, then `attribution` and the page number. */
export function PdfFooter({ attribution }: { attribution: ReactNode }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
      <View style={styles.row}>
        <Text style={{ flex: 1 }}>{attribution}</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </View>
  );
}

/** Party details and signature lines, one column per party; mirrors the HTML SignatureTable. */
export function PdfSignatureTable({ headers, rows }: { headers: readonly string[]; rows: SignatureRow[] }) {
  return (
    <View style={styles.table} wrap={false}>
      <View style={styles.row}>
        <Text style={[styles.cell, styles.labelCell]} />
        {headers.map((header) => (
          <Text key={header} style={[styles.cell, styles.bold]}>
            {header}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
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
  );
}
