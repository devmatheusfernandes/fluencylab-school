import { Inter, Quicksand, Dancing_Script, Montserrat } from 'next/font/google';
import localFont from 'next/font/local';
export const inter = Inter({ subsets: ['latin'] });

export const quicksand = Quicksand ({
    weight: ['300', '400', '500', '600', '700'],
    subsets: ['latin'],
  });

export const dancing_script = Dancing_Script ({
weight: ['400', '700'],
subsets: ['latin'],
});

export const montserrat = Montserrat ({
    weight: ['400', '500', '700'],
    subsets: ['latin'],
    });

export const myFont = localFont({ src: './BrittanySignature.ttf' })