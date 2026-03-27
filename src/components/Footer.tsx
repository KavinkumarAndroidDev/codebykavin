'use client';

import { Github, Linkedin, Mail, ArrowUpRight, Globe } from 'lucide-react';
import { useAppData } from '@/context/AppContext';
import styles from './Footer.module.css';

export default function Footer() {
  const { developer } = useAppData();

  const getLinkIcon = (url: string) => {
    if (url.includes('linkedin.com')) return <Linkedin size={12} />;
    if (url.includes('github.com')) return <Github size={12} />;
    if (url.includes('mailto:')) return <Mail size={12} />;
    return <Globe size={12} />;
  };

  const getLinkLabel = (url: string) => {
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('mailto:')) return 'Email';
    return 'Web';
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.bottom}>
            <div className={styles.brand}>
                <span className={styles.logo}>CodeBy<span className={styles.logoAccent}>Kavin</span></span>
                <p className={styles.tagline}>Built with Passion & Pixels.</p>
            </div>
            
            <div className={styles.links}>
                {developer?.links?.map((url, idx) => (
                    <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.iconLink}
                    >
                        {getLinkLabel(url)} {getLinkIcon(url)} <ArrowUpRight size={12} style={{ opacity: 0.5 }} />
                    </a>
                )) || (
                    <>
                        <a href="https://www.linkedin.com/in/kavinkumar442005/" target="_blank" rel="noopener noreferrer" className={styles.iconLink}>
                            LinkedIn <Linkedin size={12} />
                        </a>
                        <a href="https://github.com/KavinkumarAndroidDev" target="_blank" rel="noopener noreferrer" className={styles.iconLink}>
                            GitHub <Github size={12} />
                        </a>
                    </>
                )}
            </div>
        </div>
        
        <div className={styles.copyrightBar}>
            <p className="mono">&copy; {new Date().getFullYear()} CodeByKavin. All Rights Reserved.</p>
            <p className={styles.status}><span className={styles.dot} /> All Systems Online</p>
        </div>
      </div>
    </footer>
  );
}
