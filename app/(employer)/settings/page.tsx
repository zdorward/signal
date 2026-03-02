'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface CompanySettings {
  id?: string;
  company_name: string;
  mission: string | null;
  benefits: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    mission: '',
    benefits: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        setSettings({
          id: data.id,
          company_name: data.company_name || '',
          mission: data.mission || '',
          benefits: data.benefits || '',
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, id: data.id }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <span className="text-warning">Loading</span>
        <span className="animate-blink text-warning">_</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground uppercase tracking-wider">Company Settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure your company information that appears on job postings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Company Information</CardTitle>
          <CardDescription className="text-foreground">
            This information appears on all job postings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Company Name</label>
            <Input
              value={settings.company_name}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, company_name: e.target.value }))
              }
              placeholder="Your Company"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Mission Statement</label>
            <Textarea
              value={settings.mission || ''}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, mission: e.target.value }))
              }
              placeholder="What does your company do? What's your mission?"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-2">Benefits</label>
            <Textarea
              value={settings.benefits || ''}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, benefits: e.target.value }))
              }
              placeholder="List your company benefits (health coverage, vacation days, etc.)"
              rows={4}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving} variant="primary">
              {saving ? (
                <>
                  Saving<span className="animate-blink">_</span>
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
            {saved && <span className="text-primary text-sm uppercase tracking-wider">◆ Saved</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
