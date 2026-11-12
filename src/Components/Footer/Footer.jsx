import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import "./Footer.css";

const quickLinks = [
  { name: "Home", href: "#home" },
  { name: "About", href: "#about" },
  { name: "Creative Skills", href: "#skills" },
  { name: "Projects", href: "#projects" },
  { name: "Courses", href: "#courses" },
  { name: "Contact", href: "#contact" },
];

const socialLinks = [
  { name: "Instagram", href: "https://instagram.com/" },
  { name: "LinkedIn", href: "https://linkedin.com/" },
  { name: "YouTube", href: "https://youtube.com/" },
];

const EASE = [0.22, 1, 0.36, 1];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUpVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const fadeOnlyVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
};

function Footer() {
  const currentYear = new Date().getFullYear();
  const reduceMotion = useReducedMotion();
  const fadeUp = reduceMotion ? fadeOnlyVariants : fadeUpVariants;

  return (
    <footer className="footer-section">
      <div className="footer-bg-glow footer-glow-one" aria-hidden="true" />
      <div className="footer-bg-glow footer-glow-two" aria-hidden="true" />

      <motion.div
        className="footer-container"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <div className="footer-main">
          <motion.div className="footer-brand" variants={fadeUp}>
           <a href="#home" className="footer-logo" aria-label="INIFLOW home">
  <img
    src="https://res.cloudinary.com/tezenm9e/image/upload/v1793765157/fyfx1wgmvxgm0wqxst78.png"
    alt="INIFLOW"
    className="footer-logo-image"
  />
</a>

            <p className="footer-description">
              Turning creative ideas into meaningful digital
              experiences through design, animation and technology.
            </p>

            <div className="footer-socials">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="footer-social"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {social.name}
                  <ArrowUpRight size={14} className="footer-social-icon" />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.nav
            className="footer-links"
            aria-label="Footer navigation"
            variants={fadeUp}
          >
            <h3>Quick Links</h3>
            <ul>
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </motion.nav>

          <motion.div className="footer-contact" variants={fadeUp}>
            <h3>Let's Connect</h3>
            <p>Have an idea or project in mind?</p>
            <a href="#contact" className="footer-contact-link">
              Let's Talk
              <ArrowUpRight size={17} className="footer-contact-icon" />
            </a>
          </motion.div>
        </div>

        <motion.div className="footer-bottom" variants={fadeUp}>
          <p>© {currentYear} INIFLOW. All rights reserved.</p>

          <a href="#home" className="footer-back-top">
            Back to Top
            <span className="footer-back-top-icon">
              <ArrowUp size={16} />
            </span>
          </a>
        </motion.div>
      </motion.div>

      <div className="footer-watermark" aria-hidden="true">
        INIFLOW
      </div>
    </footer>
  );
}

export default Footer;