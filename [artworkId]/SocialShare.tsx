/**
 * SocialShare Component
 * 
 * A client-side component that provides social media sharing functionality for artworks.
 * Renders a set of buttons that allow users to share artwork content across various
 * social media platforms including Twitter, Facebook, LinkedIn, and WhatsApp.
 * Uses the react-share library to handle the sharing implementations.
 */
'use client';

import {
    FacebookShareButton,
    TwitterShareButton,
    LinkedinShareButton,
    WhatsappShareButton,
    XIcon,
    FacebookIcon,
    TwitterIcon,
    LinkedinIcon,
    WhatsappIcon,
} from 'react-share';

import { useTranslations } from 'next-intl';

/**
 * Props for the SocialShare component
 * @property {string} url - The URL to be shared (typically the artwork's page URL)
 * @property {string} title - The title of the content being shared (artwork title)
 * @property {string} description - A brief description of the content (artwork description)
 */
interface SocialShareProps {
    url: string;
    title: string;
    description: string;
}

/**
 * SocialShare Component
 * 
 * Renders a row of social media sharing buttons, allowing users to easily
 * share artwork content across various platforms with customized content for each.
 * 
 * @param {SocialShareProps} props - Component props
 * @returns {JSX.Element} The rendered social sharing buttons
 */
const SocialShare = ({ url, title, description }: SocialShareProps) => {
    const t = useTranslations();
    return (
        <div className="flex gap-3 items-center">
            <span className="text-sm text-muted-foreground">{t('derivatives.share')}</span>
            <div className="flex gap-2">
                {/* Twitter sharing button with title and URL */}
                <TwitterShareButton url={url} title={title}>
                    <XIcon size={32} round />
                </TwitterShareButton>
                
                {/* Facebook sharing button with title, URL and hashtag */}
                <FacebookShareButton url={url} title={title} hashtag={'#ArticulatorAI'}>
                    <FacebookIcon size={32} round />
                </FacebookShareButton>
                
                {/* LinkedIn sharing button with title, URL and summary */}
                <LinkedinShareButton url={url} title={title} summary={description}>
                    <LinkedinIcon size={32} round />
                </LinkedinShareButton>
                
                {/* WhatsApp sharing button with title and URL */}
                <WhatsappShareButton url={url} title={title}>
                    <WhatsappIcon size={32} round />
                </WhatsappShareButton>
            </div>
        </div>
    );
};

export default SocialShare;
