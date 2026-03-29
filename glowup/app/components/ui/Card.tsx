import { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  padding?: string;
}

export default function Card({ children, glow, padding = 'p-4', className = '', style, ...rest }: Props) {
  return (
    <div
      className={`card ${glow ? 'card-glow' : ''} ${padding} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}
