import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Painel Admin — HUB Somar</h1>
              <p className="text-sm text-gray-500">
                {profile?.full_name} · <span className="text-[#000FFF] font-medium">{profile?.role}</span>
              </p>
            </div>
            <a href="/trilha" className="text-sm text-gray-400 hover:text-[#000FFF]">
              ← Trilha
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { href: '/admin/modulos', label: 'Módulos', desc: 'Criar e editar módulos' },
              { href: '/admin/cards', label: 'Cards', desc: 'Conteúdo da trilha' },
              { href: '/admin/documentos', label: 'Documentos', desc: 'Base de conhecimento' },
              { href: '/admin/perguntas', label: 'Perguntas', desc: 'Fila de escalonamento' },
              { href: '/admin/usuarios', label: 'Usuários', desc: 'Gerenciar acessos' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border-2 border-gray-100 hover:border-[#000FFF] rounded-xl p-5 transition-all duration-200 group"
              >
                <p className="font-semibold text-gray-900 group-hover:text-[#000FFF]">
                  {item.label}
                </p>
                <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
