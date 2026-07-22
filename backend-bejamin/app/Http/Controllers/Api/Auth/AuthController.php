<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'nom' => 'required|string|max:100',
                'prenom' => 'nullable|string|max:100',
                'email' => 'required|string|email|max:100|unique:utilisateurs,email',
                'mot_de_passe' => 'required|string|min:6|confirmed',
                'id_role' => 'required|exists:roles,id',
                'id_ville' => 'required|exists:villes,id',
                'id_departement' => 'required|exists:departements,id',
                'id_zone' => 'nullable|exists:zones,id',
                'id_emplacement' => 'nullable|exists:emplacements,id',
            ]);

            $utilisateur = Utilisateur::create([
                'nom' => $validated['nom'],
                'prenom' => $validated['prenom'] ?? null,
                'email' => $validated['email'],
                'mot_de_passe_hash' => Hash::make($validated['mot_de_passe']),
                'id_role' => $validated['id_role'],
                'id_ville' => $validated['id_ville'],
                'id_departement' => $validated['id_departement'],
                'id_zone' => $validated['id_zone'] ?? null,
                'id_emplacement' => $validated['id_emplacement'] ?? null,
                'actif' => true,
            ]);

            // ✅ Audit d'inscription
            Audit::create([
                'id_utilisateur' => $utilisateur->id,
                'action' => 'REGISTER',
                'table_cible' => 'utilisateurs',
                'id_enregistrement' => $utilisateur->id,
                'anciennes_valeurs' => null,
                'nouvelles_valeurs' => json_encode([
                    'email' => $utilisateur->email,
                    'nom' => $utilisateur->nom,
                    'prenom' => $utilisateur->prenom,
                    'role_id' => $utilisateur->id_role,
                    'ville_id' => $utilisateur->id_ville,
                ]),
                'date_action' => now(),
                'adresse_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => 'api/auth/register'
            ]);

            $token = $utilisateur->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'utilisateur' => $utilisateur->load(['role', 'ville', 'departement']),
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
                'message' => 'Utilisateur créé avec succès'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'mot_de_passe' => 'required|string',
            ]);

            $utilisateur = Utilisateur::where('email', $validated['email'])
                                      ->with(['role', 'ville', 'departement', 'zone', 'emplacement'])
                                      ->first();

            // Tentative de connexion échouée - email inexistant
            if (!$utilisateur) {
                Audit::create([
                    'id_utilisateur' => null,
                    'action' => 'LOGIN_FAILED',
                    'table_cible' => 'auth',
                    'id_enregistrement' => 0,
                    'anciennes_valeurs' => null,
                    'nouvelles_valeurs' => json_encode([
                        'email' => $validated['email'],
                        'status' => 'failed',
                        'reason' => 'email_not_found'
                    ]),
                    'date_action' => now(),
                    'adresse_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'route' => 'api/auth/login'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants invalides'
                ], 401);
            }

            // Tentative de connexion échouée - mauvais mot de passe
            if (!Hash::check($validated['mot_de_passe'], $utilisateur->mot_de_passe_hash)) {
                Audit::create([
                    'id_utilisateur' => $utilisateur->id,
                    'action' => 'LOGIN_FAILED',
                    'table_cible' => 'auth',
                    'id_enregistrement' => $utilisateur->id,
                    'anciennes_valeurs' => null,
                    'nouvelles_valeurs' => json_encode([
                        'email' => $validated['email'],
                        'status' => 'failed',
                        'reason' => 'wrong_password'
                    ]),
                    'date_action' => now(),
                    'adresse_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'route' => 'api/auth/login'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Identifiants invalides'
                ], 401);
            }

            // Compte désactivé
            if (!$utilisateur->actif) {
                Audit::create([
                    'id_utilisateur' => $utilisateur->id,
                    'action' => 'LOGIN_FAILED',
                    'table_cible' => 'auth',
                    'id_enregistrement' => $utilisateur->id,
                    'anciennes_valeurs' => null,
                    'nouvelles_valeurs' => json_encode([
                        'email' => $validated['email'],
                        'status' => 'failed',
                        'reason' => 'account_disabled'
                    ]),
                    'date_action' => now(),
                    'adresse_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'route' => 'api/auth/login'
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Compte désactivé. Contactez l\'administrateur.'
                ], 403);
            }

            // ✅ Connexion réussie
            $utilisateur->update(['derniere_connexion' => now()]);

            Audit::create([
                'id_utilisateur' => $utilisateur->id,
                'action' => 'LOGIN_SUCCESS',
                'table_cible' => 'auth',
                'id_enregistrement' => $utilisateur->id,
                'anciennes_valeurs' => null,
                'nouvelles_valeurs' => json_encode([
                    'email' => $utilisateur->email,
                    'status' => 'success',
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]),
                'date_action' => now(),
                'adresse_ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'route' => 'api/auth/login'
            ]);

            $token = $utilisateur->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'data' => [
                    'utilisateur' => [
                        'id' => $utilisateur->id,
                        'nom' => $utilisateur->nom,
                        'prenom' => $utilisateur->prenom,
                        'email' => $utilisateur->email,
                        'full_name' => $utilisateur->full_name,
                        'role' => $utilisateur->role,
                        'ville' => $utilisateur->ville,
                        'departement' => $utilisateur->departement,
                        'zone' => $utilisateur->zone,
                        'emplacement' => $utilisateur->emplacement,
                        'permissions' => $utilisateur->role->permissions->pluck('code'),
                    ],
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
                'message' => 'Connexion réussie'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la connexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user) {
                Audit::create([
                    'id_utilisateur' => $user->id,
                    'action' => 'LOGOUT',
                    'table_cible' => 'auth',
                    'id_enregistrement' => $user->id,
                    'anciennes_valeurs' => null,
                    'nouvelles_valeurs' => json_encode([
                        'email' => $user->email,
                        'status' => 'logout'
                    ]),
                    'date_action' => now(),
                    'adresse_ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'route' => 'api/auth/logout'
                ]);
            }

            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Déconnexion réussie'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la déconnexion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user()->load(['role.permissions', 'ville', 'departement', 'zone', 'emplacement']);

            return response()->json([
                'success' => true,
                'data' => [
                    'utilisateur' => [
                        'id' => $user->id,
                        'nom' => $user->nom,
                        'prenom' => $user->prenom,
                        'email' => $user->email,
                        'full_name' => $user->full_name,
                        'role' => $user->role,
                        'ville' => $user->ville,
                        'departement' => $user->departement,
                        'zone' => $user->zone,
                        'emplacement' => $user->emplacement,
                        'permissions' => $user->role->permissions->pluck('code'),
                        'actif' => $user->actif,
                        'derniere_connexion' => $user->derniere_connexion,
                    ],
                ],
                'message' => 'Utilisateur connecté'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update authenticated user's profile
     */
    public function updateMe(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'nom' => 'sometimes|required|string|max:100',
                'prenom' => 'nullable|string|max:100',
                'email' => "sometimes|required|email|max:100|unique:utilisateurs,email,{$user->id}",
                'mot_de_passe' => 'nullable|string|min:6|confirmed',
            ]);

            if ($request->filled('mot_de_passe')) {
                $validated['mot_de_passe'] = Hash::make($validated['mot_de_passe']);
            }

            $user->update($validated);
            $user->load(['role.permissions', 'ville', 'departement', 'zone', 'emplacement']);

            return response()->json([
                'success' => true,
                'data' => [
                    'utilisateur' => [
                        'id' => $user->id,
                        'nom' => $user->nom,
                        'prenom' => $user->prenom,
                        'email' => $user->email,
                        'full_name' => $user->full_name,
                        'role' => $user->role,
                        'ville' => $user->ville,
                        'departement' => $user->departement,
                        'zone' => $user->zone,
                        'emplacement' => $user->emplacement,
                        'permissions' => $user->role->permissions->pluck('code'),
                        'actif' => $user->actif,
                        'derniere_connexion' => $user->derniere_connexion,
                    ],
                ],
                'message' => 'Profil mis à jour avec succès'
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du profil',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}