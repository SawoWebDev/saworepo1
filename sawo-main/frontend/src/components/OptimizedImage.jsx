// src/components/OptimizedImage.jsx
/**
 * Optimized Image Component
 * Handles responsive images with lazy loading, proper dimensions, and WebP support
 */
import React from 'react';

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  srcSet,
  priority = false,
  className = '',
  style = {},
  ...props
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      srcSet={srcSet}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={className}
      style={{
        maxWidth: '100%',
        height: 'auto',
        display: 'block',
        ...style,
      }}
      {...props}
    />
  );
}

/**
 * Hero Image Component
 * Optimized for above-the-fold hero sections
 * Prevents Cumulative Layout Shift (CLS) with explicit dimensions
 */
export function HeroImage({
  mobileSrc,
  tabletSrc,
  desktopSrc,
  alt,
  width = 1920,
  height = 1080,
  className = '',
}) {
  return (
    <picture>
      {mobileSrc && (
        <source
          media="(max-width: 640px)"
          srcSet={mobileSrc}
          type="image/webp"
        />
      )}
      {tabletSrc && (
        <source
          media="(max-width: 1024px)"
          srcSet={tabletSrc}
          type="image/webp"
        />
      )}
      {desktopSrc && (
        <source srcSet={desktopSrc} type="image/webp" />
      )}
      <img
        src={desktopSrc || mobileSrc}
        alt={alt}
        width={width}
        height={height}
        fetchPriority="high"
        decoding="async"
        loading="eager"
        className={className}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
    </picture>
  );
}

/**
 * Responsive Product Image Component
 * Automatically handles 3 sizes with WebP fallback
 */
export function ProductImage({
  baseSrc,
  alt,
  width = 600,
  height = 600,
  priority = false,
  className = '',
}) {
  // Assumes image naming convention: image.webp -> image-300.webp, image-600.webp, image-1200.webp
  const baseWithoutExt = baseSrc.replace(/\.webp$/i, '');

  const srcSet = `
    ${baseWithoutExt}-300.webp 300w,
    ${baseWithoutExt}-600.webp 600w,
    ${baseWithoutExt}-1200.webp 1200w
  `.trim();

  return (
    <OptimizedImage
      src={baseSrc}
      alt={alt}
      width={width}
      height={height}
      srcSet={srcSet}
      priority={priority}
      className={className}
    />
  );
}

/**
 * Background Image with Fallback
 * Use for CSS background images - automatically optimizes
 */
export function OptimizedBackgroundImage({
  mobileSrc,
  tabletSrc,
  desktopSrc,
  className = '',
  children,
  style = {},
}) {
  // Determine which image to use based on screen size (fallback for CSS-only)
  const [bgImage, setBgImage] = React.useState(desktopSrc);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 640) {
        setBgImage(mobileSrc || desktopSrc);
      } else if (window.innerWidth <= 1024) {
        setBgImage(tabletSrc || desktopSrc);
      } else {
        setBgImage(desktopSrc);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileSrc, tabletSrc, desktopSrc]);

  // Preload the image
  React.useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = bgImage;
    document.head.appendChild(link);
  }, [bgImage]);

  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default OptimizedImage;
