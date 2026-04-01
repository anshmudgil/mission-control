import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './components/Sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'Vermilion Intelligence — Mission Control',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#141414] text-white`} style={{margin:0}}>
        <div style={{display:'flex', height:'100vh', overflow:'hidden'}}>
          <Sidebar />
          <main style={{flex:1, overflow:'auto', padding:'32px'}}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
