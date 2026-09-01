import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity, Zap, BarChart3, Mail, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function CRMDashboard() {
  const userQuery = trpc.auth.me.useQuery();
  const user = userQuery.data;
  const [activeTab, setActiveTab] = useState("contacts");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch CRM data
  const contactsQuery = trpc.crm.contacts.list.useQuery({ search: searchTerm });
  const activityContactId = contactsQuery.data?.[0]?.id ?? 0;
  const activitiesQuery = trpc.crm.activities.list.useQuery(activityContactId, { enabled: activityContactId > 0 });
  const pipelineQuery = trpc.crm.pipeline.list.useQuery({});
  const reportsQuery = trpc.crm.reports.list.useQuery({});
  const engagementMetricsQuery = trpc.crm.reports.getEngagementMetrics.useQuery();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès Refusé</CardTitle>
            <CardDescription>Vous n'avez pas les permissions pour accéder au CRM.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Système CRM</h1>
          <p className="text-gray-600">Gestion des contacts et suivi des interactions</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nouveau Contact
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactsQuery.data?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Tous les contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Contacts Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contactsQuery.data?.filter((c: any) => c.status === "active").length || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Membres actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Activités</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activitiesQuery.data?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Interactions enregistrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineQuery.data?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Adhésions en cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contacts" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Contacts</span>
          </TabsTrigger>
          <TabsTrigger value="activities" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activités</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Pipeline</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Rapports</span>
          </TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Contacts</CardTitle>
              <CardDescription>Consultez et gérez tous vos contacts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Rechercher un contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />

              {contactsQuery.isLoading ? (
                <div className="text-center py-8">Chargement des contacts...</div>
              ) : contactsQuery.data && contactsQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {contactsQuery.data.map((contact: any) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-sm text-gray-600">{contact.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={contact.status === "active" ? "default" : "secondary"}>
                          {contact.status}
                        </Badge>
                        <Button variant="outline" size="sm">Détails</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Aucun contact trouvé</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des Activités</CardTitle>
              <CardDescription>Historique des interactions avec les contacts</CardDescription>
            </CardHeader>
            <CardContent>
              {activityContactId === 0 ? (
                <div className="text-center py-8 text-gray-500">Sélectionnez ou recherchez un contact pour afficher ses activités.</div>
              ) : activitiesQuery.isLoading ? (
                <div className="text-center py-8">Chargement des activités...</div>
              ) : activitiesQuery.data && activitiesQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {activitiesQuery.data.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{activity.type}</Badge>
                          <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Aucune activité enregistrée</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline d'Adhésion</CardTitle>
              <CardDescription>Suivi du processus d'adhésion des nouveaux membres</CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineQuery.isLoading ? (
                <div className="text-center py-8">Chargement du pipeline...</div>
              ) : pipelineQuery.data && pipelineQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {pipelineQuery.data.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{contactsQuery.data?.find((contact: any) => contact.id === item.contactId)?.firstName} {contactsQuery.data?.find((contact: any) => contact.id === item.contactId)?.lastName || `Contact #${item.contactId}`}</p>
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      </div>
                      <Badge variant="outline">{item.stage}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Aucune adhésion en cours</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports CRM</CardTitle>
              <CardDescription>Analyses et métriques d'engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Taux d'Engagement</p>
                    <p className="text-2xl font-bold mt-2">{engagementMetricsQuery.isLoading ? "…" : `${engagementMetricsQuery.data?.engagementRate ?? 0}%`}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-gray-600">Score Moyen</p>
                    <p className="text-2xl font-bold mt-2">{engagementMetricsQuery.isLoading ? "…" : `${engagementMetricsQuery.data?.averageScore ?? 0}/100`}</p>
                  </CardContent>
                </Card>
              </div>

              {engagementMetricsQuery.isError ? <p className="text-sm text-destructive" role="alert">Les métriques d’engagement ne sont pas disponibles.</p> : null}

              {reportsQuery.isLoading ? (
                <div className="text-center py-8">Chargement des rapports...</div>
              ) : reportsQuery.data && reportsQuery.data.length > 0 ? (
                <div className="space-y-2">
                  {reportsQuery.data.map((report: any) => (
                    <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-gray-600">{report.description}</p>
                      </div>
                      <Button variant="outline" size="sm">Voir</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Aucun rapport disponible</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
