import React, { useState } from 'react';
import { useAuth } from '@core/AuthProvider';
import { teams, databases, appwriteConfig } from '@core/appwrite';
import { ID } from 'appwrite';


export default function SuperAdminDashboard() {
    const { user, profile, logout } = useAuth();
    
    // Zichtbaarheid van het formulier
    const [showForm, setShowForm] = useState(false);

    // Formulier states
    const [name, setName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [zipCodes, setZipCodes] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleCreateOrganization = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const team = await teams.create(ID.unique(), name);

            await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.organizationsCollectionId,
                team.$id, 
                {
                    name: name,
                    contact_email: contactEmail,
                    zip_codes: zipCodes,
                    logo_url: logoUrl || null,
                    status: 'active'
                }
            );

            const loginUrl = `${window.location.origin}/login`;

            await teams.createMembership(
                team.$id,
                ['org_admin'], 
                contactEmail,
                undefined,
                undefined, 
                loginUrl, 
                'Ambtenaar' 
            );

            setMessage({ type: 'success', text: `Succes! ${name} is aangemaakt en de uitnodiging is gemaild naar ${contactEmail}.` });
            
            // Leeg de velden EN klap het formulier weer dicht
            setName('');
            setContactEmail('');
            setZipCodes('');
            setLogoUrl('');
            setShowForm(false); 

        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || 'Er is iets misgegaan bij het aanmaken.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-inter">
            {/* Navigatiebalk */}
            <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-inter-bold text-[#0870C4]">CivicSnap Super Admin</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 font-inter-medium">{profile?.full_name || user?.email}</span>
                    <button onClick={logout} className="px-4 py-2 bg-red-50 text-red-600 font-inter-semibold rounded-lg hover:bg-red-100 transition">
                        Uitloggen
                    </button>
                </div>
            </nav>

            <div className="p-8 max-w-6xl mx-auto mt-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-inter-bold">Overzicht Gemeentes</h2>
                    
                    {/* De "Nieuwe Gemeente" Knop */}
                    {!showForm && (
                        <button 
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-[#0870C4] text-white font-inter-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            
                            Nieuwe Gemeente Aanmaken
                        </button>
                    )}
                </div>
                
                {/* Globale Meldingen (bijv. als het formulier dichtklapt na succes) */}
                {message.text && !showForm && (
                    <div className={`p-4 rounded-xl mb-6 font-inter-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Het Formulier (Alleen zichtbaar als showForm true is) */}
                {showForm && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-inter-bold text-gray-800">Gegevens Nieuwe Gemeente</h3>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                                sluiten
                            </button>
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-xl mb-6 font-inter-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : ''}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleCreateOrganization} className="flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col gap-2">
                                    <label className="font-inter-semibold text-gray-700 text-sm">Naam Gemeente *</label>
                                    <input type="text" placeholder="bijv. Stad Gent" value={name} onChange={(e) => setName(e.target.value)} className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4]" required />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="font-inter-semibold text-gray-700 text-sm">Postcodes (met komma) *</label>
                                    <input type="text" placeholder="bijv. 9000, 9050" value={zipCodes} onChange={(e) => setZipCodes(e.target.value)} className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4]" required />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-inter-semibold text-gray-700 text-sm">E-mailadres Beheerder (org_admin) *</label>
                                <input type="email" placeholder="admin@stad.gent" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4]" required />
                                <p className="text-xs text-gray-500">Er wordt direct een uitnodiging gestuurd naar dit adres.</p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-inter-semibold text-gray-700 text-sm">Logo URL (Optioneel)</label>
                                <input type="url" placeholder="https://link-naar-logo.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0870C4]" />
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button type="submit" disabled={loading} className="flex-1 p-4 rounded-xl bg-[#0870C4] text-white font-inter-bold hover:bg-blue-700 transition-colors disabled:opacity-50">
                                    {loading ? 'Aanmaken & Uitnodigen...' : 'Gemeente Aanmaken'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-4 rounded-xl bg-gray-100 text-gray-700 font-inter-bold hover:bg-gray-200 transition-colors">
                                    Annuleren
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {/* Hier komt straks de tabel met actieve gemeentes! */}
                {!showForm && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center min-h-[200px] text-gray-400 font-inter-medium">
                        De tabel met actieve gemeentes komt hier te staan...
                    </div>
                )}

            </div>
        </div>
    );
}