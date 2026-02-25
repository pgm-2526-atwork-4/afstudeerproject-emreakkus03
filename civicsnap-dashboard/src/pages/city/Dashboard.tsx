import React from "react";
import { useAuth } from "@core/AuthProvider";

export default function Dashboard() {
    const {user, profile, logout} = useAuth();

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-inter">
            {/* Gemeente Navigatiebalk */}
            <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b-4 border-[#0870C4]">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-inter-bold text-gray-800">Gemeente Portaal</h1>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-inter-semibold">
                        {profile?.role === 'org_admin' ? 'Beheerder' : 'Ambtenaar'}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 font-inter-medium">{profile?.full_name}</span>
                    <button onClick={logout} className="px-4 py-2 bg-gray-100 text-gray-700 font-inter-semibold rounded-lg hover:bg-gray-200 transition">
                        Uitloggen
                    </button>
                </div>
            </nav>

            <div className="p-8 max-w-6xl mx-auto mt-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-2xl font-inter-bold mb-2">Welkom, {profile?.full_name}!</h2>
                    <p className="text-gray-600 font-inter-regular">
                        Je bent ingelogd voor de gemeente met ID: <strong className="text-[#0870C4]">{profile?.organization_id}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        Hier komen straks alle Civicsnap-meldingen binnen die in jullie specifieke postcodes worden gedaan. Andere gemeentes kunnen deze data niet zien.
                    </p>
                </div>
            </div>
        </div>
    );
};