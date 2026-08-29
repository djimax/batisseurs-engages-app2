import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, MapPin, Users, Clock, Trash2, Edit2, ClipboardCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface Event {
  id: number;
  title: string;
  description?: string | null;
  location?: string | null;
  eventType: string;
  startDate: Date;
  endDate: Date;
  color: string;
  organizer?: string | null;
  attendees?: number | null;
}

type FilterType = "all" | "past" | "present" | "future";
const EVENT_TYPE_LABELS: Record<string, string> = { reunion: "Réunion", formation: "Formation", activite: "Activité", evenement: "Événement", autre: "Autre" };

const SORT_OPTIONS = [
  { value: "date-asc", label: "Date (Plus anciens)" },
  { value: "date-desc", label: "Date (Plus recents)" },
  { value: "title-asc", label: "Titre (A-Z)" },
  { value: "title-desc", label: "Titre (Z-A)" },
  { value: "attendees-high", label: "Participants (Eleves)" },
  { value: "attendees-low", label: "Participants (Bas)" },
];

export default function Events() {
  const { data: storedEvents, isLoading } = trpc.events.list.useQuery();
  const utils = trpc.useUtils();
  const createEvent = trpc.events.create.useMutation({
    onSuccess: async () => { await utils.events.list.invalidate(); toast.success("Événement créé"); setIsOpen(false); },
    onError: (error) => toast.error(error.message),
  });
  const updateEvent = trpc.events.update.useMutation({
    onSuccess: async () => { await utils.events.list.invalidate(); toast.success("Événement mis à jour"); setIsOpen(false); },
    onError: (error) => toast.error(error.message),
  });
  const deleteEvent = trpc.events.delete.useMutation({
    onSuccess: async () => { await utils.events.list.invalidate(); toast.success("Événement supprimé"); },
    onError: (error) => toast.error(error.message),
  });
  const [registrationEventId, setRegistrationEventId] = useState<number | null>(null);
  const [registrationMemberId, setRegistrationMemberId] = useState<number | null>(null);
  const membersQuery = trpc.members.list.useQuery();
  const registrationsQuery = trpc.events.registrations.useQuery({ id: registrationEventId ?? 1 }, { enabled: registrationEventId !== null });
  const registerMember = trpc.events.register.useMutation({
    onSuccess: async () => { await registrationsQuery.refetch(); toast.success("Membre inscrit à l’événement"); setRegistrationMemberId(null); },
    onError: (error) => toast.error(error.message),
  });
  const cancelRegistration = trpc.events.cancelRegistration.useMutation({
    onSuccess: async () => { await registrationsQuery.refetch(); toast.success("Inscription annulée"); },
    onError: (error) => toast.error(error.message),
  });
  const markAttendance = trpc.events.markAttendance.useMutation({
    onSuccess: async () => { await registrationsQuery.refetch(); toast.success("Présence mise à jour"); },
    onError: (error) => toast.error(error.message),
  });
  const registrationSummary = useMemo(() => {
    const rows = registrationsQuery.data ?? [];
    return {
      total: rows.length,
      registered: rows.filter(({ registration }) => registration.status === "registered").length,
      attended: rows.filter(({ registration }) => registration.status === "attended").length,
      cancelled: rows.filter(({ registration }) => registration.status === "cancelled").length,
      attendanceRate: rows.filter(({ registration }) => registration.status !== "cancelled").length === 0 ? 0 : Math.round((rows.filter(({ registration }) => registration.status === "attended").length / rows.filter(({ registration }) => registration.status !== "cancelled").length) * 100),
    };
  }, [registrationsQuery.data]);
  const events = useMemo<Event[]>(() => (storedEvents ?? []).map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    color: event.color ?? "#1a4d2e",
  })), [storedEvents]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", location: "", eventType: "autre" as "reunion" | "formation" | "activite" | "evenement" | "autre", startDate: "", endDate: "", organizer: "", attendees: 0 });

  // Stabilize `now` reference to prevent infinite useMemo recalculations
  const now = useMemo(() => new Date(), []);

  const filteredEvents = useMemo(() => {
    const filtered = events.filter(event => {
      // Filtrer par type de date
      const isPast = event.endDate < now;
      const isFuture = event.startDate > now;
      const isPresent = !isPast && !isFuture;

      let dateMatch = true;
      if (filter === "past") dateMatch = isPast;
      else if (filter === "present") dateMatch = isPresent;
      else if (filter === "future") dateMatch = isFuture;

      // Filtrer par recherche
      const typeMatch = eventTypeFilter === "all" || event.eventType === eventTypeFilter;
      const searchMatch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());

      return dateMatch && typeMatch && searchMatch;
    });

    // Tri
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return a.startDate.getTime() - b.startDate.getTime();
        case "date-desc":
          return b.startDate.getTime() - a.startDate.getTime();
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "attendees-high":
          return (b.attendees || 0) - (a.attendees || 0);
        case "attendees-low":
          return (a.attendees || 0) - (b.attendees || 0);
        default:
          return 0;
      }
    });
  }, [events, filter, eventTypeFilter, searchTerm, sortBy]);

  const handleDelete = (id: number) => {
    if (!window.confirm("Supprimer définitivement cet événement ?")) return;
    deleteEvent.mutate({ id });
  };

  const getEventStatus = (event: Event) => {
    if (event.endDate < now) return "Passé";
    if (event.startDate > now) return "À venir";
    return "En cours";
  };

  const getStatusColor = (event: Event) => {
    if (event.endDate < now) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    if (event.startDate > now) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportEventIcs = (event: Event) => {
    const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");
    const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Les Bâtisseurs Engagés//Calendrier//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:event-${event.id}@lesbatisseursengages`, `DTSTAMP:${toIcsDate(new Date())}`, `DTSTART:${toIcsDate(event.startDate)}`, `DTEND:${toIcsDate(event.endDate)}`,
      `SUMMARY:${escapeIcs(event.title)}`, event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : "", event.location ? `LOCATION:${escapeIcs(event.location)}` : "", "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([`${lines}\r\n`], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "evenement"}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportRegistrationsCsv = () => {
    const rows = registrationsQuery.data ?? [];
    if (!rows.length) { toast.info("Aucune inscription à exporter"); return; }
    const escapeCsv = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      ["Prénom", "Nom", "Email", "Statut", "Inscrit le", "Présence confirmée le"],
      ...rows.map(({ registration, member }) => [member.firstName, member.lastName, member.email ?? "", registration.status, registration.registeredAt ?? "", registration.attendedAt ?? ""]),
    ].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}\r\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscriptions-evenement-${registrationEventId ?? ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (!formData.title.trim() || !formData.startDate || !formData.endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      toast.error("Renseignez un titre et une période valide");
      return;
    }
    const input = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      location: formData.location.trim() || undefined,
      eventType: formData.eventType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      color: "#1a4d2e",
      organizer: formData.organizer.trim() || undefined,
      attendees: Number(formData.attendees) || 0,
    };
    if (editingId) updateEvent.mutate({ id: editingId, ...input });
    else createEvent.mutate(input);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendrier d'Événements</h1>
          <p className="text-muted-foreground">
            Gérez les événements passés, présents et futurs de l'association
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setEditingId(null); setFormData({ title: "", description: "", location: "", eventType: "autre", startDate: "", endDate: "", organizer: "", attendees: 0 }); setIsOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Rechercher un evenement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {(["all", "past", "present", "future"] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                size="sm"
              >
                {f === "all" && "Tous"}
                {f === "past" && "Passes"}
                {f === "present" && "En cours"}
                {f === "future" && "A venir"}
              </Button>
            ))}
          </div>
          <select aria-label="Filtrer par type" className="h-9 rounded-md border bg-background px-3 text-sm" value={eventTypeFilter} onChange={(event) => setEventTypeFilter(event.target.value)}><option value="all">Tous les types</option>{Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Trier par</label>
          <div className="flex gap-2 flex-wrap">
            {SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={sortBy === option.value ? "default" : "outline"}
                onClick={() => setSortBy(option.value)}
                size="sm"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Chargement des événements…</CardContent></Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucun événement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div
                className="h-2"
                style={{ backgroundColor: event.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="mt-2 flex flex-wrap gap-2"><span className={`inline-block text-xs px-2 py-1 rounded-full ${getStatusColor(event)}`}>{getEventStatus(event)}</span><span className="inline-block rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">{EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}</span></div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {event.description && (
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.attendees && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{event.attendees} participants</span>
                    </div>
                  )}

                  {event.organizer && (
                    <div className="text-xs text-muted-foreground">
                      Organisé par : {event.organizer}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => exportEventIcs(event)}
                    title="Ajouter à un calendrier"
                  >
                    <Download className="h-4 w-4" />
                    .ics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => { setRegistrationEventId(event.id); setRegistrationMemberId(null); }}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    Inscriptions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => { const current = events.find((item) => item.id === event.id); if (!current) return; setEditingId(current.id); setFormData({ title: current.title, description: current.description ?? "", location: current.location ?? "", eventType: current.eventType as "reunion" | "formation" | "activite" | "evenement" | "autre", startDate: current.startDate.toISOString().slice(0, 16), endDate: current.endDate.toISOString().slice(0, 16), organizer: current.organizer ?? "", attendees: current.attendees ?? 0 }); setIsOpen(true); }}
                  >
                    <Edit2 className="h-4 w-4" />
                    Modifier
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={registrationEventId !== null} onOpenChange={(open) => { if (!open) setRegistrationEventId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inscriptions et présence</DialogTitle>
            <DialogDescription>Inscrivez un membre puis confirmez sa présence le jour de l’activité.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div><p className="text-sm text-muted-foreground">{registrationSummary.total} inscription(s)</p><p className="text-xs text-muted-foreground">{registrationSummary.registered} inscrit(s) · {registrationSummary.attended} présent(s) · {registrationSummary.cancelled} annulé(s) · {registrationSummary.attendanceRate}% de présence</p></div>
              <Button variant="outline" size="sm" disabled={!registrationsQuery.data?.length} onClick={exportRegistrationsCsv}><Download className="mr-2 h-4 w-4" />Exporter CSV</Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select aria-label="Membre à inscrire" className="h-10 flex-1 rounded-md border bg-background px-3 text-sm" value={registrationMemberId ?? ""} onChange={(event) => setRegistrationMemberId(Number(event.target.value) || null)}>
                <option value="">Sélectionner un membre actif</option>
                {(membersQuery.data ?? []).filter((member) => member.status === "active").map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
              </select>
              <Button disabled={!registrationEventId || !registrationMemberId || registerMember.isPending} onClick={() => registrationEventId && registrationMemberId && registerMember.mutate({ eventId: registrationEventId, memberId: registrationMemberId })}>Inscrire</Button>
            </div>
            <div className="space-y-2">
              {(registrationsQuery.data ?? []).length === 0 ? <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">Aucune inscription pour le moment.</p> : (registrationsQuery.data ?? []).map(({ registration, member }) => <div key={registration.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><p className="font-medium">{member.firstName} {member.lastName}</p><p className="text-xs text-muted-foreground">Statut : {registration.status === "attended" ? "Présent" : registration.status === "cancelled" ? "Annulé" : "Inscrit"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={registration.status === "attended" || markAttendance.isPending} onClick={() => markAttendance.mutate({ registrationId: registration.id, status: "attended" })}>Présent</Button>{registration.status !== "cancelled" && <Button size="sm" variant="ghost" disabled={cancelRegistration.isPending} onClick={() => cancelRegistration.mutate({ registrationId: registration.id })}>Annuler</Button>}</div></div>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l’événement" : "Nouvel événement"}</DialogTitle>
            <DialogDescription>Planifiez une activité associative avec une période valide.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Input placeholder="Titre de l’événement" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} />
            <select aria-label="Type d’événement" className="h-10 rounded-md border bg-background px-3 text-sm" value={formData.eventType} onChange={(event) => setFormData({ ...formData, eventType: event.target.value as typeof formData.eventType })}>{Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <Input placeholder="Description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Lieu" value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} />
              <Input type="number" min="0" placeholder="Participants" value={formData.attendees || ""} onChange={(event) => setFormData({ ...formData, attendees: Number(event.target.value) || 0 })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input aria-label="Début" type="datetime-local" value={formData.startDate} onChange={(event) => setFormData({ ...formData, startDate: event.target.value })} />
              <Input aria-label="Fin" type="datetime-local" value={formData.endDate} onChange={(event) => setFormData({ ...formData, endDate: event.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
              <Button onClick={handleSubmit} disabled={createEvent.isPending || updateEvent.isPending}>{editingId ? "Mettre à jour" : "Créer"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Événements passés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.endDate < now).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Événements en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => !(e.endDate < now) && !(e.startDate > now)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter(e => e.startDate > now).length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
