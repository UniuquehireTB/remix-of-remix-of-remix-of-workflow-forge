import { AppLayout } from "@/components/AppLayout";
import { User, Building2, Shield, Bell, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  { icon: User, title: "Profile", desc: "Manage your personal information and preferences" },
  { icon: Building2, title: "Organization", desc: "Organization settings, billing, and team management" },
  { icon: Shield, title: "Security", desc: "Password, two-factor authentication, and sessions" },
  { icon: Bell, title: "Notifications", desc: "Email and in-app notification preferences" },
  { icon: Palette, title: "Appearance", desc: "Theme, layout, and display settings" },
  { icon: Globe, title: "Integrations", desc: "Connected apps and API keys" },
];

const Settings = () => {
  return (
    <AppLayout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-2xl space-y-3">
        {sections.map((section, i) => (
          <div
            key={section.title}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg card-hover cursor-pointer animate-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
              <section.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <p className="text-xs text-muted-foreground">{section.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Settings;
