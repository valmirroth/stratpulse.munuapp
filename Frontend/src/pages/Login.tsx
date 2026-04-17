import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Wrench, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import type { LoginRequest } from '../types'

export default function Login() {
  const { login } = useAuth()
  const navigate   = useNavigate()
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>()

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Bem-vindo ao ManuInd!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Wrench size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ManuInd</h1>
          <p className="text-blue-300 mt-1">Sistema de Manutenção Industrial</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar no sistema</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="input"
                {...register('email', { required: 'E-mail obrigatório' })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pr-10"
                  {...register('password', { required: 'Senha obrigatória' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-6">
            Admin padrão: <span className="font-mono">admin@manuind.com</span> / <span className="font-mono">Admin@123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
