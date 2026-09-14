'use client';

import Script from 'next/script';
import { getMetaPixelInitScript } from '../src/pixel';

interface MetaPixelProps {
  pixelId: string;
}

/**
 * Componente Next.js para instalar o Meta Pixel na landing Rumo Médico.
 * Usar no layout raiz da landing (domínio verificado no BM).
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  if (!pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: getMetaPixelInitScript(pixelId) }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
