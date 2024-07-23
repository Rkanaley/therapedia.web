import TherapediaLogo from './path/to/Therapedia-logo-transparent-.png';

export function Logomark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 50 50" fill="none" {...props}>
      <image href={TherapediaLogo} width="50" height="50" />
    </svg>
  );
}

export function Logo(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 227 36" fill="none" {...props}>
      <image href={TherapediaLogo} width="36" height="36" x="0" y="0" />
      <text x="45" y="24" fontSize={20} fontWeight="bold" fill="#334155">
        {/* Your logo text */}
      </text>
      {/* Optional additional paths for the text part of the logo */}
    </svg>
  );
}
