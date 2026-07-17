/**
 * Shared helpers for the "omit sello + firma" PDF rendering used by the
 * patient portal's preview downloads. The doctor-signed PDF is the legal
 * artifact (with firma y sello). The preview is a no-frills rendering the
 * patient can share / print without misrepresenting it as a signed copy.
 *
 * Three rules for the preview:
 *  - Hide the sello image
 *  - Hide the signature line
 *  - Replace "Válido solo con firma y sello del médico" with the explicit
 *    watermark "VISTA PREVIA — Sin validez legal sin firma y sello"
 *  - Add a top-of-page diagonal "VISTA PREVIA" stamp so it's visible at a
 *    glance even on a thumbnail
 */
export const PREVIEW_WATERMARK_TEXT = "VISTA PREVIA — Sin validez legal"

import { Text, View, StyleSheet } from "@react-pdf/renderer"

const watermarkStyles = StyleSheet.create({
  topBanner: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
    textAlign: "center",
  },
  topBannerText: { fontSize: 10, fontWeight: "bold", color: "#92400e", letterSpacing: 0.5 },
})

export function PreviewWatermark() {
  return (
    <View style={watermarkStyles.topBanner} fixed={false}>
      <Text style={watermarkStyles.topBannerText}>
        ⚠ {PREVIEW_WATERMARK_TEXT}
      </Text>
    </View>
  )
}