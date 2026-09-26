import './globals.css';

export const metadata = {
  title: 'Review Kiosk',
  description: 'Scan, review, done.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
