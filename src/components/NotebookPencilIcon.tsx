import React from 'react';

interface NotebookPencilIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const NotebookPencilIcon: React.FC<NotebookPencilIconProps> = ({
  size = 24,
  strokeWidth = 2,
  className,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Notebook Cover with Rounded corners */}
      <rect x="4" y="6" width="16" height="15" rx="2" ry="2" />
      
      {/* Horizontal divider line */}
      <line x1="4" y1="11" x2="20" y2="11" />
      
      {/* Centered notebook spiral rings at the top (Four spiral rings) */}
      <path d="M5 6V3a1.5 1.5 0 0 1 3 0v3" />
      <path d="M9 6V3a1.5 1.5 0 0 1 3 0v3" />
      <path d="M13 6V3a1.5 1.5 0 0 1 3 0v3" />
      <path d="M17 6V3a1.5 1.5 0 0 1 3 0v3" />
      
      {/* Centered diagonal pencil symbol */}
      {/* Starts near lower-middle and points to lower-left tip */}
      <path d="M10 17.5l3.5-3.5a1 1 0 0 1 1.4 1.4l-3.5 3.5h-1.4v-1.4z" />
    </svg>
  );
};

export default NotebookPencilIcon;
