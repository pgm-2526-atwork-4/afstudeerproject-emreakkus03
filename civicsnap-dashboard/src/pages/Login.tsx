import React, {useState} from "react";
import { account, teams, databases, appwriteConfig } from "@core/appwrite";
import { useAuth } from "@core/AuthProvider";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useTranslation } from "react-i18next";

import { Eye, EyeOff } from "lucide-react";

export default function Login() {
    const [searchParams] = useSearchParams();
    const teamId = searchParams.get("teamId");
    const membershipId = searchParams.get("membershipId");
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    const isInviteFlow = teamId && membershipId && userId && secret;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const { checkAuth } = useAuth();
    const navigate = useNavigate();

    const { t } = useTranslation();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await account.createEmailPasswordSession(email, password);
            await checkAuth();
            navigate("/");
        } catch (error: any) {
            setError(error.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {

            try {
                await teams.updateMembershipStatus(teamId!, membershipId!, userId!, secret!);
                
            } catch (error:any) {
                if(error.message.includes("already") || error.code === 409) {
                    setError("This invite has already been accepted. Please log in with your credentials.");
                } else {
                    throw error;
                }
            }
            const userAccount = await account.get();
            await account.updateName(name);
            let wasExistingUser = false;
            try {
                await account.updatePassword(password);
                
            } catch (error:any) {
                wasExistingUser = true;
                console.log("Wachtwoord niet overschreven: gebruiker had al een account.");
            }

            const memberships = await teams.listMemberships(teamId!);
            const myMembership = memberships.memberships.find(m => m.userId === userId);

            let assignedRole = 'org_viewer';
            if (myMembership) {
                if (myMembership.roles.includes('org_admin')) {
                    assignedRole = 'org_admin';
                } else if (myMembership.roles.includes('org_officer')) {
                    assignedRole = 'org_officer';
                }
            }

            try {
                await databases.getDocument(appwriteConfig.databaseId, appwriteConfig.profilesCollectionId, userId!);

                await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.profilesCollectionId,
                    userId!,
                    {
                        full_name: name,
                        role: assignedRole,
                        organization_id: teamId,
                    }
                );
            } catch (error) {
                await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.profilesCollectionId,
                    userId!,
                    {
                        email: userAccount.email,
                        full_name: name,
                        role: assignedRole,
                        organization_id: teamId,
                        current_points: 0,
                        lifetime_points: 1,
                        is_banned: false,
                        avatar_url: null
                    }
                );
            }


            await checkAuth();
            if (wasExistingUser) {
                alert("Uitnodiging geaccepteerd! Omdat je al bekend was in het systeem, is je originele wachtwoord behouden.");
            }
            navigate("/");
        } catch (error: any) {
            setError(error.message || "Failed to accept invite. Please try again.");
        } finally {
            setLoading(false);
        }
    };

   return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] font-inter">
            <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md text-center">
                <h1 className="text-3xl font-inter-bold text-gray-900 mb-2">{isInviteFlow ? t('login.titleInviteFlow') : t('login.titleNormal')}</h1>
                <p className="text-gray-500 mb-8 font-inter-regular">{isInviteFlow 
                        ? t('login.descriptionInviteFlow') 
                        : t('login.descriptionNormal')}</p>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm font-inter-medium">
                        {error}
                    </div>
                )}
{isInviteFlow ? (
               <form onSubmit={handleAcceptInvite} className="flex flex-col gap-4">
                        <input 
                            type="text" 
                            placeholder={t('login.registerNamePlaceholder')} 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4] font-inter-regular"
                            required
                        />
                        <div className="relative">

                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={t('login.registerPasswordPlaceholder')} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4] font-inter-regular pr-12"
                                required
                                minLength={8}
                            />

                            <button type="button" onClick={()=> setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="mt-4 p-4 rounded-xl bg-[#0870C4] text-white font-inter-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {loading ? t('login.buttonAccept') : t('login.buttonAccountMaking')}
                        </button>
                    </form>
) : (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <input 
                            type="email" 
                            placeholder={t('login.loginEmailPlaceholder')} 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4] font-inter-regular"
                            required
                        />
                         <div className="relative">

                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder={t('login.loginPasswordPlaceholder')} 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4] font-inter-regular pr-12"
                                required
                            />

                            <button type="button" onClick={()=> setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <button type="submit" disabled={loading} className="mt-4 p-4 rounded-xl bg-[#0870C4] text-white font-inter-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {loading ? t('login.buttonLoading') : t('login.buttonLogin')}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );

};