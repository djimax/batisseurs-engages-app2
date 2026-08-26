import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Calendar, MapPin, Users, Clock, Trash2, Edit2 } from "lucide-react";
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
  const events = useMemo<Event[]>(() => (storedEvents ?? []).map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    color: event.color ?? "#1a4d2e",
  })), [storedEvents]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("date-asc");
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "", location: "", startDate: "", endDate: "", organizer: "", attendees: 0 });

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
      const searchMatch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());

      return dateMatch && searchMatch;
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
  }, [events, filter, searchTerm, sortBy]);

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
      eventType: "autre" as const,
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
        <Button className="gap-2" onClick={() => { setEditingId(null); setFormData({ title: "", description: "", location: "", startDate: "", endDate: "", organizer: "", attendees: 0 }); setIsOpen(true); }}>
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
          <div className="flex gap-2">
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
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${getStatusColor(event)}`}>
                      {getEventStatus(event)}
                    </span>
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
                    variant="ghost"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => { const current = events.find((item) => item.id === event.id); if (!current) return; setEditingId(current.id); setFormData({ title: current.title, description: current.description ?? "", location: current.location ?? "", startDate: current.startDate.toISOString().slice(0, 16), endDate: current.endDate.toISOString().slice(0, 16), organizer: current.organizer ?? "", attendees: current.attendees ?? 0 }); setIsOpen(true); }}
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

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier l’événement" : "Nouvel événement"}</DialogTitle>
            <DialogDescription>Planifiez une activité associative avec une période valide.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <Input placeholder="Titre de l’événement" value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} />
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
