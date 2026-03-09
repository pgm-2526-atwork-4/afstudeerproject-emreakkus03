import { useEffect, useState } from "react";
import {databases, appwriteConfig} from "@core/appwrite";
import { Models, ID, Query, Permission, Role } from "appwrite";
import { useAuth } from "@core/AuthProvider";
import toast from "react-hot-toast";

import { Megaphone, Plus, Calendar, AlertCircle, X, Check, Clock } from "lucide-react";

import Header from "@components/Header";
import Sidebar from "@components/Sidebar";

import { useTranslation } from "react-i18next";

interface Announcement extends Models.Document {
    title: string;
    content: string;
    start_at: string;
    ends_at: string;
    organization_id: string;
    priority: 'low' | 'medium' | 'high' | string;
    is_active: boolean;
}

export default function Announcements() {
    const { profile } = useAuth();
    // defining i18n translation function
    const { t } = useTranslation();

    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // form states
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [priority, setPriority] = useState("low");


    // Fetch announcements for each city dashboard
    const fetchAnnouncements = async () => {
        if (!profile?.organization_id) return;
        setLoading(true);

        try {
            const response = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.announcementsCollectionId,
                [
                    Query.equal("organization_id", profile.organization_id),
                    Query.orderDesc("start_at")
                ]
            );
            setAnnouncements(response.documents as unknown as Announcement[]);
        } catch (error) {
            console.error("Error fetching announcements:", error);
            toast.error("error fetching announcements");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [profile?.organization_id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!profile?.organization_id) return;

        if (!title || !content || !startAt || !endsAt) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.announcementsCollectionId,
                ID.unique(),
                {
                    title,
                    content,
                    start_at: new Date(startAt).toISOString(),
                    ends_at: new Date(endsAt).toISOString(),
                    organization_id: profile.organization_id,
                    priority,
                    is_active: true,
                }, [
                    Permission.read(Role.users()),
                    Permission.update(Role.team(profile.organization_id)),
                    Permission.delete(Role.team(profile.organization_id)),
                ]
            );
const resetForm = () => {
        setTitle("");
        setContent("");
        setStartAt("");
        setEndsAt("");
        setPriority("low");
    
    };
    
            toast.success("Announcement created successfully!");
            setIsModalOpen(false);
            resetForm();
            fetchAnnouncements();
        } catch (error) {
            toast.error("Error creating announcement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString("nl-BE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high":
                return "bg-red-100 text-red-800";
            case "medium":
                return "bg-yellow-100 text-yellow-800";
            case "low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getAnnouncementStatus = (announcement: Announcement) => {
        if (!announcement.is_active) {
            return { label: "Inactive", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
        }

        const now = new Date();
        const start = new Date(announcement.start_at);
        const end = new Date(announcement.ends_at);

        if (now > end) {
            return { label: "Expired", color: "bg-red-100 text-red-600", dot: "bg-red-400" };
        }

        if (now >= start && now <= end) {
            return { label: "Active", color: "bg-green-100 text-green-600", dot: "bg-green-400" };
        }

        if (now < start) {
            const diffMilisec = start.getTime() - now.getTime();
            const diffHours = Math.floor(diffMilisec / (1000 * 60 * 60));
            const diffDays = Math.floor(diffHours / 24);
            const diffMinutes = Math.floor(diffMilisec/ (1000 * 60));

            let timeString = "";
            if(diffDays > 0) timeString += `Starts in ${diffDays} day(s) `;
            else if(diffHours > 0) timeString += `Starts in ${diffHours} hour(s) `;
            else timeString += `Starts in ${diffMinutes} minute(s) `;

            return { label: `Planned ${timeString}`, color: "bg-yellow-100 text-yellow-600", dot: "bg-yellow-400" };
        }

        return { label: "Unknown", color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    };


    const handleToggleActive = async (id: string, currentState: boolean) => {
        try {
            await databases.updateDocument(
                appwriteConfig.databaseId,
                appwriteConfig.announcementsCollectionId,
                id,
                {
                    is_active: !currentState,
                }
            );
            toast.success(`Announcement ${!currentState ? "activated" : "deactivated"} successfully!`);
            fetchAnnouncements();
        } catch (error) {
            toast.error("Error updating announcement.");
        }
    };

    const announcementsWithStatus = announcements.map(announcement => ({
        ...announcement,
        status: getAnnouncementStatus(announcement),
    }));

    return (
        <div className="min-h-screen bg-[#F5F7FA]">
<Header />
<div className="flex">
        {/* Let op: Zorg dat je Sidebar component 'announcements' als activeItem ondersteunt */}
        <Sidebar activeItem="announcements" />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden p-8">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            
            {/* Header Sectie */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Megaphone className="text-[#0870C4]" />
                  Aankondigingen
                </h1>
                <p className="text-gray-500 mt-1 text-sm">Beheer hier de actieve meldingen voor burgers in jouw regio.</p>
              </div>
              {profile?.role !== 'org_viewer' && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0870C4] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={20} />
                Nieuwe Aankondiging
              </button>
              )}
            </div>

            {/* Tabel Sectie */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-16 text-gray-400">Laden...</div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Megaphone size={40} className="mb-3 text-gray-300" />
                  <span className="text-sm font-medium">Er zijn nog geen aankondigingen.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Titel</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Periode</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Prioriteit</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                  <tbody className="divide-y divide-gray-100">
                      {announcementsWithStatus.map((row) => (
                          <tr key={row.$id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-gray-800">{row.title}</p>
                              <p className="text-xs text-gray-500 truncate max-w-xs">{row.content}</p>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col text-sm text-gray-600 gap-1">
                                <span className="flex items-center gap-1"><Check size={14} className="text-green-500"/> {formatDate(row.start_at)}</span>
                                <span className="flex items-center gap-1"><Clock size={14} className="text-red-400"/> {formatDate(row.ends_at)}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {getPriorityColor(row.priority)}
                            </td>
                            
                            {/* De Slimme Status Kolom (gebruikt row.statusObj direct!) */}
                            <td className="py-4 px-6">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${row.status.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${row.status.dot}`}></span> 
                                {row.status.label}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                                {profile?.role !== 'org_viewer' ? (
                              <button 
                                onClick={() => handleToggleActive(row.$id, row.is_active)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${row.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                              >
                                {row.is_active ? "Pauzeren" : "Hervatten"}
                              </button>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* --- MODAL VOOR NIEUWE AANKONDIGING --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Nieuwe Aankondiging</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Titel</label>
                <input 
                  type="text" 
                  value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder="Bijv. Wegwerkzaamheden Centrum"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Bericht (Content)</label>
                <textarea 
                  value={content} onChange={(e) => setContent(e.target.value)} required
                  placeholder="Typ hier de details die de burgers te zien krijgen..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl h-32 resize-none focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Datum & Tijd</label>
                  <input 
                    type="datetime-local" 
                    value={startAt} onChange={(e) => setStartAt(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Eind Datum & Tijd</label>
                  <input 
                    type="datetime-local" 
                    value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="mt-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Prioriteit</label>
                <select 
                  value={priority} onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0870C4] focus:outline-none bg-white"
                >
                  <option value="low">Normaal</option>
                  <option value="medium">Hoog</option>
                  <option value="high">Urgent</option>
                </select>
              </div>
                
        
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl">
                  Annuleren
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#0870C4] text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 shadow-sm">
                  {isSubmitting ? "Opslaan..." : "Aanmaken"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </div>
    )

    

  
}