import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useSettings } from '../context/SettingsContext';

const SEO = ({ title, description, keywords, image }) => {
    const { settings } = useSettings();

    // Fallback/Default values
    const siteTitle = settings?.siteTitle || 'Smart Aspirants';
    const defaultDescription = 'Bridging the gap between students and Industry with corporate-level training and real-world experience.';
    const defaultKeywords = 'Investment Banking, Finance, Accounting, Corporate Training, Smart Aspirants';
    const defaultImage = 'https://res.cloudinary.com/dazv62vrd/image/upload/f_auto,q_auto/d3ff9c9d-14ed-4628-abf4-51167ad172a1_cqcbj5';

    // Ensure image is an absolute URL if it exists
    let metaImage = image || defaultImage;
    if (metaImage && metaImage.startsWith('/')) {
        // Use the site URL from settings or a reliable default
        const siteUrl = settings?.siteUrl || 'https://smartaspirants.com';
        metaImage = siteUrl + (metaImage.startsWith('/') ? '' : '/') + metaImage;
    }

    // Smart title combining logic
    let metaTitle = siteTitle;
    if (title && title !== siteTitle) {
        // For products or blogs, show title followed by brand
        metaTitle = `${title}`;
    }

    const metaDescription = description || defaultDescription;
    const metaKeywords = keywords || defaultKeywords;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />
            <link rel="canonical" href={window.location.href} />

            {/* Dynamic Favicon (Shows blog image in tab) */}
            <link key="favicon" rel="icon" href={metaImage} />
            <link key="apple-icon" rel="apple-touch-icon" href={metaImage} />

            {/* Open Graph / Facebook / WhatsApp */}
            <meta property="og:type" content="article" />
            <meta property="og:site_name" content={siteTitle} />
            <meta property="og:url" content={window.location.href} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            <meta property="og:image:secure_url" content={metaImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:type" content="image/jpeg" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@smartaspirants" />
            <meta name="twitter:url" content={window.location.href} />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />
            <meta name="twitter:image:alt" content={metaTitle} />
        </Helmet>
    );
};

export default SEO;
