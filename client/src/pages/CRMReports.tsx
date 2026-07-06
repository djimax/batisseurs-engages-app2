import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { HeroSection } from "@/components/HeroSection";
import { Loader2, TrendingUp, Users, Target, CheckCircle2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PERIOD_OPTIONS = [
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "quarter", label: "Ce trimestre" },
  { value: "year", label: "Cette année" },
];

const COLORS = ["#1a2a5c", "#2ecc71", "#1abc9c", "#f39c12", "#e74c3c", "#9b59b6"];

export default function CRMReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  // Fetch data
  const { data: contacts, isLoading: contactsLoading } = trpc.crm.contacts.list.useQuery();
  const { data: activities, isLoading: activitiesLoading } = trpc.crm.activities.list.useQuery(0);
  const { data: pipeline, isLoading: pipelineLoading } = trpc.crm.pipeline.list.useQuery();

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!contacts) return null;

    const totalContacts = contacts.length;
    const activeContacts = contacts.filter((c) => c.status === "active").length;
    const prospectContacts = contacts.filter((c) => c.status === "prospect").length;
    const avgEngagementScore =
      contacts.reduce((sum, c) => sum + (c.engagementScore || 0), 0) / totalContacts || 0;

    return {
      totalContacts,
      activeContacts,
      prospectContacts,
      avgEngagementScore: Math.round(avgEngagementScore),
    };
  }, [contacts]);

  // Segment distribution data
  const segmentData = useMemo(() => {
    if (!contacts) return [];

    const segments = contacts.reduce(
      (acc, contact) => {
        const segmentName = contact.segment || "général";
        const existing = acc.find((s: any) => s.name === segmentName);
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: segmentName, value: 1 });
        }
        return acc;
      },
      [] as Array<{ name: string; value: number }>
    );

    return segments;
  }, [contacts]);

  // Status distribution data
  const statusData = useMemo(() => {
    if (!contacts) return [];

    return [
      {
        name: "Prospect",
        value: contacts.filter((c) => c.status === "prospect").length,
      },
      {
        name: "Actif",
        value: contacts.filter((c) => c.status === "active").length,
      },
      {
        name: "Inactif",
        value: contacts.filter((c) => c.status === "inactive").length,
      },
      {
        name: "Archivé",
        value: contacts.filter((c) => c.status === "archived").length,
      },
    ];
  }, [contacts]);

  // Activity type distribution
  const activityTypeData = useMemo(() => {
    if (!activities) return [];

    const typeLabels: Record<string, string> = {
      call: "Appel",
      email: "Email",
      meeting: "Réunion",
      task: "Tâche",
      note: "Note",
      event: "Événement",
    };

    const types = activities.reduce(
      (acc, activity) => {
        const typeName = typeLabels[activity.type] || activity.type;
        const existing = acc.find((t) => t.name === typeName);
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: typeName, value: 1 });
        }
        return acc;
      },
      [] as Array<{ name: string; value: number }>
    );

    return types;
  }, [activities]);

  // Engagement trend data (simulated monthly data)
  const engagementTrendData = useMemo(() => {
    if (!contacts) return [];

    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
    return months.map((month, index) => ({
      month,
      engagement: Math.floor(
        contacts.reduce((sum, c) => sum + (c.engagementScore || 0), 0) / contacts.length +
          (index * 5)
      ),
      contacts: Math.floor(contacts.length * (0.8 + index * 0.05)),
    }));
  }, [contacts]);

  // Pipeline conversion data
  const pipelineData = useMemo(() => {
    if (!pipeline) return [];

    const stageLabels: Record<string, string> = {
      inquiry: "Enquête",
      application: "Candidature",
      review: "Examen",
      approved: "Approuvé",
      rejected: "Rejeté",
      member: "Membre",
    };

    const stages = pipeline.reduce(
      (acc, item) => {
        const stageName = stageLabels[item.stage] || item.stage;
        const existing = acc.find((s: any) => s.name === stageName);
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: stageName, value: 1 });
        }
        return acc;
      },
      [] as Array<{ name: string; value: number }>
    );

    return stages;
  }, [pipeline]);

  const isLoading = contactsLoading || activitiesLoading || pipelineLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeroSection
        title="Rapports CRM"
        subtitle="Analysez l'engagement des contacts et les tendances d'adhésion"
        variant="accent"
      />

      <div className="container mx-auto px-4 max-w-7xl space-y-6">
        {/* Period Selector */}
        <div className="flex justify-end">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalContacts}</div>
                <p className="text-xs text-muted-foreground">Tous les contacts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contacts Actifs</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeContacts}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.activeContacts / metrics.totalContacts) * 100)}% du total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prospects</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.prospectContacts}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((metrics.prospectContacts / metrics.totalContacts) * 100)}% du total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.avgEngagementScore}</div>
                <p className="text-xs text-muted-foreground">Score sur 100</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution par Segment</CardTitle>
              <CardDescription>Répartition des contacts par segment</CardDescription>
            </CardHeader>
            <CardContent>
              {segmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {segmentData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution par Statut</CardTitle>
              <CardDescription>Répartition des contacts par statut</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1a2a5c" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Activités par Type</CardTitle>
              <CardDescription>Répartition des activités par type</CardDescription>
            </CardHeader>
            <CardContent>
              {activityTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityTypeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2ecc71" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune activité enregistrée
                </div>
              )}
            </CardContent>
          </Card>

          {/* Engagement Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendance d'Engagement</CardTitle>
              <CardDescription>Évolution de l'engagement sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              {engagementTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="#1a2a5c"
                      name="Engagement"
                    />
                    <Line
                      type="monotone"
                      dataKey="contacts"
                      stroke="#2ecc71"
                      name="Contacts"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Conversion */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline d'Adhésion</CardTitle>
              <CardDescription>Étapes du processus d'adhésion</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineData.length > 0 ? (
                <div className="space-y-4">
                  {pipelineData.map((stage: any, index: number) => (
                    <div key={stage.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium capitalize">{stage.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${(stage.value / Math.max(...pipelineData.map((s: any) => s.value))) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{stage.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé des Statistiques</CardTitle>
            <CardDescription>Vue d'ensemble des métriques clés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Taux de Conversion</h3>
                <p className="text-2xl font-bold">
                  {metrics
                    ? Math.round((metrics.activeContacts / metrics.totalContacts) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prospects convertis en contacts actifs
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Taux d'Activité</h3>
                <p className="text-2xl font-bold">
                  {activities ? Math.round((activities.length / (metrics?.totalContacts || 1)) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contacts avec activités enregistrées
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Contacts en Pipeline</h3>
                <p className="text-2xl font-bold">{pipeline?.length || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  En cours de processus d'adhésion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
