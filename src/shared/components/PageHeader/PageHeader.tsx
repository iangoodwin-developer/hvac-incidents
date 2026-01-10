// Reusable page header component.
// Keeps consistent spacing and typography across pages.

import React from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  children?: React.ReactNode;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  statusLabel,
  children,
}) => {
  // Render optional subtitle, status, and right-side actions when provided.
  return (
    <header className="page-header">
      <div className="page-header__intro">
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
        {statusLabel ? <p className="page-header__status">{statusLabel}</p> : null}
      </div>
      {children ? <div className="page-header__actions">{children}</div> : null}
    </header>
  );
};
