import React, { useState } from 'react';
import { Copy, Plus, CheckCircle, ExternalLink, Globe, Award, TrendingUp, Share2, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useFetch from '../../hooks/useFetch';
import { referralService } from '../../services/referralService';
import SkeletonLoader from '../../components/loaders/SkeletonLoader';
import Button from '../../components/buttons/Button';
import FormInput from '../../components/forms/FormInput';
import { useNotifications } from '../../hooks/useNotifications';
import { copyToClipboard } from '../../utils/helpers';
import formatCurrency from '../../utils/formatCurrency';

const TwitterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const WhatsAppIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const ReferralLinkPage = () => {
  const { user } = useAuth();
  const { data: links, loading, execute: reloadLinks } = useFetch(referralService.getReferralLinks);
  const [newLinkName, setNewLinkName] = useState('');
  const [creating, setCreating] = useState(false);
  const { addNotification } = useNotifications();

  const referralCode = user?.referralCode || 'AFF123';
  const mainReferralUrl = `${window.location.origin}/register?ref=${referralCode}`;

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!newLinkName.trim()) return;

    setCreating(true);
    try {
      await referralService.createReferralLink(newLinkName);
      addNotification('New campaign link generated successfully!', 'success');
      setNewLinkName('');
      reloadLinks();
    } catch (err) {
      addNotification(err.message || 'Failed to generate link', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (url) => {
    const success = await copyToClipboard(url);
    if (success) {
      addNotification('Link copied to clipboard!', 'success');
    } else {
      addNotification('Failed to copy link', 'error');
    }
  };

  const shareOnSocial = (platform) => {
    const message = encodeURIComponent(`Check out this amazing SaaS platform! Register using my link: ${mainReferralUrl}`);
    let url = '';

    switch (platform) {
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${message}`;
        break;
      case 'LinkedIn':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(mainReferralUrl)}`;
        break;
      case 'Facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(mainReferralUrl)}`;
        break;
      case 'WhatsApp':
        url = `https://wa.me/?text=${message}`;
        break;
      case 'Email':
        url = `mailto:?subject=${encodeURIComponent('Join SaaSPlatform')}&body=${message}`;
        break;
      case 'Text':
        url = `sms:?&body=${message}`;
        break;
      default:
        return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    addNotification(`Opening ${platform} share window...`, 'info');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Referral Links & Tools</h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Share your unique referral link and track your marketing campaign performance.
        </p>
      </div>

      {/* Main Referral Link Card */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border-primary-500/10 shadow-lg shadow-primary-500/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Primary Referral Identity</h2>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-0.5">Your unique affiliate coordinate</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Referral Code</label>
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 font-mono text-lg font-black text-primary-600">
                  {referralCode}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Registration Link</label>
                <div className="flex items-center gap-2 p-1 pl-4 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <span className="text-xs font-semibold text-slate-500 truncate flex-1">{mainReferralUrl}</span>
                  <button 
                    onClick={() => handleCopy(mainReferralUrl)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-all font-bold text-xs shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Quick Social Share</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <button 
                  onClick={() => shareOnSocial('Twitter')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#000000]/5 text-[#000000] hover:bg-[#000000] hover:text-white transition-all group"
                >
                  <TwitterIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold">Twitter (X)</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('LinkedIn')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5] hover:text-white transition-all group"
                >
                  <LinkedInIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold">LinkedIn</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('Facebook')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2] hover:text-white transition-all group"
                >
                  <FacebookIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold">Facebook</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('WhatsApp')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all group"
                >
                  <WhatsAppIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold">WhatsApp</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('Email')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#4B5563]/10 text-[#4B5563] hover:bg-[#4B5563] hover:text-white transition-all group"
                >
                  <Mail className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold">Email</span>
                </button>
                <button 
                  onClick={() => shareOnSocial('Text')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4] hover:bg-[#06B6D4] hover:text-white transition-all group"
                >
                  <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="text-[10px] font-bold">SMS / Text</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium italic text-center">
                * Sharing your link across multiple channels increases conversion by up to 40%
              </p>
            </div>
          </div>
        </div>
      </div>                       
    </div>
  );
};

export default ReferralLinkPage;