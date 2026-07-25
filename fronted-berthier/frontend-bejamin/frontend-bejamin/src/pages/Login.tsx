import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  Shield,
  Package,
  Plane,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

const loginSchema = z.object({
  email: z.string().min(1, "L'email est obligatoire").email("Email invalide"),
  mot_de_passe: z.string().min(1, "Le mot de passe est obligatoire"),
});

type FieldErrors = Record<string, string>;

export function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('pierre@gmail.com');
  const [password, setPassword] = useState('12345678');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError('');

    const result = loginSchema.safeParse({ email, mot_de_passe: password });
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      if (error.errors) {
        const errors: FieldErrors = {};
        for (const [field, messages] of Object.entries(error.errors)) {
          if (field === 'email') errors.email = messages[0];
          if (field === 'mot_de_passe') errors.mot_de_passe = messages[0];
        }
        setFieldErrors(errors);
      }

      setGeneralError(error.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <div className="w-full h-screen flex flex-col lg:flex-row">

        <div className="w-full lg:w-1/2 h-full bg-gradient-to-b from-royal-700 to-[#081b33] p-8 md:p-16 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-royal-500/30 flex items-center justify-center">
                <span className="text-xl font-bold text-white">FC</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Fondeg   </h1>
                <p className="text-royal-300 text-xs">Catering Congo S.A.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                Gestion de stock
              </h2>
              <p className="text-royal-200/80 mt-3 text-base max-w-md">
                Outil central de gestion des stocks, commandes et traçabilité
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm bg-royal-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-royal-300" />
                </div>
                <div>
                  <p className="text-base font-medium text-white">Gestion des stocks</p>
                  <p className="text-royal-300 text-sm">Suivi en temps réel des produits et lots</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm  bg-royal-500/20 flex items-center justify-center flex-shrink-0">
                  <Plane className="w-5 h-5 text-royal-300" />
                </div>
                <div>
                  <p className="text-base font-medium text-white">Clients aériens</p>
                  <p className="text-royal-300 text-sm">Gestion des compagnies aériennes et commandes</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-sm  bg-royal-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-royal-300" />
                </div>
                <div>
                  <p className="text-base font-medium text-white">Traçabilité complète</p>
                  <p className="text-royal-300 text-sm">Audits, lots et historique des mouvements</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-royal-400 text-sm border-t border-royal-700/50 pt-4">
              République Démocratique du Congo · Kinshasa
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 h-full bg-[#dae2ec] p-8 md:p-16 flex flex-col justify-center items-center">
          <div className="flex items-center justify-center lg:hidden mb-8">
            <div className="w-14 h-14 rounded-xl bg-royal-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">FC</span>
            </div>
          </div>

          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 md:p-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
              <p className="text-gray-500 text-sm mt-1">
                Accédez à votre espace de gestion
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Adresse email
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="Votre e-mail"
                    className={cn(
                      "pl-10 h-12 bg-white focus:ring-royal-500 text-base",
                      fieldErrors.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-royal-500"
                    )}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1.5 text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-700">
                    Mot de passe
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-royal-600 hover:text-royal-700 hover:underline transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.mot_de_passe) setFieldErrors((prev) => ({ ...prev, mot_de_passe: '' }));
                    }}
                    placeholder="votre mot de passe"
                    className={cn(
                      "pl-10 pr-10 h-12 bg-white focus:ring-royal-500 text-base",
                      fieldErrors.mot_de_passe
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-200 focus:border-royal-500"
                    )}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {fieldErrors.mot_de_passe && (
                  <p className="mt-1.5 text-sm text-red-500">{fieldErrors.mot_de_passe}</p>
                )}
              </div>

              {generalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {generalError}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-royal-700 hover:bg-royal-800 text-white font-medium rounded-full transition-all duration-200 group text-base"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 pt-4">
                <Shield className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-400 text-center">
                  Accès réservé au personnel autorisé
                </p>
              </div>
            </form>
          </div>

          <div className="lg:hidden text-center mt-6">
            <p className="text-xs text-gray-400">
              République Démocratique du Congo · Kinshasa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
