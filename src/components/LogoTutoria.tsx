import logo from '../../public/favicon.svg?inline'

export function LogoTutoria({ className }: { className?: string }) {
  return <img src={logo} width="64" height="64" alt="" className={className} />
}
