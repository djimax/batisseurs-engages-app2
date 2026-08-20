import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsIcon, LogOut, Moon, Sun, Globe, Wifi, Download, Upload, Save, DollarSign } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useBackup } from "@/hooks/useBackup";
import { usePreferences } from "@/hooks/usePreferences";
import { useSyncHistory } from "@/hooks/useSyncHistory";
import { useCurrency } from "@/contexts/CurrencyContext";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [currentMode, setCurrentMode] = useState<'online' | 'offline'>('offline');
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportData, importData, getBackupSize } = useBackup();
  const { preferences, updatePreference } = usePreferences();
  const { getLastSync, getStats: getSyncStats } = useSyncHistory();
  const { currency, setCurrency, exchangeRate, setExchangeRate, resetExchangeRate } = useCurrency();
  const [newExchangeRate, setNewExchangeRate] = useState(exchangeRate.toString());

  useEffect(() => {
    const savedMode = localStorage.getItem('appMode') as 'online' | 'offline' | null;
    if (savedMode) {
      setCurrentMode(savedMode);
    }
  }, []);

  const handleChangeMode = () => {
    const newMode = currentMode === 'online' ? 'offline' : 'online';
    localStorage.setItem('appMode', newMode);
    toast.success(`Mode changé en: ${newMode === 'online' ? 'En Ligne' : 'Hors Ligne'}`);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('offlineUser');
    localStorage.removeItem('appMode');
    toast.success('Déconnexion réussie');
    setLocation('/');
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    toast.success(`Thème ${!darkMode ? 'sombre' : 'clair'} activé`);
  };

  const handleExportBackup = async () => {
    try {
      exportData();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importData(file);
      if (success) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    }
  };

  const handleLanguageChange = (lang: 'fr' | 'en') => {
    setLanguage(lang);
    updatePreference('language', lang);
    toast.success(`Langue changée en: ${lang === 'fr' ? 'Français' : 'English'}`);
  };

  const handleDateFormatChange = (format: string) => {
    setDateFormat(format);
    updatePreference('dateFormat', format as any);
    toast.success('Format de date mis à jour');
  };

  const handleEmailNotificationsChange = (value: boolean) => {
    setEmailNotifications(value);
    updatePreference('emailNotifications', value);
    toast.success(`Notifications par email ${value ? 'activées' : 'désactivées'}`);
  };

  const handleUpdateExchangeRate = () => {
    const rate = parseFloat(newExchangeRate);
    if (isNaN(rate) || rate <= 0) {
      toast.error('Veuillez entrer un taux de change valide (nombre positif)');
      return;
    }
    setExchangeRate(rate);
    toast.success(`Taux de change mis a jour: 1 EUR = ${rate.toFixed(3)} CFA`);
  };

  const handleResetExchangeRate = () => {
    resetExchangeRate();
    setNewExchangeRate('655.957');
    toast.success('Taux de change reinitialise au taux par defaut (1 EUR = 655.957 CFA)');
  };

  useEffect(() => {
    setNewExchangeRate(exchangeRate.toString());
  }, [exchangeRate]);

  const syncStats = getSyncStats();
  const lastSync = getLastSync();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground">Gérez vos préférences et configuration</p>
        </div>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentMode === 'online' ? (
              <Globe className="w-5 h-5 text-primary" />
            ) : (
              <Wifi className="w-5 h-5 text-accent-foreground" />
            )}
            Mode Actuel
          </CardTitle>
          <CardDescription>
            Vous utilisez actuellement le mode <strong>{currentMode === 'online' ? 'En Ligne' : 'Hors Ligne'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
            <p className="text-sm text-primary">
              {currentMode === 'online' 
                ? '✅ Mode En Ligne : Vos données sont synchronisées avec le serveur cloud.'
                : '✅ Mode Hors Ligne : Vos données sont stockées localement sur cet ordinateur.'}
            </p>
          </div>
          <Button
            onClick={handleChangeMode}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {currentMode === 'online' ? (
              <>
                <Wifi className="w-4 h-4 mr-2" />
                Passer au Mode Hors Ligne
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Passer au Mode En Ligne
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Sauvegarde et Restauration
          </CardTitle>
          <CardDescription>
            Exportez et importez vos données
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <p className="text-sm text-accent-foreground">
              Taille de la sauvegarde: <strong>{getBackupSize()} KB</strong>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExportBackup}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            Les fichiers de sauvegarde contiennent tous vos documents, membres et catégories.
          </p>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Historique de Synchronisation</CardTitle>
          <CardDescription>
            Suivi des activités et synchronisations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Événements totaux</p>
              <p className="text-2xl font-bold">{syncStats.totalEvents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aujourd'hui</p>
              <p className="text-2xl font-bold">{syncStats.todayEvents}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Réussis</p>
              <p className="text-2xl font-bold text-emerald-700">{syncStats.successCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erreurs</p>
              <p className="text-2xl font-bold text-red-600">{syncStats.errorCount}</p>
            </div>
          </div>
          {lastSync && (
            <div className="bg-secondary/60 border border-secondary rounded-lg p-4">
              <p className="text-sm text-secondary-foreground">
                ✅ Dernière synchronisation: {new Date(lastSync.timestamp).toLocaleString('fr-FR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="w-5 h-5" />
            Préférences
          </CardTitle>
          <CardDescription>
            Personnalisez votre expérience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Langue</label>
            <div className="flex gap-2">
              <Button
                onClick={() => handleLanguageChange('fr')}
                variant={language === 'fr' ? 'default' : 'outline'}
                size="sm"
              >
                Français
              </Button>
              <Button
                onClick={() => handleLanguageChange('en')}
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
              >
                English
              </Button>
            </div>
          </div>

          {/* Date Format */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Format de Date</label>
            <select
              value={dateFormat}
              onChange={(e) => handleDateFormatChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Notifications par Email</label>
              <p className="text-xs text-muted-foreground">Recevoir des alertes par email</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={handleEmailNotificationsChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Currency Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Devise Monétaire
          </CardTitle>
          <CardDescription>
            Choisissez la devise pour l'affichage des montants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => {
                setCurrency('EUR');
                toast.success('Devise changée en Euro (€)');
              }}
              variant={currency === 'EUR' ? 'default' : 'outline'}
              size="lg"
              className="w-full"
            >
              <span className="mr-2">€</span> Euro
            </Button>
            <Button
              onClick={() => {
                setCurrency('CFA');
                toast.success('Devise changée en CFA (F)');
              }}
              variant={currency === 'CFA' ? 'default' : 'outline'}
              size="lg"
              className="w-full"
            >
              <span className="mr-2">F</span> CFA
            </Button>
          </div>
          <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
            <p className="text-sm text-primary">
              Devise sélectionnée: <strong>{currency === 'EUR' ? 'Euro (€)' : 'CFA (F)'}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Taux de Change
          </CardTitle>
          <CardDescription>
            Gerez le taux de change EUR/CFA pour les conversions automatiques
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
            <p className="text-sm text-primary">
              Taux actuel: <strong>1 EUR = {exchangeRate.toFixed(3)} CFA</strong>
            </p>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium">Nouveau taux de change (1 EUR = ? CFA)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                value={newExchangeRate}
                onChange={(e) => setNewExchangeRate(e.target.value)}
                placeholder="Ex: 655.957"
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground"
              />
              <Button
                onClick={handleUpdateExchangeRate}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Mettre a jour
              </Button>
            </div>
          </div>

          <Button
            onClick={handleResetExchangeRate}
            variant="outline"
            className="w-full"
          >
            Reinitialiser au taux par defaut (655.957)
          </Button>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <p className="text-xs text-accent-foreground">
              Le taux de change est utilise pour convertir automatiquement les montants entre EUR et CFA dans toute l'application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-accent-foreground" />
              )}
              <label htmlFor="dark-mode" className="cursor-pointer">
                Mode Sombre
              </label>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={handleToggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Application Info */}
      <Card>
        <CardHeader>
          <CardTitle>À Propos</CardTitle>
          <CardDescription>
            Informations sur l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Application</p>
              <p className="font-semibold">Les Bâtisseurs Engagés</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mode</p>
              <p className="font-semibold">
                {currentMode === 'online' ? 'En Ligne' : 'Hors Ligne'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stockage</p>
              <p className="font-semibold">
                {currentMode === 'online' ? 'Cloud' : 'Local'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200/70">
        <CardHeader>
          <CardTitle className="text-red-700">Zone Dangereuse</CardTitle>
          <CardDescription>
            Actions irréversibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Vous serez redirigé vers la page de sélection de mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
