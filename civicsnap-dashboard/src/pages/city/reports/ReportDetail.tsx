import React, { useEffect, useState } from "react";
import {useParams, useNavigate} from "react-router-dom";
import { Query } from "appwrite";
import { databases, appwriteConfig, googleMapsApiKey } from "@core/appwrite";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";


import toast from "react-hot-toast";

import { useTranslation } from "react-i18next";

// --- importing components ---
import Header from "@components/Header";
import Sidebar from "@components/Sidebar";

import {Sparkles, ArrowLeft, Image as ImageIcon} from "lucide-react";
import { useAuth } from "@core/AuthProvider";

export default function ReportDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { t } = useTranslation();

    const [report, setReport] = useState<any>(null);
    const [duplicates, setDuplicates] = useState<any[]>([]);

    const [selectedDuplicate, setSelectedDuplicate] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [status, setStatus] = useState("");
    const [adminNote, setAdminNote] = useState("");

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: googleMapsApiKey,
    });

    useEffect(() => {
        const fetchReportAndDuplicates = async () => {
            if(!id) return;
            try {
                const response = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.reportsCollectionId,
                    id
                );
                setReport(response);
                setStatus(response.status);
                setAdminNote(response.admin_notes || "");

                const duplicatesResponse = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.reportsCollectionId,
                    [
                        Query.equal('original_report_id', id),
                        Query.orderDesc('$createdAt')
                    ]
                );
                setDuplicates(duplicatesResponse.documents);
            } catch (error) {
                console.error("Error fetching report:", error);
            } finally{
                setLoading(false);
            }
        };
        fetchReportAndDuplicates();
    }, [id]);

    const handleSave = async () => {
        if(!id) return;

        try {
            const positiveStatuses = ['approved', 'in_progress', 'resolved'];

            const pointsAlreadyAwarded = report.points_awarded > 0;
            let newPointsAwarded = report.points_awarded;

            let pointsAwardedNow = 0;

            if(positiveStatuses.includes(status) && !pointsAlreadyAwarded) {
                const categoryDocument = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.categoriesCollectionId,
                    report.category_id
                );
                pointsAwardedNow = categoryDocument.default_points;

                const userProfile = await databases.getDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.profilesCollectionId,
                    report.user_id
                );

                await databases.updateDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.profilesCollectionId,
                    report.user_id,
                    {
                        current_points: (userProfile.current_points || 0) + pointsAwardedNow,
                    }
                );

                newPointsAwarded = pointsAwardedNow;
            }

            await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.reportsCollectionId,
                id,
                {
                    status: status,
                    admin_notes: adminNote,
                    points_awarded: newPointsAwarded,
                }
            );

            if (duplicates && duplicates.length > 0) {
                const duplicateReward = 5;

                for (const dup of duplicates) {
                    const dupAlreadyAwarded = dup.points_awarded > 0;
                    let dupPointsToAward = 0;

                    if(positiveStatuses.includes(status) && !dupAlreadyAwarded) {
                        dupPointsToAward = duplicateReward;

                        try {
                            const dupUserProfile = await databases.getDocument(
                                appwriteConfig.databaseId,
                                appwriteConfig.profilesCollectionId,
                                dup.user_id
                            );

                            await databases.updateDocument(
                                appwriteConfig.databaseId,
                                appwriteConfig.profilesCollectionId,
                                dup.user_id,
                                {
                                    current_points: (dupUserProfile.current_points || 0) + dupPointsToAward,
                                }
                            );
                        } catch (error) {
                            console.error("Error updating duplicate user profile:", error);
                        }
                    }

                    try {
                        await databases.updateDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.reportsCollectionId,
                            dup.$id,
                            {
                                status: status,
                                admin_notes: adminNote ? `[Gekoppeld aan hoofdmelding] ${adminNote}` : "[Afgehandeld via originele melding]",
                                points_awarded: dupAlreadyAwarded ? dup.points_awarded : dupPointsToAward,
                            }
                        );
                    } catch (error) {
                        console.error("Error updating duplicate report:", error);
                    }
                }
            }

            if (pointsAwardedNow > 0 ) {
                toast.success(t("reportsDetail.pointsAwardedSuccess", { pointsAwardedNow: pointsAwardedNow }));
            } else {
                toast.success(t("reportsDetail.updateSuccess"));
            }


            navigate('/reports');
        } catch (error) {
            console.error("Error saving report:", error);
        }
    };

    if (loading){
        return <div className="min-h-screen flex items-center justify-center font-inter-medium">{t("general.loading")}</div>;
    }

    if (!report) {
        return <div className="min-h-screen flex items-center justify-center font-inter-medium">{t("reportsDetail.notFound")}</div>;
    }


    return (
        <div className="min-h-screen bg-[#F5F7FA] font-inter">
            <Header />
            <div className="flex">
                <Sidebar activeItem="reports" />

                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        
                        <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => navigate('/reports')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50">
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">{t("reportsDetail.title")}</h1>
                        </div>

                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            
                            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[400px]">
                                {report.photo_url ? (
                                    <img src={report.photo_url} alt="Report" className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center absolute inset-0 text-gray-400">
                                        {t("reportsDetail.noPhoto")}
                                    </div>
                                )}
                                
                             
                                {report.ai_detected_category && (
                                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                                        <Sparkles size={16} className="text-orange-500" />
                                        <span className="text-sm font-bold text-gray-800">
                                            AI: {report.ai_detected_category} {t('reportsDetail.recognized')}
                                        </span>
                                    </div>
                                )}
                            </div>

                          
                            <div className="lg:col-span-1 flex flex-col gap-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                                    <div className="w-full h-48 rounded-xl overflow-hidden mb-3">
                                        {isLoaded ? (
                                            <GoogleMap
                                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                                center={{ lat: report.location_lat, lng: report.location_long }}
                                                zoom={15}
                                                options={{ disableDefaultUI: true }}
                                            >
                                                <Marker position={{ lat: report.location_lat, lng: report.location_long }} />
                                            </GoogleMap>
                                        ) : <div className="w-full h-full bg-gray-100"></div>}
                                    </div>
                                    <p className="text-center text-sm font-semibold text-gray-600">{report.address}</p>
                                </div>

                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t('reportsDetail.descriptionLabel')}</h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        "{report.description}"
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">{t('reportsDetail.actionPanel.title')}</h2>
                                
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('reportsDetail.actionPanel.statusLabel')}</label>
                                    <select 
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        disabled={profile?.role === 'org_viewer'}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0870C4]"
                                    >
                                        <option value="new">{t('reportsDetail.actionPanel.statusOptions.new')}</option>
                                        <option value="approved">{t('reportsDetail.actionPanel.statusOptions.approved')}</option>
                                        <option value="in_progress">{t('reportsDetail.actionPanel.statusOptions.in_progress')}</option>
                                        <option value="invalid">{t('reportsDetail.actionPanel.statusOptions.invalid')}</option>
                                        <option value="resolved">{t('reportsDetail.actionPanel.statusOptions.resolved')}</option>
                                    </select>
                                </div>

                                <div className="mb-8 flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t('reportsDetail.actionPanel.internNotesLabel')}</label>
                                    <textarea 
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder={t('reportsDetail.actionPanel.internNotesPlaceholder')}
                                        disabled={profile?.role === 'org_viewer'}
                                        className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0870C4] resize-none"
                                    />
                                </div>

                               {profile?.role !== 'org_viewer' && (
                                    <button 
                                        onClick={handleSave}
                                        className="w-full bg-[#0870C4] text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                                    >
                                        {t('general.saveButton')}
                                    </button>
                                )}

                             
                                {profile?.role === 'org_viewer' && (
                                    <p className="text-sm text-gray-500 text-center font-medium">
                                        {t('reportsDetail.actionPanel.viewRights')}
                                    </p>
                                )}
                            </div>

                        </div>

                        {duplicates.length > 0 && (
                            <div className="mt-8 ">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">
                                    Gekoppelde Meldingen ({duplicates.length})
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {duplicates.map((dup) => (
                                        <div key={dup.$id} onClick={() => setSelectedDuplicate(dup)} className="hover:cursor-pointer bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                            <div className="h-32 bg-gray-100 relative">
                                                {dup.photo_url ? (
                                                    <img src={dup.photo_url} alt="Duplicate" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon className="text-gray-300" size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <p className="text-xs text-gray-500 mb-2">
                                                    {new Date(dup.$createdAt).toLocaleDateString("nl-BE")}
                                                </p>
                                                <p className="text-sm text-gray-800 line-clamp-3">
                                                    "{dup.description}"
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- MODAL VOOR DUPLICATE DETAILS --- */}
            {selectedDuplicate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Gekoppelde Melding Details</h3>
                            <button onClick={() => setSelectedDuplicate(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
                                <span className="font-bold text-xl leading-none">&times;</span>
                            </button>
                        </div>
                        
                        {/* Content Scrollable */}
                        <div className="overflow-y-auto p-6">
                            <div className="w-full h-64 bg-gray-100 rounded-xl mb-6 overflow-hidden relative">
                                {selectedDuplicate.photo_url ? (
                                    <img src={selectedDuplicate.photo_url} alt="Duplicate" className="w-full h-full object-contain bg-black/5" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        Geen foto beschikbaar
                                    </div>
                                )}
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Beschrijving van de melder</h4>
                            <p className="text-gray-800 bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                                "{selectedDuplicate.description}"
                            </p>

                            <div className="flex gap-4 text-sm text-gray-500">
                                <p><strong>Gemeld op:</strong> {new Date(selectedDuplicate.$createdAt).toLocaleDateString("nl-BE")}</p>
                                {selectedDuplicate.ai_detected_category && (
                                    <p><strong>AI Detectie:</strong> {selectedDuplicate.ai_detected_category}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
                    </div>
                </main>
            </div>
        </div>
    )
};