import React from 'react';
import ShopCustomerClient from './ShopCustomerClient';

export function generateStaticParams() {
  return [
    { slug: 'printx-shop' },
    { slug: 'default' },
  ];
}

export default function ShopPage({ params }: { params: { slug: string } }) {
  return <ShopCustomerClient />;
}
