import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'react-toastify/dist/ReactToastify.css';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import Image from 'next/image';
import { GradientHeading } from '@/src/components/ui/gradient-heading';
import LanguageSelector from '@/src/components/LanguageSelector';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: "Articulator AI - sign in",
    description: "login to articulator.ai",
}

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">

            <div className="absolute top-0 left-0 w-full h-full -z-1">
                <Image
                    src="/images/shape/shape-dotted-light.svg"
                    alt="Dotted"
                    fill
                />
            </div>

            <Link href="/" className='absolute top-10 left-10 z-999'>
                <Image alt="" src={"/images/logo.png"} width={190} height={150}></Image>
            </Link>

            <div className='absolute top-10 right-10 z-999 md:hidden'>
                <LanguageSelector />
            </div>

            <div className='absolute top-10 left-1/2 -translate-x-[100%] z-999 hidden md:block'>
                <LanguageSelector />
            </div>

            <div className="flex items-center justify-center w-full p-4 py-12">
                {children}
            </div>

            <div className="hidden h-screen bg-muted lg:block">
                <Image
                    src="/auth_banner-min.png"
                    alt="Image"
                    width={400}
                    height={400}
                    className="object-cover w-full h-full "
                />
            </div>
        </div>
    )
}
