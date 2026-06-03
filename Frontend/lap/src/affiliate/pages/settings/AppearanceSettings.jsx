import React from 'react';
import { Sun, Moon, Laptop, Palette } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import Button from '../../components/buttons/Button';
import { useNotifications } from '../../hooks/useNotifications';

export const AppearanceSettings = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { addNotification } = useNotifications();

  const handleSaveTheme = () => {
    addNotification('Appearance configuration saved!', 'success');
  };

  return (
    <div className="glass-card p-6 rounded-2xl max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <Palette className="w-5.5 h-5.5 text-primary-500" />
        <h3 className="text-lg font-bold">Appearance Settings</h3>
      </div>

      <div className="space-y-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Interface Theme Mode</p>

        <div className="grid grid-cols-2 gap-4">
          {/* Light box */}
          <div 
            onClick={() => { if (isDark) toggleTheme(); }}
            className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${!isDark ? 'border-primary-500 bg-primary-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <Sun className={`w-6 h-6 ${!isDark ? 'text-primary-500' : 'text-slate-400'}`} />
            <div>
              <h4 className="text-sm font-bold">Light mode</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Classic clean interface styling</p>
            </div>
          </div>

          {/* Dark box */}
          <div 
            onClick={() => { if (!isDark) toggleTheme(); }}
            className={`p-5 rounded-2xl border-2 cursor-pointer flex flex-col gap-3 transition-all ${isDark ? 'border-primary-500 bg-primary-500/5' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
          >
            <Moon className={`w-6 h-6 ${isDark ? 'text-primary-500' : 'text-slate-400'}`} />
            <div>
              <h4 className="text-sm font-bold">Dark mode</h4>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Sleek visual dark elements</p>
            </div>
          </div>
        </div>

        <Button 
          variant="primary"
          onClick={handleSaveTheme}
        >
          Save Appearance Preference
        </Button>
      </div>
    </div>
  );
};

export default AppearanceSettings;