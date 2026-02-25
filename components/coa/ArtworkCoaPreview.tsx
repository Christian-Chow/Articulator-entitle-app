'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  Document,
  Page,
  View,
  StyleSheet,
  Text,
  Image,
} from '@react-pdf/renderer';
import { getArtworkWatermarkedPublicUrl } from '@/lib/urls';

const PDFDownloadLink = dynamic(
  () => import("./PDFDownloadLink"),
  {
    ssr: false,
    loading: () => <p className="text-slate-400 text-sm">Loading...</p>,
  },
);

const PDFViewer = dynamic(
  () => import("./PDFViewer"),
  {
    ssr: false,
    loading: () => <p className="text-slate-400 text-sm">Loading...</p>,
  },
);

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 12,
  },
  headeritem: {},
  title: {
    fontSize: 24,
    marginVertical: 20,
    borderBottom: 2,
    borderBottomColor: '#cccccc',
    paddingVertical: 1,
  },
  artworkTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  artworkTitleYear: {
    fontSize: 18,
    color: '#10797b',
    fontWeight: 'bold',
    marginVertical: 3,
  },
  artworkDid: {
    fontSize: 11,
    color: '#ea5a1d',
    fontWeight: 'bold',
  },
  artworkType: {
    fontSize: 16,
    color: '#7f7f7f',
    fontWeight: 'light',
  },
  artworkDetailSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: 20,
  },
  artworkDetail: {
    flex: 1,
  },
  artworkDetailDescription: {
    fontSize: 10,
    color: '#4a4a49',
    paddingRight: 20,
  },
  artworkMetaDataRow: {
    flexDirection: 'row',
    fontSize: 12,
    marginTop: 5,
  },
  artworkMetaDataRowName: {
    flexDirection: 'row',
    fontWeight: 'bold',
    color: '#ea5a1d',
    width: 120,
  },
  artworkMetaDataRowValue: {
    color: '#4a4a49',
  },
  artworkImages: {
    width: 200,
  },
  artworkMainImage: {},
  footerSection: {
    flexDirection: 'row',
    gap: 20,
  },
  footerSectionBlock: {
    flex: 1,
    borderTop: 2,
    borderTopColor: '#cccccc',
    paddingTop: 20,
    flexDirection: 'column',
    gap: 3,
  },
  footerSectionBlockTitle: {
    fontSize: 12,
    color: '#10797b',
    fontWeight: 'bold',
  },
  footerSectionBlockRow: {
    fontSize: 10,
    color: '#4a4a49',
  },
});

interface ArtworkCoaProps {
  artwork: any;
}

const CoaDocument = ({ artwork }: ArtworkCoaProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headeritem}>Certificate Number: 2022002268</Text>
        <Text style={styles.headeritem}>Issue Date: 2025-10-06</Text>
        <Text style={styles.headeritem}>ARTRACX</Text>
      </View>
      <View style={styles.title}>
        <Text>CERTIFICATE OF AUTHENTICITY</Text>
      </View>
      <View style={styles.artworkTitleSection}>
        <View>
          <Text style={styles.artworkTitleYear}>
            {artwork.title}
            {artwork.metadata?.core?.creationDate && ` (${artwork.metadata.core.creationDate})`}
          </Text>
          <Text style={styles.artworkDid}>did:art:enq:6a2f6fead3b8a40966cb37fa49b3ed0eb1ffbbe4</Text>
          <Text style={styles.artworkType}>
            {artwork.metadata?.core?.mainCategory}
            {artwork.metadata?.core?.subCategory && ` | ${artwork.metadata.core.subCategory}`}
          </Text>
        </View>
        <Text>QR CODE</Text>
      </View>
      <View style={styles.artworkDetailSection}>
        <View style={styles.artworkDetail}>
          <Text style={styles.artworkDetailDescription}>
            {artwork.description}
          </Text>
          {artwork.metadata?.core?.referenceNumber && (
            <View style={styles.artworkMetaDataRow}>
              <Text style={styles.artworkMetaDataRowName}>Reference Number:</Text>
              <Text style={styles.artworkMetaDataRowValue}>{artwork.metadata.core.referenceNumber}</Text>
            </View>
          )}
          {artwork.metadata?.size?.width && artwork.metadata?.size?.height && artwork.metadata?.size?.measurementUnit && (
            <View style={styles.artworkMetaDataRow}>
              <Text style={styles.artworkMetaDataRowName}>Size:</Text>
              <Text style={styles.artworkMetaDataRowValue}>
                {`${artwork.metadata.size.width}${artwork.metadata.size.measurementUnit} (W) x ${artwork.metadata.size.height}${artwork.metadata.size.measurementUnit} (H)`}
              </Text>
            </View>
          )}
          {artwork.metadata?.core?.conditionReport && (
            <View style={styles.artworkMetaDataRow}>
              <Text style={styles.artworkMetaDataRowName}>Condition:</Text>
              <Text style={styles.artworkMetaDataRowValue}>{artwork.metadata.core.conditionReport}</Text>
            </View>
          )}
        </View>
        {artwork.main_image && (
          <View style={styles.artworkImages}>
            <Image style={styles.artworkMainImage} src={getArtworkWatermarkedPublicUrl(artwork.main_image)} />
          </View>
        )}
      </View>
      <View style={styles.footerSection}>
        <View style={styles.footerSectionBlock}>
          <Text style={styles.footerSectionBlockTitle}>Information Provided By</Text>
          <Text style={styles.footerSectionBlockRow}>{artwork.owner_id?.username || 'Owner'}</Text>
        </View>
        <View style={styles.footerSectionBlock}>
          <Text style={styles.footerSectionBlockTitle}>Certificate Issued By</Text>
          <Text style={styles.footerSectionBlockRow}>ARTRACX by Art Group</Text>
          <Text style={styles.footerSectionBlockRow}>9/F Sing Shun Centre</Text>
          <Text style={styles.footerSectionBlockRow}>495 Castle Peak Road, Lai Chi Kok</Text>
          <Text style={styles.footerSectionBlockRow}>Hong Kong</Text>
        </View>
      </View>
    </Page>
  </Document>
);

const ArtworkCoaPreview = ({ artwork }: ArtworkCoaProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6 w-full flex-wrap">
        <p className="text-2xl font-bold flex-1">Certificate of Authenticity</p>
        <PDFDownloadLink
          document={<CoaDocument artwork={artwork} />}
          fileName={`COA-${artwork.title || artwork.id}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <button
              className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Preparing...' : 'Download PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      <PDFViewer className="w-full" style={{ height: '80vh' }}>
        <CoaDocument artwork={artwork} />
      </PDFViewer>
    </div>
  );
};

export default ArtworkCoaPreview;
