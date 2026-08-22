import { useCallback, useState, useEffect } from 'react';

export interface UserPreferences {
  language: 'fr' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  emailNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  itemsPerPage: number;
  autoSaveInterval: number; // en secondes
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'fr',
  dateFormat: 'DD/MM/YYYY',
  emailNotifications: false,
  theme: 'light',
  itemsPerPage: 10,
  autoSaveInterval: 300, // 5 minutes
};

export function resetStoredPreferences() {
  const defaults = { ...DEFAULT_PREFERENCES };
  localStorage.setItem('userPreferences', JSON.stringify(defaults));
  return defaults;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les préférences au démarrage
  useEffect(() => {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder les préférences
  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    localStorage.setItem('userPreferences', JSON.stringify(updated));
    setPreferences(updated);
    return updated;
  }, [preferences]);

  // Mettre à jour une préférence
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      return savePreferences({ [key]: value });
    },
    [savePreferences]
  );

  // Réinitialiser aux valeurs par défaut
  const resetPreferences = useCallback(() => {
    const defaults = resetStoredPreferences();
    setPreferences(defaults);
    return defaults;
  }, []);

  // Formater une date selon les préférences
  const formatDate = useCallback(
    (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      switch (preferences.dateFormat) {
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'DD/MM/YYYY':
        default:
          return `${day}/${month}/${year}`;
      }
    },
    [preferences.dateFormat]
  );

  // Obtenir le texte traduit
  const t = useCallback(
    (key: string): string => {
      const translations: Record<string, Record<'fr' | 'en', string>> = {
        'documents': { fr: 'Documents', en: 'Documents' },
        'members': { fr: 'Membres', en: 'Members' },
        'categories': { fr: 'Catégories', en: 'Categories' },
        'settings': { fr: 'Paramètres', en: 'Settings' },
        'logout': { fr: 'Déconnexion', en: 'Logout' },
        'save': { fr: 'Enregistrer', en: 'Save' },
        'cancel': { fr: 'Annuler', en: 'Cancel' },
        'delete': { fr: 'Supprimer', en: 'Delete' },
        'edit': { fr: 'Modifier', en: 'Edit' },
        'add': { fr: 'Ajouter', en: 'Add' },
        'search': { fr: 'Rechercher', en: 'Search' },
        'no_results': { fr: 'Aucun résultat', en: 'No results' },
        'loading': { fr: 'Chargement...', en: 'Loading...' },
        'error': { fr: 'Erreur', en: 'Error' },
        'success': { fr: 'Succès', en: 'Success' },
      };

      return translations[key]?.[preferences.language] || key;
    },
    [preferences.language]
  );

  return {
    preferences,
    isLoaded,
    savePreferences,
    updatePreference,
    resetPreferences,
    formatDate,
    t,
  };
}
