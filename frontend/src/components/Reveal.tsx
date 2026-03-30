import React from 'react';
import { motion } from 'framer-motion';

type RevealProps = {
    children: React.ReactNode;
    className?: string;
    delayMs?: number;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
};

const Reveal: React.FC<RevealProps> = ({ children, className = '', delayMs = 0, style, onClick }) => {
    return (
        <motion.div
            className={`rw-reveal ${className}`.trim()}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: delayMs / 1000, ease: 'easeOut' }}
            style={style}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};

export default Reveal;
