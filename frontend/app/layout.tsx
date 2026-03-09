import './globals.css';
import type { Metadata } from 'next';
import { Nunito, Quicksand, Noto_Sans_SC } from 'next/font/google';
import { Providers } from './providers';
import { ToastProvider } from '@/components/Toast';

const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: '高校毕业纪念NFT系统',
  description: '基于ERC-1155协议的高校毕业纪念NFT铸造与展示平台',
  keywords: ['NFT', '毕业', '纪念', 'ERC-1155', '区块链'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={`${nunito.variable} ${quicksand.variable} ${notoSansSC.variable}`}>
      <body className="min-h-screen text-light-800 antialiased font-sans">
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
