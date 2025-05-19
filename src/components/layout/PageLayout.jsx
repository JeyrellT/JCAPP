import React from 'react';
import { motion } from 'framer-motion';

/**
 * PageLayout component provides a consistent layout structure for pages
 * 
 * @param {string} title - The title of the page
 * @param {ReactNode} children - The content of the page
 * @param {boolean} animate - Whether to animate the page content (default: true)
 * @param {object} className - Additional classes for the container
 */
const PageLayout = ({ title, children, animate = true, className = '' }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  // Base container component (with or without animation)
  const Container = animate ? motion.div : 'div';

  return (
    <div className={`page-container px-4 py-6 max-w-7xl mx-auto ${className}`}>
      {title && (
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        </header>
      )}
      
      <Container
        variants={animate ? containerVariants : undefined}
        initial={animate ? "hidden" : undefined}
        animate={animate ? "visible" : undefined}
        className="page-content"
      >
        {children}
      </Container>
    </div>
  );
};

export default PageLayout;
