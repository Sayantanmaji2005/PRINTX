import React from 'react';
import DocumentUploadClient from './DocumentUploadClient';

export function generateStaticParams() {
  return [
    { slug: 'printx-shop' },
    { slug: 'default' },
  ];
}

export default function UploadPage({ params }: { params: { slug: string } }) {
  return <DocumentUploadClient />;
}
