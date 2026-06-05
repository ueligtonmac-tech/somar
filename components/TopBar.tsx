import UserMenu from './UserMenu'

interface Profile {
  full_name: string | null
  email: string
  role: string
}

export default function TopBar({ profile }: { profile: Profile }) {
  return (
    <header className="hidden md:flex sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 items-center justify-end">
      <UserMenu profile={profile} />
    </header>
  )
}
