import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react';
import './globals.css';
import { StoreProvider } from '@/app/store';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'PyroShield',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // noinspection HtmlRequiredTitleElement
    return (
        <html lang="en">
            <head>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                    crossOrigin=""
                />
            </head>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <StoreProvider>{children}</StoreProvider>
            </body>
        </html>
    );
}
