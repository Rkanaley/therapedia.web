function LogomarkPaths() {
  return (
    <g fill="none" stroke="#38BDF8" strokeLinejoin="round" strokeWidth={3}>
    </g>
  )
}

export function Logomark(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" fill="none" {...props}>
    </svg>
  )
}

export function Logo(props: React.ComponentPropsWithoutRef<'img'>) {
  return (
    <img src="image.png" alt="Logo" {...props} />
  )
}