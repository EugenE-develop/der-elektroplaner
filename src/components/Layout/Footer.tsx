import React, { FC } from 'react';

const Footer: FC = () => (
    <footer className="border-t border-border bg-secondary px-8 py-4 text-center text-sm text-text-light print:hidden">
        <p>&copy; {new Date().getFullYear()} HOAI Planer Pro. Alle Rechte vorbehalten.</p>
    </footer>
);

export default Footer;