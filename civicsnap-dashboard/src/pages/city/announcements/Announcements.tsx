import { useEffect, useState } from "react";
import { databases, appwriteConfig } from "@core/appwrite";
import { Models, ID, Query, Permission, Role } from "appwrite";
import { useAuth } from "@core/AuthProvider";
import toast from "react-hot-toast";

import {
  Megaphone,
  Plus,
  Check,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";

import Header from "@components/Header";
import Sidebar from "@components/Sidebar";

import { useTranslation } from "react-i18next";

// Extending the Appwrite Document model with our custom announcement fields
interface Announcement extends Models.Document {
  title: string;
  content: string;
  start_at: string;
  ends_at: string;
  organization_id: string;
  priority: "low" | "medium" | "high" | string;
  is_active: boolean;
}

export default function Announcements() {
  // Get the current user's profile from the auth context
  const { profile } = useAuth();

  // Initialize the i18n translation function for multi-language support
  const { t } = useTranslation();

  // State to hold the list of fetched announcements
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Loading indicator while fetching data from the database
  const [loading, setLoading] = useState(true);

  // Controls whether the create/edit modal is visible
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Indicates if the form is currently being submitted (prevents double-submit)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If set, the modal is in "edit" mode for the announcement with this ID
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- Form field states ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [priority, setPriority] = useState("low");

  /**
   * Fetches all announcements belonging to the current user's organization
   * from the Appwrite database, ordered by start date descending.
   */
  const fetchAnnouncements = async () => {
    // Don't fetch if we don't have an organization context yet
    if (!profile?.organization_id) return;
    setLoading(true);

    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.announcementsCollectionId,
        [
          // Filter: only announcements for the current organization
          Query.equal("organization_id", profile.organization_id),
          // Sort: newest announcements first
          Query.orderDesc("start_at"),
        ],
      );
      setAnnouncements(response.documents as unknown as Announcement[]);
    } catch (error) {
      toast.error(t('announcements.toast.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch announcements whenever the user's organization changes
  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.organization_id]);

  /**
   * Handles form submission for both creating a new announcement
   * and updating an existing one (determined by `editingId`).
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;

    // Validate that the end date is after the start date
    if (new Date(endsAt) <= new Date(startAt)) {
      toast.error(t('announcements.toast.dateError'));
      return;
    }

    // Validate that all required fields are filled
    if (!title || !content || !startAt || !endsAt) {
      toast.error(t('announcements.toast.validationError'));
      return;
    }

    setIsSubmitting(true);
    // Show a loading toast that we'll update on success/failure
    const toastId = toast.loading(t('announcements.modal.buttonLoading'));

    try {
      if (editingId) {
        // --- UPDATE existing announcement ---
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.announcementsCollectionId,
          editingId,
          {
            title,
            content,
            start_at: new Date(startAt).toISOString(),
            ends_at: new Date(endsAt).toISOString(),
            priority,
          },
        );
        toast.success(t('announcements.toast.updateSuccess'), { id: toastId });
      } else {
        // --- CREATE new announcement ---
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
            is_active: true, // New announcements are active by default
          },
          [
            // Permission: all logged-in users can read
            Permission.read(Role.users()),
            // Permission: only members of this organization can update
            Permission.update(Role.team(profile.organization_id)),
            // Permission: only members of this organization can delete
            Permission.delete(Role.team(profile.organization_id)),
          ],
        );
        toast.success(t('announcements.toast.createSuccess'), { id: toastId });
      }

      // Helper to clear all form fields back to their defaults
      const resetForm = () => {
        setTitle("");
        setContent("");
        setStartAt("");
        setEndsAt("");
        setPriority("low");
        setEditingId(null);
      };

      // Close the modal, reset the form, and refresh the announcements list
      setIsModalOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error("Error creating announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Opens the modal in "edit" mode, pre-filling the form fields
   * with the selected announcement's data.
   */
  const handleOpenEdit = (announcement: Announcement) => {
    setTitle(announcement.title);
    setContent(announcement.content);
    // Convert ISO dates to the format expected by datetime-local inputs (YYYY-MM-DDTHH:MM)
    setStartAt(new Date(announcement.start_at).toISOString().slice(0, 16));
    setEndsAt(new Date(announcement.ends_at).toISOString().slice(0, 16));
    setPriority(announcement.priority);
    setEditingId(announcement.$id);
    setIsModalOpen(true);
  };

  /**
   * Deletes an announcement after user confirmation.
   * Only org_admin users should have access to the delete button.
   */
  const handleDelete = async (id: string) => {
    // Ask for confirmation before deleting
    if (
      !window.confirm(
        t('announcements.actions.deleteConfirm'))
    )
      return;

    const toastId = toast.loading(t('general.loading'));
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.announcementsCollectionId,
        id,
      );
      toast.success(t('announcements.toast.deleteSuccess'), { id: toastId });
      fetchAnnouncements();
    } catch (error) {
      toast.error(t('announcements.toast.deleteError'), { id: toastId });
    }
  };

  /**
   * Formats a date string into a human-readable format (Dutch-Belgian locale).
   * Example output: "15 jan. 2025, 14:30"
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("nl-BE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Returns a colored badge JSX element based on the priority level.
   * Maps "high" -> red, "medium" -> yellow, "low" -> green.
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">{t('announcements.priority.high')}</span>;
      case "medium":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">{t('announcements.priority.medium')}</span>;
      case "low":
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">{t('announcements.priority.low')}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">{t('announcements.priority.unknown')}</span>;
    }
  };

  /**
   * Determines the current status of an announcement based on its
   * active state and the current time relative to its start/end dates.
   * Returns an object with a label, color classes, and dot color for display.
   */
  const getAnnouncementStatus = (announcement: Announcement) => {
    // If the announcement has been manually paused
    if (!announcement.is_active) {
      return { label: t('announcements.status.paused'), color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
    }

    const now = new Date();
    const start = new Date(announcement.start_at);
    const end = new Date(announcement.ends_at);

    // If the current time is past the end date -> expired
    if (now > end) {
      return { label: t('announcements.status.expired'), color: "bg-red-100 text-red-600", dot: "bg-red-400" };
    }

    // If the current time is between start and end -> currently active
    if (now >= start && now <= end) {
      return { label: t('announcements.status.active'), color: "bg-green-100 text-green-600", dot: "bg-green-400" };
    }

    // If the current time is before the start date -> planned/scheduled
    if (now < start) {
      // Calculate how far away the start date is for a friendly label
      const diffMilisec = start.getTime() - now.getTime();
      const diffHours = Math.floor(diffMilisec / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const diffMinutes = Math.floor(diffMilisec / (1000 * 60));

      let timeString = "";
      if (diffDays > 0) timeString = t('announcements.status.startsInDays', { days: diffDays });
      else if (diffHours > 0) timeString = t('announcements.status.startsInHours', { hours: diffHours });
      else timeString = t('announcements.status.startsInMins', { mins: diffMinutes });

      return { label: `${t('announcements.status.planned')} (${timeString})`, color: "bg-yellow-100 text-yellow-600", dot: "bg-yellow-400" };
    }

    // Fallback for any unexpected state
    return { label: t('announcements.status.unknown'), color: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  };

  /**
   * Toggles the is_active field of an announcement (pause/resume).
   * This allows admins to temporarily disable announcements without deleting them.
   */
  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await databases.updateDocument(appwriteConfig.databaseId, appwriteConfig.announcementsCollectionId, id, { is_active: !currentState });
      // Build a human-readable action text for the success message
      const actionText = !currentState ? t('announcements.actions.resume').toLowerCase() : t('announcements.actions.pause').toLowerCase();
      toast.success(t('announcements.toast.toggleSuccess', { status: actionText }));
      fetchAnnouncements();
    } catch (error) {
      toast.error(t('announcements.toast.toggleError'));
    }
  };

  // Enrich each announcement with its computed status for use in the table
  const announcementsWithStatus = announcements.map((announcement) => ({
    ...announcement,
    status: getAnnouncementStatus(announcement),
  }));

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Top navigation bar */}
      <Header />

      <div className="flex">
        {/* Left sidebar navigation with "announcements" highlighted */}
        <Sidebar activeItem="announcements" />

        {/* Main content area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden p-8">
          <div className="max-w-6xl w-full mx-auto space-y-6">
          
            {/* Page header section with title and "New Announcement" button */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Megaphone className="text-[#0870C4]" />
                  {t('announcements.title')}
                </h1>
                <p className="text-gray-500 mt-1 text-sm">
                  {t('announcements.subtitle')}
                </p>
              </div>
              {/* Only show the create button for users who are not viewers */}
              {profile?.role !== "org_viewer" && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-[#0870C4] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <Plus size={20} />
                  {t('announcements.newButton')}
                </button>
              )}
            </div>

            {/* Announcements table section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Show loading state while fetching */}
              {loading ? (
                <div className="flex justify-center py-16 text-gray-400">
                  {t('general.loading')}
                </div>
              ) : announcements.length === 0 ? (
                /* Empty state when no announcements exist */
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Megaphone size={40} className="mb-3 text-gray-300" />
                  <span className="text-sm font-medium">
                    {t('announcements.noAnnouncements')}
                  </span>
                </div>
              ) : (
                /* Scrollable table displaying all announcements */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    {/* Table column headers */}
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">{t('announcements.table.title')}</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">{t('announcements.table.period')}</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">{t('announcements.table.priority')}</th>
                        <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">{t('announcements.table.status')}</th>
                        {/* Only show actions column for non-viewer users */}
                        {profile?.role !== "org_viewer" && (
                           <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase text-right">{t('announcements.table.actions')}</th>
                        )}
                      </tr>
                    </thead>

                    {/* Table body: one row per announcement */}
                    <tbody className="divide-y divide-gray-100">
                      {announcementsWithStatus.map((row) => (
                        <tr
                          key={row.$id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Title and truncated content preview */}
                          <td className="py-4 px-6">
                            <p className="font-bold text-gray-800">
                              {row.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {row.content}
                            </p>
                          </td>

                          {/* Start and end date display */}
                          <td className="py-4 px-6">
                            <div className="flex flex-col text-sm text-gray-600 gap-1">
                              {/* Green check icon for start date */}
                              <span className="flex items-center gap-1">
                                <Check size={14} className="text-green-500" />{" "}
                                {formatDate(row.start_at)}
                              </span>
                              {/* Red clock icon for end date */}
                              <span className="flex items-center gap-1">
                                <Clock size={14} className="text-red-400" />{" "}
                                {formatDate(row.ends_at)}
                              </span>
                            </div>
                          </td>

                          {/* Priority badge (low/medium/high) */}
                          <td className="py-4 px-6">
                            {getPriorityColor(row.priority)}
                          </td>

                          {/* Status badge with colored dot (active/expired/planned/paused) */}
                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${row.status.color}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${row.status.dot}`}
                              ></span>
                              {row.status.label}
                            </span>
                          </td>

                          {/* Action buttons: pause/resume, edit, delete (role-gated) */}
                          {profile?.role !== "org_viewer" && (
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Toggle active/paused state button */}
                                <button
                                  onClick={() => handleToggleActive(row.$id, row.is_active)}
                                  title={row.is_active ? t('announcements.actions.pause') : t('announcements.actions.resume')}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${row.is_active ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}
                                >
                                  {row.is_active ? t('announcements.actions.pause') : t('announcements.actions.resume')}
                                </button>

                                {/* Edit button: opens the modal in edit mode */}
                                <button
                                  onClick={() => handleOpenEdit(row)}
                                  title={t('announcements.actions.edit')}
                                  className="p-1.5 text-gray-400 hover:text-[#0870C4] hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit size={18} />
                                </button>

                                {/* Delete button: only visible to org_admin users */}
                                {profile?.role === "org_admin" && (
                                  <button
                                    onClick={() => handleDelete(row.$id)}
                                    title={t('announcements.actions.delete')}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
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

      {/* --- MODAL FOR CREATING / EDITING AN ANNOUNCEMENT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal header: shows different title for create vs edit mode */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? t('announcements.modal.titleEdit') : t('announcements.modal.titleNew')}
              </h3>
              {/* Close button placeholder */}
            </div>

            {/* Modal form: scrollable if the content overflows */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-4">
              {/* Title input field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('announcements.modal.formTitle')}</label>
                <input 
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                  placeholder={t('announcements.modal.formTitlePlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                />
              </div>

              {/* Content textarea field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{t('announcements.modal.formContent')}</label>
                <textarea 
                  value={content} onChange={(e) => setContent(e.target.value)} required
                  placeholder={t('announcements.modal.formContentPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl h-32 resize-none focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                />
              </div>

              {/* Start and end date/time pickers side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('announcements.modal.formStart')}</label>
                  <input 
                    type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('announcements.modal.formEnd')}</label>
                  {/* The min attribute prevents selecting an end date before the start date */}
                  <input 
                    type="datetime-local" min={startAt} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#0870C4] focus:outline-none"
                  />
                </div>
              </div>

              {/* Priority dropdown selector */}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{t('announcements.modal.formPriority')}</label>
                  <select 
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0870C4] focus:outline-none bg-white"
                  >
                    <option value="low">{t('announcements.priority.low')}</option>
                    <option value="medium">{t('announcements.priority.medium')}</option>
                    <option value="high">{t('announcements.priority.high')}</option>
                  </select>
                </div>
              </div>

              {/* Modal footer with cancel and submit buttons */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                {/* Cancel button: closes the modal without saving */}
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl">
                  {t('general.cancelButton')}
                </button>
                {/* Submit button: label changes based on create/edit mode and loading state */}
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-[#0870C4] text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2 shadow-sm">
                  {isSubmitting ? t('announcements.modal.buttonLoading') : (editingId ? t('announcements.modal.buttonUpdate') : t('announcements.modal.buttonCreate'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
